﻿'use client'

import { useState } from 'react'
import { Plus, Trash2, Bell, BellOff, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const REPORTS = [
  { id: 'r1', name: 'ðŸ“¦ Stock inventory â€” Delhi warehouse',    type: 'stock_inventory' },
  { id: 'r2', name: 'ðŸ›ï¸ Retailer sell-out â€” All brands',     type: 'sell_out' },
  { id: 'r3', name: 'ðŸŽ¯ Target vs actual â€” Delhi NCR',         type: 'target_actual' },
  { id: 'r4', name: 'ðŸšš Dispatch & logistics',                 type: 'dispatch_logistics' },
  { id: 'r5', name: 'â†©ï¸ Returns & defects',                   type: 'returns_defects' },
]

const TEAM = [
  { id: 'u1', name: 'Raman Kapoor',  role: 'owner',         initials: 'RK' },
  { id: 'u2', name: 'Priya Sharma',  role: 'sales_head',    initials: 'PS' },
  { id: 'u3', name: 'Amit Verma',    role: 'warehouse',      initials: 'AV' },
  { id: 'u4', name: 'Neha Gupta',    role: 'brand_manager',  initials: 'NG' },
  { id: 'u5', name: 'Suresh Mehta',  role: 'franchise_head', initials: 'SM' },
]

const CHANNELS = [
  { value: 'whatsapp', label: 'ðŸ’¬ WhatsApp' },
  { value: 'sms',      label: 'ðŸ“± SMS' },
  { value: 'email',    label: 'ðŸ“§ Email' },
  { value: 'slack',    label: 'ðŸ”· Slack' },
]

const FREQUENCIES = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'daily',    label: 'Daily' },
  { value: 'weekly',   label: 'Weekly' },
]

const TIMES = ['06:00','07:00','08:00','09:00','10:00','12:00','18:00','19:00','20:00']

interface Subscription {
  id:        string
  userId:    string
  reportId:  string
  channel:   string
  frequency: string
  time:      string
  active:    boolean
}

const INIT_SUBS: Subscription[] = [
  { id: 's1', userId: 'u1', reportId: 'r1', channel: 'whatsapp', frequency: 'daily',  time: '08:00', active: true },
  { id: 's2', userId: 'u1', reportId: 'r2', channel: 'whatsapp', frequency: 'weekly', time: '08:00', active: true },
  { id: 's3', userId: 'u2', reportId: 'r3', channel: 'whatsapp', frequency: 'daily',  time: '19:00', active: true },
  { id: 's4', userId: 'u3', reportId: 'r1', channel: 'whatsapp', frequency: 'realtime', time: '08:00', active: true },
  { id: 's5', userId: 'u4', reportId: 'r2', channel: 'email',    frequency: 'weekly', time: '09:00', active: true },
]

