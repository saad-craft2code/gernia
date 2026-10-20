import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/reports — aggregated cross-team report.
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cases = await db.case.findMany({
    select: {
      id: true, status: true, coverageType: true, timingUrgency: true,
      createdAt: true, transferredAt: true, acceptedAt: true, resolvedAt: true,
      callDurationSec: true, verifierId: true, licenseAgentId: true,
      verifier: { select: { id: true, name: true } },
      licenseAgent: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  })

  const totalCases = cases.length
  const totalResolved = cases.filter((c) => c.status === 'RESOLVED').length
  const totalPending = cases.filter((c) =>
    ['CREATED', 'TRANSFERRED', 'ACCEPTED', 'REASSIGNED'].includes(c.status),
  ).length
  const handlingSecs = cases
    .filter((c) => c.acceptedAt && c.resolvedAt)
    .map((c) => Math.round(
      (new Date(c.resolvedAt!).getTime() - new Date(c.acceptedAt!).getTime()) / 1000,
    ))
    .filter((s) => s >= 0)
  const avgHandlingSec = handlingSecs.length
    ? Math.round(handlingSecs.reduce((a, b) => a + b, 0) / handlingSecs.length)
    : 0

  // Per-LA performance
  const byAgent: Record<string, {
    name: string; assigned: number; resolved: number; pending: number; avgHandlingSec: number;
  }> = {}
  for (const c of cases) {
    if (!c.licenseAgentId || !c.licenseAgent) continue
    const k = c.licenseAgentId
    if (!byAgent[k]) {
      byAgent[k] = { name: c.licenseAgent.name, assigned: 0, resolved: 0, pending: 0, avgHandlingSec: 0 }
    }
    byAgent[k].assigned += 1
    if (c.status === 'RESOLVED') byAgent[k].resolved += 1
    if (['TRANSFERRED', 'ACCEPTED', 'REASSIGNED'].includes(c.status)) byAgent[k].pending += 1
  }
  for (const k of Object.keys(byAgent)) {
    const laCases = cases.filter(
      (c) => c.licenseAgentId === k && c.acceptedAt && c.resolvedAt,
    )
    const secs = laCases
      .map((c) => Math.round(
        (new Date(c.resolvedAt!).getTime() - new Date(c.acceptedAt!).getTime()) / 1000,
      ))
      .filter((s) => s >= 0)
    byAgent[k].avgHandlingSec = secs.length
      ? Math.round(secs.reduce((a, b) => a + b, 0) / secs.length)
      : 0
  }
  const agentPerformance = Object.values(byAgent).sort((a, b) => b.assigned - a.assigned)

  // Daily volume for last 14 days
  const dailyBuckets: Record<string, number> = {}
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    dailyBuckets[d.toISOString().slice(0, 10)] = 0
  }
  for (const c of cases) {
    const key = new Date(c.createdAt).toISOString().slice(0, 10)
    if (key in dailyBuckets) dailyBuckets[key] += 1
  }
  const dailyVolume = Object.entries(dailyBuckets).map(([date, count]) => ({ date, count }))

  // Coverage type breakdown (instead of category)
  const byCoverage: Record<string, number> = {}
  for (const c of cases) {
    const k = c.coverageType || 'Unspecified'
    byCoverage[k] = (byCoverage[k] || 0) + 1
  }
  const coverageBreakdown = Object.entries(byCoverage)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // Timing urgency breakdown
  const byUrgency: Record<string, number> = {}
  for (const c of cases) {
    const k = c.timingUrgency || 'NONE'
    byUrgency[k] = (byUrgency[k] || 0) + 1
  }
  const urgencyBreakdown = ['ASAP', '30_DAYS', '1_3_MONTHS', 'NO_DATE', 'NONE'].map((k) => ({
    name: k,
    count: byUrgency[k] || 0,
  }))

  return NextResponse.json({
    totalCases,
    totalResolved,
    totalPending,
    avgHandlingSec,
    resolutionRate: totalCases ? Math.round((totalResolved / totalCases) * 100) : 0,
    agentPerformance,
    dailyVolume,
    coverageBreakdown,
    urgencyBreakdown,
  })
}
