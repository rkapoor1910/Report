/**
 * previewReport
 * Fetches a small sample of data (first ~10 rows) from a source ref.
 * Returns columns + rows so the frontend can render the column mapper.
 */

export interface ReportPreview {
  sourceRef:    string
  columns:      string[]
  rows:         Record<string, unknown>[]
  totalRows?:   number
  detectedTypes: Record<string, 'number' | 'text' | 'date' | 'boolean'>
  suggestedMappings: Record<string, { role: string; mappedName: string }>
}

export async function previewReport(
  connectorType: string,
  credentials:   Record<string, string>,
  sourceRef:     string
): Promise<ReportPreview> {
  // In production this calls the real data source.
  // For now returns realistic sample data for Ess Gee Group use cases.

  const samples: Record<string, ReportPreview> = {

    sell_out: {
      sourceRef: 'Retailer Sell-Out',
      columns: ['Date', 'Brand', 'Store Name', 'SKU Code', 'Product Name', 'Category', 'Units Sold', 'Revenue (INR)', 'Return Units'],
      rows: [
        { Date: '2024-06-17', Brand: 'Adidas', 'Store Name': 'Rohini Mall', 'SKU Code': 'AD-UB22-BLK-8', 'Product Name': 'Ultraboost 22 Black', Category: 'Footwear', 'Units Sold': 14, 'Revenue (INR)': 182000, 'Return Units': 0 },
        { Date: '2024-06-17', Brand: 'Reebok', 'Store Name': 'Pitampura', 'SKU Code': 'RB-CLS-WHT-6', 'Product Name': 'Classic White Women', Category: 'Footwear', 'Units Sold': 8, 'Revenue (INR)': 64000, 'Return Units': 1 },
        { Date: '2024-06-17', Brand: 'Adidas', 'Store Name': 'Noida Sec 18', 'SKU Code': 'AD-STN-WHT-9', 'Product Name': 'Stan Smith White', Category: 'Footwear', 'Units Sold': 11, 'Revenue (INR)': 110000, 'Return Units': 0 },
      ],
      totalRows: 1240,
      detectedTypes: { Date: 'date', Brand: 'text', 'Store Name': 'text', 'SKU Code': 'text', 'Product Name': 'text', Category: 'text', 'Units Sold': 'number', 'Revenue (INR)': 'number', 'Return Units': 'number' },
      suggestedMappings: {
        Date:            { role: 'date',      mappedName: 'date' },
        Brand:           { role: 'dimension', mappedName: 'brand' },
        'Store Name':    { role: 'dimension', mappedName: 'store_name' },
        'SKU Code':      { role: 'id',        mappedName: 'sku_code' },
        'Product Name':  { role: 'dimension', mappedName: 'product_name' },
        Category:        { role: 'dimension', mappedName: 'category' },
        'Units Sold':    { role: 'metric',    mappedName: 'units_sold' },
        'Revenue (INR)': { role: 'metric',    mappedName: 'revenue' },
        'Return Units':  { role: 'metric',    mappedName: 'return_units' },
      },
    },

    stock_inventory: {
      sourceRef: 'Stock Inventory',
      columns: ['SKU Code', 'Product Name', 'Brand', 'Category', 'Warehouse', 'Stock on Hand', 'Reorder Level', 'Last Received Date', 'Days Since Last Sale'],
      rows: [
        { 'SKU Code': 'AD-UB22-BLK-8', 'Product Name': 'Ultraboost 22 Black', Brand: 'Adidas', Category: 'Footwear', Warehouse: 'Delhi Central', 'Stock on Hand': 14, 'Reorder Level': 20, 'Last Received Date': '2024-06-01', 'Days Since Last Sale': 0 },
        { 'SKU Code': 'RB-HEX-GRY-9',  'Product Name': 'Hexalite Grey',        Brand: 'Reebok', Category: 'Footwear', Warehouse: 'Delhi Central', 'Stock on Hand': 340, 'Reorder Level': 50, 'Last Received Date': '2024-04-10', 'Days Since Last Sale': 47 },
        { 'SKU Code': 'AD-STN-WHT-9',  'Product Name': 'Stan Smith White',     Brand: 'Adidas', Category: 'Footwear', Warehouse: 'Noida Hub',     'Stock on Hand': 28, 'Reorder Level': 15, 'Last Received Date': '2024-06-08', 'Days Since Last Sale': 1 },
      ],
      totalRows: 480,
      detectedTypes: { 'SKU Code': 'text', 'Product Name': 'text', Brand: 'text', Category: 'text', Warehouse: 'text', 'Stock on Hand': 'number', 'Reorder Level': 'number', 'Last Received Date': 'date', 'Days Since Last Sale': 'number' },
      suggestedMappings: {
        'SKU Code':            { role: 'id',        mappedName: 'sku_code' },
        'Product Name':        { role: 'dimension', mappedName: 'product_name' },
        Brand:                 { role: 'dimension', mappedName: 'brand' },
        Category:              { role: 'dimension', mappedName: 'category' },
        Warehouse:             { role: 'dimension', mappedName: 'warehouse' },
        'Stock on Hand':       { role: 'metric',    mappedName: 'stock_on_hand' },
        'Reorder Level':       { role: 'metric',    mappedName: 'reorder_level' },
        'Last Received Date':  { role: 'date',      mappedName: 'last_received_date' },
        'Days Since Last Sale':{ role: 'metric',    mappedName: 'days_since_last_sale' },
      },
    },

    target_actual: {
      sourceRef: 'Target vs Actual',
      columns: ['Week', 'Salesperson', 'Region', 'Brand', 'Target (INR)', 'Actual (INR)', 'Achievement %'],
      rows: [
        { Week: 'W24', Salesperson: 'Rahul Sharma', Region: 'Delhi NCR', Brand: 'Adidas', 'Target (INR)': 500000, 'Actual (INR)': 542000, 'Achievement %': 108.4 },
        { Week: 'W24', Salesperson: 'Priya Singh',  Region: 'Lucknow',   Brand: 'Tanishq','Target (INR)': 300000, 'Actual (INR)': 198000, 'Achievement %': 66.0 },
        { Week: 'W24', Salesperson: 'Amit Verma',   Region: 'Kanpur',    Brand: 'Reebok', 'Target (INR)': 250000, 'Actual (INR)': 227500, 'Achievement %': 91.0 },
      ],
      totalRows: 84,
      detectedTypes: { Week: 'text', Salesperson: 'text', Region: 'text', Brand: 'text', 'Target (INR)': 'number', 'Actual (INR)': 'number', 'Achievement %': 'number' },
      suggestedMappings: {
        Week:            { role: 'date',      mappedName: 'week' },
        Salesperson:     { role: 'dimension', mappedName: 'salesperson' },
        Region:          { role: 'dimension', mappedName: 'region' },
        Brand:           { role: 'dimension', mappedName: 'brand' },
        'Target (INR)':  { role: 'metric',    mappedName: 'target' },
        'Actual (INR)':  { role: 'metric',    mappedName: 'actual' },
        'Achievement %': { role: 'metric',    mappedName: 'achievement_pct' },
      },
    },
  }

  return samples[sourceRef] ?? {
    sourceRef,
    columns: ['Column A', 'Column B', 'Column C', 'Column D'],
    rows: [
      { 'Column A': 'Sample 1', 'Column B': 100, 'Column C': '2024-06-17', 'Column D': 'Category X' },
      { 'Column A': 'Sample 2', 'Column B': 200, 'Column C': '2024-06-18', 'Column D': 'Category Y' },
    ],
    totalRows: 2,
    detectedTypes: { 'Column A': 'text', 'Column B': 'number', 'Column C': 'date', 'Column D': 'text' },
    suggestedMappings: {},
  }
}
