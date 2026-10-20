'use client'

import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PhoneCall, LogOut, ShieldCheck, UserCog } from 'lucide-react'

export function TopBar() {
  const { user, logout } = useAuthStore()
  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const isVerifier = user.role === 'VERIFIER'

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-gold flex items-center justify-center shadow-sm shadow-indigo-700/20">
            <PhoneCall className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight text-indigo-950">AGUS SYSTEMS</span>
            <span className="text-[11px] text-stone-500">
              {isVerifier ? 'Representative workspace' : 'License Agent workspace'}
            </span>
          </div>
          <Badge
            variant="outline"
            className={`ml-2 hidden sm:inline-flex ${
              isVerifier
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {isVerifier ? (
              <ShieldCheck className="h-3 w-3 mr-1" />
            ) : (
              <UserCog className="h-3 w-3 mr-1" />
            )}
            {isVerifier ? 'Representative' : 'License Agent'}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm text-stone-600">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full hover:bg-stone-100 p-1 pr-2 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-indigo-700 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-left">
                  <span className="block text-sm font-medium text-indigo-950 leading-tight">
                    {user.name}
                  </span>
                  <span className="block text-[11px] text-stone-500 leading-tight">
                    {user.email}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-stone-500">
                <div className="font-mono">{user.email}</div>
                <div>Role: {user.role}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
