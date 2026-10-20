'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  hint?: string
  icon: LucideIcon
  accent?: 'indigo' | 'amber' | 'emerald' | 'rose' | 'slate'
}

const ACCENT_STYLES: Record<NonNullable<StatCardProps['accent']>, string> = {
  indigo: 'bg-indigo-50 text-indigo-700',
  amber: 'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  rose: 'bg-rose-50 text-rose-700',
  slate: 'bg-stone-100 text-stone-700',
}

export function StatCard({ label, value, hint, icon: Icon, accent = 'slate' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 hover:border-slate-300 transition-colors">
      <div
        className={cn(
          'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
          ACCENT_STYLES[accent],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-stone-500 uppercase tracking-wide">
          {label}
        </div>
        <div className="text-2xl font-semibold text-indigo-950 leading-tight mt-0.5">
          {value}
        </div>
        {hint && (
          <div className="text-xs text-stone-500 mt-0.5 truncate">{hint}</div>
        )}
      </div>
    </div>
  )
}
