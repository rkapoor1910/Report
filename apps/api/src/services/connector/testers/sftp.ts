import type { TestResult } from '../index.js'

export async function testSftpConnection(
  credentials: Record<string, string>,
  config: Record<string, unknown>
): Promise<TestResult> {
  try {
    const Client = (await import('ssh2-sftp-client')).default
    const sftp = new Client()
    await sftp.connect({
      host: credentials.host,
      port: parseInt(credentials.port || '22'),
      username: credentials.username,
      password: credentials.password || undefined,
      privateKey: credentials.privateKey || undefined,
      readyTimeout: 8000,
    })
    const list = await sftp.list(String(config.remotePath || '/'))
    await sftp.end()
    return {
      success: true,
      message: `SFTP connected — ${list.length} items found at ${config.remotePath || '/'}`,
      preview: list.slice(0, 5).map(f => ({ name: f.name, size: f.size, modified: f.modifyTime })),
    }
  } catch (err) {
    return { success: false, message: 'SFTP connection failed', error: (err as Error).message }
  }
}
