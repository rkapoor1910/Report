"""
delivery/slack/sender.py
Sends structured Slack alerts using Block Kit.
Supports both channel posts and direct messages.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
import os
import logging
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

logger = logging.getLogger(__name__)

SEVERITY_EMOJI = { 'critical': ':rotating_light:', 'warning': ':warning:', 'info': ':information_source:' }
TREND_EMOJI    = { 'up': ':chart_with_upwards_trend:', 'down': ':chart_with_downwards_trend:', 'neutral': ':arrow_right:' }
SEVERITY_COLOR = { 'critical': '#DC2626', 'warning': '#D97706', 'info': ':2563EB' }


@dataclass
class SlackResult:
    success:    bool
    recipient:  str
    ts:         Optional[str] = None   # message timestamp
    error:      Optional[str] = None


class SlackSender:

    def __init__(self):
        self.client = WebClient(token=os.environ['SLACK_BOT_TOKEN'])

    def send(
        self,
        channel:     str,    # '#channel-name' or '@username' or Slack user ID
        alert:       dict,
        report_name: str,
        org_name:    str,
    ) -> SlackResult:

        blocks = self._build_blocks(alert, report_name, org_name)

        try:
            res = self.client.chat_postMessage(
                channel     = channel,
                text        = alert.get('title', report_name),   # fallback for notifications
                blocks      = blocks,
                unfurl_links= False,
            )
            logger.info(f"[Slack] Sent to {channel} — ts: {res['ts']}")
            return SlackResult(success=True, recipient=channel, ts=res['ts'])
        except SlackApiError as e:
            logger.error(f"[Slack] Failed to {channel}: {e.response['error']}")
            return SlackResult(success=False, recipient=channel, error=e.response['error'])

    def _build_blocks(self, alert: dict, report_name: str, org_name: str) -> list[dict]:
        severity  = alert.get('severity', 'info')
        sev_emoji = SEVERITY_EMOJI.get(severity, ':information_source:')
        color     = SEVERITY_COLOR.get(severity, '#2563EB')
        blocks    = []

        # ── Header ─────────────────────────────────────────────────────────────
        blocks.append({
            'type': 'header',
            'text': { 'type': 'plain_text', 'text': f"{sev_emoji}  {alert.get('title', report_name)}", 'emoji': True },
        })

        blocks.append({
            'type': 'context',
            'elements': [{ 'type': 'mrkdwn', 'text': f"*{org_name}* · {report_name}" }],
        })

        blocks.append({ 'type': 'divider' })

        # ── Summary ────────────────────────────────────────────────────────────
        if alert.get('summary'):
            blocks.append({
                'type': 'section',
                'text': { 'type': 'mrkdwn', 'text': alert['summary'] },
            })

        # ── Stats (fields layout) ──────────────────────────────────────────────
        stats = alert.get('stats', [])
        if stats:
            fields = []
            for s in stats[:6]:   # max 6 fields in 2-column layout
                trend  = TREND_EMOJI.get(s.get('trend', 'neutral'), ':arrow_right:')
                chg    = f" `{s['change_pct']:+.1f}%`" if s.get('change_pct') is not None else ''
                fields.append({
                    'type': 'mrkdwn',
                    'text': f"*{s['label']}*\n{trend} {s['value']}{chg}",
                })
            blocks.append({ 'type': 'section', 'fields': fields })

        # ── Red flags ──────────────────────────────────────────────────────────
        red_flags = alert.get('red_flags', [])
        if red_flags:
            blocks.append({ 'type': 'divider' })
            blocks.append({
                'type': 'section',
                'text': { 'type': 'mrkdwn', 'text': '*🚩 Red flags*' },
            })
            for flag in red_flags[:5]:
                icon = ':red_circle:' if flag['severity'] == 'critical' else ':large_yellow_circle:'
                blocks.append({
                    'type': 'section',
                    'text': {
                        'type': 'mrkdwn',
                        'text': f"{icon} *{flag['label']}* — {flag['value']} `{flag['change']}`"
                                + (f"\n_{flag['suggestion']}_" if flag.get('suggestion') else ''),
                    },
                })

        # ── Suggested actions ──────────────────────────────────────────────────
        actions = alert.get('suggested_actions', [])
        if actions:
            blocks.append({ 'type': 'divider' })
            action_text = '*✅ Suggested actions*\n' + '\n'.join(f"• {a}" for a in actions[:3])
            blocks.append({
                'type': 'section',
                'text': { 'type': 'mrkdwn', 'text': action_text },
            })

        # ── Footer button ──────────────────────────────────────────────────────
        blocks.append({ 'type': 'divider' })
        blocks.append({
            'type': 'actions',
            'elements': [{
                'type': 'button',
                'text': { 'type': 'plain_text', 'text': 'View full report', 'emoji': True },
                'url':  os.environ.get('APP_URL', 'https://app.reportiq.com') + '/dashboard/alerts',
                'style': 'primary',
            }],
        })

        return blocks
