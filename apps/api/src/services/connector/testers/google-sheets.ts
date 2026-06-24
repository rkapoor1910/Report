import axios from 'axios'
import type { TestResult } from '../index.js'

export async function testGoogleSheetsConnection(
  credentials: Record<string, string>,
  config: Record<string, unknown>
): Promise<TestResult> {
  try {
    const { accessToken } = credentials
    const { spreadsheetId, sheetName } = config as { spreadsheetId: string; sheetName: string }
    const range = sheetName ? `${sheetName}!A1:Z5` : 'A1:Z5'
    const res = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 8000 }
    )
    const rows: string[][] = res.data.values || []
    const columns = rows[0] || []
    const preview = rows.slice(1, 4).map(row =>
      Object.fromEntries(columns.map((col, i) => [col, row[i] ?? '']))
    )
    return {
      success: true,
      message: `Google Sheets connected — ${rows.length - 1} data rows found`,
      columns,
      preview,
      rowCount: rows.length - 1,
    }
  } catch (err) {
    return { success: false, message: 'Google Sheets connection failed', error: (err as Error).message }
  }
}
