﻿'use client'

import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, Table2, FileSpreadsheet, Mail, Database, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DiscoveredSource {
  sourceRef:     string
  label:         string
  description?:  string
  estimatedRows?: number
  columns?:      string[]
  type:          'table' | 'sheet' | 'file' | 'endpoint' | 'topic'
}

interface ReportSelectorProps {
  connectorId:   string
  connectorType: string
  connectorName: string
  onSelect: (source: DiscoveredSource) => void
  onBack:   () => void
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  table:    <Database   size={15} />,
  sheet:    <FileSpreadsheet size={15} />,
  file:     <FileSpreadsheet size={15} />,
  endpoint: <Globe      size={15} />,
  topic:    <Table2     size={15} />,
}

// Report types to help users label what they're setting up
const REPORT_TYPES = [
  { value: 'sell_out',          label: 'Retailer sell-out',     emoji: 'ðŸ›ï¸' },
  { value: 'stock_inventory',   label: 'Stock / inventory',     emoji: 'ðŸ“¦' },
  { value: 'demand_forecast',   label: 'Demand / forecast',     emoji: 'ðŸ“ˆ' },
  { value: 'daily_sales',       label: 'Daily POS sales',       emoji: 'ðŸ§¾' },
  { value: 'dispatch_logistics',label: 'Dispatch / logistics',  emoji: 'ðŸšš' },
  { value: 'purchase_order',    label: 'Purchase orders',       emoji: 'ðŸ“‹' },
  { value: 'franchise',         label: 'Franchise partner',     emoji: 'ðŸª' },
  { value: 'target_actual',     label: 'Target vs actual',      emoji: 'ðŸŽ¯' },
  { value: 'returns_defects',   label: 'Returns & defects',     emoji: 'â†©ï¸' },
  { value: 'custom',            label: 'Custom report',         emoji: 'âš™ï¸' },
]

export function ReportSelector({ connectorId, connectorType, connectorName, onSelect, onBack }: ReportSelectorProps) {
  const [sources, setSources]     = useState<DiscoveredSource[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected]   = useState<DiscoveredSource | null>(null)
  const [reportName, setReportName]   = useState('')
  const [reportType, setReportType]   = useState('')

  const fetchSources = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res  = await fetch('/api/v1/reports/discover/' + connectorId)
      const data = await res.json()
      setSources(data.sources ?? [])
    } catch {
      // keep empty
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchSources() }, [connectorId])

  // Auto-suggest report name when source + type selected
  useEffect(() => {
    if (selected && reportType) {
      const typeMeta = REPORT_TYPES.find(t => t.value === reportType)
      setReportName(typeMeta ? `${typeMeta.emoji} ${connectorName} â€” ${typeMeta.label}` : selected.label)
    }
  }, [selected, reportType, connectorName])

  const canContinue = selected && reportName.trim() && reportType

  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-medium text-foreground">Choose a report to monitor</h2>
          <p className="text-xs text-muted-foreground mt-0.5">From: {connectorName}</p>
        </div>
        <button
          onClick={() => fetchSources(true)}
          disabled={refreshing}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="px-5 py-5 space-y-6">

        {/* Available sources */}
        <div>
          <p className="text-xs font-medium text-foreground mb-2.5">Available in this source</p>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={18} className="animate-spin text-muted-foreground" />
            </div>
          ) : sources.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">No reports discovered automatically.</p>
              <p className="text-xs text-muted-foreground mt-1">Try refreshing or enter a source reference manually below.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {sources.map(source => (
                <button
                  key={source.sourceRef}
                  onClick={() => setSelected(source)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                    selected?.sourceRef === source.sourceRef
                      ? 'border-foreground ring-1 ring-foreground bg-background'
                      : 'border-border hover:border-foreground/40 bg-background'
                  )}
                >
                  <span className={cn(
                    'w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5',
                    selected?.sourceRef === source.sourceRef ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
                  )}>
                    {TYPE_ICON[source.type] ?? <Table2 size={14} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{source.label}</p>
                    {source.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{source.description}</p>
                    )}
                    {source.columns && source.columns.length > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">
                        Columns: {source.columns.slice(0, 4).join(', ')}{source.columns.length > 4 ? ` +${source.columns.length - 4} more` : ''}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 shrink-0 mt-1 transition-colors',
                    selected?.sourceRef === source.sourceRef ? 'border-foreground bg-foreground' : 'border-border'
                  )} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Report type */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-2">What kind of report is this?</label>
          <div className="grid grid-cols-2 gap-1.5">
            {REPORT_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs transition-all',
                  reportType === type.value
                    ? 'border-foreground bg-foreground text-background font-medium'
                    : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                )}
              >
                <span>{type.emoji}</span>
                {type.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            This helps ReportIQ understand context and generate smarter alerts
          </p>
        </div>

        {/* Report name */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Report name</label>
          <input
            type="text"
            value={reportName}
            onChange={e => setReportName(e.target.value)}
            placeholder="e.g. ðŸ“¦ Adidas stock report â€” Delhi warehouse"
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-foreground/30"
          />
        </div>

      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-muted/20">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          â† Back
        </button>
        <button
          disabled={!canContinue}
          onClick={() => selected && onSelect({ ...selected, label: reportName })}
          className={cn(
            'px-5 py-2 rounded-lg text-sm font-medium transition-all',
            canContinue
              ? 'bg-foreground text-background hover:opacity-90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          Map columns â†’
        </button>
      </div>

    </div>
  )
}


