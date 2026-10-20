import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

// POST /api/cases/[id]/accept — LA accepts the case
export async function POST(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'LICENSE_AGENT') {
    return NextResponse.json({ error: 'Only LAs can accept' }, { status: 403 })
  }
  const { id } = await params

  const c = await db.case.findUnique({ where: { id } })
  if (!c) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }
  if (c.licenseAgentId !== user.id) {
    return NextResponse.json({ error: 'Not assigned to you' }, { status: 403 })
  }
  if (c.status === 'ACCEPTED' || c.status === 'RESOLVED') {
    return NextResponse.json({ error: 'Already accepted or resolved' }, { status: 400 })
  }

  const updated = await db.case.update({
    where: { id },
    data: { status: 'ACCEPTED', acceptedAt: new Date() },
  })

  await db.auditLog.create({
    data: {
      caseId: id,
      actorId: user.id,
      action: 'ACCEPT',
      details: `Accepted by ${user.name}`,
    },
  })

  return NextResponse.json({ case: updated })
}
