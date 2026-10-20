import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export type Role = 'VERIFIER' | 'LICENSE_AGENT'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
}

const SESSION_COOKIE = 'cc_session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'call-center-dev-secret-change-me'

// --- Password hashing (scrypt) ---
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, 'hex')
  const testBuf = scryptSync(password, salt, 64)
  if (hashBuf.length !== testBuf.length) return false
  return timingSafeEqual(hashBuf, testBuf)
}

// --- Session (signed cookie: base64(JSON payload).signature) ---
function sign(payload: string): string {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
}

export async function createSession(userId: string): Promise<void> {
  const payload = JSON.stringify({ uid: userId, iat: Date.now() })
  const b64 = Buffer.from(payload).toString('base64')
  const sig = sign(b64)
  const token = `${b64}.${sig}`
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    const [b64, sig] = token.split('.')
    if (!b64 || !sig) return null
    const expected = sign(b64)
    if (sig !== expected) return null
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString())
    if (!payload?.uid) return null
    const user = await db.user.findUnique({
      where: { id: payload.uid },
      select: { id: true, email: true, name: true, role: true, active: true },
    })
    if (!user || !user.active) return null
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
    }
  } catch {
    return null
  }
}

export function requireRole(user: SessionUser | null, role: Role): user is SessionUser {
  return !!user && user.role === role
}
