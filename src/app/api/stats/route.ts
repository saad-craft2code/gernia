import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isToday } from '@/lib/dates'

// GET /api/stats — dashboard stats. For verifier: their own. For LA: theirs.
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const range = Number(url.searchParams.get('range') || 7)
  const days = Math.min(30, Math.max(1, range))

  if (user.role === 'VERIFIER') {
    const cases = await db.case.findMany({
      where: { verifierId: user.id },
      select: {
        id: true, status: true, createdAt: true, resolvedAt: true, acceptedAt: true,
        callDurationSec: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    })
    const today = cases.filter((c) => isToday(c.createdAt))
    const pending = cases.filter((c) =>
      ['CREATED', 'TRANSFERRED', 'ACCEPTED', 'REASSIGNED'].includes(c.status),
    )
    const resolved = cases.filter((c) => c.status === 'RESOLVED')
    const resolvedToday = resolved.filter((c) => c.resolvedAt && isToday(c.resolvedAt))
    const handledDurations = resolved
      .filter((c) => c.acceptedAt && c.resolvedAt)
      .map((c) => Math.round(
        (new Date(c.resolvedAt!).getTime() - new Date(c.acceptedAt!).getTime()) / 1000,
      ))
      .filter((s) => s >= 0)
    const avgHandlingSec = handledDurations.length
      ? Math.round(handledDurations.reduce((a, b) => a + b, 0) / handledDurations.length)
      : 0
    const series = buildDailySeries(cases, days, (c) => new Date(c.createdAt))

    return NextResponse.json({
      role: 'VERIFIER',
      todayCount: today.length,
      pendingCount: pending.length,
      resolvedCount: resolvedToday.length,
      totalResolved: resolved.length,
      avgHandlingSec,
      series,
    })
  }

  // LICENSE_AGENT
  const cases = await db.case.findMany({
    where: { licenseAgentId: user.id },
    select: {
      id: true, status: true, transferredAt: true, resolvedAt: true, acceptedAt: true,
      archived: true, callDurationSec: true,
    },
    orderBy: { transferredAt: 'desc' },
    take: 1000,
  })
  const activeToday = cases.filter(
    (c) => !c.archived && c.transferredAt && isToday(c.transferredAt),
  )
  const pending = activeToday.filter((c) =>
    ['TRANSFERRED', 'ACCEPTED', 'REASSIGNED'].includes(c.status),
  )
  const resolvedToday = cases.filter(
    (c) => c.status === 'RESOLVED' && c.resolvedAt && isToday(c.resolvedAt),
  )
  const resolvedAll = cases.filter((c) => c.status === 'RESOLVED')
  const handledDurations = resolvedAll
    .filter((c) => c.acceptedAt && c.resolvedAt)
    .map((c) => Math.round(
      (new Date(c.resolvedAt!).getTime() - new Date(c.acceptedAt!).getTime()) / 1000,
    ))
    .filter((s) => s >= 0)
  const avgHandlingSec = handledDurations.length
    ? Math.round(handledDurations.reduce((a, b) => a + b, 0) / handledDurations.length)
    : 0
  const series = buildDailySeries(
    cases.filter((c) => c.transferredAt),
    days,
    (c) => new Date(c.transferredAt!),
  )

  return NextResponse.json({
    role: 'LICENSE_AGENT',
    todayCount: activeToday.length,
    pendingCount: pending.length,
    resolvedCount: resolvedToday.length,
    totalResolved: resolvedAll.length,
    avgHandlingSec,
    series,
  })
}

function buildDailySeries<T>(
  items: T[],
  days: number,
  dateFn: (item: T) => Date,
): { date: string; count: number }[] {
  const buckets: Record<string, number> = {}
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    buckets[key] = 0
  }
  for (const item of items) {
    const d = dateFn(item)
    const key = d.toISOString().slice(0, 10)
    if (key in buckets) buckets[key] += 1
  }
  return Object.entries(buckets).map(([date, count]) => ({ date, count }))
}
