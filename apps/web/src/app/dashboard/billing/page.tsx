'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, ArrowRight, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Sample state (replaced by API in production) ──────────────────────────────

const CURRENT_PLAN = {
  id:          'starter',
  name:        'Starter',
  price:       29,
  renewsAt:    '24 Jul 2024',
  trialEndsAt: null,
  status:      'active',
}

const USAGE = [
  { label: 'Connectors',   used: 2, limit: 3,  resource: 'connectors' },
  { label: 'Reports',      used: 4, limit: 5,  resource: 'reports' },
  { label: 'Team members', used: 1, limit: 2,  resource: 'teamMembers' },
]

const INVOICES = [
  { date: '1 Jun 2024', amount: '₹29', status: 'paid',   description: 'Starter plan — Jun 2024' },
  { date: '1 May 2024', amount: '₹29', status: 'paid',   description: 'Starter plan — May 2024' },
  { date: '1 Apr 2024', amount: '₹0',  status: 'trial',  description: '14-day trial' },
]

export default function BillingPage() {
  const [upgrading, setUpgrading] = useState(false)

  const handleUpgrade = async () => {
    setUpgrading(true)
    const res  = await fetch('/api/v1/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'growth' }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setUpgrading(false)
  }

  const handleManage = async () => {
    const res  = await fetch('/api/v1/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const nearLimit = USAGE.some(u => u.limit > 0 && u.used / u.limit >= 0.8)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">

      <div>
        <h1 className="text-base font-semibold text-foreground">Billing & plan</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your subscription and usage</p>
      </div>

      {/* Current plan */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-foreground" />
              <h2 className="text-sm font-semibold text-foreground">{CURRENT_PLAN.name} plan</h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                {CURRENT_PLAN.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{CURRENT_PLAN.price}/month · Renews {CURRENT_PLAN.renewsAt}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleManage}
              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Manage
            </button>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="text-xs px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
            >
              {upgrading ? 'Loading…' : <><Zap size={11} /> Upgrade</>}
            </button>
          </div>
        </div>

        {/* Usage bars */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-foreground">Usage this month</p>
          {USAGE.map(item => {
            const pct     = item.limit > 0 ? (item.used / item.limit) * 100 : 0
            const atLimit = item.limit > 0 && item.used >= item.limit
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={cn('text-xs font-medium', atLimit ? 'text-red-600' : 'text-foreground')}>
                    {item.used} / {item.limit === -1 ? '∞' : item.limit}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', atLimit ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-foreground')}
                    style={{ width: item.limit === -1 ? '20%' : `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upgrade prompt if near limit */}
      {nearLimit && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-amber-800">You're close to your plan limits</p>
            <p className="text-xs text-amber-700 mt-0.5">Upgrade to Growth for unlimited reports, 15 connectors, and 10 team members.</p>
          </div>
          <button
            onClick={handleUpgrade}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 shrink-0"
          >
            Upgrade →
          </button>
        </div>
      )}

      {/* Growth plan upsell */}
      <div className="bg-foreground rounded-xl p-5 text-background">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={14} />
          <h2 className="text-sm font-semibold">Growth plan — ₹99/month</h2>
        </div>
        <p className="text-xs opacity-70 mb-4">Everything in Starter, plus:</p>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-5">
          {['15 connectors', 'Unlimited reports', 'WhatsApp + SMS + Email + Slack', 'Real-time alerts', '10 team members', 'Role-based routing', 'AI anomaly detection', '90-day history'].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs opacity-90">
              <Check size={12} className="shrink-0 opacity-70" />
              {f}
            </div>
          ))}
        </div>
        <button
          onClick={handleUpgrade}
          disabled={upgrading}
          className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-background text-foreground hover:opacity-90 disabled:opacity-50"
        >
          {upgrading ? 'Loading…' : <><ArrowRight size={12} /> Upgrade to Growth</>}
        </button>
      </div>

      {/* Invoice history */}
      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">Invoice history</h2>
        </div>
        <div className="divide-y divide-border">
          {INVOICES.map((inv, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-xs font-medium text-foreground">{inv.description}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{inv.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-foreground">{inv.amount}</span>
                <span className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-full border',
                  inv.status === 'paid'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-muted text-muted-foreground border-border'
                )}>
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
