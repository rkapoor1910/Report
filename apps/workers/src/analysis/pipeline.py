"""
pipeline.py
Orchestrates the full analysis pipeline for a single report run:
  1. Normalise raw data
  2. Detect anomalies vs historical snapshots
  3. Summarise with AI
  4. Return AlertMessage ready for delivery

This is called by the BullMQ job worker (Node.js side via HTTP)
or directly by the Celery task scheduler.
"""

from __future__ import annotations
from typing import Any, Optional
import logging

from analysis.normaliser import DataNormaliser, NormalisedReport
from analysis.anomaly.detector import AnomalyDetector
from analysis.summariser.ai_summariser import AISummariser, AlertMessage

logger = logging.getLogger(__name__)


class AnalysisPipeline:

    def __init__(self):
        self.normaliser  = DataNormaliser()
        self.detector    = AnomalyDetector()
        self.summariser  = AISummariser()

    def run(
        self,
        raw_data:        list[dict[str, Any]],
        historical_data: list[list[dict[str, Any]]],   # list of prior raw snapshots
        report_config:   dict,
        org_name:        str,
        recipient_role:  str = 'owner',
    ) -> AlertMessage:
        """
        Full pipeline run.

        Args:
            raw_data:        Current snapshot — list of row dicts from the connector
            historical_data: Prior snapshots (newest first) — used for comparison
            report_config:   Report DB record — id, name, type, schema, thresholds etc.
            org_name:        Organisation name for personalised messages
            recipient_role:  Role of the alert recipient — affects AI tone and focus

        Returns:
            AlertMessage — ready to deliver via WhatsApp/SMS/email/Slack
        """

        schema     = report_config['schema']
        thresholds = report_config.get('thresholds', {})

        # ── Step 1: Normalise current snapshot ───────────────────────────────
        logger.info(f"[Pipeline] Normalising {len(raw_data)} rows for report {report_config['id']}")
        try:
            current = self.normaliser.normalise(
                raw_data       = raw_data,
                report_id      = report_config['id'],
                report_name    = report_config['name'],
                report_type    = report_config['type'],
                connector_type = report_config.get('connectorType', 'unknown'),
                source_ref     = report_config.get('sourceRef', ''),
                schema         = schema,
            )
        except Exception as e:
            logger.error(f"[Pipeline] Normalisation failed: {e}")
            raise

        # ── Step 2: Normalise historical snapshots ────────────────────────────
        historical_normalised: list[NormalisedReport] = []
        for i, hist_raw in enumerate(historical_data[:3]):   # use last 3 periods max
            try:
                hist = self.normaliser.normalise(
                    raw_data       = hist_raw,
                    report_id      = report_config['id'] + f'_hist_{i}',
                    report_name    = report_config['name'],
                    report_type    = report_config['type'],
                    connector_type = report_config.get('connectorType', 'unknown'),
                    source_ref     = report_config.get('sourceRef', ''),
                    schema         = schema,
                )
                historical_normalised.append(hist)
            except Exception as e:
                logger.warning(f"[Pipeline] Could not normalise historical snapshot {i}: {e}")

        # ── Step 3: Detect anomalies ──────────────────────────────────────────
        logger.info(f"[Pipeline] Running anomaly detection with {len(historical_normalised)} historical periods")
        try:
            anomaly_report = self.detector.detect(
                current    = current,
                historical = historical_normalised,
                thresholds = thresholds,
            )
        except Exception as e:
            logger.error(f"[Pipeline] Anomaly detection failed: {e}")
            raise

        logger.info(
            f"[Pipeline] Found {len(anomaly_report.red_flags)} red flags, "
            f"{len(anomaly_report.stats)} stats"
        )

        # ── Step 4: AI summarise ──────────────────────────────────────────────
        logger.info(f"[Pipeline] Calling AI summariser (role={recipient_role})")
        try:
            alert = self.summariser.summarise(
                anomaly        = anomaly_report,
                org_name       = org_name,
                recipient_role = recipient_role,
            )
        except Exception as e:
            logger.error(f"[Pipeline] AI summarisation failed: {e}")
            raise

        logger.info(f"[Pipeline] Alert generated — severity={alert.severity}, title={alert.title}")
        return alert


# ─── FastAPI endpoint (called by Node.js BullMQ worker) ──────────────────────

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="ReportIQ Analysis Worker")

pipeline = AnalysisPipeline()


class AnalysisRequest(BaseModel):
    raw_data:        list[dict[str, Any]]
    historical_data: list[list[dict[str, Any]]] = []
    report_config:   dict[str, Any]
    org_name:        str
    recipient_role:  str = 'owner'


class AnalysisResponse(BaseModel):
    report_id:         str
    report_name:       str
    severity:          str
    title:             str
    summary:           str
    red_flags:         list[dict]
    stats:             list[dict]
    suggested_actions: list[str]
    whatsapp_message:  str
    sms_message:       str
    email_subject:     str


@app.post('/analyse', response_model=AnalysisResponse)
async def analyse(req: AnalysisRequest):
    """
    Main analysis endpoint.
    Called by the Node.js API when a scheduled report sync completes.
    Returns structured alert ready for delivery.
    """
    try:
        alert = pipeline.run(
            raw_data        = req.raw_data,
            historical_data = req.historical_data,
            report_config   = req.report_config,
            org_name        = req.org_name,
            recipient_role  = req.recipient_role,
        )
        return AnalysisResponse(
            report_id         = alert.report_id,
            report_name       = alert.report_name,
            severity          = alert.severity,
            title             = alert.title,
            summary           = alert.summary,
            red_flags         = alert.red_flags,
            stats             = alert.stats,
            suggested_actions = alert.suggested_actions,
            whatsapp_message  = alert.whatsapp_message,
            sms_message       = alert.sms_message,
            email_subject     = alert.email_subject,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("[API] Analysis failed")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get('/health')
async def health():
    return { 'status': 'ok', 'service': 'reportiq-workers' }
