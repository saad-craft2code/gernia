'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  US_STATES, COVERAGE_TYPES, GENDERS, YES_NO, TIMING_OPTIONS, NON_SALE_STATES,
} from '@/lib/constants'
import { formatPhoneInput, formatCurrencyInput } from '@/lib/validation'
import {
  User, Phone, Heart, DollarSign, Clock, CheckSquare,
  Save, X, Plus, Trash2, Loader2, AlertTriangle, FileText, ShieldCheck,
} from 'lucide-react'

interface FamilyMember {
  name: string
  dob: string
  gender: string
  smoking: 'YES' | 'NO' | ''
}

export function ProspectForm({ onDone }: { onDone: () => void }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  // Section 1 - Client/Contact
  const [representativeName, setRepresentativeName] = useState('')
  const [prospectName, setProspectName] = useState('')
  const [prospectPhone, setProspectPhone] = useState('')
  const [prospectEmail, setProspectEmail] = useState('')
  const [prospectState, setProspectState] = useState('')

  // Section 2 - Coverage
  const [coverageType, setCoverageType] = useState('')
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])

  // Section 3 - Health
  const [hasMedicalConditions, setHasMedicalConditions] = useState('')
  const [medicalConditionsDetails, setMedicalConditionsDetails] = useState('')
  const [isPregnant, setIsPregnant] = useState('')
  const [doctorVisitFrequency, setDoctorVisitFrequency] = useState('')
  const [lastDoctorVisit, setLastDoctorVisit] = useState('')
  const [nextAppointment, setNextAppointment] = useState('')
  const [hasMentalHealth, setHasMentalHealth] = useState('')
  const [mentalHealthDetails, setMentalHealthDetails] = useState('')

  // Section 4 - Budget
  const [previousInsuranceCost, setPreviousInsuranceCost] = useState('')
  const [expectedMonthlyCost, setExpectedMonthlyCost] = useState('')
  const [expectedCostIncrease, setExpectedCostIncrease] = useState('')
  const [cobraOffered, setCobraOffered] = useState('')

  // Section 5 - Timing
  const [timingUrgency, setTimingUrgency] = useState('')
  const [preferredStartDate, setPreferredStartDate] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  // Section 6 - Checklist
  const [checklistHealthyCandidate, setChecklistHealthyCandidate] = useState(false)
  const [checklistHouseholdProvided, setChecklistHouseholdProvided] = useState(false)
  const [checklistStateEligibility, setChecklistStateEligibility] = useState(false)

  function addFamilyMember() {
    setFamilyMembers((prev) => [...prev, { name: '', dob: '', gender: '', smoking: '' }])
  }
  function updateFamilyMember(idx: number, field: keyof FamilyMember, value: string) {
    setFamilyMembers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    )
  }
  function removeFamilyMember(idx: number) {
    setFamilyMembers((prev) => prev.filter((_, i) => i !== idx))
  }

  async function save(e: FormEvent) {
    e.preventDefault()

    // Per spec: NO field is mandatory. We save whatever the user entered,
    // even if phone/email/dates are partial or have an unusual format.
    // Auto-formatting on input already cleaned up obvious cases (phone).
    setSaving(true)
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          representativeName, prospectName,
          prospectPhone, prospectEmail, prospectState,
          coverageType,
          familyMemberCount: familyMembers.length || null,
          familyMembers: familyMembers.filter((m) => m.name.trim()),
          hasMedicalConditions, medicalConditionsDetails, isPregnant,
          doctorVisitFrequency, lastDoctorVisit, nextAppointment,
          hasMentalHealth, mentalHealthDetails,
          previousInsuranceCost: previousInsuranceCost || null,
          expectedMonthlyCost: expectedMonthlyCost || null,
          expectedCostIncrease: expectedCostIncrease || null,
          cobraOffered,
          timingUrgency, preferredStartDate, additionalNotes,
          checklistHealthyCandidate, checklistHouseholdProvided, checklistStateEligibility,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create prospect case')
      toast({
        title: 'Prospect case saved',
        description: `${data?.case?.caseNumber ?? 'Case'} saved successfully. Open it to transfer to a License Agent.`,
      })
      onDone()
    } catch (e) {
      toast({
        title: 'Error saving case',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-6 pb-12">
      {/* Form header — sticky */}
      <div className="sticky top-16 z-20 -mx-4 lg:-mx-8 px-4 lg:px-8 py-4 bg-stone-50/95 backdrop-blur border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onDone} className="text-stone-600">
            <X className="h-4 w-4 mr-1.5" />
            Cancel
          </Button>
          <div className="hidden sm:block h-6 w-px bg-slate-200" />
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-indigo-950">
              Prospect Information Questionnaire
            </div>
            <div className="text-xs text-stone-500">
              All fields optional — save with whatever you have, dates included.
            </div>
          </div>
        </div>
        <Button type="submit" disabled={saving} className="bg-indigo-700 hover:bg-indigo-800 text-white">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save prospect
            </>
          )}
        </Button>
      </div>

      {/* SECTION 1 — Client / Contact Information */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base section-accent flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-700" />
            1 · Client / Contact Information
          </CardTitle>
          <CardDescription className="text-xs ml-7">
            Representative &amp; prospect identity. Phone auto-formats as (XXX) XXX-XXXX.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <Field label="Representative name">
            <Input value={representativeName} onChange={(e) => setRepresentativeName(e.target.value)} placeholder="e.g. Sarah Johnson" className="h-11" />
          </Field>
          <Field label="Prospect name">
            <Input value={prospectName} onChange={(e) => setProspectName(e.target.value)} placeholder="e.g. John Smith" className="h-11" />
          </Field>
          <Field label="Phone number" hint="Optional — auto-formats as you type">
            <Input
              value={prospectPhone}
              onChange={(e) => setProspectPhone(formatPhoneInput(e.target.value))}
              placeholder="(555) 123-4567"
              inputMode="tel"
              className="h-11"
            />
          </Field>
          <Field label="Email" hint="Optional">
            <Input type="email" value={prospectEmail} onChange={(e) => setProspectEmail(e.target.value)} placeholder="john.smith@email.com" className="h-11" />
          </Field>
          <Field label="State">
            <Select value={prospectState} onValueChange={setProspectState}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Select state…" /></SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {prospectState && NON_SALE_STATES.includes(prospectState as never) && (
            <div className="sm:col-span-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                AGUS SYSTEMS does <strong>not</strong> sell plans in {prospectState}. Please
                note this in the additional-notes section and inform the prospect.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2 — Coverage Need */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base section-accent flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-700" />
            2 · Coverage Need
          </CardTitle>
          <CardDescription className="text-xs ml-7">
            Coverage type and household members (if family).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Coverage type">
            <Select value={coverageType} onValueChange={setCoverageType}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Self / Family / Group" /></SelectTrigger>
              <SelectContent>
                {COVERAGE_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          {coverageType === 'FAMILY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-stone-700">Household members</Label>
                <Button type="button" size="sm" variant="outline" onClick={addFamilyMember} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                  <Plus className="h-3.5 w-3.5 mr-1" />Add member
                </Button>
              </div>
              {familyMembers.length === 0 && (
                <div className="text-xs text-stone-500 italic px-1">
                  No members added yet. Click "Add member" to add each person who needs coverage.
                </div>
              )}
              {familyMembers.length > 0 && (
                <div className="space-y-2">
                  <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_0.8fr_auto] gap-2 px-1 text-xs font-medium text-stone-500 uppercase tracking-wide">
                    <div>Name</div><div>DOB (MM/DD/YYYY)</div><div>Gender</div><div>Smoking</div><div></div>
                  </div>
                  {familyMembers.map((m, idx) => (
                    <div key={idx} className="grid md:grid-cols-[1.5fr_1fr_1fr_0.8fr_auto] gap-2 items-center p-2 rounded-md border border-slate-200 bg-stone-50">
                      <Input
                        value={m.name}
                        onChange={(e) => updateFamilyMember(idx, 'name', e.target.value)}
                        placeholder="Full name"
                        className="h-10 bg-white"
                      />
                      <Input
                        value={m.dob}
                        onChange={(e) => updateFamilyMember(idx, 'dob', e.target.value)}
                        placeholder="MM/DD/YYYY"
                        className="h-10 bg-white"
                      />
                      <Select value={m.gender} onValueChange={(v) => updateFamilyMember(idx, 'gender', v)}>
                        <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Gender" /></SelectTrigger>
                        <SelectContent>
                          {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={m.smoking} onValueChange={(v) => updateFamilyMember(idx, 'smoking', v)}>
                        <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Yes / No" /></SelectTrigger>
                        <SelectContent>
                          {YES_NO.map((y) => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFamilyMember(idx)}
                        className="text-red-600 hover:bg-red-50 h-9 w-9"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 3 — Health / Medical */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base section-accent flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-600" />
            3 · Health / Medical Questions
          </CardTitle>
          <CardDescription className="text-xs ml-7">
            Pre-existing conditions, pregnancy, doctor visits, mental health.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <YesNoField label="Any medical or pre-existing conditions?" value={hasMedicalConditions} onChange={setHasMedicalConditions} hint="e.g. cancer, heart attack, stroke, diabetes" />
            <YesNoField label="Is anyone currently pregnant?" value={isPregnant} onChange={setIsPregnant} />
            <YesNoField label="Any mental health conditions or related medications?" value={hasMentalHealth} onChange={setHasMentalHealth} />
          </div>
          {hasMedicalConditions === 'YES' && (
            <Field label="Medical conditions — details">
              <Textarea value={medicalConditionsDetails} onChange={(e) => setMedicalConditionsDetails(e.target.value)} rows={2} placeholder="List conditions, diagnoses, dates, treating physician…" />
            </Field>
          )}
          {hasMentalHealth === 'YES' && (
            <Field label="Mental health — details">
              <Textarea value={mentalHealthDetails} onChange={(e) => setMentalHealthDetails(e.target.value)} rows={2} placeholder="Provide details…" />
            </Field>
          )}
          <Field label="How often does the prospect visit a doctor?">
            <Input value={doctorVisitFrequency} onChange={(e) => setDoctorVisitFrequency(e.target.value)} placeholder="e.g. Once a year, every 6 months, rarely…" className="h-11" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Date of last doctor visit" hint="Optional — format MM/DD/YYYY">
              <Input value={lastDoctorVisit} onChange={(e) => setLastDoctorVisit(e.target.value)} placeholder="MM/DD/YYYY" className="h-11" />
            </Field>
            <Field label="Next scheduled appointment" hint="Optional — format MM/DD/YYYY">
              <Input value={nextAppointment} onChange={(e) => setNextAppointment(e.target.value)} placeholder="MM/DD/YYYY" className="h-11" />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4 — Budget / Current Situation */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base section-accent flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-amber-600" />
            4 · Budget / Current Situation
          </CardTitle>
          <CardDescription className="text-xs ml-7">
            Currency inputs accept digits + decimal. Saved as plain numbers.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <CurrencyField label="Previous insurance cost (if known)" value={previousInsuranceCost} onChange={setPreviousInsuranceCost} />
          <CurrencyField label="Expected affordable monthly cost" value={expectedMonthlyCost} onChange={setExpectedMonthlyCost} />
          <CurrencyField label="Expected cost increase (if applicable)" value={expectedCostIncrease} onChange={setExpectedCostIncrease} />
          <YesNoField label="COBRA offered due to job loss?" value={cobraOffered} onChange={setCobraOffered} />
        </CardContent>
      </Card>

      {/* SECTION 5 — Timing / Urgency */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base section-accent flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-700" />
            5 · Timing / Urgency
          </CardTitle>
          <CardDescription className="text-xs ml-7">
            How soon does the prospect need a plan? Pick from the standard options.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <Field label="How soon does the prospect need a plan?">
            <Select value={timingUrgency} onValueChange={setTimingUrgency}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Select timing…" /></SelectTrigger>
              <SelectContent>
                {TIMING_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Preferred plan start date" hint="Optional — format MM/DD/YYYY">
            <Input value={preferredStartDate} onChange={(e) => setPreferredStartDate(e.target.value)} placeholder="MM/DD/YYYY" className="h-11" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Additional notes / anything else the representative should know">
              <Textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} rows={4} placeholder="Any context that helps the License Agent handle this prospect — employer changes, dependent details, special timing, etc." />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 6 — Representative Checklist */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base section-accent flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-emerald-700" />
            6 · Representative Checklist
          </CardTitle>
          <CardDescription className="text-xs ml-7">
            Confirm each item before saving. These do not block save.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ChecklistItem
            checked={checklistHealthyCandidate}
            onChange={setChecklistHealthyCandidate}
            label="Client appears to meet the healthy-candidate criteria for private-plan review."
            hint="Private-plan candidates should have no pre-existing conditions and cannot be currently pregnant."
          />
          <ChecklistItem
            checked={checklistHouseholdProvided}
            onChange={setChecklistHouseholdProvided}
            label="All requested household member details have been provided."
          />
          <ChecklistItem
            checked={checklistStateEligibility}
            onChange={setChecklistStateEligibility}
            label="State eligibility has been checked."
            hint={`Plans cannot be sold in: ${NON_SALE_STATES.join(', ')}.`}
          />
        </CardContent>
      </Card>

      {/* Bottom save bar */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="text-xs text-stone-500 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          All captured data is persisted to the AGUS SYSTEMS database and audit-logged.
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDone} className="border-slate-200">Cancel</Button>
          <Button type="submit" disabled={saving} className="bg-indigo-700 hover:bg-indigo-800 text-white">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save prospect
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

function Field({
  label, hint, children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-stone-700">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-stone-500">{hint}</p>}
    </div>
  )
}

function YesNoField({
  label, value, onChange, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-stone-700">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11"><SelectValue placeholder="Yes / No" /></SelectTrigger>
        <SelectContent>
          {YES_NO.map((y) => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {hint && <p className="text-[11px] text-stone-500">{hint}</p>}
    </div>
  )
}

function CurrencyField({
  label, value, onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const preview = value ? formatCurrencyInput(value) : ''
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-stone-700">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
        placeholder="0.00"
        inputMode="decimal"
        className="h-11"
      />
      {preview && <p className="text-[11px] text-emerald-700">Preview: {preview}</p>}
    </div>
  )
}

function ChecklistItem({
  checked, onChange, label, hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex items-start gap-3 px-3 py-2.5 rounded-md border border-slate-200 hover:bg-stone-50 cursor-pointer">
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5 data-[state=checked]:bg-indigo-700" />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-stone-800">{label}</div>
        {hint && <div className="text-xs text-stone-500 mt-0.5">{hint}</div>}
      </div>
    </label>
  )
}

function normalizePhoneForSave(raw: string): string {
  return raw // already formatted as (XXX) XXX-XXXX
}
