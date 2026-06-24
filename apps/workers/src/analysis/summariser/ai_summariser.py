"""
summariser/ai_summariser.py
Sends structured anomaly findings to the Claude API.
Returns a plain-English alert object ready for delivery via WhatsApp/SMS/email.

The AI does NOT receive raw data — only the structured findings from the
anomaly detector. This keeps prompts concise, costs low, and outputs consistent.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
import anthropic
import json
import os

from analysis.anomaly.detector import AnomalyReport, RedFlag, StatSummary


# ─── Output type ─────────────────────────────────────────────────────────────

@dataclass
class AlertMessage:
    report_id:         str
    report_name:       str
    severity:          str           # 'info' | 'warning' | 'critical'
    title:             str           # one-line headline
    summary:           str           # 2-3 sentence plain-English summary
    red_flags:         list[dict]    # [{label, value, change, severity}]
    stats:             list[dict]    # [{label, value, trend, change_pct}]
    suggested_actions: list[str]     # 2-4 bullet points
    whatsapp_message:  str           # formatted for WhatsApp (with emoji)
    sms_message:       str           # short version for SMS (160 chars target)
    email_subject:     str
    raw_ai_response:   str


# ─── Summariser ──────────────────────────────────────────────────────────────

class AISummariser:

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
        self.model  = 'claude-sonnet-4-6'

    def summarise(
        self,
        anomaly:      AnomalyReport,
        org_name:     str,
        recipient_role: str = 'owner',   # 'owner' | 'sales_head' | 'warehouse' | 'brand_manager'
    ) -> AlertMessage:

        # ── Build structured prompt ───────────────────────────────────────────
        findings_json = self._build_findings(anomaly)
        system_prompt = self._system_prompt(recipient_role)
        user_prompt   = self._user_prompt(org_name, anomaly, findings_json)

        # ── Call Claude API ───────────────────────────────────────────────────
        response = self.client.messages.create(
            model      = self.model,
            max_tokens = 1500,
            system     = system_prompt,
            messages   = [{ 'role': 'user', 'content': user_prompt }],
        )

        raw_text = response.content[0].text

        # ── Parse structured JSON response from Claude ────────────────────────
        try:
            parsed = json.loads(self._extract_json(raw_text))
        except Exception:
            # Fallback if Claude returns malformed JSON
            parsed = self._fallback_parse(raw_text, anomaly)

        # ── Overall severity — worst red flag severity ────────────────────────
        severity = 'info'
        if any(f.severity == 'critical' for f in anomaly.red_flags):
            severity = 'critical'
        elif any(f.severity == 'warning' for f in anomaly.red_flags):
            severity = 'warning'

        return AlertMessage(
            report_id         = anomaly.report_id,
            report_name       = anomaly.report_name,
            severity          = severity,
            title             = parsed.get('title', anomaly.report_name + ' — analysis complete'),
            summary           = parsed.get('summary', ''),
            red_flags         = [self._flag_to_dict(f) for f in anomaly.red_flags],
            stats             = [self._stat_to_dict(s) for s in anomaly.stats],
            suggested_actions = parsed.get('suggested_actions', []),
            whatsapp_message  = parsed.get('whatsapp_message', ''),
            sms_message       = parsed.get('sms_message', ''),
            email_subject     = parsed.get('email_subject', anomaly.report_name),
            raw_ai_response   = raw_text,
        )

    # ─── Prompt builders ─────────────────────────────────────────────────────

    def _system_prompt(self, recipient_role: str) -> str:
        role_context = {
            'owner': "You are reporting to the business owner / MD. Give a high-level strategic view — overall health, biggest wins and risks, cash flow implications. Keep it concise.",
            'sales_head': "You are reporting to the sales head. Focus on store performance, team target achievement, and specific stores or SKUs that need attention today.",
            'warehouse': "You are reporting to the warehouse / supply chain manager. Focus on stock levels, reorder needs, dead stock, and dispatch issues. Be specific about SKUs and quantities.",
            'brand_manager': "You are reporting to the brand / category manager. Focus on sell-through rates, return rates, stock cover by brand, and slow-moving SKUs.",
        }.get(recipient_role, "You are reporting to a business manager.")

        return f"""You are ReportIQ's analysis engine. Your job is to turn business data findings into clear, actionable alerts.

