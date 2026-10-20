import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

// GET /api/cases/[id] — fetch a single case with all relations
export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params

  const c = await db.case.findUnique({
    where: { id },
    include: {
      verifier: { select: { id: true, name: true, email: true } },
      licenseAgent: { select: { id: true, name: true, email: true } },
      notes: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, role: true } } },
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { actor: { select: { id: true, name: true, role: true } } },
      },
    },
  })
  if (!c) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }
  // Authorization: verifier who created, or LA assigned to it
  if (user.role === 'VERIFIER' && c.verifierId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (user.role === 'LICENSE_AGENT' && c.licenseAgentId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json({ case: c })
}

// PATCH /api/cases/[id] — generic update (e.g. add la_notes, update callDuration)
export async function PATCH(req: Request, { params }: Ctx) {
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

  const body = (await req.json()) as {
    laNotes?: string
    callDurationSec?: number
  }

  const data: Record<string, unknown> = {}
  if (typeof body.laNotes === 'string') data.laNotes = body.laNotes
  if (typeof body.callDurationSec === 'number') {
    data.callDurationSec = body.callDurationSec
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const updated = await db.case.update({ where: { id }, data })
  return NextResponse.json({ case: updated })
}
