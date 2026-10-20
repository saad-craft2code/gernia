import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { archiveStaleCasesForAgent } from '@/lib/archive'

// GET /api/cases
// Verifier: sees cases they created (with optional status filter)
// LA: sees cases transferred to them today (with auto-archive of stale ones)
//   - if `archive=1`, returns archived cases instead (history)
// Query params: status, search, archive
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || undefined
  const search = url.searchParams.get('search') || undefined
  const archiveOnly = url.searchParams.get('archive') === '1'

  if (user.role === 'LICENSE_AGENT') {
    await archiveStaleCasesForAgent(user.id)

    const where: Record<string, unknown> = {
      licenseAgentId: user.id,
      archived: archiveOnly ? true : false,
    }
    if (status) where.status = status
    if (search) {
      where.OR = [
        { prospectName: { contains: search, mode: 'insensitive' } },
        { prospectPhone: { contains: search, mode: 'insensitive' } },
        { prospectEmail: { contains: search, mode: 'insensitive' } },
        { representativeName: { contains: search, mode: 'insensitive' } },
        { caseNumber: { contains: search, mode: 'insensitive' } },
      ]
    }
    const orderField = archiveOnly ? 'archivedAt' : 'transferredAt'
    const cases = await db.case.findMany({
      where,
      orderBy: { [orderField]: 'desc' } as never,
      take: 200,
      include: { verifier: { select: { id: true, name: true, email: true } } },
    })
    return NextResponse.json({ cases })
  }

  // VERIFIER
  const where: Record<string, unknown> = { verifierId: user.id }
  if (status) where.status = status
  if (search) {
    where.OR = [
      { prospectName: { contains: search, mode: 'insensitive' } },
      { prospectPhone: { contains: search, mode: 'insensitive' } },
      { prospectEmail: { contains: search, mode: 'insensitive' } },
      { representativeName: { contains: search, mode: 'insensitive' } },
      { caseNumber: { contains: search, mode: 'insensitive' } },
    ]
  }
  const cases = await db.case.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { licenseAgent: { select: { id: true, name: true, email: true } } },
  })
  return NextResponse.json({ cases })
}

// POST /api/cases — create new prospect questionnaire case (verifier only).
// All fields are optional per the spec: "if something is missing, no need to make it mandatory".
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (user.role !== 'VERIFIER') {
    return NextResponse.json(
      { error: 'Only verifiers can create prospect cases' },
      { status: 403 },
    )
  }

  const body = (await req.json()) as Record<string, unknown>

  // Generate next caseNumber AGUS-YYYY-00001
  const year = new Date().getFullYear()
  const count = await db.case.count()
  const seq = String(count + 1).padStart(5, '0')
  const caseNumber = `AGUS-${year}-${seq}`

  // Coerce family members: only save rows with at least a name
  let familyMembers: unknown[] = []
  if (Array.isArray(body.familyMembers)) {
    familyMembers = (body.familyMembers as unknown[])
      .filter((m) => {
        const r = m as Record<string, unknown>
        return r && typeof r === 'object' && (r.name as string)?.trim()
      })
  }

  const created = await db.case.create({
    data: {
      caseNumber,
      // Section 1
      representativeName: (body.representativeName as string)?.trim() || null,
      prospectName: (body.prospectName as string)?.trim() || null,
      prospectPhone: (body.prospectPhone as string)?.trim() || null,
      prospectEmail: (body.prospectEmail as string)?.trim() || null,
      prospectState: (body.prospectState as string)?.trim() || null,
      // Section 2
      coverageType: (body.coverageType as string) || null,
      familyMemberCount: typeof body.familyMemberCount === 'number' ? body.familyMemberCount : null,
      familyMembers: familyMembers.length ? familyMembers : null,
      // Section 3
      hasMedicalConditions: (body.hasMedicalConditions as string) || null,
      medicalConditionsDetails: (body.medicalConditionsDetails as string)?.trim() || null,
      isPregnant: (body.isPregnant as string) || null,
      doctorVisitFrequency: (body.doctorVisitFrequency as string)?.trim() || null,
      lastDoctorVisit: (body.lastDoctorVisit as string)?.trim() || null,
      nextAppointment: (body.nextAppointment as string)?.trim() || null,
      hasMentalHealth: (body.hasMentalHealth as string) || null,
      mentalHealthDetails: (body.mentalHealthDetails as string)?.trim() || null,
      // Section 4
      previousInsuranceCost: (body.previousInsuranceCost as string)?.trim() || null,
      expectedMonthlyCost: (body.expectedMonthlyCost as string)?.trim() || null,
      expectedCostIncrease: (body.expectedCostIncrease as string)?.trim() || null,
      cobraOffered: (body.cobraOffered as string) || null,
      // Section 5
      timingUrgency: (body.timingUrgency as string) || null,
      preferredStartDate: (body.preferredStartDate as string)?.trim() || null,
      additionalNotes: (body.additionalNotes as string)?.trim() || null,
      // Section 6 — checklist (booleans, default false)
      checklistHealthyCandidate: Boolean(body.checklistHealthyCandidate),
      checklistHouseholdProvided: Boolean(body.checklistHouseholdProvided),
      checklistStateEligibility: Boolean(body.checklistStateEligibility),
      // Lifecycle
      verifierId: user.id,
      status: 'CREATED',
    },
  })

  await db.auditLog.create({
    data: {
      caseId: created.id,
      actorId: user.id,
      action: 'CREATE',
      details: `Prospect case ${caseNumber} created`,
    },
  })

  return NextResponse.json({ case: created }, { status: 201 })
}
