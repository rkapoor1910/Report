﻿'use client'

import { useState, useEffect } from 'react'
import { Loader2, Wand2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ColumnMapping {
  originalName: string
  mappedName:   string
  dataType:     'number' | 'text' | 'date' | 'boolean'
  role:         'metric' | 'dimension' | 'date' | 'id' | 'ignore'
}

interface ReportPreview {
  sourceRef:     string
  columns:       string[]
  rows:          Record<string, unknown>[]
  totalRows?:    number
  detectedTypes: Record<string, 'number' | 'text' | 'date' | 'boolean'>
  suggestedMappings: Record<string, { role: string; mappedName: string }>
}

interface ColumnMapperProps {
  connectorId: string
  sourceRef:   string
  reportName:  string
  onBack:      () => void
  onDone: (schema: {
    columns:       ColumnMapping[]
    dateColumn:    string
    primaryMetric: string
  }) => void
}

// â”€â”€â”€ Role config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ROLES: Array<{ value: ColumnMapping['role']; label: string; description: string; color: string }> = [
  { value: 'metric',    label: 'Metric',    description: 'A number to track â€” revenue, units, count', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'dimension', label: 'Dimension', description: 'A category to group by â€” brand, store, SKU', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'date',      label: 'Date',      description: 'A date or time field',                       color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'id',        label: 'ID',        description: 'A unique identifier â€” SKU code, order ID',   color: 'bg-slate-50 text-slate-600 border-slate-200' },
  { value: 'ignore',    label: 'Ignore',    description: 'Skip this column',                           color: 'bg-gray-50 text-gray-400 border-gray-200' },
]

