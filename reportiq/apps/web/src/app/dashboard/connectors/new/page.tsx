'use client'

import { useState } from 'react'
import { SourcePicker } from '@/components/connectors/SourcePicker'
import { ConnectorAuthForm } from '@/components/connectors/ConnectorAuthForm'
import { ConnectorTestResult } from '@/components/connectors/ConnectorTestResult'

type Step = 'pick' | 'auth' | 'test' | 'done'

const STEP_LABELS: Record<Step, string> = {
  pick: 'Choose source',
  auth: 'Connect',
  test: 'Test',
  done: 'Done',
}

export default function NewConnectorPage() {
  const [step, setStep]                       = useState<Step>('pick')
  const [selectedConnector, setSelectedConnector] = useState<any>(null)
  const [testResult, setTestResult]           = useState<any>(null)

  const steps: Step[] = ['pick', 'auth', 'test', 'done']

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">

      {/* Progress steps */}
      <div className="flex items-center mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={[
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                step === s
                  ? 'bg-foreground text-background'
                  : steps.indexOf(step) > i
                    ? 'bg-green-600 text-white'
                    : 'bg-muted text-muted-foreground',
              ].join(' ')}>
                {i + 1}
              </div>
              <span className={[
                'text-xs',
                step === s ? 'text-foreground font-medium' : 'text-muted-foreground',
              ].join(' ')}>
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-px bg-border mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step panels */}
      <div className="rounded-xl border border-border overflow-hidden bg-background min-h-[520px]">

        {step === 'pick' && (
          <SourcePicker
            onSelect={(connector) => {
              setSelectedConnector(connector)
              setStep('auth')
            }}
          />
        )}

        {step === 'auth' && selectedConnector && (
          <ConnectorAuthForm
            connector={selectedConnector}
            onBack={() => setStep('pick')}
            onSuccess={(result: any) => {
              setTestResult(result)
              setStep('test')
            }}
          />
        )}

        {step === 'test' && (
          <ConnectorTestResult
            connector={selectedConnector}
            result={testResult}
            onDone={() => setStep('done')}
          />
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center justify-center h-[520px] gap-4 text-center px-8">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-2xl">✅</div>
            <h2 className="text-base font-medium text-foreground">Connector added successfully</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              {selectedConnector?.label} is now connected. Configure which reports to monitor next.
            </p>
            <a
              href="/dashboard/reports/new"
              className="mt-2 px-5 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Configure reports →
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
