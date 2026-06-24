'use client'
export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import ReportsInner from './inner'

export default function NewReportPage() {
  return (
    <Suspense fallback={<div style={{padding:'32px',fontSize:'14px',color:'#6b7280'}}>Loading...</div>}>
      <ReportsInner />
    </Suspense>
  )
}
