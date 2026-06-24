import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'

export async function alertRoutes(fastify: FastifyInstance) {

  /**
   * GET /api/v1/alerts
   * List alerts for the org — paginated, filterable by report/severity.
   */
  fastify.get('/', async (req: FastifyRequest, reply) => {
    const { reportId, severity, limit = 20, offset = 0 } = req.query as {
      reportId?: string
      severity?: string
      limit?:    number
      offset?:   number
    }
    // TODO: query from DB
    // const alerts = await db.query.alerts.findMany({
    //   where: and(
    //     eq(alerts.orgId, req.user.orgId),
    //     reportId ? eq(alerts.reportId, reportId) : undefined,
    //     severity ? eq(alerts.severity, severity) : undefined,
    //   ),
    //   orderBy: desc(alerts.createdAt),
    //   limit, offset,
    // })
    return reply.send({ alerts: [], total: 0 })
  })

  /**
   * GET /api/v1/alerts/:id
   * Get a single alert with full detail + delivery records.
   */
  fastify.get('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    return reply.send({ alert: null })
  })

  /**
   * POST /api/v1/alerts/trigger/:reportId
   * Manually trigger an analysis + delivery run for a report.
   * Used by the dashboard "Run now" button.
   */
  fastify.post('/trigger/:reportId', async (
    req: FastifyRequest<{ Params: { reportId: string } }>,
    reply
  ) => {
    const { reportId } = req.params
    // TODO: enqueue analysis job immediately
    // await analysisQueue.add('manual-trigger', { reportId, ... }, { priority: 1 })
    return reply.send({ success: true, message: 'Analysis job queued' })
  })

  /**
   * POST /api/v1/alerts/subscriptions
   * Create or update a user's alert subscription for a report.
   */
  fastify.post('/subscriptions', async (req: FastifyRequest, reply) => {
    const SubscriptionSchema = z.object({
      reportId:      z.string().uuid(),
      channel:       z.enum(['whatsapp', 'sms', 'email', 'slack']),
      address:       z.string().min(1),   // phone, email, or Slack channel
      frequency:     z.enum(['realtime', 'hourly', 'daily', 'weekly', 'monthly']),
      scheduleTime:  z.string().default('08:00'),
      scheduleDays:  z.array(z.string()).default(['monday']),
    })

    const body = SubscriptionSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input', details: body.error.flatten() })
    }

    // TODO: upsert into alert_subscriptions
    return reply.status(201).send({ subscription: { id: 'temp-sub-id', ...body.data } })
  })

  /**
   * GET /api/v1/alerts/subscriptions
   * Get all alert subscriptions for the current user.
   */
  fastify.get('/subscriptions', async (req: FastifyRequest, reply) => {
    // TODO: fetch from DB
    return reply.send({ subscriptions: [] })
  })

  /**
   * DELETE /api/v1/alerts/subscriptions/:id
   * Remove an alert subscription.
   */
  fastify.delete('/subscriptions/:id', async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply
  ) => {
    // TODO: delete from DB
    return reply.send({ success: true })
  })

  /**
   * GET /api/v1/alerts/deliveries
   * Delivery history — status of all outbound messages.
   */
  fastify.get('/deliveries', async (req: FastifyRequest, reply) => {
    // TODO: query alert_deliveries joined with alerts
    return reply.send({ deliveries: [] })
  })
}
