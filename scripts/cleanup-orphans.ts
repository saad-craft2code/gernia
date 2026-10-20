import { db } from '/home/z/my-project/src/lib/db'

async function main() {
  // Can't delete verifier@agus.systems (has FK cases), so deactivate it instead
  const old = await db.user.updateMany({
    where: { email: 'verifier@agus.systems' },
    data: { active: false },
  })
  console.log('Deactivated verifier@agus.systems:', old.count)

  // Verify final account list
  const all = await db.user.findMany({
    select: { email: true, name: true, role: true, active: true },
    orderBy: { email: 'asc' },
  })
  console.log('\nFinal users in Neon DB:')
  for (const u of all) console.log(`  ${u.email} - ${u.name} (${u.role}) [active=${u.active}]`)
}

main().then(() => db.$disconnect()).catch(e => { console.error(e); process.exit(1) })
