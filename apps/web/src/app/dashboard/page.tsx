﻿'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plug, FileText, Bell, TrendingDown, TrendingUp,
  AlertTriangle, CheckCircle2, Clock, ArrowRight, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

// â”€â”€ Sample data (replaced by API calls in production) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STATS = [
  { label: 'Active connectors', value: '4',   sub: '2 syncing now',              icon: Plug,       color: 'text-blue-600',   bg: 'bg-blue-50' },
  { label: 'Reports monitored', value: '9',   sub: 'Across 4 connectors',        icon: FileText,   color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Alerts this week',  value: '23',  sub: '6 critical, 17 warnings',    icon: Bell,       color: 'text-amber-600',  bg: 'bg-amber-50' },
  { label: 'Alerts delivered',  value: '98%', sub: 'All channels operational',   icon: CheckCircle2,color: 'text-green-600', bg: 'bg-green-50' },
]

const RECENT_ALERTS = [
  {
    id: '1',
    title: 'Adidas stock running critically low',
    report: 'ðŸ“¦ Stock inventory â€” Delhi warehouse',
    severity: 'critical',
    time: '2 hours ago',
    delivered: ['whatsapp', 'email'],
  },
  {
    id: '2',
    title: 'Lajpat Nagar store missed target 4 days running',
    report: 'ðŸŽ¯ Target vs actual â€” Delhi NCR',
    severity: 'warning',
    time: '8 hours ago',
    delivered: ['whatsapp'],
  },
  {
    id: '3',
    title: 'Weekly sell-out summary â€” Week 24',
    report: 'ðŸ›ï¸ Retailer sell-out â€” All brands',
    severity: 'info',
    time: '1 day ago',
    delivered: ['whatsapp', 'email', 'slack'],
  },
  {
    id: '4',
    title: 'Reebok Hexalite dead stock alert â€” â‚¹8.5L idle',
    report: 'ðŸ“¦ Stock inventory â€” Delhi warehouse',
    severity: 'warning',
    time: '2 days ago',
    delivered: ['email'],
  },
]

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   label: 'Critical' },
  warning:  { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Warning' },
  info:     { icon: CheckCircle2,  color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200',  label: 'Info' },
}

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: 'ðŸ’¬',
  email:    'ðŸ“§',
  slack:    'ðŸ’¬',
  sms:      'ðŸ“±',
}

// â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Good morning, Raman</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening across Ess Gee Group today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {STATS.map(stat => (
          <div key={stat.label} className="bg-background border border-border rounded-xl p-4">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', stat.bg)}>
              <stat.icon size={15} className={stat.color} />
            </div>
            <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="text-xs font-medium text-foreground mt-0.5">{stat.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">

        {/* Recent alerts */}
        <div className="lg:col-span-2 bg-background border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">Recent alerts</h2>
            <Link href="/dashboard/alerts" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {RECENT_ALERTS.map(alert => {
              const cfg = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG]
              return (
                <Link
                  key={alert.id}
                  href={`/dashboard/alerts/${alert.id}`}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', cfg.bg)}>
                    <cfg.icon size={13} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.report}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock size={10} /> {alert.time}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Â·</span>
                      <span className="text-[11px] text-muted-foreground">
                        {alert.delivered.map(ch => CHANNEL_LABEL[ch] ?? ch).join(' ')}
                      </span>
                    </div>
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 mt-1',
                    cfg.bg, cfg.color, cfg.border
                  )}>
                    {cfg.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <div className="bg-background border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <h2 className="text-sm font-medium text-foreground">Quick actions</h2>
            </div>
            <div className="p-3 space-y-2">
              {[
                { label: 'Add a connector',     href: '/dashboard/connectors/new',  icon: Plug,      desc: 'Connect a data source' },
                { label: 'Configure a report',  href: '/dashboard/reports/new',     icon: FileText,  desc: 'Set up monitoring' },
                { label: 'Manage subscriptions',href: '/dashboard/alerts/subscriptions', icon: Bell, desc: 'Who gets what alerts' },
              ].map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <action.icon size={13} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{action.label}</p>
                    <p className="text-[11px] text-muted-foreground">{action.desc}</p>
                  </div>
                  <ArrowRight size={12} className="ml-auto text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {/* System status */}
          <div className="bg-background border border-border rounded-xl p-4">
            <h2 className="text-xs font-medium text-foreground mb-3">System status</h2>
            <div className="space-y-2">
              {[
                { label: 'Analysis engine', status: 'operational' },
                { label: 'WhatsApp delivery', status: 'operational' },
                { label: 'Email delivery', status: 'operational' },
                { label: 'Scheduled jobs', status: 'operational' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[11px] text-green-600 font-medium">OK</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}


