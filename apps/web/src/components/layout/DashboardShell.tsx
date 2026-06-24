﻿'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Plug, FileText, Bell, Users,
  Settings, ChevronRight, Menu, X, Zap, LogOut,
  AlertTriangle, CheckCircle2, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

// â”€â”€â”€ Nav items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const NAV = [
  {
    label: 'Overview',
    href:  '/dashboard',
    icon:  LayoutDashboard,
    exact: true,
  },
  {
    label: 'Connectors',
    href:  '/dashboard/connectors',
    icon:  Plug,
    badge: null,
  },
  {
    label: 'Reports',
    href:  '/dashboard/reports',
    icon:  FileText,
    badge: null,
  },
  {
    label: 'Alerts',
    href:  '/dashboard/alerts',
    icon:  Bell,
    badge: '3',   // unread count â€” fetched in real impl
  },
  {
    label: 'Team',
    href:  '/dashboard/settings/team',
    icon:  Users,
    badge: null,
  },
  {
    label: 'Settings',
    href:  '/dashboard/settings',
    icon:  Settings,
    badge: null,
  },
]

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname      = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* â”€â”€ Mobile overlay â”€â”€ */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* â”€â”€ Sidebar â”€â”€ */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-56 flex flex-col bg-background border-r border-border transition-transform duration-200',
        'lg:relative lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border shrink-0">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <Zap size={14} className="text-background" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">ReportIQ</span>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto lg:hidden text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-foreground text-background font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon size={15} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                    active ? 'bg-background/20 text-background' : 'bg-foreground text-background'
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Org + user */}
        <div className="px-3 py-3 border-t border-border shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground shrink-0">
              EG
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">Ess Gee Group</p>
              <p className="text-[11px] text-muted-foreground truncate">Admin</p>
            </div>
            <LogOut size={13} className="text-muted-foreground shrink-0" />
          </div>
        </div>

      </aside>

      {/* â”€â”€ Main area â”€â”€ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <Menu size={16} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>ReportIQ</span>
            {pathname !== '/dashboard' && (
              <>
                <ChevronRight size={12} />
                <span className="capitalize text-foreground font-medium">
                  {pathname.split('/').filter(Boolean).slice(1).join(' / ')}
                </span>
              </>
            )}
          </div>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/dashboard/connectors/new"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <Plug size={12} />
              Add connector
            </Link>
            <Link
              href="/dashboard/alerts/trigger"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              <Zap size={12} />
              Run now
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  )
}


