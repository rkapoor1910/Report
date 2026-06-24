'use client'
export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import OnboardingInner from './inner'

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',color:'#6b7280'}}>Loading...</div>}>
      <OnboardingInner />
    </Suspense>
  )
}
