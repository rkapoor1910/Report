﻿'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Info, Clock, ChevronRight, Filter, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const ALERTS = [
  { id: '1', title: 'Adidas stock running critically low',              report: 'ðŸ“¦ Stock inventory',       severity: 'critical', time: '2h ago',   summary: '3 SKUs below reorder level. Ultraboost 22, Classic White Women, Stan Smith. Combined risk: â‚¹4.2L lost sales if not restocked by weekend.', delivered: ['whatsapp','email'], actions: ['Raise PO with Adidas today', 'Check alternate warehouse stock', 'Alert store managers to manage customer expectations'] },
  { id: '2', title: 'Lajpat Nagar missed target 4 days running',        report: 'ðŸŽ¯ Target vs actual',      severity: 'critical', time: '8h ago',   summary: 'Store is at 61% of weekly target. Footfall is normal but conversion is low â€” 3 top SKUs out of stock since Tuesday.', delivered: ['whatsapp'], actions: ['Request emergency replenishment from warehouse', 'Verify stock transfer is logged in system'] },
  { id: '3', title: 'Reebok Hexalite dead stock â€” â‚¹8.5L idle 47 days', report: 'ðŸ“¦ Stock inventory',       severity: 'warning',  time: '1d ago',   summary: '340 units of Reebok Hexalite Grey have not moved in 47 days. Last season model. Carrying cost increasing.', delivered: ['email'], actions: ['Run clearance promotion this weekend', 'Request brand return authorisation from Reebok'] },
  { id: '4', title: 'Weekly sell-out summary â€” Week 24',                report: 'ðŸ›ï¸ Retailer sell-out',    severity: 'info',     time: '1d ago',   summary: 'Total sell-out â‚¹1.84 Cr â€” up 11% vs last week. Adidas Delhi NCR outperformed by 22%. Tanishq Lucknow the weakest at 34% below target.', delivered: ['whatsapp','email','slack'], actions: [] },
  { id: '5', title: 'Kanpur franchise returns spike',                   report: 'â†©ï¸ Returns & defects',    severity: 'warning',  time: '2d ago',   summary: 'Return rate jumped to 8.4% this week â€” double normal. Top return reason: size mismatch (62%). Possible fit issue with new Adidas batch.', delivered: ['whatsapp'], actions: ['Contact Adidas quality team', 'Pull batch QC report', 'Brief store staff on fit guide'] },
  { id: '6', title: 'Brand PO target achievement â€” Q2 update',          report: 'ðŸ“‹ Purchase orders',      severity: 'info',     time: '3d ago',   summary: 'Q2 at 87% of brand targets. Adidas on track. Tanishq 14% behind â€” festive inventory build needed by July.', delivered: ['email'], actions: ['Plan Tanishq pre-festive order', 'Review Adidas Q3 forecast'] },
]

const SEV = {
  critical: { icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   dot: 'bg-red-500' },
  warning:  { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  info:     { icon: Info,          color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200',  dot: 'bg-blue-500' },
}

const CH: Record<string, string> = { whatsapp: 'ðŸ’¬ WhatsApp', email: 'ðŸ“§ Email', slack: 'ðŸ”· Slack', sms: 'ðŸ“± SMS' }

export default function AlertsPage() {
  const [filter, setFilter]   = useState<'all' | 'critical' | 'warning' | 'info'>('all')
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = ALERTS.filter(a => {
    const matchFilter = filter === 'all' || a.severity === filter
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.report.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const selectedAlert = ALERTS.find(a => a.id === selected)

  return (
    <div className="flex h-full">

      {/* List panel */}
      <div className={cn('flex flex-col border-r border-border', selected ? 'hidden lg:flex w-80 shrink-0' : 'flex-1')}>

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-border space-y-2">
          <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 h-8">
            <Search size={13} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search alertsâ€¦"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'critical', 'warning', 'info'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'text-[11px] px-2.5 py-1 rounded-full border font-medium capitalize transition-colors',
                  filter === f
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >{f}</button>
            ))}
          </div>
        </div>

        {/* Alert list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">No alerts match your filter</div>
          ) : filtered.map(alert => {
            const cfg = SEV[alert.severity as keyof typeof SEV]
            return (
              <button
                key={alert.id}
                onClick={() => setSelected(alert.id)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors',
                  selected === alert.id && 'bg-muted/40'
                )}
              >
                <div className={cn('w-2 h-2 rounded-full shrink-0 mt-1.5', cfg.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground leading-snug">{alert.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{alert.report}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock size={10} className="text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{alert.time}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selected && selectedAlert ? (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-6">

            <button
              onClick={() => setSelected(null)}
              className="lg:hidden text-xs text-muted-foreground mb-4 flex items-center gap-1 hover:text-foreground"
            >
              â† Back to alerts
            </button>

            {(() => {
              const cfg = SEV[selectedAlert.severity as keyof typeof SEV]
              return (
                <>
                  <div className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border mb-4', cfg.bg, cfg.color, cfg.border)}>
                    <cfg.icon size={11} />
                    {selectedAlert.severity.charAt(0).toUpperCase() + selectedAlert.severity.slice(1)}
                  </div>
                  <h1 className="text-base font-semibold text-foreground mb-1">{selectedAlert.title}</h1>
                  <p className="text-xs text-muted-foreground mb-5">{selectedAlert.report} Â· {selectedAlert.time}</p>

                  <div className="bg-muted/30 rounded-xl border border-border p-4 mb-4">
                    <p className="text-sm text-foreground leading-relaxed">{selectedAlert.summary}</p>
                  </div>

                  {selectedAlert.actions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-foreground mb-2">Suggested actions</p>
                      <div className="space-y-2">
                        {selectedAlert.actions.map((a, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[10px] font-medium text-green-700">{i + 1}</span>
                            </div>
                            <p className="text-sm text-foreground">{a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-foreground mb-2">Delivered via</p>
                    <div className="flex gap-2">
                      {selectedAlert.delivered.map(ch => (
                        <span key={ch} className="text-xs px-3 py-1 rounded-full border border-border bg-background text-foreground">
                          {CH[ch] ?? ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Select an alert to view details
        </div>
      )}
    </div>
  )
}


