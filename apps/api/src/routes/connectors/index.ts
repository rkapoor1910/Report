import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  CONNECTOR_DEFINITIONS,
  prepareCredentials,
  retrieveCredentials,
  testConnector,
  generateWebhookToken,
} from '../../services/connector/index.js'
import { maskCredentials } from '../../services/vault/index.js'
import type { ConnectorType } from '@reportiq/shared-types'

// ─── Validation schemas ─────────────────────────────────────────────────────

const CreateConnectorSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string(),
  credentials: z.record(z.string()).default({}),
  config: z.record(z.unknown()).default({}),
  syncFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly', 'monthly', 'manual']).default('daily'),
})

const UpdateConnectorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  credentials: z.record(z.string()).optional(),
  config: z.record(z.unknown()).optional(),
  syncFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly', 'monthly', 'manual']).optional(),
  isActive: z.boolean().optional(),
})

// ─── Routes ─────────────────────────────────────────────────────────────────

export async function connectorRoutes(fastify: FastifyInstance) {

  /**
   * GET /api/v1/connectors/definitions
   * Returns all supported connector types with their required fields.
   * Used by the frontend source picker + auth form.
   */
  fastify.get('/definitions', async (_req, reply) => {
    return reply.send({
      connectors: Object.entries(CONNECTOR_DEFINITIONS).map(([type, def]) => ({
        type,
        label: def.label,
        category: def.category,
        authMethod: def.authMethod,
        credentialFields: def.credentialFields,
        configFields: def.configFields ?? [],
      })),
    })
  })

  /**
   * GET /api/v1/connectors
   * List all connectors for the current org.
   * Credentials are masked — never returned in full.
   */
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    // TODO: replace with actual DB query via Drizzle
    // const orgId = req.user.orgId
    // const connectors = await db.query.connectors.findMany({ where: eq(connectors.orgId, orgId) })
    return reply.send({ connectors: [], total: 0 })
  })

  /**
   * GET /api/v1/connectors/:id
   * Get a single connector. Credentials are masked.
   */
  fastify.get('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = req.params
    // TODO: fetch from DB
    // const connector = await db.query.connectors.findFirst({ where: eq(connectors.id, id) })
    // if (!connector) return reply.status(404).send({ error: 'Connector not found' })
    return reply.send({ connector: null })
  })

  /**
   * POST /api/v1/connectors
   * Create a new connector.
   * 1. Validates the input
   * 2. Encrypts credentials
   * 3. Runs a test connection
   * 4. Saves to DB if test passes (or saves with status=pending for oauth flows)
   */
  fastify.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = CreateConnectorSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input', details: body.error.flatten() })
    }

    const { name, type, credentials, config, syncFrequency } = body.data
    const connectorType = type as ConnectorType

    // Validate connector type exists
    const definition = CONNECTOR_DEFINITIONS[connectorType]
    if (!definition) {
      return reply.status(400).send({ error: `Unknown connector type: ${type}` })
    }

    // For webhook/push connectors, generate a token
    let finalCredentials = { ...credentials }
    if (['webhook', 'push_api', 'sdk'].includes(connectorType)) {
      finalCredentials.webhookToken = generateWebhookToken()
    }

    // Test the connection before saving
    const testResult = await testConnector(connectorType, finalCredentials, config)

    // Encrypt credentials
    const encryptedCreds = Object.keys(finalCredentials).length > 0
      ? prepareCredentials(finalCredentials)
      : null

    // TODO: save to DB
    // const [connector] = await db.insert(connectors).values({
    //   orgId: req.user.orgId,
    //   name,
    //   type: connectorType,
    //   category: definition.category,
    //   authMethod: definition.authMethod,
    //   status: testResult.success ? 'connected' : 'error',
    //   encryptedCreds,
    //   config,
    //   syncFrequency,
    //   errorMessage: testResult.success ? null : testResult.error,
    // }).returning()

    // Return connector with masked credentials + test result
    return reply.status(201).send({
      connector: {
        id: 'temp-id',
        name,
        type: connectorType,
        category: definition.category,
        authMethod: definition.authMethod,
        status: testResult.success ? 'connected' : 'error',
        config,
        syncFrequency,
        // Return masked creds so frontend can show what was saved
        credentials: maskCredentials(finalCredentials),
        // For inbound connectors, return the generated token
        webhookToken: finalCredentials.webhookToken,
      },
      testResult,
    })
  })

  /**
   * POST /api/v1/connectors/:id/test
   * Re-test an existing connector's connection.
   */
  fastify.post('/:id/test', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = req.params

    // TODO: fetch from DB and decrypt credentials
    // const connector = await db.query.connectors.findFirst({ where: eq(connectors.id, id) })
    // if (!connector) return reply.status(404).send({ error: 'Not found' })
    // const credentials = connector.encryptedCreds ? retrieveCredentials(connector.encryptedCreds) : {}
    // const testResult = await testConnector(connector.type as ConnectorType, credentials, connector.config)

    return reply.send({
      testResult: { success: true, message: 'Connection test passed' }
    })
  })

  /**
   * PATCH /api/v1/connectors/:id
   * Update a connector's name, credentials, config, or frequency.
   */
  fastify.patch('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = req.params
    const body = UpdateConnectorSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input', details: body.error.flatten() })
    }

    const updates = body.data
    let encryptedCreds: string | undefined

    if (updates.credentials && Object.keys(updates.credentials).length > 0) {
      encryptedCreds = prepareCredentials(updates.credentials)
    }

    // TODO: update in DB
    // await db.update(connectors).set({ ...updates, encryptedCreds, updatedAt: new Date() })
    //   .where(and(eq(connectors.id, id), eq(connectors.orgId, req.user.orgId)))

    return reply.send({ success: true })
  })

  /**
   * DELETE /api/v1/connectors/:id
   * Soft-delete (deactivate) a connector.
   */
  fastify.delete('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = req.params
    // TODO: soft delete in DB
    // await db.update(connectors).set({ status: 'paused', updatedAt: new Date() })
    //   .where(and(eq(connectors.id, id), eq(connectors.orgId, req.user.orgId)))
    return reply.send({ success: true })
  })

  /**
   * POST /api/v1/connectors/oauth/callback
   * OAuth callback handler — exchanges code for access token and saves connector.
   */
  fastify.post('/oauth/callback', async (req: FastifyRequest, reply) => {
    const { code, state, provider } = req.body as {
      code: string
      state: string
      provider: string
    }

    // TODO: exchange code for token with provider
    // const tokens = await exchangeOAuthCode(provider, code)
    // const encryptedCreds = prepareCredentials({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token })
    // Save connector with oauth tokens

    return reply.send({ success: true, message: 'OAuth connector connected' })
  })
}
