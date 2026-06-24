'use client'

import { useState } from 'react'
import { CheckCircle2, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [saved, setSaved]     = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)

  const apiKey = 'riq_live_a8f3b2c1d4e5f6g7h8i9j0k1l2m3n4o5'

  const save = (section: string) => {
    setSaved(section)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      <div>
        <h1 className="text-base font-semibold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your organisation and delivery preferences</p>
      </div>

      {/* Organisation */}
      <Section title="Organisation">
        <Field label="Organisation name">
          <input defaultValue="Ess Gee Group" className={input} />
        </Field>
        <Field label="Industry">
          <select defaultValue="retail" className={input}>
            <option value="retail">Retail & distribution</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="ecommerce">E-commerce</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Timezone">
          <select defaultValue="Asia/Kolkata" className={input}>
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="UTC">UTC</option>
            <option value="Europe/London">Europe/London (GMT)</option>
          </select>
        </Field>
        <SaveBtn saved={saved === 'org'} onClick={() => save('org')} />
      </Section>

      {/* Delivery defaults */}
      <Section title="Default delivery settings">
        <Field label="Default alert channel">
          <select defaultValue="whatsapp" className={input}>
            <option value="whatsapp">💬 WhatsApp</option>
            <option value="email">📧 Email</option>
            <option value="sms">📱 SMS</option>
            <option value="slack">🔷 Slack</option>
          </select>
        </Field>
        <Field label="Default frequency">
          <select defaultValue="daily" className={input}>
            <option value="realtime">Real-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </Field>
        <Field label="Default send time">
          <select defaultValue="08:00" className={input}>
            {['06:00','07:00','08:00','09:00','10:00','18:00','19:00','20:00'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <SaveBtn saved={saved === 'delivery'} onClick={() => save('delivery')} />
      </Section>

      {/* WhatsApp / SMS */}
      <Section title="WhatsApp & SMS (Twilio)">
        <Field label="Twilio Account SID">
          <input type="password" placeholder="AC••••••••••••••••••••••••••••••••" className={input} />
        </Field>
        <Field label="Twilio Auth Token">
          <input type="password" placeholder="••••••••••••••••••••••••••••••••" className={input} />
        </Field>
        <Field label="WhatsApp sender number">
          <input type="text" placeholder="whatsapp:+14155238886" className={input} />
        </Field>
        <Field label="SMS sender number">
          <input type="text" placeholder="+14155238886" className={input} />
        </Field>
        <SaveBtn saved={saved === 'twilio'} onClick={() => save('twilio')} />
      </Section>

      {/* Email */}
      <Section title="Email (SendGrid)">
        <Field label="SendGrid API key">
          <input type="password" placeholder="SG.••••••••••••••••••••••••••••" className={input} />
        </Field>
        <Field label="From email">
          <input type="email" defaultValue="alerts@reportiq.com" className={input} />
        </Field>
        <Field label="From name">
          <input type="text" defaultValue="ReportIQ" className={input} />
        </Field>
        <SaveBtn saved={saved === 'email'} onClick={() => save('email')} />
      </Section>

      {/* Slack */}
      <Section title="Slack">
        <Field label="Bot token">
          <input type="password" placeholder="xoxb-••••••••••••••••••••••••••" className={input} />
        </Field>
        <Field label="Default channel">
          <input type="text" defaultValue="#reportiq-alerts" className={input} />
        </Field>
        <SaveBtn saved={saved === 'slack'} onClick={() => save('slack')} />
      </Section>

      {/* API key */}
      <Section title="API key">
        <p className="text-xs text-muted-foreground mb-3">Use this key to push data via the SDK or Push API connector.</p>
        <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2.5">
          <code className="text-xs flex-1 text-foreground font-mono">
            {showKey ? apiKey : 'riq_live_' + '•'.repeat(28)}
          </code>
          <button onClick={() => setShowKey(v => !v)} className="text-muted-foreground hover:text-foreground">
            {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(apiKey); save('copy') }}
            className="text-muted-foreground hover:text-foreground"
          >
            {saved === 'copy' ? <CheckCircle2 size={13} className="text-green-600" /> : <Copy size={13} />}
          </button>
        </div>
        <button className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw size={12} /> Regenerate key
        </button>
      </Section>

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

const input = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-foreground/30'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-widest">{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function SaveBtn({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-1 flex items-center gap-1.5 text-xs font-medium px-4 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90"
    >
      {saved ? <><CheckCircle2 size={12} /> Saved</> : 'Save'}
    </button>
  )
}
