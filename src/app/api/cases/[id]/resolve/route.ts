import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

const resolveSchema = z.object({
  resolutionNotes: z.string().optional(),
  callDurationSec: z.number().int().min(0).optional(),
})

// POST /api/cases/[id]/resolve — LA marks the case resolved
export async function POST(req: Request, { params }: Ctx) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'LICENSE_AGENT') {
    return NextResponse.json({ error: 'Only LAs can resolve' }, { status: 403 })
  }
  const { id } = await params

  const c = await db.case.findUnique({ where: { id } })
  if (!c) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }
  if (c.licenseAgentId !== user.id) {
    return NextResponse.json({ error: 'Not assigned to you' }, { status: 403 })
  }
  if (c.status === 'RESOLVED') {
    return NextResponse.json({ error: 'Already resolved' }, { status: 400 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    resolutionNotes?: string
    callDurationSec?: number
  }
  const parsed = resolveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const data: Record<string, unknown> = {
    status: 'RESOLVED',
    resolvedAt: new Date(),
  }
  if (typeof parsed.data.callDurationSec === 'number') {
    data.callDurationSec = parsed.data.callDurationSec
  }
  if (parsed.data.resolutionNotes) {
    // Append to laNotes
    const prev = c.laNotes || ''
    const addOn = `\n[Resolution ${new Date().toISOString()}]\n${parsed.data.resolutionNotes}`
    data.laNotes = (prev + addOn).trim()
  }

  const updated = await db.case.update({ where: { id }, data })

  await db.auditLog.create({
    data: {
      caseId: id,
      actorId: user.id,
      action: 'RESOLVE',
      details: `Resolved by ${user.name}`,
    },
  })

  return NextResponse.json({ case: updated })
}
