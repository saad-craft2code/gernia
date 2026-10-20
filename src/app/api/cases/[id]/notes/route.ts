import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

const noteSchema = z.object({
  content: z.string().min(1).max(4000),
})

// POST /api/cases/[id]/notes — add a note to the case
export async function POST(req: Request, { params }: Ctx) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  const c = await db.case.findUnique({ where: { id } })
  if (!c) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }
  if (user.role === 'VERIFIER' && c.verifierId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (user.role === 'LICENSE_AGENT' && c.licenseAgentId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = noteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid note' }, { status: 400 })
  }

  const note = await db.caseNote.create({
    data: {
      caseId: id,
      authorId: user.id,
      content: parsed.data.content,
    },
    include: { author: { select: { id: true, name: true, role: true } } },
  })

  await db.auditLog.create({
    data: {
      caseId: id,
      actorId: user.id,
      action: 'NOTE_ADD',
      details: `Note added by ${user.name}`,
    },
  })

  return NextResponse.json({ note }, { status: 201 })
}
