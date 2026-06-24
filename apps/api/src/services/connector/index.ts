import { encryptCredentials, decryptCredentials } from '../vault/index.js'
import { testRestConnection } from './testers/rest.js'
import { testDatabaseConnection } from './testers/database.js'
import { testEmailConnection } from './testers/email.js'
import { testSftpConnection } from './testers/sftp.js'
import { testGoogleSheetsConnection } from './testers/google-sheets.js'
import type {
  ConnectorType,
  ConnectorCategory,
  AuthMethod,
  ConnectorStatus,
  SyncFrequency,
} from '@reportiq/shared-types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateConnectorInput {
  orgId: string
  name: string
  type: ConnectorType
  category: ConnectorCategory
  authMethod: AuthMethod
  credentials: Record<string, string>   // plain — encrypted before DB write
  config?: Record<string, unknown>
  syncFrequency?: SyncFrequency
}

export interface ConnectorRecord {
  id: string
  orgId: string
  name: string
  type: ConnectorType
  category: ConnectorCategory
  authMethod: AuthMethod
  status: ConnectorStatus
  config: Record<string, unknown>
  syncFrequency: SyncFrequency
  lastSyncAt: Date | null
  nextSyncAt: Date | null
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TestResult {
  success: boolean
  message: string
  preview?: Record<string, unknown>[]  // first few rows of data
  rowCount?: number
  columns?: string[]
  error?: string
}

// ─── Connector metadata map ─────────────────────────────────────────────────
// Defines which fields each connector type needs from the user

export const CONNECTOR_DEFINITIONS: Record<ConnectorType, {
  label: string
  category: ConnectorCategory
  authMethod: AuthMethod
  credentialFields: Array<{ key: string; label: string; type: 'text' | 'password' | 'url'; placeholder?: string }>
  configFields?: Array<{ key: string; label: string; type: 'text' | 'select'; options?: string[] }>
}> = {
  gmail: {
    label: 'Gmail',
    category: 'files',
    authMethod: 'oauth2',
    credentialFields: [],  // handled by OAuth flow
    configFields: [
      { key: 'labelFilter', label: 'Only emails with label', type: 'text', },
      { key: 'attachmentTypes', label: 'Attachment types', type: 'select', options: ['excel', 'csv', 'pdf', 'all'] },
    ],
  },
  outlook: {
    label: 'Outlook / Microsoft 365',
    category: 'files',
    authMethod: 'oauth2',
    credentialFields: [],
    configFields: [
      { key: 'folderPath', label: 'Folder path', type: 'text' },
      { key: 'attachmentTypes', label: 'Attachment types', type: 'select', options: ['excel', 'csv', 'pdf', 'all'] },
    ],
  },
  excel_upload: {
    label: 'Excel / CSV upload',
    category: 'files',
    authMethod: 'none',
    credentialFields: [],
  },
  google_sheets: {
    label: 'Google Sheets',
    category: 'files',
    authMethod: 'oauth2',
    credentialFields: [],
    configFields: [
      { key: 'spreadsheetId', label: 'Spreadsheet ID or URL', type: 'text' },
      { key: 'sheetName', label: 'Sheet / tab name', type: 'text' },
    ],
  },
  sharepoint: {
    label: 'SharePoint / OneDrive',
    category: 'files',
    authMethod: 'oauth2',
    credentialFields: [],
    configFields: [
      { key: 'siteUrl', label: 'SharePoint site URL', type: 'url' },
      { key: 'libraryPath', label: 'Document library path', type: 'text' },
    ],
  },
  sftp: {
    label: 'SFTP / FTP',
    category: 'files',
    authMethod: 'sftp_key',
    credentialFields: [
      { key: 'host', label: 'Host', type: 'text', placeholder: 'files.example.com' },
      { key: 'port', label: 'Port', type: 'text', placeholder: '22' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'privateKey', label: 'Private key (optional)', type: 'password' },
    ],
    configFields: [
      { key: 'remotePath', label: 'Remote directory path', type: 'text', placeholder: '/reports/' },
      { key: 'filePattern', label: 'File pattern', type: 'text', placeholder: '*.xlsx' },
    ],
  },
  s3: {
    label: 'AWS S3 / GCS',
    category: 'files',
    authMethod: 'api_key',
    credentialFields: [
      { key: 'accessKeyId', label: 'Access key ID', type: 'text' },
      { key: 'secretAccessKey', label: 'Secret access key', type: 'password' },
      { key: 'region', label: 'Region', type: 'text', placeholder: 'us-east-1' },
    ],
    configFields: [
      { key: 'bucket', label: 'Bucket name', type: 'text' },
      { key: 'prefix', label: 'Key prefix / folder', type: 'text', placeholder: 'reports/' },
    ],
  },
  shopify: {
    label: 'Shopify',
    category: 'cloud',
    authMethod: 'api_key',
    credentialFields: [
      { key: 'shopDomain', label: 'Shop domain', type: 'text', placeholder: 'yourshop.myshopify.com' },
      { key: 'accessToken', label: 'Admin API access token', type: 'password' },
    ],
  },
  stripe: {
    label: 'Stripe',
    category: 'cloud',
    authMethod: 'api_key',
    credentialFields: [
      { key: 'secretKey', label: 'Secret key', type: 'password', placeholder: 'sk_live_...' },
    ],
  },
  hubspot: {
    label: 'HubSpot',
    category: 'cloud',
    authMethod: 'oauth2',
    credentialFields: [],
  },
  salesforce: {
    label: 'Salesforce',
    category: 'cloud',
    authMethod: 'oauth2',
    credentialFields: [],
    configFields: [
      { key: 'instanceUrl', label: 'Instance URL', type: 'url', placeholder: 'https://yourorg.salesforce.com' },
    ],
  },
  ga4: {
    label: 'Google Analytics 4',
    category: 'cloud',
    authMethod: 'oauth2',
    credentialFields: [],
    configFields: [
      { key: 'propertyId', label: 'GA4 Property ID', type: 'text' },
    ],
  },
  postgres: {
    label: 'PostgreSQL',
    category: 'database',
    authMethod: 'basic',
    credentialFields: [
      { key: 'host', label: 'Host', type: 'text', placeholder: 'db.example.com' },
      { key: 'port', label: 'Port', type: 'text', placeholder: '5432' },
      { key: 'database', label: 'Database name', type: 'text' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'sslMode', label: 'SSL mode', type: 'text', placeholder: 'require' },
    ],
  },
  mysql: {
    label: 'MySQL',
    category: 'database',
    authMethod: 'basic',
    credentialFields: [
      { key: 'host', label: 'Host', type: 'text' },
      { key: 'port', label: 'Port', type: 'text', placeholder: '3306' },
      { key: 'database', label: 'Database', type: 'text' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
    ],
  },
  mssql: {
    label: 'SQL Server',
    category: 'database',
    authMethod: 'basic',
    credentialFields: [
      { key: 'host', label: 'Host / server', type: 'text' },
      { key: 'port', label: 'Port', type: 'text', placeholder: '1433' },
      { key: 'database', label: 'Database', type: 'text' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
    ],
  },
  mongodb: {
    label: 'MongoDB',
    category: 'database',
    authMethod: 'basic',
    credentialFields: [
      { key: 'uri', label: 'Connection URI', type: 'password', placeholder: 'mongodb+srv://...' },
    ],
  },
  snowflake: {
    label: 'Snowflake',
    category: 'database',
    authMethod: 'basic',
    credentialFields: [
      { key: 'account', label: 'Account identifier', type: 'text', placeholder: 'org-account' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
      { key: 'warehouse', label: 'Warehouse', type: 'text' },
      { key: 'database', label: 'Database', type: 'text' },
      { key: 'schema', label: 'Schema', type: 'text', placeholder: 'PUBLIC' },
    ],
  },
  bigquery: {
    label: 'BigQuery',
    category: 'database',
    authMethod: 'api_key',
    credentialFields: [
      { key: 'serviceAccountJson', label: 'Service account JSON', type: 'password' },
    ],
    configFields: [
      { key: 'projectId', label: 'GCP project ID', type: 'text' },
      { key: 'datasetId', label: 'Dataset ID', type: 'text' },
    ],
  },
  tally: {
    label: 'Tally',
    category: 'erp',
    authMethod: 'basic',
    credentialFields: [
      { key: 'host', label: 'Tally server host', type: 'text', placeholder: '192.168.1.10' },
      { key: 'port', label: 'Tally XML port', type: 'text', placeholder: '9000' },
    ],
    configFields: [
      { key: 'companyName', label: 'Company name in Tally', type: 'text' },
    ],
  },
  sap: {
    label: 'SAP',
    category: 'erp',
    authMethod: 'basic',
    credentialFields: [
      { key: 'host', label: 'SAP host', type: 'text' },
      { key: 'systemNumber', label: 'System number', type: 'text', placeholder: '00' },
      { key: 'client', label: 'Client', type: 'text', placeholder: '100' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
    ],
  },
  oracle_erp: {
    label: 'Oracle ERP',
    category: 'erp',
    authMethod: 'basic',
    credentialFields: [
      { key: 'host', label: 'Host', type: 'text' },
      { key: 'port', label: 'Port', type: 'text', placeholder: '1521' },
      { key: 'serviceName', label: 'Service name / SID', type: 'text' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
    ],
  },
  ms_dynamics: {
    label: 'Microsoft Dynamics',
    category: 'erp',
    authMethod: 'oauth2',
    credentialFields: [],
    configFields: [
      { key: 'organizationUrl', label: 'Organisation URL', type: 'url' },
    ],
  },
  webhook: {
    label: 'Webhook receiver',
    category: 'custom',
    authMethod: 'webhook_token',
    credentialFields: [],  // token is generated by us, not entered
  },
  push_api: {
    label: 'Push API',
    category: 'custom',
    authMethod: 'api_key',
    credentialFields: [],  // API key generated by us
  },
  sdk: {
    label: 'SDK / code',
    category: 'custom',
    authMethod: 'api_key',
    credentialFields: [],
  },
  kafka: {
    label: 'Kafka / Kinesis',
    category: 'custom',
    authMethod: 'basic',
    credentialFields: [
      { key: 'brokers', label: 'Broker addresses', type: 'text', placeholder: 'broker1:9092,broker2:9092' },
      { key: 'username', label: 'SASL username', type: 'text' },
      { key: 'password', label: 'SASL password', type: 'password' },
    ],
    configFields: [
      { key: 'topic', label: 'Topic name', type: 'text' },
      { key: 'groupId', label: 'Consumer group ID', type: 'text' },
    ],
  },
}

// ─── Service functions ──────────────────────────────────────────────────────

/**
 * Encrypt credentials before storing in DB.
 */
export function prepareCredentials(credentials: Record<string, string>): string {
  return encryptCredentials(credentials)
}

/**
 * Decrypt credentials from DB blob for use in connector testers.
 */
export function retrieveCredentials(encryptedBlob: string): Record<string, string> {
  return decryptCredentials(encryptedBlob)
}

/**
 * Generate a unique inbound webhook URL for webhook-type connectors.
 */
export function generateWebhookToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Test a connector's credentials by actually trying to connect.
 * Returns success/failure + a data preview.
 */
export async function testConnector(
  type: ConnectorType,
  credentials: Record<string, string>,
  config: Record<string, unknown> = {}
): Promise<TestResult> {
  try {
    switch (type) {
      case 'postgres':
      case 'mysql':
      case 'mssql':
      case 'mongodb':
      case 'snowflake':
      case 'bigquery':
        return await testDatabaseConnection(type, credentials, config)

      case 'gmail':
      case 'outlook':
        return await testEmailConnection(type, credentials, config)

      case 'sftp':
        return await testSftpConnection(credentials, config)

      case 'google_sheets':
        return await testGoogleSheetsConnection(credentials, config)

      case 'shopify':
      case 'stripe':
      case 'hubspot':
      case 'ga4':
        return await testRestConnection(type, credentials, config)

      case 'excel_upload':
        return { success: true, message: 'File upload connector ready — upload files via the dashboard.' }

      case 'webhook':
      case 'push_api':
      case 'sdk':
        return { success: true, message: 'Inbound connector ready — copy the endpoint URL and token below.' }

      case 'tally':
        return await testRestConnection('tally', credentials, config)

      default:
        return { success: true, message: 'Connector saved — connection will be verified on first sync.' }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, message: 'Connection failed', error: message }
  }
}

// ─── Import crypto for webhook token generation ─────────────────────────────
import crypto from 'crypto'
