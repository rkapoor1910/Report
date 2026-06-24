"""
delivery/router.py
Delivery router — receives an AlertMessage and a list of subscribers,
routes to the correct sender (WhatsApp / SMS / email / Slack),
records delivery status.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
import logging

from delivery.whatsapp.sender import WhatsAppSender, DeliveryResult
from delivery.sms.sender      import SMSSender
from delivery.email.sender    import EmailSender
from delivery.slack.sender    import SlackSender

logger = logging.getLogger(__name__)


@dataclass
class Subscriber:
    user_id:   str
    name:      str
    channel:   str           # 'whatsapp' | 'sms' | 'email' | 'slack'
    address:   str           # phone number, email, or Slack channel/user ID
    role:      str           # 'owner' | 'sales_head' | 'warehouse' | 'brand_manager'


@dataclass
class DeliveryRecord:
    user_id:    str
    channel:    str
    address:    str
    success:    bool
    message_id: Optional[str] = None
    error:      Optional[str] = None


class DeliveryRouter:

    def __init__(self, org_name: str, report_name: str):
        self.org_name    = org_name
        self.report_name = report_name
        self._whatsapp   = None
        self._sms        = None
        self._email      = None
        self._slack      = None

    def deliver_to_all(
        self,
        alert:       dict,
        subscribers: list[Subscriber],
    ) -> list[DeliveryRecord]:
        """
        Deliver an alert to all subscribers via their configured channel.
        Returns a list of delivery records for logging/retry.
        """
        records = []
        for sub in subscribers:
            logger.info(f"[Router] Delivering to {sub.name} via {sub.channel} ({sub.address})")
            record = self._deliver_one(alert, sub)
            records.append(record)
            if not record.success:
                logger.warning(f"[Router] Delivery failed for {sub.user_id}: {record.error}")
        return records

    def _deliver_one(self, alert: dict, sub: Subscriber) -> DeliveryRecord:
        try:
            if sub.channel == 'whatsapp':
                sender = self._get_whatsapp()
                result = sender.send(sub.address, alert, self.report_name)
                return DeliveryRecord(
                    user_id    = sub.user_id,
                    channel    = 'whatsapp',
                    address    = sub.address,
                    success    = result.success,
                    message_id = result.message_sid,
                    error      = result.error,
                )

            elif sub.channel == 'sms':
                sender = self._get_sms()
                result = sender.send(sub.address, alert, self.report_name)
                return DeliveryRecord(
                    user_id    = sub.user_id,
                    channel    = 'sms',
                    address    = sub.address,
                    success    = result.success,
                    message_id = result.message_sid,
                    error      = result.error,
                )

            elif sub.channel == 'email':
                sender = self._get_email()
                result = sender.send(
                    to_email    = sub.address,
                    to_name     = sub.name,
                    alert       = alert,
                    report_name = self.report_name,
                    org_name    = self.org_name,
                )
                return DeliveryRecord(
                    user_id = sub.user_id,
                    channel = 'email',
                    address = sub.address,
                    success = result.success,
                    error   = result.error,
                )

            elif sub.channel == 'slack':
                sender = self._get_slack()
                result = sender.send(sub.address, alert, self.report_name, self.org_name)
                return DeliveryRecord(
                    user_id    = sub.user_id,
                    channel    = 'slack',
                    address    = sub.address,
                    success    = result.success,
                    message_id = result.ts,
                    error      = result.error,
                )

            else:
                return DeliveryRecord(
                    user_id = sub.user_id,
                    channel = sub.channel,
                    address = sub.address,
                    success = False,
                    error   = f"Unknown channel: {sub.channel}",
                )

        except Exception as e:
            logger.exception(f"[Router] Unexpected error delivering to {sub.user_id}")
            return DeliveryRecord(
                user_id = sub.user_id,
                channel = sub.channel,
                address = sub.address,
                success = False,
                error   = str(e),
            )

    # ── Lazy-init senders ─────────────────────────────────────────────────────
    def _get_whatsapp(self) -> WhatsAppSender:
        if not self._whatsapp:
            self._whatsapp = WhatsAppSender()
        return self._whatsapp

    def _get_sms(self) -> SMSSender:
        if not self._sms:
            self._sms = SMSSender()
        return self._sms

    def _get_email(self) -> EmailSender:
        if not self._email:
            self._email = EmailSender()
        return self._email

    def _get_slack(self) -> SlackSender:
        if not self._slack:
            self._slack = SlackSender()
        return self._slack
