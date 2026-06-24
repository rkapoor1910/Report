'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, Zap, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type OnboardingStep = 'welcome' | 'org' | 'connector' | 'report' | 'alert' | 'done'

const STEPS: Array<{ id: OnboardingStep; label: string }> = [
  { id: 'welcome',   label: 'Welcome' },
  { id: 'org',       label: 'Your org' },
  { id: 'connector', label: 'Connect data' },
  { id: 'report',    label: 'Pick report' },
  { id: 'alert',     label: 'First alert' },
]

const TEMPLATES = [
  { id: 'retail_distributor', emoji: '🏪', title: 'Retail & distribution', desc: 'Monitor sell-out, stock levels, and franchise performance across brands', connectors: ['gmail', 'google_sheets', 'tally'], reports: ['Retailer sell-out', 'Stock inventory', 'Target vs actual'] },
  { id: 'ecommerce', emoji: '🛍️', title: 'E-commerce', desc: 'Track Shopify sales, inventory, returns, and fulfilment daily', connectors: ['shopify', 'stripe', 'gmail'], reports: ['Daily orders', 'Revenue', 'Returns'] },
  { id: 'saas', emoji: '💻', title: 'SaaS business', desc: 'Monitor MRR, churn signals, support volume, and feature usage', connectors: ['stripe', 'hubspot', 'ga4'], reports: ['Revenue', 'Churn signals', 'Support tickets'] },
  { id: 'custom', emoji: '⚙️', title: 'Set up manually', desc: 'Connect any data source and configure reports from scratch', connectors: [], reports: [] },
]

const ALERT_CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', desc: 'Best for instant alerts' },
  { value: 'email',    label: 'Email',    desc: 'Good for digests' },
  { value: 'slack',    label: 'Slack',    desc: 'Good for teams' },
  { value: 'sms',      label: 'SMS',      desc: 'Most reliable' },
]

function OnboardingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get('plan') ?? 'growth'

  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [orgName, setOrgName] = useState('')
  const [industry, setIndustry] = useState('retail')
  const [template, setTemplate] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [channel, setChannel] = useState('whatsapp')
  const [alertTime, setAlertTime] = useState('08:00')
  const [saving, setSaving] = useState(false)

  const stepIndex = STEPS.findIndex(s => s.id === step)

  const handleFinish = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1200))
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>ReportIQ</span>
        </div>
        {step !== 'done' && (
          <span style={{ fontSize: 12, color: '#6b7280' }}>Step {Math.max(stepIndex, 0) + 1} of {STEPS.length}</span>
        )}
      </div>

      {step !== 'done' && (
        <div style={{ height: 2, background: '#f3f4f6' }}>
          <div style={{ height: '100%', background: '#111827', width: `${((stepIndex + 1) / STEPS.length) * 100}%`, transition: 'width 0.3s' }} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>

          {step === 'welcome' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Zap size={28} color="#fff" />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Welcome to ReportIQ</h1>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                You are 10 minutes away from receiving your first plain-English business alert on WhatsApp.
              </p>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 24, textAlign: 'left' }}>
                {[
                  { icon: '🔌', text: 'Connect a data source — email, spreadsheet, database, or app' },
                  { icon: '📊', text: 'Choose which reports to monitor and map your columns' },
                  { icon: '📲', text: 'Get plain-English alerts with stats, red flags, and actions' },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{item.text}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep('org')} style={{ width: '100%', padding: '12px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Get started <ArrowRight size={14} />
              </button>
              <p style={{ marginTop: 12, fontSize: 12, color: '#9ca3af' }}>
                You are on the <strong>{plan}</strong> plan — 14-day free trial, no credit card needed
              </p>
            </div>
          )}

          {step === 'org' && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Tell us about your business</h2>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>This helps ReportIQ personalise your alerts</p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Business name</label>
                <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Ess Gee Group"
                  style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Industry</label>
                <select value={industry} onChange={e => setIndustry(e.target.value)}
                  style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }}>
                  <option value="retail">Retail and distribution</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="saas">SaaS / software</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 10 }}>What do you want to monitor?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setTemplate(t.id)}
                      style={{ padding: 12, border: template === t.id ? '2px solid #111827' : '1px solid #e5e7eb', borderRadius: 12, textAlign: 'left', cursor: 'pointer', background: '#fff' }}>
                      <span style={{ fontSize: 20 }}>{t.emoji}</span>
                      <p style={{ fontSize: 12, fontWeight: 500, marginTop: 6 }}>{t.title}</p>
                      <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <button disabled={!orgName || !template} onClick={() => setStep('connector')}
                style={{ width: '100%', padding: 10, background: !orgName || !template ? '#e5e7eb' : '#111827', color: !orgName || !template ? '#9ca3af' : '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: !orgName || !template ? 'not-allowed' : 'pointer' }}>
                Continue
              </button>
            </div>
          )}

          {step === 'connector' && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Connect your first data source</h2>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Start with the source that has your most important reports</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {[
                  { icon: '📧', label: 'Gmail / Outlook', desc: 'Pick up Excel and CSV reports from email attachments', href: '/dashboard/connectors/new' },
                  { icon: '🗂️', label: 'Google Sheets', desc: 'Sync live from a shared spreadsheet', href: '/dashboard/connectors/new' },
                  { icon: '🧾', label: 'Tally', desc: 'Connect directly to your Tally installation', href: '/dashboard/connectors/new' },
                  { icon: '📊', label: 'Upload Excel / CSV', desc: 'Manually upload a report file to start', href: '/dashboard/connectors/new' },
                ].map(option => (
                  <a key={option.label} href={option.href}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: '1px solid #e5e7eb', borderRadius: 12, textDecoration: 'none', color: 'inherit', background: '#fff' }}>
                    <span style={{ fontSize: 20 }}>{option.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 500 }}>{option.label}</p>
                      <p style={{ fontSize: 12, color: '#6b7280' }}>{option.desc}</p>
                    </div>
                    <ArrowRight size={13} color="#9ca3af" />
                  </a>
                ))}
              </div>
              <button onClick={() => setStep('alert')} style={{ width: '100%', fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                Skip for now — connect later
              </button>
            </div>
          )}

          {step === 'report' && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Which report to monitor first?</h2>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Pick the one most important to your business today</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {[
                  { icon: '📦', label: 'Stock / inventory', desc: 'Know when stock is low or sitting idle' },
                  { icon: '🛍️', label: 'Retailer sell-out', desc: 'Track daily sales by store, brand, SKU' },
                  { icon: '🎯', label: 'Target vs actual', desc: 'Get alerted when the team misses target' },
                  { icon: '🚚', label: 'Dispatch and logistics', desc: 'Monitor orders shipped, pending, returned' },
                  { icon: '↩️', label: 'Returns and defects', desc: 'Spot return rate spikes before they escalate' },
                ].map(option => (
                  <a key={option.label} href="/dashboard/reports/new"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: '1px solid #e5e7eb', borderRadius: 12, textDecoration: 'none', color: 'inherit', background: '#fff' }}>
                    <span style={{ fontSize: 20 }}>{option.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 500 }}>{option.label}</p>
                      <p style={{ fontSize: 12, color: '#6b7280' }}>{option.desc}</p>
                    </div>
                    <ArrowRight size={13} color="#9ca3af" />
                  </a>
                ))}
              </div>
              <button onClick={() => setStep('alert')} style={{ width: '100%', fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                Skip — set up reports later
              </button>
            </div>
          )}

          {step === 'alert' && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Where should we send your alerts?</h2>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>You can change this anytime</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {ALERT_CHANNELS.map(ch => (
                  <button key={ch.value} onClick={() => setChannel(ch.value)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, border: channel === ch.value ? '2px solid #111827' : '1px solid #e5e7eb', borderRadius: 12, background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500 }}>{ch.label}</p>
                      <p style={{ fontSize: 12, color: '#6b7280' }}>{ch.desc}</p>
                    </div>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: channel === ch.value ? '5px solid #111827' : '2px solid #e5e7eb' }} />
                  </button>
                ))}
              </div>
              {(channel === 'whatsapp' || channel === 'sms') && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Your mobile number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210"
                    style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              )}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Send daily summary at</label>
                <select value={alertTime} onChange={e => setAlertTime(e.target.value)}
                  style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none' }}>
                  {['06:00','07:00','08:00','09:00','10:00','18:00','19:00','20:00'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleFinish} disabled={saving}
                style={{ width: '100%', padding: 12, background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
                {saving ? <><Loader2 size={14} /> Setting up your account...</> : <>Finish setup <ArrowRight size={14} /></>}
              </button>
            </div>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Check size={28} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>You are all set</h2>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                ReportIQ will send your first alert at {alertTime} once your data source syncs.
              </p>
              <a href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#111827', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                Go to dashboard <ArrowRight size={14} />
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#6b7280' }}>Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}
