'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { ReportData } from '@/lib/types'
import { formatDuration, formatDate } from '@/lib/dates'
import { StatCard } from '@/components/shared/stat-card'
import { Activity, BarChart3, CheckCircle2, Clock, Layers } from 'lucide-react'
import { COVERAGE_TYPES, TIMING_OPTIONS } from '@/lib/constants'

const COLORS = ['#4338ca', '#d97706', '#be123c', '#047857', '#7c3aed', '#0ea5e9', '#84cc16', '#f59e0b']

interface AgusReportData extends Omit<ReportData, 'categoryBreakdown' | 'urgencyBreakdown'> {
  coverageBreakdown: { name: string; count: number }[]
  urgencyBreakdown: { name: string; count: number }[]
}

export function ReportsView() {
  const [data, setData] = useState<AgusReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<7 | 14 | 30>(14)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/reports?range=${range}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setData(d ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [range])

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    )
  }

  const dailyVolume = data.dailyVolume.map((d) => ({
    ...d,
    dateShort: formatDate(d.date).split(' ').slice(0, 2).join(' '),
  }))

  const coverageBreakdown = data.coverageBreakdown.map((c) => ({
    ...c,
    name: COVERAGE_TYPES.find((ct) => ct.value === c.name)?.label ?? c.name,
  }))

  const urgencyBreakdown = data.urgencyBreakdown.map((u) => ({
    ...u,
    name: TIMING_OPTIONS.find((t) => t.value === u.name)?.label ?? (u.name === 'NONE' ? 'Unspecified' : u.name),
  }))

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-indigo-950">Reports</h2>
          <p className="text-xs text-stone-500">
            Cross-team performance &amp; prospect distribution (last {range} days).
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
          {([7, 14, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                range === r ? 'bg-white text-indigo-950 shadow-sm' : 'text-stone-600 hover:text-indigo-950'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total prospects" value={data.totalCases} icon={Layers} accent="slate" />
        <StatCard label="Resolved" value={data.totalResolved} icon={CheckCircle2} accent="emerald" />
        <StatCard label="In-flight" value={data.totalPending} icon={Clock} accent="amber" />
        <StatCard label="Avg handling" value={formatDuration(data.avgHandlingSec)} icon={Activity} accent="indigo" hint={`Resolution rate ${data.resolutionRate}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-700" />
              Daily case volume
            </CardTitle>
            <CardDescription className="text-xs">
              Prospects captured per day over the selected window.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dateShort" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8, border: '1px solid #e2e8f0',
                      fontSize: 12, color: '#1e1b4b',
                    }}
                  />
                  <Bar dataKey="count" fill="#4338ca" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-700" />
              Coverage type breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution by requested coverage type.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={coverageBreakdown}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {coverageBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8, border: '1px solid #e2e8f0',
                      fontSize: 12, color: '#1e1b4b',
                    }}
                  />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">License Agent performance</CardTitle>
          <CardDescription className="text-xs">
            Per-agent assignment, resolution &amp; average handling time.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-stone-500">
                  <th className="text-left font-medium px-6 py-3">Agent</th>
                  <th className="text-right font-medium px-6 py-3">Assigned</th>
                  <th className="text-right font-medium px-6 py-3">Resolved</th>
                  <th className="text-right font-medium px-6 py-3">Pending</th>
                  <th className="text-right font-medium px-6 py-3">Avg handling</th>
                  <th className="text-right font-medium px-6 py-3">Resolution %</th>
                </tr>
              </thead>
              <tbody>
                {data.agentPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-stone-500 text-xs py-8">
                      No agent data yet.
                    </td>
                  </tr>
                ) : (
                  data.agentPerformance.map((a, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-stone-50">
                      <td className="px-6 py-3 font-medium text-indigo-950">{a.name}</td>
                      <td className="px-6 py-3 text-right text-stone-700">{a.assigned}</td>
                      <td className="px-6 py-3 text-right text-emerald-700 font-medium">{a.resolved}</td>
                      <td className="px-6 py-3 text-right text-amber-700">{a.pending}</td>
                      <td className="px-6 py-3 text-right font-mono text-stone-700">
                        {formatDuration(a.avgHandlingSec)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Badge variant="outline" className="text-xs border-slate-200 text-stone-700">
                          {a.assigned ? Math.round((a.resolved / a.assigned) * 100) : 0}%
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Timing urgency breakdown</CardTitle>
          <CardDescription className="text-xs">
            Prospects by declared urgency (how soon they need a plan).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {urgencyBreakdown.map((u, i) => (
              <div key={u.name} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-xs font-medium text-stone-700">{u.name}</span>
                </div>
                <div className="text-2xl font-semibold text-indigo-950">{u.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
