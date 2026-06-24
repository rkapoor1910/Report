﻿'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TestResult {
  success: boolean
  message: string
  preview?: Record<string, unknown>[]
  columns?: string[]
  rowCount?: number
  error?: string
}

interface ConnectorTestResultProps {
  connector: { type: string; label: string; icon: string }
  result: { connector: any; testResult: TestResult }
  onDone: () => void
}

export function ConnectorTestResult({ connector, result, onDone }: ConnectorTestResultProps) {
  const [retrying, setRetrying]       = useState(false)
  const [showRaw, setShowRaw]         = useState(false)
  const [currentResult, setCurrentResult] = useState(result)

  const { testResult } = currentResult
  const success = testResult?.success

  const handleRetry = async () => {
    setRetrying(true)
    try {
      const res  = await fetch('/api/v1/connectors/' + currentResult.connector?.id + '/test', { method: 'POST' })
      const data = await res.json()
      setCurrentResult(prev => ({ ...prev, testResult: data.testResult }))
    } catch {
      // keep existing result
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">Connection test</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{connector.icon} {connector.label}</p>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* Result banner */}
        <div className={cn(
          'rounded-xl border p-4 flex items-start gap-3',
          success
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        )}>
          <div className="shrink-0 mt-0.5">
            {success
              ? <CheckCircle2 size={18} className="text-green-600" />
              : <XCircle size={18} className="text-red-500" />
            }
          </div>
          <div>
            <p className={cn('text-sm font-medium', success ? 'text-green-800' : 'text-red-700')}>
              {success ? 'Connection successful' : 'Connection failed'}
            </p>
            <p className={cn('text-xs mt-0.5 leading-relaxed', success ? 'text-green-700' : 'text-red-600')}>
              {testResult?.message}
            </p>
            {!success && testResult?.error && (
              <p className="text-xs mt-1 text-red-500 font-mono break-all">{testResult.error}</p>
            )}
          </div>
        </div>

        {/* Data preview */}
        {success && testResult?.preview && testResult.preview.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-foreground">Data preview</p>
              {testResult.rowCount && (
                <span className="text-[11px] text-muted-foreground">{testResult.rowCount.toLocaleString()} rows found</span>
              )}
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      {(testResult.columns ?? Object.keys(testResult.preview[0])).map(col => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {testResult.preview.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                        {(testResult.columns ?? Object.keys(row)).map(col => (
                          <td key={col} className="px-3 py-2 text-foreground whitespace-nowrap max-w-[180px] truncate">
                            {String(row[col] ?? 'â€”')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Showing first {Math.min(5, testResult.preview.length)} rows Â· Full data syncs on schedule
            </p>
          </div>
        )}

        {/* What happens next */}
        {success && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
            <p className="text-xs font-medium text-foreground">What happens next</p>
            {[
              'ReportIQ will sync data from this source on your chosen schedule',
              'In Step 2, you\'ll configure which reports to monitor and map your columns',
              'The AI will then start detecting patterns and red flags automatically',
            ].map((item, i) => (
              <div key={i} className="flex gap-2.5 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Raw response toggle */}
        {testResult && (
          <div>
            <button
              onClick={() => setShowRaw(v => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showRaw ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showRaw ? 'Hide' : 'Show'} raw response
            </button>
            {showRaw && (
              <pre className="mt-2 rounded-lg bg-muted p-3 text-xs overflow-x-auto text-muted-foreground">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {!success && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex-1 h-10 rounded-lg border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
              {retrying ? 'Retryingâ€¦' : 'Retry connection'}
            </button>
          )}
          {!success && (
            <button
              onClick={onDone}
              className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Save anyway
            </button>
          )}
          {success && (
            <button
              onClick={onDone}
              className="flex-1 h-10 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Continue to reports â†’
            </button>
          )}
        </div>

        {!success && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
            <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Common fixes: check your credentials, ensure the host is reachable, and verify firewall rules allow outbound connections from ReportIQ.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}


