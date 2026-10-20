import { db } from '../src/lib/db'

async function main() {
  // Find LA
  const la = await db.user.findFirst({ where: { role: 'LICENSE_AGENT' } })
  const verifier = await db.user.findFirst({ where: { role: 'VERIFIER' } })
  if (!la || !verifier) {
    console.error('Missing users')
    return
  }

  // Create a case that was transferred YESTERDAY (stale)
  const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000)
  const staleCase = await db.case.create({
    data: {
      caseNumber: 'CC-2026-TEST-OLD',
      callerName: 'Old Caller',
      callerCnic: '00000-0000000-0',
      callerPhone: '+92 300 9999999',
      callReason: 'Test stale transfer',
      category: 'Inquiry',
      urgency: 'NORMAL',
      summary: 'This case was transferred yesterday and should auto-archive.',
      verifierId: verifier.id,
      licenseAgentId: la.id,
      status: 'TRANSFERRED',
      transferredAt: yesterday,
    },
  })
  console.log('Created stale case:', staleCase.caseNumber, 'transferredAt:', staleCase.transferredAt)

  // Now trigger the archive by simulating an LA fetch
  const { archiveStaleCasesForAgent } = await import('../src/lib/archive')
  const archivedCount = await archiveStaleCasesForAgent(la.id)
  console.log('Auto-archived count:', archivedCount)

  // Verify
  const updated = await db.case.findUnique({ where: { id: staleCase.id } })
  console.log('After archive - archived:', updated?.archived, 'archivedAt:', updated?.archivedAt)
}

main().then(() => db.$disconnect()).catch(e => { console.error(e); process.exit(1) })
