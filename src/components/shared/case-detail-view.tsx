'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft, PhoneCall, Phone, Check, Upload, Send, Loader2, Clock, Play,
  Square, User, Activity, Volume2, Heart, DollarSign, CheckSquare, Users,
} from 'lucide-react'
import type { Case, UserBrief, CaseNote, AuditLog, FamilyMember } from '@/lib/types'
import { StatusBadge } from '@/components/shared/badges'
import { formatDateTime, relativeTime, formatDuration } from '@/lib/dates'
import { COVERAGE_TYPES, US_STATES, NON_SALE_STATES, TIMING_OPTIONS } from '@/lib/constants'

interface Props {
  caseId: string
  onClose: () => void
  onMutated?: () => void
}

export function CaseDetailView({ caseId, onClose, onMutated }: Props) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [tab, setTab] = useState<'overview' | 'notes' | 'recording' | 'audit' | 'transfer'>('overview')
  const [loading, setLoading] = useState(true)
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [agents, setAgents] = useState<UserBrief[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [transferring, setTransferring] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [recordingFile, setRecordingFile] = useState<File | null>(null)
  const [recordingUploading, setRecordingUploading] = useState(false)

  const [timerActive, setTimerActive] = useState(false)
  const [timerSec, setTimerSec] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [savingTimer, setSavingTimer] = useState(false)

  const loadCase = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cases/${caseId}`, { cache: 'no-store' })
      const data = await res.json()
      setCaseData(data?.case ?? null)
      if (data?.case) setTimerSec(data.case.callDurationSec || 0)
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    loadCase()
  }, [loadCase])

  useEffect(() => {
    if (user?.role === 'VERIFIER') {
      fetch('/api/users?role=LICENSE_AGENT')
        .then((r) => r.json())
        .then((data) => {
          setAgents(data?.users ?? [])
          if (!selectedAgent && data?.users?.length > 0) {
            setSelectedAgent(data.users[0].id)
          }
        })
        .catch(() => setAgents([]))
    }
  }, [user?.role, selectedAgent])

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimerSec((s) => s + 1), 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerActive])

  useEffect(() => {
    if (!caseData || timerSec === 0) return
    const id = setInterval(async () => {
      if (!timerActive) return
      try {
        setSavingTimer(true)
        await fetch(`/api/cases/${caseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callDurationSec: timerSec }),
        })
      } finally {
        setSavingTimer(false)
      }
    }, 10_000)
    return () => clearInterval(id)
  }, [caseData, caseId, timerActive, timerSec])

  async function transfer() {
    if (!selectedAgent || !caseData) return
    setTransferring(true)
    try {
      const res = await fetch(`/api/cases/${caseData.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseAgentId: selectedAgent }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Transfer failed')
      toast({
        title: 'Case transferred',
        description: `Sent to ${data?.agent?.name ?? 'License Agent'} — they will see it on their dashboard.`,
      })
      await loadCase()
      onMutated?.()
    } catch (e) {
      toast({
        title: 'Transfer failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setTransferring(false)
    }
  }

  async function addNote() {
    if (!noteText.trim() || !caseData) return
    setNoteSaving(true)
    try {
      const res = await fetch(`/api/cases/${caseData.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to add note')
      setNoteText('')
      await loadCase()
      onMutated?.()
    } catch (e) {
      toast({
        title: 'Could not add note',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setNoteSaving(false)
    }
  }

  async function uploadRecording() {
    if (!recordingFile || !caseData) return
    setRecordingUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', recordingFile)
      const res = await fetch(`/api/cases/${caseData.id}/recording`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Upload failed')
      toast({
        title: 'Recording uploaded',
        description: `${recordingFile.name} (${Math.round(recordingFile.size / 1024)} KB)`,
      })
      setRecordingFile(null)
      await loadCase()
      onMutated?.()
    } catch (e) {
      toast({
        title: 'Upload failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setRecordingUploading(false)
    }
  }

  async function acceptCase() {
    if (!caseData) return
    const res = await fetch(`/api/cases/${caseData.id}/accept`, { method: 'POST' })
    if (res.ok) {
      toast({ title: 'Case accepted' })
      await loadCase()
      onMutated?.()
    }
  }

  async function resolveCase() {
    if (!caseData) return
    const res = await fetch(`/api/cases/${caseData.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callDurationSec: timerSec }),
    })
    if (res.ok) {
      toast({ title: 'Case resolved' })
      setTimerActive(false)
      await loadCase()
      onMutated?.()
    } else {
      toast({ title: 'Could not resolve', variant: 'destructive' })
    }
  }

  async function saveTimer() {
    if (!caseData) return
    setSavingTimer(true)
    setTimerActive(false)
    await fetch(`/api/cases/${caseData.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callDurationSec: timerSec }),
    })
    setSavingTimer(false)
  }

  if (loading || !caseData) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
        <div className="flex items-center justify-center py-24 text-stone-500 text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading case…
        </div>
      </div>
    )
  }

  const isVerifier = user?.role === 'VERIFIER'
  const isAgent = user?.role === 'LICENSE_AGENT'
  const hasTransferTab = isVerifier && caseData.status !== 'RESOLVED'

  const familyMembers: FamilyMember[] = Array.isArray(caseData.familyMembers)
    ? (caseData.familyMembers as FamilyMember[])
    : []

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-5">
      {/* Sticky top header with Back button + case summary + action buttons */}
      <div className="sticky top-16 z-20 -mx-4 lg:-mx-8 px-4 lg:px-8 py-4 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-stone-600">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <div className="hidden sm:block h-6 w-px bg-slate-200" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-stone-500">{caseData.caseNumber}</span>
                <StatusBadge status={caseData.status} />
                {caseData.coverageType && (
                  <Badge variant="outline" className="text-xs border-indigo-200 bg-indigo-50 text-indigo-700">
                    {coverageLabel(caseData.coverageType)}
                  </Badge>
                )}
                {caseData.timingUrgency && (
                  <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-800">
                    {timingLabel(caseData.timingUrgency)}
                  </Badge>
                )}
                {caseData.prospectState && NON_SALE_STATES.includes(caseData.prospectState as never) && (
                  <Badge variant="outline" className="text-xs border-red-200 bg-red-50 text-red-700">
                    No-sale state: {caseData.prospectState}
                  </Badge>
                )}
              </div>
              <div className="text-xl font-bold text-indigo-950 mt-0.5 truncate">
                {caseData.prospectName || 'Unnamed prospect'}
              </div>
            </div>
          </div>

          {/* Action buttons on the right */}
          <div className="flex items-center gap-2 shrink-0">
            {isAgent && caseData.status === 'TRANSFERRED' && (
              <Button onClick={acceptCase} size="sm" className="bg-indigo-700 hover:bg-indigo-800 text-white">
                <Check className="h-4 w-4 mr-1.5" />Accept
              </Button>
            )}
            {isAgent && caseData.status === 'ACCEPTED' && (
              <Button onClick={resolveCase} size="sm" className="bg-indigo-700 hover:bg-indigo-800 text-white">
                <Check className="h-4 w-4 mr-1.5" />Resolve
              </Button>
            )}
            {isVerifier && caseData.status === 'RESOLVED' && (
              <Badge variant="outline" className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700">
                Resolved {caseData.resolvedAt ? relativeTime(caseData.resolvedAt) : ''}
              </Badge>
            )}
          </div>
        </div>
        <div className="text-xs text-stone-500 mt-2">
          Created {formatDateTime(caseData.createdAt)}
          {caseData.verifier && ` · by ${caseData.verifier.name}`}
          {caseData.licenseAgent && ` · assigned to ${caseData.licenseAgent.name}`}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs sm:text-sm">
            Notes {caseData.notes?.length ? `(${caseData.notes.length})` : ''}
          </TabsTrigger>
          {isAgent ? (
            <TabsTrigger value="recording" className="text-xs sm:text-sm">Recording</TabsTrigger>
          ) : hasTransferTab ? (
            <TabsTrigger value="transfer" className="text-xs sm:text-sm">Transfer</TabsTrigger>
          ) : (
            <TabsTrigger value="overview-extra" disabled className="text-xs sm:text-sm opacity-30">·</TabsTrigger>
          )}
          <TabsTrigger value="audit" className="text-xs sm:text-sm">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-6">
          {isAgent && caseData.status !== 'RESOLVED' && caseData.status !== 'CREATED' && (
            <CallTimer
              active={timerActive}
              seconds={timerSec}
              onStart={() => setTimerActive(true)}
              onPause={() => setTimerActive(false)}
              onSave={saveTimer}
              saving={savingTimer}
            />
          )}

          <div className="grid lg:grid-cols-2 gap-5">
            <Section title="1 · Client / Contact Information" icon={<User className="h-4 w-4" />}>
              <KV label="Representative" value={caseData.representativeName || '—'} />
              <KV label="Prospect name" value={caseData.prospectName || '—'} />
              <KV label="Phone" value={caseData.prospectPhone || '—'} />
              <KV label="Email" value={caseData.prospectEmail || '—'} />
              <KV label="State" value={stateLabel(caseData.prospectState)} />
            </Section>

            <Section title="2 · Coverage Need" icon={<Users className="h-4 w-4" />}>
              <KV label="Coverage type" value={coverageLabel(caseData.coverageType)} />
              <KV label="Member count" value={String(caseData.familyMemberCount ?? '—')} />
              {familyMembers.length > 0 && (
                <div className="sm:col-span-2">
                  <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium mb-1.5">Household members</div>
                  <div className="rounded-md border border-slate-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-stone-50 text-stone-500 uppercase tracking-wide">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Name</th>
                          <th className="text-left px-3 py-2 font-medium">DOB</th>
                          <th className="text-left px-3 py-2 font-medium">Gender</th>
                          <th className="text-left px-3 py-2 font-medium">Smoking</th>
                        </tr>
                      </thead>
                      <tbody>
                        {familyMembers.map((m, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-3 py-2 text-stone-800">{m.name || '—'}</td>
                            <td className="px-3 py-2 text-stone-700">{m.dob || '—'}</td>
                            <td className="px-3 py-2 text-stone-700">{m.gender || '—'}</td>
                            <td className="px-3 py-2 text-stone-700">{m.smoking || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Section>

            <Section title="3 · Health / Medical" icon={<Heart className="h-4 w-4" />}>
              <KV label="Pre-existing conditions" value={ynLabel(caseData.hasMedicalConditions)} />
              <KV label="Currently pregnant?" value={ynLabel(caseData.isPregnant)} />
              <KV label="Mental health conditions?" value={ynLabel(caseData.hasMentalHealth)} />
              <KV label="Doctor visit frequency" value={caseData.doctorVisitFrequency || '—'} />
              <KV label="Last doctor visit" value={caseData.lastDoctorVisit || '—'} />
              <KV label="Next appointment" value={caseData.nextAppointment || '—'} />
              {caseData.medicalConditionsDetails && (
                <KV label="Conditions details" value={caseData.medicalConditionsDetails} multiline />
              )}
              {caseData.mentalHealthDetails && (
                <KV label="Mental health details" value={caseData.mentalHealthDetails} multiline />
              )}
            </Section>

            <Section title="4 · Budget / Current Situation" icon={<DollarSign className="h-4 w-4" />}>
              <KV label="Previous insurance cost" value={fmtCurrency(caseData.previousInsuranceCost)} />
              <KV label="Expected monthly cost" value={fmtCurrency(caseData.expectedMonthlyCost)} />
              <KV label="Expected cost increase" value={fmtCurrency(caseData.expectedCostIncrease)} />
              <KV label="COBRA offered" value={ynLabel(caseData.cobraOffered)} />
            </Section>

            <Section title="5 · Timing / Urgency" icon={<Clock className="h-4 w-4" />}>
              <KV label="Needed when?" value={timingLabel(caseData.timingUrgency)} />
              <KV label="Preferred start date" value={caseData.preferredStartDate || '—'} />
              {caseData.additionalNotes && (
                <KV label="Additional notes" value={caseData.additionalNotes} multiline />
              )}
            </Section>

            <Section title="6 · Representative Checklist" icon={<CheckSquare className="h-4 w-4" />}>
              <KV label="Healthy-candidate criteria met" value={ynBoolean(caseData.checklistHealthyCandidate)} />
              <KV label="Household details provided" value={ynBoolean(caseData.checklistHouseholdProvided)} />
              <KV label="State eligibility checked" value={ynBoolean(caseData.checklistStateEligibility)} />
            </Section>
          </div>

          {caseData.laNotes && (
            <div>
              <h3 className="text-sm font-semibold text-indigo-950 mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-700" />
                LA notes &amp; resolution
              </h3>
              <div className="rounded-md bg-stone-50 border border-slate-100 p-4 text-sm text-stone-700 whitespace-pre-wrap">
                {caseData.laNotes}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-5 space-y-3">
          <div className="rounded-md bg-stone-50 border border-slate-100 p-4">
            <Label className="text-xs text-stone-600">Add a note</Label>
            <div className="mt-1.5">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder="Type your note for the team…"
                className="bg-white"
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={addNote}
                disabled={noteSaving || !noteText.trim()}
                className="bg-indigo-700 hover:bg-indigo-800 text-white"
              >
                {noteSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Send className="h-4 w-4 mr-1.5" />
                )}
                Add note
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {caseData.notes?.length === 0 && (
              <div className="text-center py-8 text-xs text-stone-500">
                No notes yet. Add the first one above.
              </div>
            )}
            {caseData.notes?.map((n: CaseNote) => (
              <div key={n.id} className="rounded-md border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-stone-700">
                    {n.author?.name ?? 'Unknown'}
                    {n.author?.role && (
                      <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4">
                        {n.author.role === 'VERIFIER' ? 'Rep' : 'Agent'}
                      </Badge>
                    )}
                  </span>
                  <span className="text-[11px] text-stone-400">{relativeTime(n.createdAt)}</span>
                </div>
                <p className="text-sm text-stone-700 whitespace-pre-wrap">{n.content}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {isAgent && (
          <TabsContent value="recording" className="mt-5 space-y-4">
            {caseData.recordingUrl ? (
              <div className="rounded-md border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="h-5 w-5 text-indigo-700" />
                  <span className="text-sm font-medium text-indigo-950">Recording</span>
                </div>
                <audio controls src={caseData.recordingUrl} className="w-full">
                  Your browser does not support audio playback.
                </audio>
                <p className="text-xs text-stone-500 mt-2">
                  File path: <span className="font-mono">{caseData.recordingUrl}</span>
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-stone-500 border border-dashed border-slate-300 rounded-md">
                No recording uploaded yet.
              </div>
            )}
            <div className="rounded-md border border-dashed border-slate-300 p-4">
              <Label className="text-xs text-stone-600">Upload a new recording</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="file"
                  accept="audio/*,video/webm"
                  onChange={(e) => setRecordingFile(e.target.files?.[0] ?? null)}
                  className="h-10"
                />
                <Button
                  onClick={uploadRecording}
                  disabled={!recordingFile || recordingUploading}
                  size="sm"
                  className="bg-indigo-700 hover:bg-indigo-800 text-white"
                >
                  {recordingUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1.5" />
                  )}
                  Upload
                </Button>
              </div>
              {recordingFile && (
                <p className="text-xs text-stone-500 mt-2">
                  {recordingFile.name} · {Math.round(recordingFile.size / 1024)} KB
                </p>
              )}
            </div>
          </TabsContent>
        )}

        {hasTransferTab && (
          <TabsContent value="transfer" className="mt-5 space-y-4">
            <div className="rounded-md border border-slate-200 p-4">
              <Label className="text-xs text-stone-600">Transfer to License Agent</Label>
              <p className="text-xs text-stone-500 mt-1 mb-3">
                Pick the agent who should receive this case. They will see a fresh card
                on their dashboard within ~30s.
              </p>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select agent…" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end mt-3">
                <Button
                  onClick={transfer}
                  disabled={!selectedAgent || transferring}
                  className="bg-indigo-700 hover:bg-indigo-800 text-white"
                >
                  {transferring ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <PhoneCall className="h-4 w-4 mr-1.5" />
                  )}
                  Transfer case
                </Button>
              </div>
            </div>

            {agents.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {agents.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAgent(a.id)}
                    className={`text-left rounded-md border p-3 transition-colors ${
                      selectedAgent === a.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-indigo-950 truncate">{a.name}</div>
                    <div className="text-xs text-stone-500 truncate">{a.email}</div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="audit" className="mt-5 space-y-2">
          {caseData.auditLogs?.length === 0 && (
            <div className="text-center py-8 text-xs text-stone-500">
              No activity yet.
            </div>
          )}
          <div className="space-y-2">
            {caseData.auditLogs?.map((l: AuditLog) => (
              <div key={l.id} className="flex items-start gap-3 text-sm border border-slate-100 rounded-md p-3">
                <div className="h-7 w-7 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center shrink-0">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-indigo-950 text-xs">
                      {l.actor?.name ?? 'System'}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 h-4 border-slate-200 text-stone-600">
                      {l.action}
                    </Badge>
                    <span className="text-[11px] text-stone-400">
                      {formatDateTime(l.createdAt)}
                    </span>
                  </div>
                  {l.details && (
                    <p className="text-xs text-stone-600 mt-0.5">{l.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-indigo-950">{title}</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  )
}

function KV({
  label, value, fullWidth, multiline,
}: {
  label: string
  value: React.ReactNode
  fullWidth?: boolean
  multiline?: boolean
}) {
  return (
    <div className={`${fullWidth ? 'sm:col-span-2' : ''}`}>
      <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium">
        {label}
      </div>
      {multiline ? (
        <div className="text-sm text-stone-700 mt-0.5 whitespace-pre-wrap">{value}</div>
      ) : (
        <div className="text-sm text-indigo-950 mt-0.5">{value}</div>
      )}
    </div>
  )
}

function CallTimer({
  active, seconds, onStart, onPause, onSave, saving,
}: {
  active: boolean
  seconds: number
  onStart: () => void
  onPause: () => void
  onSave: () => void
  saving: boolean
}) {
  return (
    <div className="rounded-lg bg-agus-gradient text-white p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${active ? 'bg-amber-500 pulse-indigo' : 'bg-indigo-900'}`}>
          <PhoneCall className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[11px] text-indigo-200 uppercase tracking-wide">
            Live call timer {saving && '· saving…'}
          </div>
          <div className="text-2xl font-mono tabular-nums">
            {formatDuration(seconds)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!active ? (
          <Button size="sm" onClick={onStart} className="bg-indigo-500 hover:bg-indigo-600 text-white">
            <Play className="h-4 w-4 mr-1.5" />Start
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onPause} className="bg-transparent border-indigo-300 text-white hover:bg-indigo-800">
            <Square className="h-3 w-3 mr-1.5" />Pause
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onSave} className="bg-transparent border-indigo-300 text-white hover:bg-indigo-800">
          <Clock className="h-3.5 w-3.5 mr-1.5" />Save
        </Button>
      </div>
    </div>
  )
}

function coverageLabel(code: string | null): string {
  if (!code) return '—'
  return COVERAGE_TYPES.find((c) => c.value === code)?.label ?? code
}

function stateLabel(code: string | null): string {
  if (!code) return '—'
  return US_STATES.find((s) => s.code === code)?.name ?? code
}

function timingLabel(code: string | null): string {
  if (!code) return '—'
  return TIMING_OPTIONS.find((t) => t.value === code)?.label ?? code
}

function ynLabel(v: string | null): string {
  if (!v) return '—'
  return v === 'YES' ? 'Yes' : v === 'NO' ? 'No' : v
}

function ynBoolean(v: boolean): string {
  return v ? 'Yes' : 'No'
}

function fmtCurrency(v: string | null): string {
  if (!v) return '—'
  const num = Number(v)
  if (isNaN(num)) return v
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
