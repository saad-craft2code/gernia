'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import type { Case, UserBrief } from '@/lib/types'
import { COVERAGE_TYPES, NON_SALE_STATES, US_STATES } from '@/lib/constants'
import {
  Plus, FileText, Search, Loader2, Phone, User, MapPin, Inbox, Clock,
  CheckCircle2, Activity, ChevronRight,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/badges'
import { StatCard } from '@/components/shared/stat-card'
import { relativeTime } from '@/lib/dates'
import { CaseDetailModal } from '@/components/shared/case-detail-modal'
import { ReportsView } from '@/components/shared/reports-view'
import { ProspectForm } from '@/components/dashboards/prospect-form'

interface CaseWithAgent extends Case {
  licenseAgent?: UserBrief | null
}

export function VerifierDashboard() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [cases, setCases] = useState<CaseWithAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detailCase, setDetailCase] = useState<Case | null>(null)
  const [view, setView] = useState<'cases' | 'reports' | 'form'>('cases')
  const [stats, setStats] = useState<{
    todayCount: number
    pendingCount: number
    resolvedCount: number
    totalResolved: number
    avgHandlingSec: number
  } | null>(null)

  const loadCases = useCallback(async () => {
    setLoading(true)
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/cases${q}`, { cache: 'no-store' })
      const data = await res.json()
      setCases(data?.cases ?? [])
    } catch {
      setCases([])
    } finally {
      setLoading(false)
    }
  }, [search])

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats', { cache: 'no-store' })
      const data = await res.json()
      setStats({
        todayCount: data.todayCount,
        pendingCount: data.pendingCount,
        resolvedCount: data.resolvedCount,
        totalResolved: data.totalResolved,
        avgHandlingSec: data.avgHandlingSec,
      })
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (view === 'cases') {
      loadCases()
      loadStats()
      const t = setInterval(loadStats, 30_000)
      return () => clearInterval(t)
    }
  }, [loadCases, loadStats, view])

  if (view === 'form') {
    return (
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
        <ProspectForm onDone={() => setView('cases')} />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-indigo-950 tracking-tight">
            Representative workspace
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Welcome back, {user?.name}. Complete the prospect questionnaire, pick a License
            Agent and transfer the case.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setView(view === 'reports' ? 'cases' : 'reports')}
            className="border-slate-200"
          >
            <Activity className="h-4 w-4 mr-2" />
            {view === 'reports' ? 'Back to cases' : 'View reports'}
          </Button>
          <Button onClick={() => setView('form')} className="bg-indigo-700 hover:bg-indigo-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New prospect
          </Button>
        </div>
      </div>

      {view === 'reports' ? (
        <ReportsView />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Today's cases" value={stats?.todayCount ?? 0} icon={Inbox} accent="indigo" />
            <StatCard label="In-flight" value={stats?.pendingCount ?? 0} icon={Clock} accent="amber" hint="Pending / transferred" />
            <StatCard label="Resolved (today)" value={stats?.resolvedCount ?? 0} icon={CheckCircle2} accent="emerald" />
            <StatCard label="Total resolved" value={stats?.totalResolved ?? 0} icon={FileText} accent="slate" />
          </div>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Recent prospect cases</CardTitle>
                  <CardDescription className="text-xs">
                    Cases you captured. Click a row to open details &amp; transfer to a License Agent.
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Search name / phone / email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 w-full sm:w-80"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-stone-500 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading cases…
                </div>
              ) : cases.length === 0 ? (
                <EmptyCases onCreate={() => setView('form')} />
              ) : (
                <div className="divide-y divide-slate-100">
                  {cases.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setDetailCase(c)}
                      className="w-full text-left px-6 py-4 hover:bg-stone-50 transition-colors flex items-center gap-4"
                    >
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-stone-500">{c.caseNumber}</span>
                          <StatusBadge status={c.status} />
                          {c.coverageType && (
                            <Badge variant="outline" className="text-xs border-indigo-200 bg-indigo-50 text-indigo-700">
                              {coverageLabel(c.coverageType)}
                            </Badge>
                          )}
                          {c.prospectState && NON_SALE_STATES.includes(c.prospectState as never) && (
                            <Badge variant="outline" className="text-xs border-amber-300 bg-amber-50 text-amber-800">
                              ⚠ {c.prospectState}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-medium text-indigo-950 mt-0.5 truncate">
                          {c.prospectName || 'Unnamed prospect'}
                          {c.prospectState && ` · ${stateLabel(c.prospectState)}`}
                        </div>
                        <div className="text-xs text-stone-500 truncate">
                          {c.prospectPhone || '—'}{c.prospectEmail ? ` · ${c.prospectEmail}` : ''}
                        </div>
                      </div>
                      <div className="hidden md:flex flex-col items-end text-right shrink-0">
                        <div className="text-xs text-stone-500">{relativeTime(c.createdAt)}</div>
                        {c.licenseAgent ? (
                          <Badge variant="outline" className="text-xs mt-1 border-slate-200 text-stone-600">
                            → {c.licenseAgent.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs mt-1 border-amber-200 bg-amber-50 text-amber-700">
                            Not transferred
                          </Badge>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-stone-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {detailCase && (
        <CaseDetailModal
          caseId={detailCase.id}
          onClose={() => setDetailCase(null)}
          onMutated={() => {
            loadCases()
            loadStats()
          }}
        />
      )}
    </div>
  )
}

function EmptyCases({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="h-14 w-14 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center">
        <FileText className="h-7 w-7" />
      </div>
      <div className="mt-4 text-sm font-medium text-indigo-950">No prospect cases yet</div>
      <p className="text-xs text-stone-500 mt-1 max-w-xs">
        Click <span className="font-medium text-stone-700">New prospect</span> to capture
        the Prospect Information Questionnaire and route it to a License Agent.
      </p>
      <Button onClick={onCreate} className="mt-4 bg-indigo-700 hover:bg-indigo-800 text-white">
        <Plus className="h-4 w-4 mr-2" />
        New prospect
      </Button>
    </div>
  )
}

function coverageLabel(code: string): string {
  return COVERAGE_TYPES.find((c) => c.value === code)?.label ?? code
}

function stateLabel(code: string): string {
  return US_STATES.find((s) => s.code === code)?.name ?? code
}
