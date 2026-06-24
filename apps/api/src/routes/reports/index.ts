import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { discoverReports } from '../../services/analysis/discover.js'
import { previewReport } from '../../services/analysis/preview.js'
import { retrieveCredentials } from '../../services/vault/index.js'

// ─── Validation schemas ─────────────────────────────────────────────────────

const SaveReportSchema = z.object({
  connectorId:  z.string().uuid(),
  name:         z.string().min(1).max(120),
  type:         z.string(),
  sourceRef:    z.string(),   // table name, sheet name, file path, endpoint etc.
  schema: z.object({
    columns: z.array(z.object({
      originalName: z.string(),
      mappedName:   z.string(),
      dataType:     z.enum(['number', 'text', 'date', 'boolean']),
      role:         z.enum(['metric', 'dimension', 'date', 'id', 'ignore']),
    })),
    dateColumn:    z.string(),
    primaryMetric: z.string(),
  }),
  thresholds: z.object({
    dropAlertPct:    z.number().min(1).max(100).default(15),  // alert if metric drops by X%
    spikeAlertPct:   z.number().min(1).max(100).default(30),  // alert if metric spikes by X%
    missingDataHrs:  z.number().min(1).default(24),           // alert if no data for X hours
    deadStockDays:   z.number().min(1).default(30).optional(),// alert if stock not moving for X days
  }),
  syncFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly', 'monthly', 'manual']).default('daily'),
  isActive: z.boolean().default(true),
})

// ─── Routes ─────────────────────────────────────────────────────────────────

export async function reportRoutes(fastify: FastifyInstance) {

  /**
   * GET /api/v1/reports
   * List all reports for the current org.
   */
  fastify.get('/', async (_req, reply) => {
    // TODO: fetch from DB via Drizzle
    return reply.send({ reports: [], total: 0 })
  })

  /**
   * GET /api/v1/reports/discover/:connectorId
   * Auto-discover available reports/tables/sheets from a connected source.
   * e.g. for Google Sheets → list of sheet tabs
   *      for Postgres → list of tables
   *      for Gmail → recent email subjects with attachments
   *      for S3 → list of files in the bucket
   */
  fastify.get('/discover/:connectorId', async (
    req: FastifyRequest<{ Params: { connectorId: string } }>,
    reply
  ) => {
    const { connectorId } = req.params

    // TODO: fetch connector from DB
    // const connector = await db.query.connectors.findFirst({
    //   where: eq(connectors.id, connectorId)
    // })
    // if (!connector) return reply.status(404).send({ error: 'Connector not found' })
    // const credentials = connector.encryptedCreds
    //   ? retrieveCredentials(connector.encryptedCreds) : {}
    // const discovered = await discoverReports(connector.type, credentials, connector.config)

    // Stub response — real data comes from discoverReports()
    const discovered = await discoverReports('google_sheets', {}, {})
    return reply.send({ sources: discovered })
  })

  /**
   * POST /api/v1/reports/preview
   * Fetch a sample of data from a specific source ref so the user
   * can see columns before mapping them.
   */
  fastify.post('/preview', async (
    req: FastifyRequest,
    reply
  ) => {
    const { connectorId, sourceRef } = req.body as {
      connectorId: string
      sourceRef: string
    }

    // TODO: fetch connector + decrypt creds from DB
    // const preview = await previewReport(connector.type, credentials, sourceRef)

    const preview = await previewReport('google_sheets', {}, sourceRef)
    return reply.send(preview)
  })

  /**
   * POST /api/v1/reports
   * Save a fully configured report — name, column mappings, thresholds.
   */
  fastify.post('/', async (req: FastifyRequest, reply) => {
    const body = SaveReportSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input', details: body.error.flatten() })
    }

    // TODO: insert into DB
    // const [report] = await db.insert(reports).values({
    //   orgId: req.user.orgId,
    //   connectorId: body.data.connectorId,
    //   name: body.data.name,
    //   type: body.data.type,
    //   schema: body.data.schema,
    //   isActive: body.data.isActive,
    // }).returning()

    return reply.status(201).send({
      report: {
        id: 'temp-report-id',
        ...body.data,
        createdAt: new Date().toISOString(),
      }
    })
  })

  /**
   * PATCH /api/v1/reports/:id
   * Update report config, schema, or thresholds.
   */
  fastify.patch('/:id', async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply
  ) => {
    const body = SaveReportSchema.partial().safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input', details: body.error.flatten() })
    }
    // TODO: update in DB
    return reply.send({ success: true })
  })

  /**
   * DELETE /api/v1/reports/:id
   * Deactivate a report (soft delete).
   */
  fastify.delete('/:id', async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply
  ) => {
    // TODO: soft delete
    return reply.send({ success: true })
  })
}
