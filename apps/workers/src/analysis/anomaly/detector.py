"""
anomaly/detector.py
Compares the latest report snapshot against historical data.
Returns a structured AnomalyReport with scored findings —
these are passed to the AI summariser to generate plain-English alerts.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional
import pandas as pd
import numpy as np

from analysis.normaliser import NormalisedReport


# ─── Output types ────────────────────────────────────────────────────────────

@dataclass
class RedFlag:
    label:        str
    value:        str           # current value (formatted)
    change:       str           # e.g. "▼ 34%" or "▲ 22%"
    change_pct:   float         # signed float
    severity:     str           # 'critical' | 'warning' | 'info'
    dimension:    Optional[str] = None   # e.g. "Lajpat Nagar" or "Adidas Ultraboost"
    suggestion:   Optional[str] = None


@dataclass
class StatSummary:
    label:         str
    value:         str
    trend:         str          # 'up' | 'down' | 'neutral'
    change_pct:    Optional[float] = None
    context:       Optional[str]   = None


@dataclass
class AnomalyReport:
    report_id:         str
    report_name:       str
    report_type:       str
    analysis_time:     datetime
    period_label:      str          # e.g. "Week 24" or "17 Jun 2024"
    red_flags:         list[RedFlag]
    stats:             list[StatSummary]
    top_performers:    list[dict]
    bottom_performers: list[dict]
    dead_stock:        list[dict]   # only for stock reports
    missing_data:      bool
    data_quality_notes: list[str]
    thresholds:        dict


# ─── Detector ────────────────────────────────────────────────────────────────

class AnomalyDetector:

    def detect(
        self,
        current:    NormalisedReport,
        historical: list[NormalisedReport],   # prior snapshots, newest first
        thresholds: dict,
    ) -> AnomalyReport:

        df        = current.df
        metric    = current.primary_metric
        date_col  = current.date_column
        drop_pct  = thresholds.get('dropAlertPct',   15)
        spike_pct = thresholds.get('spikeAlertPct',  30)
        dead_days = thresholds.get('deadStockDays',  30)

        red_flags:          list[RedFlag]    = []
        stats:              list[StatSummary]= []
        top_performers:     list[dict]       = []
        bottom_performers:  list[dict]       = []
        dead_stock:         list[dict]       = []
        data_quality_notes: list[str]        = []

        # ── Current period totals ─────────────────────────────────────────────
        current_total = df[metric].sum() if metric in df.columns else 0

        # ── Prior period totals (from historical snapshots) ──────────────────
        prior_total: Optional[float] = None
        if historical:
            prior_df     = historical[0].df
            prior_metric = historical[0].primary_metric
            if prior_metric in prior_df.columns:
                prior_total = prior_df[prior_metric].sum()

        # ── 1. Overall metric change ──────────────────────────────────────────
        if prior_total is not None and prior_total != 0:
            overall_change_pct = ((current_total - prior_total) / abs(prior_total)) * 100
            trend = 'up' if overall_change_pct > 0 else 'down' if overall_change_pct < 0 else 'neutral'

            stats.append(StatSummary(
                label      = self._format_metric_label(metric),
                value      = self._format_value(current_total, metric),
                trend      = trend,
                change_pct = round(overall_change_pct, 1),
                context    = f"vs previous period ({self._format_value(prior_total, metric)})",
            ))

            if overall_change_pct <= -drop_pct:
                red_flags.append(RedFlag(
                    label      = f"{self._format_metric_label(metric)} dropped significantly",
                    value      = self._format_value(current_total, metric),
                    change     = f"▼ {abs(overall_change_pct):.1f}%",
                    change_pct = overall_change_pct,
                    severity   = 'critical' if overall_change_pct <= -drop_pct * 1.5 else 'warning',
                    suggestion = f"Investigate what caused the {abs(overall_change_pct):.0f}% drop vs last period.",
                ))
            elif overall_change_pct >= spike_pct:
                red_flags.append(RedFlag(
                    label      = f"Unusual spike in {self._format_metric_label(metric)}",
                    value      = self._format_value(current_total, metric),
                    change     = f"▲ {overall_change_pct:.1f}%",
                    change_pct = overall_change_pct,
                    severity   = 'warning',
                    suggestion = "Verify data integrity — this may be a data error or a breakout moment.",
                ))
        else:
            stats.append(StatSummary(
                label = self._format_metric_label(metric),
                value = self._format_value(current_total, metric),
                trend = 'neutral',
            ))

        # ── 2. Dimension-level analysis (e.g. per store, per brand, per SKU) ──
        dimension_cols = [
            c.mapped_name for c in current.columns
            if c.role == 'dimension' and c.mapped_name in df.columns
        ]

        for dim_col in dimension_cols[:2]:   # analyse top 2 dimensions
            if metric not in df.columns:
                break
            grouped = (
                df.groupby(dim_col)[metric]
                .sum()
                .reset_index()
                .sort_values(metric, ascending=False)
            )

            if grouped.empty:
                continue

            # Top performers
            top = grouped.head(3)
            top_performers.extend([
                { 'dimension': dim_col, 'name': str(row[dim_col]), 'value': self._format_value(row[metric], metric) }
                for _, row in top.iterrows()
            ])

            # Bottom performers
            bottom = grouped[grouped[metric] < grouped[metric].quantile(0.2)]
            bottom_performers.extend([
                { 'dimension': dim_col, 'name': str(row[dim_col]), 'value': self._format_value(row[metric], metric) }
                for _, row in bottom.head(3).iterrows()
            ])

            # Per-dimension red flags vs prior period
            if historical and len(historical) > 0:
                prior_df = historical[0].df
                if dim_col in prior_df.columns and metric in prior_df.columns:
                    prior_grouped = prior_df.groupby(dim_col)[metric].sum()
                    for _, row in grouped.iterrows():
                        dim_name  = str(row[dim_col])
                        curr_val  = row[metric]
                        prior_val = prior_grouped.get(dim_name)
                        if prior_val is None or prior_val == 0:
                            continue
                        chg = ((curr_val - prior_val) / abs(prior_val)) * 100
                        if chg <= -drop_pct:
                            red_flags.append(RedFlag(
                                label     = f"{dim_name} underperforming",
                                value     = self._format_value(curr_val, metric),
                                change    = f"▼ {abs(chg):.1f}%",
                                change_pct= chg,
                                severity  = 'critical' if chg <= -drop_pct * 1.5 else 'warning',
                                dimension = dim_col,
                                suggestion= f"Check what's happening at {dim_name} — down {abs(chg):.0f}% vs last period.",
                            ))

        # ── 3. Stock-specific: dead stock + below reorder ─────────────────────
        if current.report_type == 'stock_inventory':
            stock_col   = self._find_col(df, ['stock_on_hand', 'stock', 'quantity', 'qty'])
            reorder_col = self._find_col(df, ['reorder_level', 'min_stock', 'reorder_point'])
            days_col    = self._find_col(df, ['days_since_last_sale', 'days_no_sale', 'idle_days'])
            sku_col     = self._find_col(df, ['sku_code', 'sku', 'product_code', 'item_code'])
            name_col    = self._find_col(df, ['product_name', 'item_name', 'name'])

            # Dead stock
            if stock_col and days_col:
                dead = df[(df[days_col] >= dead_days) & (df[stock_col] > 0)]
                for _, row in dead.head(5).iterrows():
                    sku_label = str(row.get(sku_col or name_col, 'Unknown SKU'))
                    qty       = int(row[stock_col])
                    days_idle = int(row[days_col])
                    dead_stock.append({ 'sku': sku_label, 'qty': qty, 'days_idle': days_idle })
                    red_flags.append(RedFlag(
                        label     = f"Dead stock: {sku_label}",
                        value     = f"{qty:,} units",
                        change    = f"{days_idle} days idle",
                        change_pct= 0,
                        severity  = 'warning',
                        suggestion= f"Consider a clearance push or brand return request for {sku_label}.",
                    ))

            # Below reorder level
            if stock_col and reorder_col:
                critical = df[df[stock_col] <= df[reorder_col]]
                for _, row in critical.head(5).iterrows():
                    sku_label = str(row.get(sku_col or name_col, 'Unknown SKU'))
                    qty       = int(row[stock_col])
                    reorder   = int(row[reorder_col])
                    red_flags.append(RedFlag(
                        label     = f"Low stock: {sku_label}",
                        value     = f"{qty:,} units",
                        change    = f"Reorder point: {reorder:,}",
                        change_pct= 0,
                        severity  = 'critical',
                        suggestion= f"Reorder {sku_label} immediately — stock is at or below reorder level.",
                    ))

        # ── 4. Target vs actual ───────────────────────────────────────────────
        if current.report_type == 'target_actual':
            target_col = self._find_col(df, ['target', 'target_inr', 'plan'])
            actual_col = self._find_col(df, ['actual', 'actual_inr', 'achievement'])
            pct_col    = self._find_col(df, ['achievement_pct', 'attainment_pct', 'pct'])
            person_col = self._find_col(df, ['salesperson', 'person', 'rep', 'region', 'store'])

            if target_col and actual_col and person_col:
                df['_gap_pct'] = ((df[actual_col] - df[target_col]) / df[target_col].abs()) * 100
                laggards = df[df['_gap_pct'] < -20].sort_values('_gap_pct')
                for _, row in laggards.head(3).iterrows():
                    person_name = str(row[person_col])
                    gap         = abs(row['_gap_pct'])
                    red_flags.append(RedFlag(
                        label     = f"Target miss: {person_name}",
                        value     = self._format_value(row[actual_col], actual_col),
                        change    = f"▼ {gap:.1f}% below target",
                        change_pct= row['_gap_pct'],
                        severity  = 'critical' if gap > 30 else 'warning',
                        suggestion= f"Follow up with {person_name} — {gap:.0f}% below target.",
                    ))

        # ── 5. Data quality checks ────────────────────────────────────────────
        if metric in df.columns:
            null_count = df[metric].isna().sum()
            if null_count > 0:
                data_quality_notes.append(f"{null_count} rows have missing values in {metric}.")

            neg_count = (df[metric] < 0).sum()
            if neg_count > 0:
                data_quality_notes.append(f"{neg_count} rows have negative values in {metric} — possible returns or data errors.")

        # ── Sort red flags by severity ────────────────────────────────────────
        severity_order = {'critical': 0, 'warning': 1, 'info': 2}
        red_flags.sort(key=lambda f: severity_order.get(f.severity, 3))

        return AnomalyReport(
            report_id          = current.report_id,
            report_name        = current.report_name,
            report_type        = current.report_type,
            analysis_time      = datetime.utcnow(),
            period_label       = self._period_label(current),
            red_flags          = red_flags,
            stats              = stats,
            top_performers     = top_performers,
            bottom_performers  = bottom_performers,
            dead_stock         = dead_stock,
            missing_data       = False,
            data_quality_notes = data_quality_notes,
            thresholds         = thresholds,
        )

    # ─── Helpers ─────────────────────────────────────────────────────────────

    def _find_col(self, df: pd.DataFrame, candidates: list[str]) -> Optional[str]:
        for c in candidates:
            if c in df.columns:
                return c
        return None

    def _format_value(self, value: float, col_name: str = '') -> str:
        col = col_name.lower()
        if any(k in col for k in ['revenue', 'inr', 'amount', 'value', 'sales', 'target', 'actual']):
            if value >= 10_000_000:
                return f"₹{value/10_000_000:.2f} Cr"
            elif value >= 100_000:
                return f"₹{value/100_000:.1f} L"
            else:
                return f"₹{value:,.0f}"
        elif any(k in col for k in ['pct', 'percent', 'rate']):
            return f"{value:.1f}%"
        elif any(k in col for k in ['units', 'qty', 'count', 'stock', 'quantity']):
            return f"{value:,.0f} units"
        else:
            if value >= 1_000_000:
                return f"{value/1_000_000:.1f}M"
            elif value >= 1_000:
                return f"{value/1_000:.1f}K"
            return f"{value:,.2f}"

    def _format_metric_label(self, col_name: str) -> str:
        return col_name.replace('_', ' ').title()

    def _period_label(self, report: NormalisedReport) -> str:
        _, latest = report.date_range
        if hasattr(latest, 'strftime'):
            return latest.strftime('%-d %b %Y')
        return str(latest)
