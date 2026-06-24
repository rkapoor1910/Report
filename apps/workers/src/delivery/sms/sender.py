"""
delivery/sms/sender.py
Sends SMS alerts via Twilio. SMS is the short-form fallback channel —
160 chars target, plain text only, most urgent info only.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
import os
import logging
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

logger = logging.getLogger(__name__)

SMS_MAX = 160


@dataclass
class SMSResult:
    success:     bool
    recipient:   str
    message_sid: Optional[str] = None
    error:       Optional[str] = None


class SMSSender:

    def __init__(self):
        self.client      = Client(os.environ['TWILIO_ACCOUNT_SID'], os.environ['TWILIO_AUTH_TOKEN'])
        self.from_number = os.environ['TWILIO_SMS_FROM']

    def send(self, to_number: str, alert: dict, report_name: str) -> SMSResult:

        # Use AI-generated SMS message if available, else build a short one
        body = alert.get('sms_message') or self._format_sms(alert, report_name)

        # Hard truncate at 160
        if len(body) > SMS_MAX:
            body = body[:SMS_MAX - 3] + '...'

        try:
            msg = self.client.messages.create(
                from_ = self.from_number,
                to    = to_number,
                body  = body,
            )
            logger.info(f"[SMS] Sent to {to_number} — SID: {msg.sid}")
            return SMSResult(success=True, recipient=to_number, message_sid=msg.sid)
        except TwilioRestException as e:
            logger.error(f"[SMS] Failed to {to_number}: {e}")
            return SMSResult(success=False, recipient=to_number, error=str(e))

    def _format_sms(self, alert: dict, report_name: str) -> str:
        severity = alert.get('severity', 'info')
        prefix   = 'ALERT' if severity == 'critical' else 'ReportIQ'

        # Pick the worst red flag
        flags = alert.get('red_flags', [])
        if flags:
            worst = flags[0]
            return f"{prefix}: {worst['label']} — {worst['value']} {worst['change']}. Check ReportIQ."

        # Fall back to first stat
        stats = alert.get('stats', [])
        if stats:
            s = stats[0]
            return f"{prefix}: {s['label']} {s['value']}. {report_name}."

        return f"{prefix}: New alert for {report_name}. Open ReportIQ for details."
