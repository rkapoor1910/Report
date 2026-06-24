﻿'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConnectorType, ConnectorCategory } from '../../types/shared'

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ConnectorDefinition {
  type: ConnectorType
  label: string
  category: ConnectorCategory
  authMethod: string
  icon: string
  popular?: boolean
  isNew?: boolean
}

// â”€â”€â”€ Connector catalogue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CONNECTORS: ConnectorDefinition[] = [
  // Files & email
  { type: 'gmail',        label: 'Gmail',             category: 'files',    authMethod: 'oauth2',        icon: 'âœ‰ï¸',  popular: true },
  { type: 'outlook',      label: 'Outlook / M365',    category: 'files',    authMethod: 'oauth2',        icon: 'ðŸ“§',  popular: true },
  { type: 'excel_upload', label: 'Excel / CSV upload', category: 'files',   authMethod: 'none',          icon: 'ðŸ“Š',  popular: true },
  { type: 'google_sheets',label: 'Google Sheets',     category: 'files',    authMethod: 'oauth2',        icon: 'ðŸ—‚ï¸',  popular: true },
  { type: 'sharepoint',   label: 'SharePoint',        category: 'files',    authMethod: 'oauth2',        icon: 'ðŸ¢' },
  { type: 'sftp',         label: 'SFTP / FTP',        category: 'files',    authMethod: 'sftp_key',      icon: 'ðŸ–§' },
  { type: 's3',           label: 'AWS S3 / GCS',      category: 'files',    authMethod: 'api_key',       icon: 'â˜ï¸' },
  // Cloud
  { type: 'shopify',      label: 'Shopify',           category: 'cloud',    authMethod: 'api_key',       icon: 'ðŸ›ï¸',  popular: true },
  { type: 'stripe',       label: 'Stripe',            category: 'cloud',    authMethod: 'api_key',       icon: 'ðŸ’³' },
  { type: 'hubspot',      label: 'HubSpot',           category: 'cloud',    authMethod: 'oauth2',        icon: 'ðŸ”¶' },
  { type: 'salesforce',   label: 'Salesforce',        category: 'cloud',    authMethod: 'oauth2',        icon: 'â˜ï¸' },
  { type: 'ga4',          label: 'Google Analytics',  category: 'cloud',    authMethod: 'oauth2',        icon: 'ðŸ“ˆ' },
  // Databases
  { type: 'postgres',     label: 'PostgreSQL',        category: 'database', authMethod: 'basic',         icon: 'ðŸ˜',  popular: true },
  { type: 'mysql',        label: 'MySQL',             category: 'database', authMethod: 'basic',         icon: 'ðŸ¬' },
  { type: 'mssql',        label: 'SQL Server',        category: 'database', authMethod: 'basic',         icon: 'ðŸ—„ï¸' },
  { type: 'mongodb',      label: 'MongoDB',           category: 'database', authMethod: 'basic',         icon: 'ðŸƒ' },
  { type: 'snowflake',    label: 'Snowflake',         category: 'database', authMethod: 'basic',         icon: 'â„ï¸' },
  { type: 'bigquery',     label: 'BigQuery',          category: 'database', authMethod: 'api_key',       icon: 'ðŸ”' },
  // ERP / Legacy
  { type: 'tally',        label: 'Tally',             category: 'erp',      authMethod: 'basic',         icon: 'ðŸ§¾',  popular: true },
  { type: 'sap',          label: 'SAP',               category: 'erp',      authMethod: 'basic',         icon: 'ðŸ­' },
  { type: 'oracle_erp',   label: 'Oracle ERP',        category: 'erp',      authMethod: 'basic',         icon: 'ðŸ”´' },
  { type: 'ms_dynamics',  label: 'MS Dynamics',       category: 'erp',      authMethod: 'oauth2',        icon: 'ðŸ”·' },
  // Custom
  { type: 'webhook',      label: 'Webhook receiver',  category: 'custom',   authMethod: 'webhook_token', icon: 'ðŸ”—', isNew: true },
  { type: 'push_api',     label: 'Push API',          category: 'custom',   authMethod: 'api_key',       icon: 'ðŸ“¡', isNew: true },
  { type: 'sdk',          label: 'SDK / code',        category: 'custom',   authMethod: 'api_key',       icon: 'ðŸ’»', isNew: true },
  { type: 'kafka',        label: 'Kafka / Kinesis',   category: 'custom',   authMethod: 'basic',         icon: 'âš¡' },
]

