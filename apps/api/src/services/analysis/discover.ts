/**
 * discoverReports
 * Connects to a source and returns a list of available reports/tables/sheets.
 * Each item has a sourceRef (used later for preview + sync) and metadata.
 */

export interface DiscoveredSource {
  sourceRef: string       // unique reference — table name, sheet ID, file path etc.
  label: string           // human-readable name
  description?: string    // e.g. "Last modified 2 days ago", "1,240 rows"
  estimatedRows?: number
  columns?: string[]      // column names if detectable without full read
  type: 'table' | 'sheet' | 'file' | 'endpoint' | 'topic'
}

export async function discoverReports(
  connectorType: string,
  credentials: Record<string, string>,
  config: Record<string, unknown>
): Promise<DiscoveredSource[]> {
  switch (connectorType) {

    case 'google_sheets':
      return discoverGoogleSheets(credentials, config)

    case 'postgres':
    case 'mysql':
    case 'mssql':
      return discoverDatabase(connectorType, credentials, config)

    case 'gmail':
    case 'outlook':
      return discoverEmailAttachments(credentials, config)

    case 'sftp':
    case 's3':
      return discoverFiles(connectorType, credentials, config)

    case 'shopify':
      return [
        { sourceRef: 'orders',    label: 'Orders',    description: 'All Shopify orders', type: 'endpoint' },
        { sourceRef: 'products',  label: 'Products',  description: 'Product catalogue',  type: 'endpoint' },
        { sourceRef: 'inventory', label: 'Inventory', description: 'Stock levels by SKU',type: 'endpoint' },
        { sourceRef: 'customers', label: 'Customers', description: 'Customer records',   type: 'endpoint' },
      ]

    case 'stripe':
      return [
        { sourceRef: 'charges',       label: 'Charges',        type: 'endpoint' },
        { sourceRef: 'subscriptions', label: 'Subscriptions',  type: 'endpoint' },
        { sourceRef: 'payouts',       label: 'Payouts',        type: 'endpoint' },
      ]

    case 'tally':
      return [
        { sourceRef: 'sales_vouchers',    label: 'Sales vouchers',     description: 'Daily sales transactions', type: 'endpoint' },
        { sourceRef: 'purchase_vouchers', label: 'Purchase vouchers',  type: 'endpoint' },
        { sourceRef: 'stock_summary',     label: 'Stock summary',      description: 'Current inventory levels', type: 'endpoint' },
        { sourceRef: 'ledger_summary',    label: 'Ledger summary',     type: 'endpoint' },
        { sourceRef: 'profit_loss',       label: 'Profit & Loss',      type: 'endpoint' },
      ]

    default:
      return []
  }
}

async function discoverGoogleSheets(
  credentials: Record<string, string>,
  config: Record<string, unknown>
): Promise<DiscoveredSource[]> {
  try {
    const { accessToken } = credentials
    const { spreadsheetId } = config as { spreadsheetId: string }
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const data = await res.json()
    return (data.sheets ?? []).map((sheet: any) => ({
      sourceRef: sheet.properties.title,
      label:     sheet.properties.title,
      description: `${sheet.properties.gridProperties?.rowCount ?? '?'} rows`,
      type: 'sheet' as const,
    }))
  } catch {
    return []
  }
}

async function discoverDatabase(
  type: string,
  credentials: Record<string, string>,
  _config: Record<string, unknown>
): Promise<DiscoveredSource[]> {
  // For now returns placeholder — real impl uses node-postgres / mysql2
  return [
    { sourceRef: 'sales_data',    label: 'sales_data',    description: 'Detected table', type: 'table' },
    { sourceRef: 'inventory',     label: 'inventory',     description: 'Detected table', type: 'table' },
    { sourceRef: 'orders',        label: 'orders',        description: 'Detected table', type: 'table' },
  ]
}

async function discoverEmailAttachments(
  credentials: Record<string, string>,
  config: Record<string, unknown>
): Promise<DiscoveredSource[]> {
  return [
    { sourceRef: 'inbox_attachments', label: 'Email attachments (inbox)', description: 'Excel/CSV files received in last 30 days', type: 'file' },
  ]
}

async function discoverFiles(
  type: string,
  credentials: Record<string, string>,
  config: Record<string, unknown>
): Promise<DiscoveredSource[]> {
  return [
    { sourceRef: String(config.remotePath ?? '/'), label: String(config.remotePath ?? '/'), description: 'Remote directory', type: 'file' },
  ]
}
