'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ReportSelector } from '@/components/reports/ReportSelector'
import { ColumnMapper }   from '@/components/reports/ColumnMapper'
import { ThresholdConfig } from '@/components/reports/ThresholdConfig'

type Step = 'select' | 'map' | 'thresholds' | 'done'

const STEP_LABELS: Record<Step, string> = {
  select:     'Choose report',
  map:        'Map columns',
  thresholds: 'Set alerts',
  done:       'Done',
}

export default function NewReportPage() {
  const searchParams  = useSearchParams()
  const connectorId   = searchParams.get('connectorId')   ?? 'demo-connector-id'
  const connectorType = searchParams.get('connectorType') ?? 'google_sheets'
  const connectorName = searchParams.get('connectorName') ?? 'My connector'

  const [step, setStep]           = useState<Step>('select')
  const [selectedSource, setSelectedSource] = useState<any>(null)
  const [reportType, setReportType]   = useState('')
  const [schema, setSchema]           = useState<any>(null)

  const steps: Step[] = ['select', 'map', 'thresholds', 'done']

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">

      {/* Progress */}
      <div className="flex items-center mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={[
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                step === s ? 'bg-foreground text-background' :
                  steps.indexOf(step) > i ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
              ].join(' ')}>
                {i + 1}
              </div>
              <span className={['text-xs', step === s ? 'text-foreground font-medium' : 'text-muted-foreground'].join(' ')}>
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border mx-2" />}
          </div>
        ))}
      </div>

      {/* Step panels */}
      <div className="rounded-xl border border-border overflow-hidden bg-background">

        {step === 'select' && (
          <ReportSelector
            connectorId={connectorId}
            connectorType={connectorType}
            connectorName={connectorName}
            onBack={() => window.history.back()}
            onSelect={(source) => {
              setSelectedSource(source)
              setReportType((source as any).reportType ?? 'custom')
              setStep('map')
            }}
          />
        )}

        {step === 'map' && selectedSource && (
          <ColumnMapper
            connectorId={connectorId}
            sourceRef={selectedSource.sourceRef}
            reportName={selectedSource.label}
            onBack={() => setStep('select')}
            onDone={(s) => { setSchema(s); setStep('thresholds') }}
          />
        )}

        {step === 'thresholds' && schema && (
          <ThresholdConfig
            reportType={reportType}
            reportName={selectedSource?.label ?? 'Report'}
            primaryMetric={schema.primaryMetric}
            onBack={() => setStep('map')}
            onSave={async (thresholds, syncFrequency) => {
              await fetch('/api/v1/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  connectorId,
                  name:       selectedSource?.label,
                  type:       reportType,
                  sourceRef:  selectedSource?.sourceRef,
                  schema,
                  thresholds,
                  syncFrequency,
                }),
              })
              setStep('done')
            }}
          />
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-16 px-8 gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-2xl">Γ£à</div>
            <h2 className="text-base font-medium text-foreground">Report configured</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              {selectedSource?.label} is now being monitored. ReportIQ will start analysing data on your schedule.
            </p>
            <div className="flex gap-3 mt-2">
              <a href="/dashboard/reports/new"
                className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                Add another report
              </a>
              <a href="/dashboard/alerts"
                className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90">
                Set up alerts ΓåÆ
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
