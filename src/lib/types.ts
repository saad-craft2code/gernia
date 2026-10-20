// Shared client-side types matching the AGUS SYSTEMS Prospect Questionnaire schema.

export type Role = 'VERIFIER' | 'LICENSE_AGENT'
export type CaseStatus = 'CREATED' | 'TRANSFERRED' | 'ACCEPTED' | 'RESOLVED' | 'REASSIGNED'

export interface UserBrief {
  id: string
  name: string
  email: string
  role?: Role
}

export interface CaseNote {
  id: string
  caseId: string
  authorId: string
  content: string
  createdAt: string
  author?: UserBrief
}

export interface AuditLog {
  id: string
  caseId: string
  actorId: string | null
  action: string
  details: string | null
  createdAt: string
  actor?: UserBrief | null
}

export interface FamilyMember {
  name: string
  dob: string
  gender: string
  smoking: 'YES' | 'NO' | ''
}

export interface Case {
  id: string
  caseNumber: string

  // Section 1 - Client/Contact
  representativeName: string | null
  prospectName: string | null
  prospectPhone: string | null
  prospectEmail: string | null
  prospectState: string | null

  // Section 2 - Coverage
  coverageType: string | null
  familyMemberCount: number | null
  familyMembers: FamilyMember[] | null

  // Section 3 - Health
  hasMedicalConditions: string | null
  medicalConditionsDetails: string | null
  isPregnant: string | null
  doctorVisitFrequency: string | null
  lastDoctorVisit: string | null
  nextAppointment: string | null
  hasMentalHealth: string | null
  mentalHealthDetails: string | null

  // Section 4 - Budget
  previousInsuranceCost: string | null
  expectedMonthlyCost: string | null
  expectedCostIncrease: string | null
  cobraOffered: string | null

  // Section 5 - Timing
  timingUrgency: string | null
  preferredStartDate: string | null
  additionalNotes: string | null

  // Section 6 - Checklist
  checklistHealthyCandidate: boolean
  checklistHouseholdProvided: boolean
  checklistStateEligibility: boolean

  // Handoff
  verifierId: string
  licenseAgentId: string | null
  status: CaseStatus
  transferredAt: string | null
  acceptedAt: string | null
  resolvedAt: string | null
  callDurationSec: number
  recordingUrl: string | null
  laNotes: string | null
  archived: boolean
  archivedAt: string | null
  createdAt: string
  updatedAt: string

  // relations
  verifier?: UserBrief
  licenseAgent?: UserBrief | null
  notes?: CaseNote[]
  auditLogs?: AuditLog[]
}

export interface CaseStats {
  role: Role
  todayCount: number
  pendingCount: number
  resolvedCount: number
  totalResolved: number
  avgHandlingSec: number
  series: { date: string; count: number }[]
}

export interface ReportData {
  totalCases: number
  totalResolved: number
  totalPending: number
  avgHandlingSec: number
  resolutionRate: number
  agentPerformance: {
    name: string
    assigned: number
    resolved: number
    pending: number
    avgHandlingSec: number
  }[]
  dailyVolume: { date: string; count: number }[]
  categoryBreakdown: { name: string; count: number }[]
  urgencyBreakdown: { name: string; count: number }[]
}
