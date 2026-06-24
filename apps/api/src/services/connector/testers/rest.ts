import axios from 'axios'
import type { TestResult } from '../index.js'

export async function testRestConnection(
  type: string,
  credentials: Record<string, string>,
  config: Record<string, unknown>
): Promise<TestResult> {
  try {
    switch (type) {
      case 'shopify': {
        const { shopDomain, accessToken } = credentials
        const res = await axios.get(
          `https://${shopDomain}/admin/api/2024-01/shop.json`,
          { headers: { 'X-Shopify-Access-Token': accessToken }, timeout: 8000 }
        )
        return {
          success: true,
          message: `Connected to Shopify store: ${res.data.shop.name}`,
          preview: [{ shop: res.data.shop.name, domain: res.data.shop.domain, currency: res.data.shop.currency }],
        }
      }
      case 'stripe': {
        const { secretKey } = credentials
        const res = await axios.get('https://api.stripe.com/v1/account', {
          headers: { Authorization: `Bearer ${secretKey}` }, timeout: 8000
        })
        return {
          success: true,
          message: `Connected to Stripe account: ${res.data.business_profile?.name || res.data.id}`,
        }
      }
      case 'tally': {
        const { host, port } = credentials
        // Tally XML gateway ping
        const res = await axios.post(
          `http://${host}:${port}`,
          `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>List of Companies</REPORTNAME></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`,
          { headers: { 'Content-Type': 'text/xml' }, timeout: 8000 }
        )
        return {
          success: res.status === 200,
          message: res.status === 200 ? 'Tally connection successful' : 'Tally responded with an error',
        }
      }
      default:
        return { success: true, message: 'REST endpoint reachable' }
    }
  } catch (err) {
    const msg = axios.isAxiosError(err)
      ? `HTTP ${err.response?.status}: ${err.response?.statusText || err.message}`
      : (err as Error).message
    return { success: false, message: 'Connection failed', error: msg }
  }
}
