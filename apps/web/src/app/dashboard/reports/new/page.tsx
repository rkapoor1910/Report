'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Check } from 'lucide-react'

export const dynamic = 'force-dynamic'

function ReportsContent() {
  const searchParams  = useSearchParams()
  const connectorId   = searchParams.get('connectorId')   ?? 'demo-connector-id'
  const connectorType = searchParams.get('connectorType') ?? 'google_sheets'
  const connectorName = searchParams.get('connectorName') ?? 'My connector'

  const [step, setStep]   = useState<'select' | 'done'>('select')
  const [selected, setSelected] = useState<string | null>(null)

  const REPORTS = [
    { id: 'sell_out',        emoji: '🛍️', label: 'Retailer sell-out',    desc: 'Track daily sales by store, brand, SKU' },
    { id: 'stock_inventory', emoji: '📦', label: 'Stock / inventory',     desc: 'Know when stock is low or sitting idle' },
    { id: 'target_actual',   emoji: '🎯', label: 'Target vs actual',      desc: 'Get alerted when the team misses target' },
    { id: 'dispatch',        emoji: '🚚', label: 'Dispatch and logistics', desc: 'Monitor orders shipped, pending, returned' },
    { id: 'returns',         emoji: '↩️', label: 'Returns and defects',   desc: 'Spot return rate spikes before they escalate' },
    { id: 'custom',          emoji: '⚙️', label: 'Custom report',         desc: 'Map any data source to ReportIQ' },
  ]

  if (step === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center', padding: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={24} color="#16a34a" />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Report configured</h2>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 300, lineHeight: 1.6 }}>
          ReportIQ will now monitor this report and send alerts on your schedule.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setStep('select')} style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, cursor: 'pointer', background: '#fff' }}>
            Add another
          </button>
          <a href="/dashboard/alerts" style={{ padding: '8px 16px', background: '#111827', color: '#fff', borderRadius: 8, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            Set up alerts <ArrowRight size={12} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Choose a report to monitor</h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>From: {connectorName}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {REPORTS.map(report => (
          <button key={report.id} onClick={() => setSelected(report.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: selected === report.id ? '2px solid #111827' : '1px solid #e5e7eb', borderRadius: 12, textAlign: 'left', cursor: 'pointer', background: '#fff', width: '100%' }}>
            <span style={{ fontSize: 20 }}>{report.emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{report.label}</p>
              <p style={{ fontSize: 12, color: '#6b7280' }}>{report.desc}</p>
            </div>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: selected === report.id ? '5px solid #111827' : '2px solid #e5e7eb', flexShrink: 0 }} />
          </button>
        ))}
      </div>
      <button disabled={!selected} onClick={() => setStep('done')}
        style={{ width: '100%', padding: 12, background: selected ? '#111827' : '#e5e7eb', color: selected ? '#fff' : '#9ca3af', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: selected ? 'pointer' : 'not-allowed' }}>
        Configure this report
      </button>
    </div>
  )
}

export default function NewReportPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, fontSize: 14, color: '#6b7280' }}>Loading...</div>}>
      <ReportsContent />
    </Suspense>
  )
}
