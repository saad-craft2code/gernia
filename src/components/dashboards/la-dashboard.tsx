'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import type { Case } from '@/lib/types'
import { COVERAGE_TYPES, NON_SALE_STATES, US_STATES, TIMING_OPTIONS } from '@/lib/constants'
import {
  Search, Loader2, PhoneCall, Inbox, Clock, CheckCircle2, Activity,
  Phone, Check, History, User, MapPin,
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/badges'
import { StatCard } from '@/components/shared/stat-card'
import { relativeTime, formatDuration } from '@/lib/dates'
import { CaseDetailView } from '@/components/shared/case-detail-view'
import { ReportsView } from '@/components/shared/reports-view'

export function LaDashboard() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [cases, setCases] = useState<Case[]>([])
  const [archived, setArchived] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'TRANSFERRED' | 'ACCEPTED' | 'RESOLVED'>('all')
  const [detailCase, setDetailCase] = useState<Case | null>(null)
  const [view, setView] = useState<'today' | 'archive' | 'reports' | 'detail'>('today')
  const [stats, setStats] = useState<{
    todayCount: number
    pendingCount: number
    resolvedCount: number
    totalResolved: number
    avgHandlingSec: number
  } | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadCases = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/cases?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      setCases(data?.cases ?? [])
    } catch {
      setCases([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  const loadArchived = useCallback(async () => {
    const params = new URLSearchParams({ archive: '1' })
    if (search) params.set('search', search)
    const res = await fetch(`/api/cases?${params.toString()}`, { cache: 'no-store' })
    const data = await res.json()
    setArchived(data?.cases ?? [])
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
    setLoading(true)
    loadCases()
    loadStats()
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      loadCases()
      loadStats()
    }, 30_000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [loadCases, loadStats])

  useEffect(() => {
    if (view === 'archive') loadArchived()
  }, [view, loadArchived])

  async function acceptCase(c: Case) {
    const res = await fetch(`/api/cases/${c.id}/accept`, { method: 'POST' })
    if (res.ok) {
      toast({ title: 'Case accepted', description: `${c.caseNumber} is now in progress.` })
      loadCases()
      loadStats()
    } else {
      toast({ title: 'Could not accept', variant: 'destructive' })
    }
  }

  async function resolveCase(c: Case) {
    const res = await fetch(`/api/cases/${c.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (res.ok) {
      toast({ title: 'Case resolved', description: `${c.caseNumber} marked as resolved.` })
      loadCases()
      loadStats()
    } else {
      toast({ title: 'Could not resolve', variant: 'destructive' })
    }
  }

  function openDetail(c: Case) {
    setDetailCase(c)
    setView('detail')
  }

  // Full-screen case detail view (early return — replaces the modal)
  if (view === 'detail' && detailCase) {
    return (
      <CaseDetailView
        caseId={detailCase.id}
        onClose={() => {
          setDetailCase(null)
          setView('today')
        }}
        onMutated={() => {
          loadCases()
          loadStats()
          if (view === 'archive') loadArchived()
        }}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-indigo-950 tracking-tight">
            License Agent workspace
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Hi {user?.name}. Today's prospect cases are below. Cards auto-clear at end of
            day, but the data is always searchable in the archive.
          </p>
        </div>
        <Button variant="outline" onClick={() => setView(view === 'reports' ? 'today' : 'reports')} className="border-slate-200">
          <Activity className="h-4 w-4 mr-2" />
          {view === 'reports' ? 'Back to cases' : 'Reports'}
        </Button>
      </div>

      {view === 'reports' ? (
        <ReportsView />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Today's cases" value={stats?.todayCount ?? 0} icon={Inbox} accent="indigo" />
            <StatCard label="Pending" value={stats?.pendingCount ?? 0} icon={Clock} accent="amber" hint="Not yet resolved" />
            <StatCard label="Resolved today" value={stats?.resolvedCount ?? 0} icon={CheckCircle2} accent="emerald" />
            <StatCard
              label="Avg handling"
              value={stats ? formatDuration(stats.avgHandlingSec) : '—'}
              icon={PhoneCall}
              accent="slate"
              hint="Accept → resolve"
            />
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <TabsList className="bg-stone-100">
                <TabsTrigger value="today" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white">
                  <PhoneCall className="h-3.5 w-3.5 mr-1.5" />
                  Today
                </TabsTrigger>
                <TabsTrigger value="archive" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white">
                  <History className="h-3.5 w-3.5 mr-1.5" />
                  Archive
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                {view === 'today' && (
                  <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                    <TabsList className="bg-stone-100 h-9">
                      <TabsTrigger value="all" className="text-xs h-7 px-3">All</TabsTrigger>
                      <TabsTrigger value="TRANSFERRED" className="text-xs h-7 px-3">New</TabsTrigger>
                      <TabsTrigger value="ACCEPTED" className="text-xs h-7 px-3">Active</TabsTrigger>
                      <TabsTrigger value="RESOLVED" className="text-xs h-7 px-3">Done</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
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
            </div>

            <TabsContent value="today" className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-stone-500 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading today's cases…
                </div>
              ) : cases.length === 0 ? (
                <EmptyCaseView search={search} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {cases.map((c) => (
                    <CaseCard
                      key={c.id}
                      caseData={c}
                      onAccept={() => acceptCase(c)}
                      onResolve={() => resolveCase(c)}
                      onOpenDetail={() => openDetail(c)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="archive" className="mt-0">
              {archived.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-14 w-14 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center">
                    <History className="h-7 w-7" />
                  </div>
                  <div className="mt-4 text-sm font-medium text-indigo-950">No archived cases</div>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs">
                    Cases auto-archive at end of day. They appear here once the day rolls
                    over (or after the next 30s polling cycle).
                  </p>
                </div>
              ) : (
                <Card className="border-slate-200">
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {archived.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => openDetail(c)}
                          className="w-full text-left px-6 py-4 hover:bg-stone-50 transition-colors flex items-center gap-4"
                        >
                          <div className="h-9 w-9 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center shrink-0">
                            <History className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-stone-500">{c.caseNumber}</span>
                              <StatusBadge status={c.status} />
                            </div>
                            <div className="text-sm font-medium text-indigo-950 mt-0.5 truncate">
                              {c.prospectName || 'Unnamed prospect'} · {stateLabel(c.prospectState || '')}
                            </div>
                            <div className="text-xs text-stone-500">
                              Archived {c.archivedAt ? relativeTime(c.archivedAt) : '—'} · {c.prospectPhone || '—'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function EmptyCaseView({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="h-14 w-14 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center">
        <Inbox className="h-7 w-7" />
      </div>
      <div className="mt-4 text-sm font-medium text-indigo-950">
        {search ? 'No matching cases' : 'No cases transferred yet'}
      </div>
      <p className="text-xs text-stone-500 mt-1 max-w-xs">
        {search
          ? 'Try clearing the search or the status filter.'
          : 'When a representative transfers a prospect to you, the case appears here automatically.'}
      </p>
    </div>
  )
}

function CaseCard({
  caseData, onAccept, onResolve, onOpenDetail,
}: {
  caseData: Case
  onAccept: () => void
  onResolve: () => void
  onOpenDetail: () => void
}) {
  const isNew = caseData.status === 'TRANSFERRED'
  const isNonSaleState = caseData.prospectState
    ? NON_SALE_STATES.includes(caseData.prospectState as never)
    : false
  return (
    <Card className={`border-slate-200 hover:border-slate-300 transition-all hover:shadow-md ${isNew ? 'pulse-indigo border-indigo-300' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="font-mono text-xs text-stone-500">{caseData.caseNumber}</div>
            <div className="text-base font-semibold text-indigo-950 mt-0.5">
              {caseData.prospectName || 'Unnamed prospect'}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={caseData.status} />
            {caseData.coverageType && (
              <Badge variant="outline" className="text-xs border-indigo-200 bg-indigo-50 text-indigo-700">
                {coverageLabel(caseData.coverageType)}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1.5 text-sm text-stone-600 mb-4">
          {caseData.prospectPhone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{caseData.prospectPhone}</span>
            </div>
          )}
          {caseData.prospectEmail && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{caseData.prospectEmail}</span>
            </div>
          )}
          {caseData.prospectState && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span>{stateLabel(caseData.prospectState)}</span>
              {isNonSaleState && (
                <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-800 ml-1">
                  No-sale state
                </Badge>
              )}
            </div>
          )}
          {caseData.timingUrgency && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span>{timingLabel(caseData.timingUrgency)}</span>
            </div>
          )}
          {caseData.transferredAt && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span>Transferred {relativeTime(caseData.transferredAt)}</span>
            </div>
          )}
        </div>

        {/* Family / coverage quick preview */}
        {(caseData.familyMemberCount || caseData.coverageType === 'FAMILY') && (
          <div className="rounded-md bg-indigo-50/50 border border-indigo-100 p-2 mb-3 text-xs text-indigo-900">
            <span className="font-medium">Household:</span>{' '}
            {caseData.familyMemberCount || 0} member{caseData.familyMemberCount === 1 ? '' : 's'}
          </div>
        )}

        {caseData.additionalNotes && (
          <div className="rounded-md bg-stone-50 border border-stone-100 p-3 mb-4 max-h-24 overflow-y-auto scrollbar-thin">
            <div className="text-xs text-stone-500 mb-1">Notes</div>
            <div className="text-xs text-stone-700 line-clamp-2">{caseData.additionalNotes}</div>
          </div>
        )}

        {caseData.verifier && (
          <div className="text-[11px] text-stone-500 mb-3 flex items-center gap-1.5">
            <User className="h-3 w-3" />
            <span>From: <span className="font-medium text-stone-700">{caseData.verifier.name}</span></span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 border-t border-stone-100 -mx-5 -mb-5 px-5 py-3">
          {caseData.status === 'TRANSFERRED' && (
            <>
              <Button size="sm" onClick={onAccept} className="bg-indigo-700 hover:bg-indigo-800 text-white h-9 flex-1">
                <Check className="h-4 w-4 mr-1.5" />Accept
              </Button>
              <Button size="sm" variant="outline" onClick={onOpenDetail} className="border-slate-200 h-9 flex-1">
                <PhoneCall className="h-4 w-4 mr-1.5" />Open
              </Button>
            </>
          )}
          {caseData.status === 'ACCEPTED' && (
            <>
              <Button size="sm" onClick={onResolve} className="bg-indigo-700 hover:bg-indigo-800 text-white h-9 flex-1">
                <Check className="h-4 w-4 mr-1.5" />Resolve
              </Button>
              <Button size="sm" variant="outline" onClick={onOpenDetail} className="border-slate-200 h-9 flex-1">
                <PhoneCall className="h-4 w-4 mr-1.5" />Open
              </Button>
            </>
          )}
          {caseData.status === 'RESOLVED' && (
            <Button size="sm" variant="outline" onClick={onOpenDetail} className="border-slate-200 h-9 w-full">
              <PhoneCall className="h-4 w-4 mr-1.5" />View details
            </Button>
          )}
          {caseData.status === 'CREATED' && (
            <div className="text-xs text-stone-500 w-full text-center py-1.5">
              Awaiting transfer from representative.
            </div>
          )}
          {caseData.status === 'REASSIGNED' && (
            <div className="text-xs text-amber-700 w-full text-center py-1.5">
              Reassigned — please re-open to handle.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function coverageLabel(code: string): string {
  return COVERAGE_TYPES.find((c) => c.value === code)?.label ?? code
}

function stateLabel(code: string): string {
  if (!code) return ''
  return US_STATES.find((s) => s.code === code)?.name ?? code
}

function timingLabel(code: string): string {
  return TIMING_OPTIONS.find((t) => t.value === code)?.label ?? code
}
