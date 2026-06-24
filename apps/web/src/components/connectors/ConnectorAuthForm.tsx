﻿'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowLeft, Loader2, ExternalLink, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CredentialField {
  key: string
  label: string
  type: 'text' | 'password' | 'url'
  placeholder?: string
}

interface ConfigField {
  key: string
  label: string
  type: 'text' | 'select'
  options?: string[]
  placeholder?: string
}

interface ConnectorDefinition {
  type: string
  label: string
  category: string
  authMethod: string
  credentialFields: CredentialField[]
  configFields: ConfigField[]
}

interface ConnectorAuthFormProps {
  connector: { type: string; label: string; icon: string; authMethod: string }
  onBack: () => void
  onSuccess: (result: any) => void
}

const OAUTH_PROVIDERS: Record<string, { label: string; color: string; description: string }> = {
  gmail:         { label: 'Connect with Google',    color: '#4285F4', description: 'Grant read access to your Gmail inbox to collect report attachments.' },
  outlook:       { label: 'Connect with Microsoft', color: '#0078D4', description: 'Grant read access to your Outlook inbox and OneDrive files.' },
  google_sheets: { label: 'Connect with Google',    color: '#4285F4', description: 'Grant read access to your Google Sheets.' },
  hubspot:       { label: 'Connect with HubSpot',   color: '#FF7A59', description: 'Authorise ReportIQ to read your HubSpot CRM data.' },
  salesforce:    { label: 'Connect with Salesforce',color: '#00A1E0', description: 'Authorise ReportIQ to read your Salesforce reports.' },
  sharepoint:    { label: 'Connect with Microsoft', color: '#0078D4', description: 'Grant read access to your SharePoint libraries.' },
  ms_dynamics:   { label: 'Connect with Microsoft', color: '#0078D4', description: 'Authorise ReportIQ to read your Dynamics data.' },
  ga4:           { label: 'Connect with Google',    color: '#4285F4', description: 'Grant read access to your Google Analytics 4 property.' },
}

const INBOUND_INFO: Record<string, { title: string; steps: string[] }> = {
  webhook: {
    title: 'Your unique webhook URL',
    steps: [
      'Copy the URL and token below',
      'Add a webhook in your source system pointing to this URL',
      'Include the token in the X-ReportIQ-Token request header',
      'ReportIQ will start receiving data immediately',
    ],
  },
  push_api: {
    title: 'Your Push API endpoint',
    steps: [
      'Copy your API key below',
      'POST data to: /api/v1/ingest/{connectorId}',
      'Authenticate with: Authorization: Bearer <your-api-key>',
      'Send data as JSON or multipart (CSV/Excel)',
    ],
  },
  sdk: {
    title: 'SDK quick start',
    steps: [
      'Install: pip install reportiq  or  npm install @reportiq/sdk',
      'Copy your API key below',
      'Call reportiq.push(data) from your codebase',
      'Full docs at docs.reportiq.com/sdk',
    ],
  },
}

