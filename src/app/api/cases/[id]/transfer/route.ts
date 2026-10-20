import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

type Ctx = { params: Promise<{ id: string }> }

const transferSchema = z.object({
  licenseAgentId: z.string().min(1),
})

// POST /api/cases/[id]/transfer
// Verifier transfers the call (and case) to a chosen License Agent.
export async function POST(req: Request, { params }: Ctx) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'VERIFIER') {
    return NextResponse.json({ error: 'Only verifiers can transfer' }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json()
  const parsed = transferSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid agent id' }, { status: 400 })
  }
  const { licenseAgentId } = parsed.data

  const agent = await db.user.findUnique({
    where: { id: licenseAgentId },
  })
  if (!agent || agent.role !== 'LICENSE_AGENT' || !agent.active) {
    return NextResponse.json({ error: 'Agent not found or inactive' }, { status: 404 })
  }

  const c = await db.case.findUnique({ where: { id } })
  if (!c) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }
  if (c.verifierId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (c.status === 'RESOLVED') {
    return NextResponse.json({ error: 'Case already resolved' }, { status: 400 })
  }

  const updated = await db.case.update({
    where: { id },
    data: {
      licenseAgentId,
      status: 'TRANSFERRED',
      transferredAt: new Date(),
      archived: false,
      archivedAt: null,
      acceptedAt: null,
      resolvedAt: null,
    },
  })

  await db.auditLog.create({
    data: {
      caseId: id,
      actorId: user.id,
      action: 'TRANSFER',
      details: `Transferred to ${agent.name} (${agent.email})`,
    },
  })

  return NextResponse.json({ case: updated, agent })
}