const CATEGORIES: Array<{ id: ConnectorCategory | 'all'; label: string }> = [
  { id: 'all',      label: 'All' },
  { id: 'files',    label: 'Files & email' },
  { id: 'cloud',    label: 'Cloud apps' },
  { id: 'database', label: 'Databases' },
  { id: 'erp',      label: 'ERP & legacy' },
  { id: 'custom',   label: 'Custom / API' },
]

const CATEGORY_LABELS: Record<ConnectorCategory, string> = {
  files:    'Files, email & spreadsheets',
  cloud:    'Cloud apps & SaaS',
  database: 'Databases & warehouses',
  erp:      'ERP & legacy systems',
  custom:   'Custom & developer',
}

// â”€â”€â”€ Props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SourcePickerProps {
  onSelect: (connector: ConnectorDefinition) => void
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function SourcePicker({ onSelect }: SourcePickerProps) {
  const [search, setSearch]           = useState('')
  const [category, setCategory]       = useState<ConnectorCategory | 'all'>('all')
  const [selected, setSelected]       = useState<ConnectorType | null>(null)

  const filtered = useMemo(() => {
    return CONNECTORS.filter(c => {
      const matchCat    = category === 'all' || c.category === category
      const matchSearch = !search || c.label.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [search, category])

  const grouped = useMemo(() => {
    if (category !== 'all' || search) {
      return [{ label: 'Results', connectors: filtered }]
    }
    const cats: ConnectorCategory[] = ['files', 'cloud', 'database', 'erp', 'custom']
    return cats
      .map(cat => ({
        label: CATEGORY_LABELS[cat],
        connectors: filtered.filter(c => c.category === cat),
      }))
      .filter(g => g.connectors.length > 0)
  }, [filtered, category, search])

  const selectedConnector = CONNECTORS.find(c => c.type === selected)

  const handleSelect = (c: ConnectorDefinition) => {
    setSelected(c.type)
  }

  const handleContinue = () => {
    if (!selectedConnector) return
    onSelect(selectedConnector)
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-medium text-foreground">Add a data source</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Choose how your reports reach ReportIQ</p>
        </div>
        <span className="text-xs text-muted-foreground">Step 1 of 4</span>
      </div>

      {/* Search */}
      <div className="px-5 pt-4">
        <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 h-9">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search â€” Shopify, Tally, Gmail, Postgresâ€¦"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 px-5 pt-3 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border transition-colors',
              category === cat.id
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Connector grid */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2">
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No connectors match your search.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Need something custom?{' '}
              <a href="mailto:hello@reportiq.com" className="underline">Request a connector</a>
            </p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.label} className="mb-6">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2.5">
                {group.label}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {group.connectors.map(connector => (
                  <button
                    key={connector.type}
                    onClick={() => handleSelect(connector)}
                    className={cn(
                      'flex flex-col items-start p-3 rounded-xl border text-left transition-all',
                      selected === connector.type
                        ? 'border-foreground ring-1 ring-foreground bg-background'
                        : 'border-border hover:border-foreground/40 bg-background'
                    )}
                  >
                    <span className="text-xl mb-2">{connector.icon}</span>
                    <span className="text-[13px] font-medium text-foreground leading-tight">
                      {connector.label}
                    </span>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {connector.popular && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-700">
                          Popular
                        </span>
                      )}
                      {connector.isNew && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                          New
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom bar */}
      <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-muted/30">
        <div>
          <p className="text-xs text-muted-foreground">Selected</p>
          <p className="text-sm font-medium text-foreground">
            {selectedConnector ? `${selectedConnector.icon} ${selectedConnector.label}` : 'None selected'}
          </p>
        </div>
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={cn(
            'text-sm font-medium px-5 py-2 rounded-lg transition-all',
            selected
              ? 'bg-foreground text-background hover:opacity-90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          Continue â†’
        </button>
      </div>

    </div>
  )
}



