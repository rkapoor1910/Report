"""
delivery/email/sender.py
Sends rich HTML email digests via SendGrid.
Includes full stats table, red flags section, and suggested actions.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
import os
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, HtmlContent, PlainTextContent

logger = logging.getLogger(__name__)

SEVERITY_COLOR = {
    'critical': '#DC2626',
    'warning':  '#D97706',
    'info':     '#2563EB',
}

TREND_ARROW = { 'up': '↑', 'down': '↓', 'neutral': '→' }
TREND_COLOR = { 'up': '#16A34A', 'down': '#DC2626', 'neutral': '#6B7280' }


@dataclass
class EmailResult:
    success:   bool
    recipient: str
    error:     Optional[str] = None


class EmailSender:

    def __init__(self):
        self.client     = SendGridAPIClient(os.environ['SENDGRID_API_KEY'])
        self.from_email = os.environ.get('FROM_EMAIL', 'alerts@reportiq.com')
        self.from_name  = os.environ.get('FROM_NAME',  'ReportIQ')

    def send(
        self,
        to_email:    str,
        to_name:     str,
        alert:       dict,
        report_name: str,
        org_name:    str,
    ) -> EmailResult:

        subject  = alert.get('email_subject') or f"ReportIQ — {report_name}"
        html     = self._build_html(alert, report_name, org_name, to_name)
        plain    = self._build_plain(alert, report_name)

        message = Mail(
            from_email    = (self.from_email, self.from_name),
            to_emails     = (to_email, to_name),
            subject       = subject,
            html_content  = HtmlContent(html),
            plain_text_content = PlainTextContent(plain),
        )

        try:
            self.client.send(message)
            logger.info(f"[Email] Sent to {to_email}")
            return EmailResult(success=True, recipient=to_email)
        except Exception as e:
            logger.error(f"[Email] Failed to {to_email}: {e}")
            return EmailResult(success=False, recipient=to_email, error=str(e))

    def _build_html(self, alert: dict, report_name: str, org_name: str, recipient_name: str) -> str:
        severity      = alert.get('severity', 'info')
        accent_color  = SEVERITY_COLOR.get(severity, '#2563EB')
        stats         = alert.get('stats', [])
        red_flags     = alert.get('red_flags', [])
        actions       = alert.get('suggested_actions', [])

        # Stats rows
        stats_rows = ''
        for s in stats:
            arrow = TREND_ARROW.get(s.get('trend', 'neutral'), '→')
            color = TREND_COLOR.get(s.get('trend', 'neutral'), '#6B7280')
            chg   = f" <span style='color:{color}'>{s['change_pct']:+.1f}%</span>" if s.get('change_pct') is not None else ''
            stats_rows += f"""
            <tr>
              <td style='padding:10px 16px;border-bottom:1px solid #F3F4F6;color:#374151;font-size:14px'>{s['label']}</td>
              <td style='padding:10px 16px;border-bottom:1px solid #F3F4F6;font-weight:600;font-size:14px'>
                <span style='color:{color}'>{arrow}</span> {s['value']}{chg}
              </td>
              <td style='padding:10px 16px;border-bottom:1px solid #F3F4F6;color:#9CA3AF;font-size:12px'>{s.get('context','')}</td>
            </tr>"""

        # Red flag rows
        flag_items = ''
        for f in red_flags:
            badge_color = SEVERITY_COLOR.get(f['severity'], '#6B7280')
            flag_items += f"""
            <tr>
              <td style='padding:10px 16px;border-bottom:1px solid #FEF2F2'>
                <span style='display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:{badge_color}20;color:{badge_color}'>{f['severity'].upper()}</span>
              </td>
              <td style='padding:10px 16px;border-bottom:1px solid #FEF2F2;font-size:14px;color:#111827;font-weight:500'>{f['label']}</td>
              <td style='padding:10px 16px;border-bottom:1px solid #FEF2F2;font-size:14px;color:#374151'>{f['value']}</td>
              <td style='padding:10px 16px;border-bottom:1px solid #FEF2F2;font-size:13px;color:#DC2626;font-weight:500'>{f['change']}</td>
            </tr>"""

        # Action items
        action_items = ''.join(
            f"<li style='margin-bottom:8px;font-size:14px;color:#374151'>{a}</li>"
            for a in actions
        )

        return f"""<!DOCTYPE html>
<html>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>
<body style='margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif'>
  <div style='max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)'>

    <!-- Header -->
    <div style='background:{accent_color};padding:24px 32px'>
      <div style='font-size:12px;color:rgba(255,255,255,0.7);margin-bottom:4px'>{org_name} · ReportIQ</div>
      <h1 style='margin:0;font-size:20px;color:#fff;font-weight:600'>{alert.get('title', report_name)}</h1>
      <div style='font-size:13px;color:rgba(255,255,255,0.85);margin-top:6px'>{report_name}</div>
    </div>

    <!-- Summary -->
    <div style='padding:24px 32px;border-bottom:1px solid #F3F4F6'>
      <p style='margin:0;font-size:15px;color:#374151;line-height:1.6'>Hi {recipient_name},</p>
      <p style='font-size:15px;color:#374151;line-height:1.6'>{alert.get('summary', '')}</p>
    </div>

    <!-- Stats -->
    {'<div style="padding:0 32px 0"><h2 style="font-size:13px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;padding:20px 0 12px">Key metrics</h2><table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #E5E7EB"><tbody>' + stats_rows + '</tbody></table></div>' if stats_rows else ''}

    <!-- Red flags -->
    {'<div style="padding:0 32px"><h2 style="font-size:13px;font-weight:600;color:#DC2626;text-transform:uppercase;letter-spacing:0.05em;padding:24px 0 12px">🚩 Red flags</h2><table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #FEE2E2;background:#FFF5F5"><tbody>' + flag_items + '</tbody></table></div>' if flag_items else ''}

    <!-- Suggested actions -->
    {'<div style="padding:0 32px 24px"><h2 style="font-size:13px;font-weight:600;color:#16A34A;text-transform:uppercase;letter-spacing:0.05em;padding:24px 0 12px">✅ Suggested actions</h2><ul style="margin:0;padding-left:20px">' + action_items + '</ul></div>' if action_items else ''}

    <!-- Footer -->
    <div style='padding:20px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB'>
      <p style='margin:0;font-size:12px;color:#9CA3AF'>
        Sent by ReportIQ · <a href='#' style='color:#6B7280'>Manage alerts</a> · <a href='#' style='color:#6B7280'>Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>"""

    def _build_plain(self, alert: dict, report_name: str) -> str:
        lines = [
            f"ReportIQ — {report_name}",
            f"{alert.get('title', '')}",
            '',
            alert.get('summary', ''),
            '',
        ]
        for s in alert.get('stats', []):
            chg = f" ({s['change_pct']:+.1f}%)" if s.get('change_pct') is not None else ''
            lines.append(f"• {s['label']}: {s['value']}{chg}")
        if alert.get('red_flags'):
            lines.append('\nRed flags:')
            for f in alert['red_flags']:
                lines.append(f"  [{f['severity'].upper()}] {f['label']} — {f['value']} {f['change']}")
        if alert.get('suggested_actions'):
            lines.append('\nSuggested actions:')
            for a in alert['suggested_actions']:
                lines.append(f"  • {a}")
        return '\n'.join(lines)
