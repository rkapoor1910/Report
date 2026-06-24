"""
delivery/whatsapp/sender.py
Sends formatted WhatsApp alerts via Twilio WhatsApp Business API.
Handles message formatting, length limits, and delivery receipts.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
import os
import logging
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

logger = logging.getLogger(__name__)

# WhatsApp message limit — Twilio caps at 1600 chars
MAX_LENGTH = 1500

SEVERITY_EMOJI = {
    'critical': '🚨',
    'warning':  '⚠️',
    'info':     'ℹ️',
}


@dataclass
class DeliveryResult:
    success:      bool
    channel:      str
    recipient:    str
    message_sid:  Optional[str] = None
    error:        Optional[str] = None


class WhatsAppSender:

    def __init__(self):
        self.client    = Client(
            os.environ['TWILIO_ACCOUNT_SID'],
            os.environ['TWILIO_AUTH_TOKEN'],
        )
        self.from_number = os.environ['TWILIO_WHATSAPP_FROM']  # whatsapp:+14155238886

    def send(
        self,
        to_number:   str,          # e.g. '+919876543210'
        alert:       dict,         # AlertMessage as dict
        report_name: str,
    ) -> DeliveryResult:

        to_wa = f"whatsapp:{to_number}" if not to_number.startswith('whatsapp:') else to_number

        # Use pre-formatted message from AI summariser if available
        body = alert.get('whatsapp_message') or self._format_message(alert, report_name)

        # Truncate if over limit
        if len(body) > MAX_LENGTH:
            body = body[:MAX_LENGTH - 20] + '\n\n_[truncated]_'

        try:
            message = self.client.messages.create(
                from_ = self.from_number,
                to    = to_wa,
                body  = body,
            )
            logger.info(f"[WhatsApp] Sent to {to_number} — SID: {message.sid}")
            return DeliveryResult(
                success     = True,
                channel     = 'whatsapp',
                recipient   = to_number,
                message_sid = message.sid,
            )
        except TwilioRestException as e:
            logger.error(f"[WhatsApp] Failed to send to {to_number}: {e}")
            return DeliveryResult(
                success   = False,
                channel   = 'whatsapp',
                recipient = to_number,
                error     = str(e),
            )

    def _format_message(self, alert: dict, report_name: str) -> str:
        """
        Fallback formatter if AI summariser didn't produce a whatsapp_message.
        Produces clean, readable WhatsApp text with emojis.
        """
        severity = alert.get('severity', 'info')
        icon     = SEVERITY_EMOJI.get(severity, 'ℹ️')

        lines = [
            f"{icon} *{report_name}*",
            f"_{alert.get('title', '')}_ ",
            '',
        ]

        # Key stats
        for stat in alert.get('stats', [])[:3]:
            trend_icon = '📈' if stat.get('trend') == 'up' else '📉' if stat.get('trend') == 'down' else '➡️'
            change     = f" ({stat['change_pct']:+.1f}%)" if stat.get('change_pct') is not None else ''
            lines.append(f"{trend_icon} *{stat['label']}:* {stat['value']}{change}")

        # Red flags
        red_flags = alert.get('red_flags', [])
        if red_flags:
            lines.append('')
            lines.append('*🚩 Needs attention:*')
            for flag in red_flags[:3]:
                sev_icon = '🔴' if flag['severity'] == 'critical' else '🟡'
                lines.append(f"{sev_icon} {flag['label']} — {flag['value']} ({flag['change']})")

        # Suggested actions
        actions = alert.get('suggested_actions', [])
        if actions:
            lines.append('')
            lines.append('*✅ Actions:*')
            for action in actions[:2]:
                lines.append(f"• {action}")

        return '\n'.join(lines)
