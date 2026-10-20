'use client'

import { create } from 'zustand'

export type Role = 'VERIFIER' | 'LICENSE_AGENT'
export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
}

interface AuthState {
  user: SessionUser | null
  loading: boolean
  initialized: boolean
  error: string | null
  loadUser: () => Promise<void>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  setError: (msg: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  error: null,
  loadUser: async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      const data = await res.json()
      set({ user: data?.user ?? null, initialized: true })
    } catch {
      set({ user: null, initialized: true })
    }
  },
  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        set({ loading: false, error: data?.error || 'Login failed' })
        return false
      }
      set({ user: data, loading: false, initialized: true, error: null })
      return true
    } catch {
      set({ loading: false, error: 'Network error' })
      return false
    }
  },
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    set({ user: null })
  },
  setError: (msg) => set({ error: msg }),
}))
