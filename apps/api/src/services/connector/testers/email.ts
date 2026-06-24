import type { TestResult } from '../index.js'

export async function testEmailConnection(
  type: string,
  credentials: Record<string, string>,
  config: Record<string, unknown>
): Promise<TestResult> {
  // OAuth tokens are validated during the OAuth callback flow
  // This confirms the token exists and is non-empty
  if (credentials.accessToken) {
    return {
      success: true,
      message: `${type === 'gmail' ? 'Gmail' : 'Outlook'} account connected via OAuth.`,
    }
  }
  return { success: false, message: 'No OAuth token found — please complete the OAuth flow.', error: 'missing_token' }
}
