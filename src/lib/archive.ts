// Helper: lazily archive cases whose transferredAt is on a previous day.
// Called whenever an LA fetches their dashboard. Achieves the "cards disappear
// at end of day but data stays in DB" rule without needing an actual cron job.

import { db } from '@/lib/db'
import { isToday } from '@/lib/dates'

export async function archiveStaleCasesForAgent(agentId: string): Promise<number> {
  // Find non-archived cases assigned to this agent whose transferredAt exists
  // and is not today. These are the ones that should "disappear" from today's
  // dashboard but remain in DB.
  const cases = await db.case.findMany({
    where: {
      licenseAgentId: agentId,
      archived: false,
      transferredAt: { not: null },
      status: { in: ['TRANSFERRED', 'ACCEPTED', 'REASSIGNED'] },
    },
    select: { id: true, transferredAt: true },
  })

  const toArchive = cases.filter((c) => c.transferredAt && !isToday(c.transferredAt))
  if (toArchive.length === 0) return 0

  await db.case.updateMany({
    where: { id: { in: toArchive.map((c) => c.id) } },
    data: { archived: true, archivedAt: new Date() },
  })

  // Add audit logs
  await db.auditLog.createMany({
    data: toArchive.map((c) => ({
      caseId: c.id,
      actorId: null, // system
      action: 'ARCHIVE',
      details: 'Auto-archived at end of day (lazy)',
    })),
  })

  return toArchive.length
}
