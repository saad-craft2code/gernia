// Seed script: creates demo verifier + 2 License Agent accounts for AGUS SYSTEMS.
// Run with: ./run-with-env.sh bun run scripts/seed.ts

import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth'

async function main() {
  console.log('Seeding AGUS SYSTEMS demo accounts...')

  const users = [
    // 2 Representatives (verifiers)
    { email: 'verifier1@agus.systems', name: 'Sarah Johnson',  role: 'VERIFIER',       password: 'Verifier@123' },
    { email: 'verifier2@agus.systems', name: 'James Wilson',   role: 'VERIFIER',       password: 'Ver1f1er@2026' },
    // 2 License Agents
    { email: 'la1@agus.systems',     name: 'Michael Brown',   role: 'LICENSE_AGENT', password: 'Agent@123' },
    { email: 'la2@agus.systems',     name: 'Emily Davis',     role: 'LICENSE_AGENT', password: 'Ag3nt@2026' },
  ]

  for (const u of users) {
    const existing = await db.user.findUnique({ where: { email: u.email } })
    if (existing) {
      // Update existing account so password stays in sync with the seed file.
      await db.user.update({
        where: { email: u.email },
        data: {
          name: u.name,
          role: u.role,
          passwordHash: hashPassword(u.password),
          active: true,
        },
      })
      console.log(`  ~ ${u.email} already exists (password synced)`)
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
  console.log('  Verifier #1:  verifier1@agus.systems  /  Verifier@123')
  console.log('  Verifier #2:  verifier2@agus.systems  /  Ver1f1er@2026')
  console.log('  LA #1:        la1@agus.systems         /  Agent@123')
  console.log('  LA #2:        la2@agus.systems         /  Ag3nt@2026')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
