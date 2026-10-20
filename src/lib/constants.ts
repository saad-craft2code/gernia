// USA-focused constants for AGUS SYSTEMS — Prospect Information Questionnaire

// US states and territories (excluding the 11 states where plans cannot be sold
// per the prospect questionnaire source form).
export const NON_SALE_STATES = [
  'CA', 'CT', 'MA', 'NY', 'NM', 'ND', 'OR', 'SD', 'VT', 'WA', 'AK',
] as const

export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CO', name: 'Colorado' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
] as const

export const COVERAGE_TYPES = [
  { value: 'SELF',   label: 'Self / Individual' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'GROUP',  label: 'Group' },
] as const

export const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const

export const YES_NO = [
  { value: 'YES', label: 'Yes' },
  { value: 'NO',  label: 'No' },
] as const

export const TIMING_OPTIONS = [
  { value: 'ASAP',       label: 'ASAP' },
  { value: '30_DAYS',    label: 'Within 30 days' },
  { value: '1_3_MONTHS', label: '1-3 months' },
  { value: 'NO_DATE',    label: 'No specific date' },
] as const

export const CASE_STATUSES = [
  'CREATED', 'TRANSFERRED', 'ACCEPTED', 'RESOLVED', 'REASSIGNED',
] as const

export const URGENCY_LEVELS = [
  { value: 'LOW',      label: 'Low',      tone: 'slate' },
  { value: 'NORMAL',   label: 'Normal',   tone: 'indigo' },
  { value: 'HIGH',     label: 'High',     tone: 'amber' },
  { value: 'CRITICAL', label: 'Critical', tone: 'red' },
] as const

export type CaseStatus = (typeof CASE_STATUSES)[number]
