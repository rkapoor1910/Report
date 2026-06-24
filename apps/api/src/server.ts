import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { connectorRoutes } from './routes/connectors'
import { reportRoutes } from './routes/reports'
import { alertRoutes } from './routes/alerts'
import { webhookRoutes } from './routes/webhooks'

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
})

// ── Plugins ────────────────────────────────────────────────────────────────
await server.register(helmet)
await server.register(cors, {
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true,
})
await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

// ── Routes ─────────────────────────────────────────────────────────────────
await server.register(connectorRoutes, { prefix: '/api/v1/connectors' })
await server.register(reportRoutes,   { prefix: '/api/v1/reports' })
await server.register(alertRoutes,    { prefix: '/api/v1/alerts' })
await server.register(webhookRoutes,  { prefix: '/api/v1/webhooks' })

// ── Health check ───────────────────────────────────────────────────────────
server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

// ── Start ──────────────────────────────────────────────────────────────────
try {
  await server.listen({ port: 3001, host: '0.0.0.0' })
  console.log('🚀 ReportIQ API running on http://localhost:3001')
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
