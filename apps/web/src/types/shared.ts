// â”€â”€â”€ Connector types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type ConnectorCategory = 'files' | 'cloud' | 'database' | 'erp' | 'custom'

export type ConnectorType =
  | 'gmail' | 'outlook' | 'excel_upload' | 'google_sheets' | 'sharepoint'
  | 'sftp' | 's3' | 'shopify' | 'stripe' | 'hubspot' | 'salesforce' | 'ga4'
  | 'postgres' | 'mysql' | 'mssql' | 'mongodb' | 'snowflake' | 'bigquery'
  | 'tally' | 'sap' | 'oracle_erp' | 'ms_dynamics'
  | 'webhook' | 'push_api' | 'sdk' | 'kafka'

export type AuthMethod = 'oauth2' | 'api_key' | 'basic' | 'jdbc' | 'sftp_key' | 'webhook_token' | 'none'

export type ConnectorStatus = 'pending' | 'connected' | 'error' | 'syncing' | 'paused'

export interface Connector {
  id: string
  orgId: string
  name: string
  type: ConnectorType
  category: ConnectorCategory
  authMethod: AuthMethod
  status: ConnectorStatus
  lastSyncAt: Date | null
  nextSyncAt: Date | null
  syncFrequency: SyncFrequency
  config: Record<string, unknown>   // non-sensitive config only
  createdAt: Date
  updatedAt: Date
}

// â”€â”€â”€ Report types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type ReportType =
  | 'sell_out' | 'stock_inventory' | 'demand_forecast' | 'daily_sales'
  | 'dispatch_logistics' | 'purchase_order' | 'franchise' | 'target_actual'
  | 'returns_defects' | 'custom'

export interface Report {
  id: string
  orgId: string
  connectorId: string
  name: string
  type: ReportType
  schema: ReportSchema
  isActive: boolean
  createdAt: Date
}

export interface ReportSchema {
  columns: ColumnMapping[]
  dateColumn: string
  primaryMetric: string
}

export interface ColumnMapping {
  originalName: string
  mappedName: string
  dataType: 'number' | 'text' | 'date' | 'boolean'
  role: 'metric' | 'dimension' | 'date' | 'id' | 'ignore'
}

// â”€â”€â”€ Alert types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type AlertSeverity = 'info' | 'warning' | 'critical'
export type DeliveryChannel = 'whatsapp' | 'sms' | 'email' | 'slack'
export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual'

export interface Alert {
  id: string
  orgId: string
  reportId: string
  severity: AlertSeverity
  title: string
  summary: string
  redFlags: RedFlag[]
  stats: AlertStat[]
  suggestedActions: string[]
  deliveredAt: Date | null
  deliveryChannel: DeliveryChannel
  recipientIds: string[]
  createdAt: Date
}

export interface RedFlag {
  label: string
  value: string
  change: string
  severity: AlertSeverity
}

export interface AlertStat {
  label: string
  value: string
  trend: 'up' | 'down' | 'neutral'
  changePercent: number | null
}

// â”€â”€â”€ User & org types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type UserRole = 'owner' | 'admin' | 'analyst' | 'viewer'

export interface OrgMember {
  id: string
  orgId: string
  clerkUserId: string
  name: string
  email: string
  role: UserRole
  alertSubscriptions: AlertSubscription[]
  createdAt: Date
}

export interface AlertSubscription {
  reportId: string
  channel: DeliveryChannel
  frequency: SyncFrequency
  scheduleTime: string   // e.g. "08:00"
  scheduleDays: string[] // e.g. ["monday"] for weekly
}