export default function SubscriptionsPage() {
  const [subs, setSubs]           = useState<Subscription[]>(INIT_SUBS)
  const [saved, setSaved]         = useState(false)
  const [adding, setAdding]       = useState(false)
  const [newSub, setNewSub]       = useState<Partial<Subscription>>({
    channel: 'whatsapp', frequency: 'daily', time: '08:00', active: true
  })

  const getUser   = (id: string) => TEAM.find(u => u.id === id)
  const getReport = (id: string) => REPORTS.find(r => r.id === id)

  const toggleActive = (id: string) => {
    setSubs(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  const deleteSub = (id: string) => {
    setSubs(prev => prev.filter(s => s.id !== id))
  }

  const addSub = () => {
    if (!newSub.userId || !newSub.reportId) return
    const sub: Subscription = {
      id:        'new-' + Date.now(),
      userId:    newSub.userId!,
      reportId:  newSub.reportId!,
      channel:   newSub.channel!,
      frequency: newSub.frequency!,
      time:      newSub.time!,
      active:    true,
    }
    setSubs(prev => [...prev, sub])
    setAdding(false)
    setNewSub({ channel: 'whatsapp', frequency: 'daily', time: '08:00', active: true })
  }

  const handleSave = async () => {
    // TODO: POST /api/v1/alerts/subscriptions for each sub
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Group by user
  const byUser = TEAM.map(user => ({
    user,
    subs: subs.filter(s => s.userId === user.id),
  })).filter(g => g.subs.length > 0 || adding)

  return (
    <div className="p-6 max-w-3xl mx-auto">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-foreground">Alert subscriptions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Control who gets which alerts, via which channel, and when</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-foreground text-background hover:opacity-90"
        >
          <Plus size={13} /> Add subscription
        </button>
      </div>

      {/* Add subscription form */}
      {adding && (
        <div className="mb-4 rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <p className="text-xs font-medium text-foreground">New subscription</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Team member</label>
              <select
                value={newSub.userId ?? ''}
                onChange={e => setNewSub(p => ({ ...p, userId: e.target.value }))}
                className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs outline-none"
              >
                <option value="">Selectâ€¦</option>
                {TEAM.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Report</label>
              <select
                value={newSub.reportId ?? ''}
                onChange={e => setNewSub(p => ({ ...p, reportId: e.target.value }))}
                className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs outline-none"
              >
                <option value="">Selectâ€¦</option>
                {REPORTS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Channel</label>
              <select
                value={newSub.channel}
                onChange={e => setNewSub(p => ({ ...p, channel: e.target.value }))}
                className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs outline-none"
              >
                {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Frequency</label>
              <select
                value={newSub.frequency}
                onChange={e => setNewSub(p => ({ ...p, frequency: e.target.value }))}
                className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs outline-none"
              >
                {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            {newSub.frequency !== 'realtime' && (
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Send at</label>
                <select
                  value={newSub.time}
                  onChange={e => setNewSub(p => ({ ...p, time: e.target.value }))}
                  className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs outline-none"
                >
                  {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={addSub} disabled={!newSub.userId || !newSub.reportId}
              className="px-4 py-1.5 bg-foreground text-background rounded-lg text-xs font-medium disabled:opacity-40">
              Add
            </button>
            <button onClick={() => setAdding(false)}
              className="px-4 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Subscription rows grouped by user */}
      <div className="space-y-4">
        {TEAM.map(user => {
          const userSubs = subs.filter(s => s.userId === user.id)
          if (userSubs.length === 0) return null
          return (
            <div key={user.id} className="bg-background border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
                <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center text-[11px] font-medium text-background shrink-0">
                  {user.initials}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
                </div>
                <span className="ml-auto text-[11px] text-muted-foreground">{userSubs.length} subscription{userSubs.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-border">
                {userSubs.map(sub => {
                  const report = getReport(sub.reportId)
                  const ch     = CHANNELS.find(c => c.value === sub.channel)
                  const freq   = FREQUENCIES.find(f => f.value === sub.frequency)
                  return (
                    <div key={sub.id} className={cn('flex items-center gap-3 px-4 py-3', !sub.active && 'opacity-50')}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{report?.name ?? sub.reportId}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">{ch?.label ?? sub.channel}</span>
                          <span className="text-[11px] text-muted-foreground">Â·</span>
                          <span className="text-[11px] text-muted-foreground">{freq?.label ?? sub.frequency}</span>
                          {sub.frequency !== 'realtime' && (
                            <>
                              <span className="text-[11px] text-muted-foreground">Â·</span>
                              <span className="text-[11px] text-muted-foreground">{sub.time}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleActive(sub.id)}
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                            sub.active ? 'text-foreground hover:bg-muted' : 'text-muted-foreground hover:bg-muted'
                          )}
                          title={sub.active ? 'Pause' : 'Resume'}
                        >
                          {sub.active ? <Bell size={13} /> : <BellOff size={13} />}
                        </button>
                        <button
                          onClick={() => deleteSub(sub.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Save button */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90"
        >
          {saved ? <><CheckCircle2 size={14} /> Saved</> : 'Save changes'}
        </button>
        <p className="text-xs text-muted-foreground">Changes take effect on the next scheduled run</p>
      </div>

    </div>
  )
}