const ROLE_BADGE: Record<ColumnMapping['role'], string> = {
  metric:    'bg-blue-50 text-blue-700',
  dimension: 'bg-purple-50 text-purple-700',
  date:      'bg-amber-50 text-amber-700',
  id:        'bg-slate-50 text-slate-600',
  ignore:    'bg-gray-50 text-gray-400',
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function ColumnMapper({ connectorId, sourceRef, reportName, onBack, onDone }: ColumnMapperProps) {
  const [preview, setPreview]     = useState<ReportPreview | null>(null)
  const [loading, setLoading]     = useState(true)
  const [mappings, setMappings]   = useState<ColumnMapping[]>([])
  const [aiApplied, setAiApplied] = useState(false)
  const [activeCol, setActiveCol] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPreview() {
      try {
        const res  = await fetch('/api/v1/reports/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectorId, sourceRef }),
        })
        const data: ReportPreview = await res.json()
        setPreview(data)

        // Initialise mappings â€” apply AI suggestions if available
        const initial: ColumnMapping[] = data.columns.map(col => {
          const suggested = data.suggestedMappings[col]
          return {
            originalName: col,
            mappedName:   suggested?.mappedName ?? col.toLowerCase().replace(/\s+/g, '_'),
            dataType:     data.detectedTypes[col] ?? 'text',
            role:         (suggested?.role as ColumnMapping['role']) ?? 'dimension',
          }
        })
        setMappings(initial)
        if (Object.keys(data.suggestedMappings).length > 0) setAiApplied(true)
      } catch {
        setPreview(null)
      } finally {
        setLoading(false)
      }
    }
    fetchPreview()
  }, [connectorId, sourceRef])

  const updateMapping = (originalName: string, updates: Partial<ColumnMapping>) => {
    setMappings(prev => prev.map(m =>
      m.originalName === originalName ? { ...m, ...updates } : m
    ))
  }

  const dateColumns   = mappings.filter(m => m.role === 'date')
  const metricColumns = mappings.filter(m => m.role === 'metric')

  const [dateColumn, setDateColumn]       = useState('')
  const [primaryMetric, setPrimaryMetric] = useState('')

  useEffect(() => {
    if (dateColumns.length > 0 && !dateColumn)   setDateColumn(dateColumns[0].originalName)
    if (metricColumns.length > 0 && !primaryMetric) setPrimaryMetric(metricColumns[0].originalName)
  }, [mappings])

  const canContinue = dateColumn && primaryMetric && mappings.some(m => m.role === 'metric')

  const handleDone = () => {
    onDone({ columns: mappings, dateColumn, primaryMetric })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Loading data previewâ€¦</p>
      </div>
    )
  }

  if (!preview) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Could not load preview. Please check the connector and try again.</p>
        <button onClick={onBack} className="mt-4 text-sm underline text-muted-foreground">â† Go back</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">Map your columns</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{reportName} Â· {preview.totalRows?.toLocaleString()} rows</p>
      </div>

      <div className="px-5 py-4 space-y-5">

        {/* AI suggestion notice */}
        {aiApplied && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5">
            <Wand2 size={13} className="text-blue-600 shrink-0" />
            <p className="text-xs text-blue-700">
              AI auto-detected column types and roles. Review and adjust anything that looks wrong.
            </p>
          </div>
        )}

        {/* Data preview table */}
        <div>
          <p className="text-xs font-medium text-foreground mb-2">Data preview (first 3 rows)</p>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {preview.columns.map(col => (
                      <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 3).map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {preview.columns.map(col => (
                        <td key={col} className="px-3 py-2 text-foreground whitespace-nowrap max-w-[140px] truncate">
                          {String(row[col] ?? 'â€”')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Column mappings */}
        <div>
          <p className="text-xs font-medium text-foreground mb-2">Column roles</p>
          <div className="space-y-2">
            {mappings.map(mapping => (
              <div
                key={mapping.originalName}
                className={cn(
                  'rounded-lg border p-3 transition-colors',
                  activeCol === mapping.originalName ? 'border-foreground/40' : 'border-border'
                )}
                onClick={() => setActiveCol(activeCol === mapping.originalName ? null : mapping.originalName)}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Column name + type */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-foreground truncate">{mapping.originalName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                      {mapping.dataType}
                    </span>
                  </div>

                  {/* Role selector */}
                  <div className="flex gap-1 flex-wrap justify-end">
                    {ROLES.map(role => (
                      <button
                        key={role.value}
                        onClick={e => { e.stopPropagation(); updateMapping(mapping.originalName, { role: role.value }) }}
                        className={cn(
                          'text-[11px] font-medium px-2 py-0.5 rounded border transition-all',
                          mapping.role === role.value
                            ? role.color
                            : 'border-border text-muted-foreground hover:border-foreground/30'
                        )}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expanded: mapped name */}
                {activeCol === mapping.originalName && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <label className="block text-[11px] text-muted-foreground mb-1">
                      Internal field name (used by AI for analysis)
                    </label>
                    <input
                      type="text"
                      value={mapping.mappedName}
                      onClick={e => e.stopPropagation()}
                      onChange={e => updateMapping(mapping.originalName, { mappedName: e.target.value })}
                      className="w-full h-7 px-2 rounded border border-border bg-background text-xs outline-none focus:ring-1 focus:ring-foreground/30 font-mono"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Date + primary metric pickers */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Date column <span className="text-red-500">*</span>
            </label>
            <select
              value={dateColumn}
              onChange={e => setDateColumn(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs outline-none"
            >
              <option value="">Selectâ€¦</option>
              {mappings.filter(m => m.role === 'date').map(m => (
                <option key={m.originalName} value={m.originalName}>{m.originalName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Primary metric <span className="text-red-500">*</span>
            </label>
            <select
              value={primaryMetric}
              onChange={e => setPrimaryMetric(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs outline-none"
            >
              <option value="">Selectâ€¦</option>
              {mappings.filter(m => m.role === 'metric').map(m => (
                <option key={m.originalName} value={m.originalName}>{m.originalName}</option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">The main number the AI watches</p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-muted/20">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">â† Back</button>
        <button
          disabled={!canContinue}
          onClick={handleDone}
          className={cn(
            'px-5 py-2 rounded-lg text-sm font-medium transition-all',
            canContinue ? 'bg-foreground text-background hover:opacity-90' : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          Set alert thresholds â†’
        </button>
      </div>

    </div>
  )
}


