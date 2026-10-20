import { db } from '/home/z/my-project/src/lib/db'
import { hashPassword } from '/home/z/my-project/src/lib/auth'

async function main() {
  // Sync LA passwords to what the new seed script declares.
  // (The seed skipped them because they already existed from the first seeding.)

  await db.user.update({
    where: { email: 'la1@agus.systems' },
    data: { passwordHash: hashPassword('Agent@123'), name: 'Michael Brown', role: 'LICENSE_AGENT', active: true },
  })
  console.log('  ✓ la1@agus.systems password synced -> Agent@123')

  await db.user.update({
    where: { email: 'la2@agus.systems' },
    data: { passwordHash: hashPassword('Ag3nt@2026'), name: 'Emily Davis', role: 'LICENSE_AGENT', active: true },
  })
  console.log('  ✓ la2@agus.systems password synced -> Ag3nt@2026')

  // Also make sure the verifier accounts are correct
  await db.user.update({
    where: { email: 'verifier1@agus.systems' },
    data: { passwordHash: hashPassword('Verifier@123'), name: 'Sarah Johnson', role: 'VERIFIER', active: true },
  })
  console.log('  ✓ verifier1@agus.systems password synced -> Verifier@123')

  await db.user.update({
    where: { email: 'verifier2@agus.systems' },
    data: { passwordHash: hashPassword('Ver1f1er@2026'), name: 'James Wilson', role: 'VERIFIER', active: true },
  })
  console.log('  ✓ verifier2@agus.systems password synced -> Ver1f1er@2026')

  console.log('\nAll 4 active accounts are now ready.')
}

main().then(() => db.$disconnect()).catch(e => { console.error(e); process.exit(1) })
