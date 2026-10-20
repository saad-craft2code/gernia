import { db } from '../src/lib/db'

async function main() {
  const r = await db.case.deleteMany({ where: { caseNumber: 'CC-2026-TEST-OLD' } })
  console.log('Deleted stale test cases:', r.count)
  // Also delete the audit logs / notes attached
  await db.auditLog.deleteMany({ where: { details: { contains: 'CC-2026-TEST-OLD' } } })
  console.log('Cleanup done')
}
main().then(() => db.$disconnect())