{role_context}

RULES:
- Write in plain English. No spreadsheet jargon. No column names.
- Be specific — use actual numbers, not vague language like "significant drop".
- The WhatsApp message must feel like a smart colleague texting you, not a robot.
- Use ₹ for Indian rupee amounts. Use L for lakhs (₹1L = ₹100,000), Cr for crores.
- Max 3 red flags in the WhatsApp message — prioritise the most urgent.
- Suggested actions must be specific and actionable, not generic advice.
- Always respond in valid JSON matching the schema provided."""

    def _user_prompt(self, org_name: str, anomaly: AnomalyReport, findings: dict) -> str:
        return f"""Analyse these findings for {org_name} and generate an alert.

REPORT: {anomaly.report_name}
PERIOD: {anomaly.period_label}
TYPE: {anomaly.report_type}

FINDINGS:
{json.dumps(findings, indent=2)}

Respond ONLY with valid JSON in this exact schema:
{{
  "title": "One-line headline (max 80 chars)",
  "summary": "2-3 sentences summarising what happened and what matters most",
  "suggested_actions": ["Action 1", "Action 2", "Action 3"],
  "whatsapp_message": "Full WhatsApp message with emoji. Start with bold heading using *text*. Include key numbers, top red flags, and 1-2 suggested actions. Max 400 chars.",
  "sms_message": "Ultra-short SMS version — key metric + worst red flag + one action. Max 160 chars.",
  "email_subject": "Email subject line"
}}"""

    def _build_findings(self, anomaly: AnomalyReport) -> dict:
        return {
            'period':      anomaly.period_label,
            'stats':       [{ 'label': s.label, 'value': s.value, 'trend': s.trend, 'change_pct': s.change_pct, 'context': s.context } for s in anomaly.stats],
            'red_flags':   [{ 'label': f.label, 'value': f.value, 'change': f.change, 'severity': f.severity, 'suggestion': f.suggestion } for f in anomaly.red_flags],
            'top_performers':    anomaly.top_performers[:3],
            'bottom_performers': anomaly.bottom_performers[:3],
            'dead_stock':        anomaly.dead_stock[:3],
            'data_quality':      anomaly.data_quality_notes,
        }

    # ─── Helpers ─────────────────────────────────────────────────────────────

    def _extract_json(self, text: str) -> str:
        """Extract JSON block from Claude response."""
        text = text.strip()
        if text.startswith('{'):
            return text
        # Try to find JSON between ```json ... ``` fences
        import re
        match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if match:
            return match.group(1)
        # Find first { to last }
        start = text.find('{')
        end   = text.rfind('}')
        if start != -1 and end != -1:
            return text[start:end+1]
        raise ValueError("No JSON found in AI response")

    def _fallback_parse(self, raw: str, anomaly: AnomalyReport) -> dict:
        """Minimal fallback if JSON parsing fails."""
        worst_flag = anomaly.red_flags[0].label if anomaly.red_flags else "No major issues detected"
        return {
            'title':             f"{anomaly.report_name} — {anomaly.period_label}",
            'summary':           raw[:300],
            'suggested_actions': [f.suggestion for f in anomaly.red_flags[:3] if f.suggestion],
            'whatsapp_message':  f"*{anomaly.report_name}*\n{anomaly.period_label}\n\n⚠️ {worst_flag}",
            'sms_message':       f"ReportIQ: {worst_flag[:120]}",
            'email_subject':     f"ReportIQ alert — {anomaly.report_name}",
        }

    def _flag_to_dict(self, f: RedFlag) -> dict:
        return { 'label': f.label, 'value': f.value, 'change': f.change, 'severity': f.severity, 'suggestion': f.suggestion }

    def _stat_to_dict(self, s: StatSummary) -> dict:
        return { 'label': s.label, 'value': s.value, 'trend': s.trend, 'change_pct': s.change_pct, 'context': s.context }
