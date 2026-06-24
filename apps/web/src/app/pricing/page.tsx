﻿import Link from 'next/link'
import { Check, Zap, ArrowRight } from 'lucide-react'

// â”€â”€â”€ Pricing config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PLANS = [
  {
    id:          'starter',
    name:        'Starter',
    price:       29,
    currency:    'â‚¹',
    period:      'mo',
    description: 'Perfect for a single store or brand manager getting started',
    highlight:   false,
    cta:         'Start free trial',
    ctaHref:     '/onboarding?plan=starter',
    features: [
      '3 connectors',
      '5 reports monitored',
      'WhatsApp + email alerts',
      'Daily & weekly frequency',
      '2 team members',
      '30-day alert history',
      'Standard support',
    ],
    limits: {
      connectors:  3,
      reports:     5,
      teamMembers: 2,
    },
  },
  {
    id:          'growth',
    name:        'Growth',
    price:       99,
    currency:    'â‚¹',
    period:      'mo',
    description: 'For distribution businesses with multiple brands and locations',
    highlight:   true,
    cta:         'Start free trial',
    ctaHref:     '/onboarding?plan=growth',
    features: [
      '15 connectors',
      'Unlimited reports',
      'WhatsApp, SMS, email & Slack',
      'Real-time + scheduled alerts',
      '10 team members',
      'Role-based alert routing',
      '90-day alert history',
      'AI anomaly detection',
      'Priority support',
    ],
    limits: {
      connectors:  15,
      reports:     -1,   // unlimited
      teamMembers: 10,
    },
  },
  {
    id:          'enterprise',
    name:        'Enterprise',
    price:       null,
    currency:    'â‚¹',
    period:      'mo',
    description: 'For large distributors and multi-brand groups with custom needs',
    highlight:   false,
    cta:         'Talk to us',
    ctaHref:     'mailto:hello@reportiq.com',
    features: [
      'Unlimited connectors',
      'Unlimited reports',
      'All delivery channels',
      'On-premise agent support',
      'Unlimited team members',
      'Custom alert logic',
      'Unlimited history',
      'SSO / SAML',
      'SLA + dedicated support',
      'Custom onboarding',
    ],
    limits: {
      connectors:  -1,
      reports:     -1,
      teamMembers: -1,
    },
  },
]

const FAQS = [
  {
    q: 'Do you offer a free trial?',
    a: 'Yes â€” all plans include a 14-day free trial with no credit card required. You get full access to all features on your chosen plan.',
  },
  {
    q: 'Can I connect Tally, SAP, or a custom ERP?',
    a: 'Yes. ReportIQ connects to Tally, SAP, Oracle ERP, any SQL database, Excel/CSV files, email inboxes, Google Sheets, and 20+ other sources out of the box. For custom systems, you can use our Push API or SDK.',
  },
  {
    q: 'How does WhatsApp delivery work?',
    a: 'We use the WhatsApp Business API via Twilio. You receive alerts on your personal WhatsApp number â€” no separate app needed. Each alert is a readable, formatted message in plain English.',
  },
  {
    q: 'What happens if a data source goes offline?',
    a: 'ReportIQ sends you an alert if it cannot fetch data from a source within your configured window. Missing data is itself a red flag.',
  },
  {
    q: 'Can different people get different alerts?',
    a: 'Yes. Role-based routing lets you configure exactly which reports each team member receives, via which channel, and at what frequency.',
  },
  {
    q: 'Is my data secure?',
    a: 'All credentials are encrypted with AES-256-GCM. Data is processed in your region. We never store raw report data beyond the current analysis window â€” only summaries and alert records.',
  },
]

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <Zap size={14} className="text-background" />
          </div>
          <span className="text-sm font-semibold">ReportIQ</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
          <Link href="/onboarding" className="text-sm font-medium px-4 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90">
            Get started
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Connect your data sources once. Get plain-English alerts to your phone.<br />
            No analyst needed.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? 'border-foreground ring-1 ring-foreground bg-foreground text-background'
                  : 'border-border bg-background'
              }`}
            >
              {plan.highlight && (
                <div className="text-[11px] font-semibold uppercase tracking-widest mb-4 opacity-70">
                  Most popular
                </div>
              )}

              <h2 className={`text-base font-semibold mb-1 ${plan.highlight ? 'text-background' : 'text-foreground'}`}>
                {plan.name}
              </h2>
              <p className={`text-xs mb-5 ${plan.highlight ? 'text-background/70' : 'text-muted-foreground'}`}>
                {plan.description}
              </p>

              <div className="mb-6">
                {plan.price !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${plan.highlight ? 'text-background' : 'text-foreground'}`}>
                      {plan.currency}{plan.price.toLocaleString()}
                    </span>
                    <span className={`text-sm ${plan.highlight ? 'text-background/70' : 'text-muted-foreground'}`}>
                      /{plan.period}
                    </span>
                  </div>
                ) : (
                  <div className={`text-2xl font-bold ${plan.highlight ? 'text-background' : 'text-foreground'}`}>
                    Custom pricing
                  </div>
                )}
                <p className={`text-[11px] mt-1 ${plan.highlight ? 'text-background/60' : 'text-muted-foreground'}`}>
                  14-day free trial Â· No credit card required
                </p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <Check size={13} className={plan.highlight ? 'text-background/80' : 'text-green-600'} />
                    <span className={`text-sm ${plan.highlight ? 'text-background/90' : 'text-foreground'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`w-full py-2.5 rounded-xl text-sm font-medium text-center transition-opacity flex items-center justify-center gap-1.5 ${
                  plan.highlight
                    ? 'bg-background text-foreground hover:opacity-90'
                    : 'bg-foreground text-background hover:opacity-90'
                }`}
              >
                {plan.cta} <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-foreground text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-5">
            {FAQS.map(faq => (
              <div key={faq.q} className="border-b border-border pb-5">
                <h3 className="text-sm font-medium text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

