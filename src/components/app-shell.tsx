'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { LoginScreen } from '@/components/login-screen'
import { TopBar } from '@/components/shared/top-bar'
import { VerifierDashboard } from '@/components/dashboards/verifier-dashboard'
import { LaDashboard } from '@/components/dashboards/la-dashboard'
import { Loader2 } from 'lucide-react'

export function AppShell() {
  const { user, initialized, loadUser } = useAuthStore()

  useEffect(() => {
    if (!initialized) loadUser()
  }, [initialized, loadUser])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          <span className="text-sm">Loading workspace…</span>
        </div>
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopBar />
      <main className="flex-1 w-full">
        {user.role === 'VERIFIER' ? <VerifierDashboard /> : <LaDashboard />}
      </main>
    </div>
  )
}
