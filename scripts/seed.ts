// Seed script: creates demo verifier + 2 License Agent accounts for AGUS SYSTEMS.
// Run with: ./run-with-env.sh bun run scripts/seed.ts

import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth'

async function main() {
  console.log('Seeding AGUS SYSTEMS demo accounts...')

  const users = [
    { email: 'verifier@agus.systems', name: 'Sarah Johnson',  role: 'VERIFIER',       password: 'Verifier@123' },
    { email: 'la1@agus.systems',     name: 'Michael Brown',   role: 'LICENSE_AGENT', password: 'Agent@123' },
    { email: 'la2@agus.systems',     name: 'Emily Davis',     role: 'LICENSE_AGENT', password: 'Agent@123' },
  ]

  for (const u of users) {
    const existing = await db.user.findUnique({ where: { email: u.email } })
    if (existing) {
      console.log(`  - ${u.email} already exists (skipping)`)
      continue
    }
    await db.user.create({
      data: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: hashPassword(u.password),
      },
    })
    console.log(`  + Created ${u.email} (${u.role}) - password: ${u.password}`)
  }

  console.log('\nDemo accounts ready. You can now log in as:')
  console.log('  Verifier:       verifier@agus.systems  /  Verifier@123')
  console.log('  License Agent:  la1@agus.systems      /  Agent@123')
  console.log('  License Agent:  la2@agus.systems      /  Agent@123')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
