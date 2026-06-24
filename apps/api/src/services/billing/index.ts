import Stripe from 'stripe'
import type { FastifyInstance, FastifyRequest } from 'fastify'

// ─── Stripe client ────────────────────────────────────────────────────────────

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// ─── Plan config ──────────────────────────────────────────────────────────────

export const PLANS = {
  starter: {
    name:           'Starter',
    stripePriceId:  process.env.STRIPE_PRICE_STARTER!,
    limits: {
      connectors:  3,
      reports:     5,
      teamMembers: 2,
    },
  },
  growth: {
    name:           'Growth',
    stripePriceId:  process.env.STRIPE_PRICE_GROWTH!,
    limits: {
      connectors:  15,
      reports:     -1,    // unlimited
      teamMembers: 10,
    },
  },
  enterprise: {
    name:           'Enterprise',
    stripePriceId:  process.env.STRIPE_PRICE_ENTERPRISE!,
    limits: {
      connectors:  -1,
      reports:     -1,
      teamMembers: -1,
    },
  },
} as const

export type PlanId = keyof typeof PLANS

// ─── Billing service ──────────────────────────────────────────────────────────

export class BillingService {

  /**
   * Create a Stripe Checkout session for a new subscription.
   * User is redirected to Stripe's hosted checkout page.
   */
  async createCheckoutSession(params: {
    orgId:      string
    planId:     PlanId
    email:      string
    successUrl: string
    cancelUrl:  string
  }): Promise<{ url: string }> {
    const plan = PLANS[params.planId]

    const session = await stripe.checkout.sessions.create({
      mode:                'subscription',
      payment_method_types: ['card'],
      customer_email:      params.email,
      line_items: [{
        price:    plan.stripePriceId,
        quantity: 1,
      }],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          orgId:  params.orgId,
          planId: params.planId,
        },
      },
      metadata: {
        orgId:  params.orgId,
        planId: params.planId,
      },
      success_url: params.successUrl,
      cancel_url:  params.cancelUrl,
    })

    return { url: session.url! }
  }

  /**
   * Create a Stripe billing portal session so the user can
   * manage their subscription (upgrade, cancel, update card).
   */
  async createPortalSession(params: {
    stripeCustomerId: string
    returnUrl:        string
  }): Promise<{ url: string }> {
    const session = await stripe.billingPortal.sessions.create({
      customer:   params.stripeCustomerId,
      return_url: params.returnUrl,
    })
    return { url: session.url }
  }

  /**
   * Retrieve the current subscription details for an org.
   */
  async getSubscription(stripeSubscriptionId: string) {
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
      expand: ['default_payment_method'],
    })
    return {
      status:            sub.status,
      planId:            sub.metadata.planId as PlanId,
      currentPeriodEnd:  new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      trialEnd:          sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    }
  }

  /**
   * Check if an org has exceeded a plan limit.
   * Returns { allowed: false, reason } if over limit.
   */
  checkLimit(
    planId:     PlanId,
    resource:   'connectors' | 'reports' | 'teamMembers',
    current:    number
  ): { allowed: boolean; limit: number; reason?: string } {
    const plan  = PLANS[planId]
    const limit = plan.limits[resource]

    if (limit === -1) return { allowed: true, limit: -1 }  // unlimited

    if (current >= limit) {
      return {
        allowed: false,
        limit,
        reason: `Your ${plan.name} plan allows ${limit} ${resource}. Upgrade to add more.`,
      }
    }

    return { allowed: true, limit }
  }
}

// ─── Billing API routes ───────────────────────────────────────────────────────

export async function billingRoutes(fastify: FastifyInstance) {
  const billing = new BillingService()

  /**
   * POST /api/v1/billing/checkout
   * Create a Stripe Checkout session — returns redirect URL.
   */
  fastify.post('/checkout', async (req: FastifyRequest, reply) => {
    const { planId } = req.body as { planId: PlanId }
    if (!PLANS[planId]) {
      return reply.status(400).send({ error: 'Invalid plan' })
    }

    const session = await billing.createCheckoutSession({
      orgId:      'req.user.orgId',   // TODO: from auth middleware
      planId,
      email:      'req.user.email',   // TODO: from auth middleware
      successUrl: `${process.env.APP_URL}/dashboard/billing?success=true`,
      cancelUrl:  `${process.env.APP_URL}/pricing`,
    })

    return reply.send(session)
  })

  /**
   * POST /api/v1/billing/portal
   * Create a Stripe billing portal session.
   */
  fastify.post('/portal', async (req: FastifyRequest, reply) => {
    // TODO: fetch stripeCustomerId from DB
    const session = await billing.createPortalSession({
      stripeCustomerId: 'cus_xxx',
      returnUrl: `${process.env.APP_URL}/dashboard/billing`,
    })
    return reply.send(session)
  })

  /**
   * GET /api/v1/billing/subscription
   * Current subscription status for the org.
   */
  fastify.get('/subscription', async (_req, reply) => {
    // TODO: fetch stripeSubscriptionId from DB
    const sub = await billing.getSubscription('sub_xxx')
    return reply.send({ subscription: sub })
  })

  /**
   * POST /api/v1/billing/webhook
   * Stripe webhook handler — processes subscription events.
   * Registered as a raw body route (no JSON parsing).
   */
  fastify.post('/webhook', {
    config: { rawBody: true },
  }, async (req: FastifyRequest, reply) => {
    const sig     = req.headers['stripe-signature'] as string
    const payload = (req as any).rawBody as Buffer

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      return reply.status(400).send({ error: 'Webhook signature invalid' })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // TODO: activate subscription in DB
        // await db.update(orgs).set({
        //   plan: session.metadata.planId,
        //   stripeCustomerId: session.customer,
        //   stripeSubscriptionId: session.subscription,
        //   subscriptionStatus: 'active',
        // }).where(eq(orgs.id, session.metadata.orgId))
        console.log(`[Billing] Subscription activated for org ${session.metadata?.orgId}`)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        // TODO: update plan/status in DB
        console.log(`[Billing] Subscription updated: ${sub.id} — status: ${sub.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        // TODO: downgrade org to free tier
        console.log(`[Billing] Subscription cancelled: ${sub.id}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // TODO: send payment failure alert to org owner
        console.log(`[Billing] Payment failed for customer ${invoice.customer}`)
        break
      }
    }

    return reply.send({ received: true })
  })
}
