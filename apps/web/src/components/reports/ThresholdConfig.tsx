'use client'

import { useState } from 'react'
import { TrendingDown, TrendingUp, Clock, Package, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Thresholds {
  dropAlertPct:   number
  spikeAlertPct:  number
  missingDataHrs: number
  deadStockDays?: number
}

interface ThresholdConfigProps {
  reportType:    string
  reportName:    string
  primaryMetric: string
  onBack:        () => void
  onSave: (thresholds: Thresholds, syncFrequency: string) => void
}

const PRESETS: Array<{ label: string; description: string; values: Thresholds }> = [
  {
    label: 'Sensitive',
    description: 'Alert on small changes — good for critical metrics',
    values: { dropAlertPct: 10, spikeAlertPct: 20, missingDataHrs: 12 },
  },
  {
    label: 'Balanced',
    description: 'Default — catches meaningful changes without noise',
    values: { dropAlertPct: 15, spikeAlertPct: 30, missingDataHrs: 24 },
  },
  {
    label: 'Relaxed',
    description: 'Only flag large deviations — for noisy data sources',
    values: { dropAlertPct: 25, spikeAlertPct: 50, missingDataHrs: 48 },
  },
]

const FREQUENCIES = [
  { value: 'realtime', label: 'Real-time',    description: 'As soon as data arrives' },
  { value: 'hourly',   label: 'Hourly',       description: 'Every hour' },
  { value: 'daily',    label: 'Daily',        description: 'Once a day — recommended' },
  { value: 'weekly',   label: 'Weekly',       description: 'Once a week' },
  { value: 'manual',   label: 'Manual only',  description: 'Only when you trigger it' },
]

export function ThresholdConfig({ reportType, reportName, primaryMetric, onBack, onSave }: ThresholdConfigProps) {
  const isStock       = reportType === 'stock_inventory'
  const [preset, setPreset]   = useState<string>('Balanced')
  const [frequency, setFrequency] = useState('daily')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  const [thresholds, setThresholds] = useState<Thresholds>({
    dropAlertPct:   15,
    spikeAlertPct:  30,
    missingDataHrs: 24,
    deadStockDays:  isStock ? 30 : undefined,
  })

  const applyPreset = (p: typeof PRESETS[0]) => {
    setPreset(p.label)
    setThresholds(prev => ({ ...prev, ...p.values }))
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800)) // simulate API call
    setSaved(true)
    setTimeout(() => onSave(thresholds, frequency), 600)
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <CheckCircle2 size={32} className="text-green-600" />
        <p className="text-sm font-medium text-foreground">Report saved</p>
        <p className="text-xs text-muted-foreground">Setting up your alert subscriptions…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">Alert thresholds</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{reportName}</p>
      </div>

      <div className="px-5 py-5 space-y-6">

        {/* Presets */}
        <div>
          <p className="text-xs font-medium text-foreground mb-2.5">Start with a preset</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className={cn(
                  'p-3 rounded-lg border text-left transition-all',
                  preset === p.label
                    ? 'border-foreground ring-1 ring-foreground'
                    : 'border-border hover:border-foreground/40'
                )}
              >
                <p className="text-xs font-medium text-foreground">{p.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{p.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Fine-tune sliders */}
        <div className="space-y-4">
          <p className="text-xs font-medium text-foreground">Fine-tune</p>

          {/* Drop alert */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingDown size={14} className="text-red-500" />
                <span className="text-xs font-medium text-foreground">Drop alert</span>
              </div>
              <span className="text-sm font-medium text-foreground">{thresholds.dropAlertPct}%</span>
            </div>
            <input
              type="range" min={5} max={50} step={5}
              value={thresholds.dropAlertPct}
              onChange={e => { setPreset('Custom'); setThresholds(t => ({ ...t, dropAlertPct: +e.target.value })) }}
              className="w-full accent-foreground"
            />
            <p className="text-[11px] text-muted-foreground mt-2">
              Alert when <strong>{primaryMetric || 'primary metric'}</strong> drops by more than <strong>{thresholds.dropAlertPct}%</strong> vs the previous period
            </p>
          </div>

          {/* Spike alert */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-amber-500" />
                <span className="text-xs font-medium text-foreground">Spike alert</span>
              </div>
              <span className="text-sm font-medium text-foreground">{thresholds.spikeAlertPct}%</span>
            </div>
            <input
              type="range" min={10} max={100} step={5}
              value={thresholds.spikeAlertPct}
              onChange={e => { setPreset('Custom'); setThresholds(t => ({ ...t, spikeAlertPct: +e.target.value })) }}
              className="w-full accent-foreground"
            />
            <p className="text-[11px] text-muted-foreground mt-2">
              Alert on unexpected spikes — could indicate data errors or a breakout moment
            </p>
          </div>

          {/* Missing data */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-500" />
                <span className="text-xs font-medium text-foreground">Missing data alert</span>
              </div>
              <span className="text-sm font-medium text-foreground">{thresholds.missingDataHrs}h</span>
            </div>
            <input
              type="range" min={6} max={72} step={6}
              value={thresholds.missingDataHrs}
              onChange={e => { setPreset('Custom'); setThresholds(t => ({ ...t, missingDataHrs: +e.target.value })) }}
              className="w-full accent-foreground"
            />
            <p className="text-[11px] text-muted-foreground mt-2">
              Alert if no data arrives for <strong>{thresholds.missingDataHrs} hours</strong> — catches silent failures
            </p>
          </div>

          {/* Dead stock — only for inventory reports */}
          {isStock && (
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-purple-500" />
                  <span className="text-xs font-medium text-foreground">Dead stock alert</span>
                </div>
                <span className="text-sm font-medium text-foreground">{thresholds.deadStockDays}d</span>
              </div>
              <input
                type="range" min={7} max={90} step={7}
                value={thresholds.deadStockDays ?? 30}
                onChange={e => { setPreset('Custom'); setThresholds(t => ({ ...t, deadStockDays: +e.target.value })) }}
                className="w-full accent-foreground"
              />
              <p className="text-[11px] text-muted-foreground mt-2">
                Flag SKUs with zero sales for more than <strong>{thresholds.deadStockDays} days</strong>
              </p>
            </div>
          )}
        </div>

        {/* Sync frequency */}
        <div>
          <p className="text-xs font-medium text-foreground mb-2.5">How often should ReportIQ check this report?</p>
          <div className="space-y-1.5">
            {FREQUENCIES.map(f => (
              <button
                key={f.value}
                onClick={() => setFrequency(f.value)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-left transition-all',
                  frequency === f.value
                    ? 'border-foreground ring-1 ring-foreground'
                    : 'border-border hover:border-foreground/40'
                )}
              >
                <div>
                  <span className="text-xs font-medium text-foreground">{f.label}</span>
                  <span className="text-[11px] text-muted-foreground ml-2">{f.description}</span>
                </div>
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 transition-colors shrink-0',
                  frequency === f.value ? 'border-foreground bg-foreground' : 'border-border'
                )} />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-muted/20">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? 'Saving…' : 'Save report →'}
        </button>
      </div>

    </div>
  )
}
