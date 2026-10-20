import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/users?role=LICENSE_AGENT — list users, optionally filtered by role.
// Verifier uses this to populate the "transfer to" dropdown.
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const role = url.searchParams.get('role')
  const where: { active?: boolean; role?: string } = { active: true }
  if (role) where.role = role

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ users })
}
