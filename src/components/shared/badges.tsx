'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CaseStatus } from '@/lib/types'

const STATUS_STYLES: Record<CaseStatus, string> = {
  CREATED: 'border-slate-200 bg-slate-100 text-slate-700',
  TRANSFERRED: 'border-amber-200 bg-amber-50 text-amber-800',
  ACCEPTED: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  REASSIGNED: 'border-purple-200 bg-purple-50 text-purple-800',
}

const STATUS_LABEL: Record<CaseStatus, string> = {
  CREATED: 'Created',
  TRANSFERRED: 'Transferred',
  ACCEPTED: 'Accepted',
  RESOLVED: 'Resolved',
  REASSIGNED: 'Reassigned',
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', STATUS_STYLES[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 mr-1.5" />
      {STATUS_LABEL[status]}
    </Badge>
  )
}
