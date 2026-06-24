"""
normaliser.py
Converts raw report data (any format) into a standard NormalisedReport object.
This is the first step in the analysis pipeline — everything downstream
works with NormalisedReport, never with raw source data directly.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import Any, Optional
import pandas as pd
import numpy as np
import json
import re


# ─── Standard schema ─────────────────────────────────────────────────────────

@dataclass
class ColumnMeta:
    original_name: str
    mapped_name:   str
    data_type:     str   # 'number' | 'text' | 'date' | 'boolean'
    role:          str   # 'metric' | 'dimension' | 'date' | 'id' | 'ignore'


@dataclass
class NormalisedReport:
    report_id:      str
    report_name:    str
    report_type:    str
    connector_type: str
    source_ref:     str
    snapshot_time:  datetime
    date_column:    str
    primary_metric: str
    columns:        list[ColumnMeta]
    df:             pd.DataFrame        # normalised dataframe — typed, cleaned
    row_count:      int
    date_range:     tuple[date, date]   # (earliest, latest) date in this snapshot
    metadata:       dict = field(default_factory=dict)


# ─── Normaliser ──────────────────────────────────────────────────────────────

class DataNormaliser:
    """
    Accepts raw data from any connector and returns a NormalisedReport.
    Handles: type coercion, date parsing, currency stripping,
             empty row removal, duplicate detection, encoding fixes.
    """

    def normalise(
        self,
        raw_data:       list[dict[str, Any]],
        report_id:      str,
        report_name:    str,
        report_type:    str,
        connector_type: str,
        source_ref:     str,
        schema:         dict,                   # from DB — column mappings + date/metric config
    ) -> NormalisedReport:

        if not raw_data:
            raise ValueError(f"No data received for report '{report_name}'")

        df = pd.DataFrame(raw_data)

        # ── 1. Drop fully empty rows and duplicate rows ──────────────────────
        df = df.dropna(how='all').drop_duplicates()

        # ── 2. Apply column mappings from schema ─────────────────────────────
        column_meta: list[ColumnMeta] = []
        rename_map:  dict[str, str]   = {}
        drop_cols:   list[str]        = []

        for col_def in schema.get('columns', []):
            original = col_def['originalName']
            if original not in df.columns:
                continue
            if col_def['role'] == 'ignore':
                drop_cols.append(original)
                continue
            rename_map[original] = col_def['mappedName']
            column_meta.append(ColumnMeta(
                original_name = original,
                mapped_name   = col_def['mappedName'],
                data_type     = col_def['dataType'],
                role          = col_def['role'],
            ))

        df = df.drop(columns=drop_cols, errors='ignore')
        df = df.rename(columns=rename_map)

        # ── 3. Type coercion ─────────────────────────────────────────────────
        for meta in column_meta:
            col = meta.mapped_name
            if col not in df.columns:
                continue

            if meta.data_type == 'number':
                df[col] = self._to_numeric(df[col])

            elif meta.data_type == 'date':
                df[col] = pd.to_datetime(df[col], infer_datetime_format=True, errors='coerce')

            elif meta.data_type == 'boolean':
                df[col] = df[col].map(
                    lambda v: True if str(v).lower() in ('true', '1', 'yes', 'y') else False
                )

            else:  # text
                df[col] = df[col].astype(str).str.strip()

        # ── 4. Drop rows where date or primary metric is null ────────────────
        date_col   = self._mapped_name(schema['dateColumn'], schema)
        metric_col = self._mapped_name(schema['primaryMetric'], schema)

        if date_col in df.columns:
            df = df.dropna(subset=[date_col])
        if metric_col in df.columns:
            df = df.dropna(subset=[metric_col])

        # ── 5. Sort by date ascending ────────────────────────────────────────
        if date_col in df.columns:
            df = df.sort_values(date_col).reset_index(drop=True)

        # ── 6. Compute date range ────────────────────────────────────────────
        if date_col in df.columns and not df.empty:
            earliest = df[date_col].min()
            latest   = df[date_col].max()
            date_range = (
                earliest.date() if hasattr(earliest, 'date') else earliest,
                latest.date()   if hasattr(latest,   'date') else latest,
            )
        else:
            today = date.today()
            date_range = (today, today)

        return NormalisedReport(
            report_id      = report_id,
            report_name    = report_name,
            report_type    = report_type,
            connector_type = connector_type,
            source_ref     = source_ref,
            snapshot_time  = datetime.utcnow(),
            date_column    = date_col,
            primary_metric = metric_col,
            columns        = column_meta,
            df             = df,
            row_count      = len(df),
            date_range     = date_range,
        )

    # ─── Helpers ─────────────────────────────────────────────────────────────

    def _to_numeric(self, series: pd.Series) -> pd.Series:
        """Strip currency symbols, commas, % signs then convert to float."""
        cleaned = (
            series.astype(str)
            .str.replace(r'[₹$€£,\s%]', '', regex=True)
            .str.replace(r'[()]', '-', regex=True)   # (1,000) → -1000
        )
        return pd.to_numeric(cleaned, errors='coerce')

    def _mapped_name(self, original_name: str, schema: dict) -> str:
        """Look up the mapped name for an original column name."""
        for col in schema.get('columns', []):
            if col['originalName'] == original_name:
                return col['mappedName']
        return original_name.lower().replace(' ', '_')