export function ConnectorAuthForm({ connector, onBack, onSuccess }: ConnectorAuthFormProps) {
  const [definition, setDefinition]       = useState<ConnectorDefinition | null>(null)
  const [loading, setLoading]             = useState(true)
  const [submitting, setSubmitting]       = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [connectorName, setConnectorName] = useState('My ' + connector.label)

  useEffect(() => {
    async function fetchDefinition() {
      try {
        const res  = await fetch('/api/v1/connectors/definitions')
        const data = await res.json()
        const def  = data.connectors.find((c: ConnectorDefinition) => c.type === connector.type)
        setDefinition(def ?? null)
      } catch {
        setDefinition({
          type: connector.type, label: connector.label,
          category: '', authMethod: connector.authMethod,
          credentialFields: [], configFields: [],
        })
      } finally {
        setLoading(false)
      }
    }
    fetchDefinition()
  }, [connector.type, connector.authMethod, connector.label])

  const buildSchema = () => {
    if (!definition) return z.object({})
    const shape: Record<string, z.ZodTypeAny> = {}
    definition.credentialFields.forEach(f => {
      shape[f.key] = z.string().min(1, f.label + ' is required')
    })
    definition.configFields?.forEach(f => { shape[f.key] = z.string().optional() })
    return z.object(shape)
  }

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(buildSchema()),
  })

  const togglePassword = (key: string) =>
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))

  const onSubmit = async (formData: Record<string, string>) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: connectorName,
          type: connector.type,
          credentials: formData,
          config: {},
          syncFrequency: 'daily',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create connector')
      onSuccess(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOAuth = () => {
    const cb = encodeURIComponent(window.location.origin + '/api/v1/connectors/oauth/callback')
    window.location.href = '/api/v1/connectors/oauth/init?provider=' + connector.type + '&redirect=' + cb
  }

  const generatedToken = 'riq_live_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  const webhookUrl     = (typeof window !== 'undefined' ? window.location.origin : 'https://app.reportiq.com') + '/api/v1/webhooks/ingest'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isOAuth    = definition?.authMethod === 'oauth2' && !!OAUTH_PROVIDERS[connector.type]
  const isInbound  = ['webhook', 'push_api', 'sdk'].includes(connector.type)
  const isUpload   = connector.type === 'excel_upload'
  const isCredForm = !isOAuth && !isInbound && !isUpload && (definition?.credentialFields?.length ?? 0) > 0

  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <button onClick={onBack} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft size={14} />
        </button>
        <div>
          <h2 className="text-sm font-medium text-foreground">Connect {connector.label}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isOAuth ? "You'll be redirected to authorise access" : 'Credentials stored encrypted â€” never shared'}
          </p>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* Connector name */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Connector name</label>
          <input
            type="text"
            value={connectorName}
            onChange={e => setConnectorName(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-foreground/30"
          />
          <p className="text-xs text-muted-foreground mt-1">A friendly label to identify this connection</p>
        </div>

        {/* OAuth */}
        {isOAuth && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs font-medium text-foreground mb-1">How this works</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{OAUTH_PROVIDERS[connector.type].description}</p>
              <p className="text-xs text-muted-foreground mt-2">ReportIQ only requests <strong>read</strong> access â€” it never modifies your data.</p>
            </div>
            {definition?.configFields?.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-foreground mb-1.5">{f.label}</label>
                <input type="text" placeholder={f.placeholder} {...register(f.key)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-foreground/30" />
              </div>
            ))}
            <button onClick={handleOAuth}
              style={{ backgroundColor: OAUTH_PROVIDERS[connector.type].color }}
              className="w-full h-10 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <ExternalLink size={14} />
              {OAUTH_PROVIDERS[connector.type].label}
            </button>
          </div>
        )}

        {/* Inbound (webhook / push / sdk) */}
        {isInbound && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-xs font-medium text-foreground">{INBOUND_INFO[connector.type]?.title}</p>
              {connector.type !== 'sdk' && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Endpoint URL</p>
                  <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
                    <code className="text-xs flex-1 break-all">{webhookUrl}</code>
                    <button onClick={() => navigator.clipboard.writeText(webhookUrl)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">Copy</button>
                  </div>
                </div>
              )}
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">{connector.type === 'sdk' ? 'API key' : 'Secret token'}</p>
                <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
                  <code className="text-xs flex-1 break-all">{generatedToken}</code>
                  <button onClick={() => navigator.clipboard.writeText(generatedToken)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">Copy</button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Next steps</p>
              {INBOUND_INFO[connector.type]?.steps.map((step, i) => (
                <div key={i} className="flex gap-3 text-xs text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0">{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
            <button
              onClick={() => onSuccess({ connector: { type: connector.type, status: 'connected' }, testResult: { success: true, message: 'Inbound connector ready' } })}
              className="w-full h-10 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90">
              Done â€” connector is set up
            </button>
          </div>
        )}

        {/* File upload */}
        {isUpload && (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
              <p className="text-2xl mb-2">ðŸ“Š</p>
              <p className="text-sm font-medium text-foreground mb-1">Upload a file to test</p>
              <p className="text-xs text-muted-foreground mb-4">Excel (.xlsx, .xls) or CSV â€” up to 50 MB</p>
              <label className="px-4 py-2 rounded-lg border border-border text-sm cursor-pointer hover:bg-muted transition-colors">
                Choose file
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={() => {}} />
              </label>
            </div>
            <button
              onClick={() => onSuccess({ connector: { type: 'excel_upload', status: 'connected' }, testResult: { success: true, message: 'File upload ready' } })}
              className="w-full h-10 bg-foreground text-background rounded-lg text-sm font-medium">
              Continue â†’
            </button>
          </div>
        )}

        {/* Credential form */}
        {isCredForm && (
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            {definition!.credentialFields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-foreground mb-1.5">{field.label}</label>
                <div className="relative">
                  <input
                    type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    {...register(field.key)}
                    className={cn(
                      'w-full h-9 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-1 focus:ring-foreground/30',
                      errors[field.key] ? 'border-red-400' : 'border-border',
                      field.type === 'password' ? 'pr-10' : ''
                    )}
                  />
                  {field.type === 'password' && (
                    <button type="button" onClick={() => togglePassword(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPasswords[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
                {errors[field.key] && <p className="text-xs text-red-500 mt-1">{String(errors[field.key]?.message)}</p>}
              </div>
            ))}

            {definition!.configFields?.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  {field.label} <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                {field.type === 'select' ? (
                  <select {...register(field.key)} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none">
                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type="text" placeholder={field.placeholder} {...register(field.key)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-foreground/30" />
                )}
              </div>
            ))}

            <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
              <span className="text-sm mt-0.5">ðŸ”’</span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All credentials are encrypted with AES-256-GCM before storage. Never logged, never returned in plain text.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full h-10 bg-foreground text-background rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? 'Testing connectionâ€¦' : 'Connect & test â†’'}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}


