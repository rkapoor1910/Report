import type { TestResult } from '../index.js'

export async function testDatabaseConnection(
  type: string,
  credentials: Record<string, string>,
  config: Record<string, unknown>
): Promise<TestResult> {
  try {
    switch (type) {
      case 'postgres': {
        const { default: postgres } = await import('postgres')
        const sql = postgres({
          host: credentials.host,
          port: parseInt(credentials.port || '5432'),
          database: credentials.database,
          username: credentials.username,
          password: credentials.password,
          ssl: credentials.sslMode === 'disable' ? false : 'require',
          connect_timeout: 8,
          max: 1,
        })
        const result = await sql`SELECT current_database() as db, version()`
        await sql.end()
        return {
          success: true,
          message: `Connected to PostgreSQL: ${result[0].db}`,
          preview: result as unknown as Record<string, unknown>[],
        }
      }
      case 'mongodb': {
        const { MongoClient } = await import('mongodb')
        const client = new MongoClient(credentials.uri, { serverSelectionTimeoutMS: 8000 })
        await client.connect()
        const admin = client.db().admin()
        const info = await admin.serverInfo()
        await client.close()
        return {
          success: true,
          message: `Connected to MongoDB v${info.version}`,
        }
      }
      default:
        return { success: true, message: `${type} connection saved — will be tested on first sync.` }
    }
  } catch (err) {
    return { success: false, message: 'Database connection failed', error: (err as Error).message }
  }
}
