'use client'

import { useState, FormEvent } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PhoneCall, ShieldCheck, UserCog, Loader2, AlertCircle } from 'lucide-react'

const DEMO = {
  verifier: { email: 'verifier@agus.systems', password: 'Verifier@123' },
  agent: { email: 'la1@agus.systems', password: 'Agent@123' },
}

export function LoginScreen() {
  const { login, loading, error, setError } = useAuthStore()
  const [email, setEmail] = useState(DEMO.verifier.email)
  const [password, setPassword] = useState(DEMO.verifier.password)
  const [role, setRole] = useState<'verifier' | 'agent'>('verifier')

  function switchRole(next: 'verifier' | 'agent') {
    setRole(next)
    const d = next === 'verifier' ? DEMO.verifier : DEMO.agent
    setEmail(d.email)
    setPassword(d.password)
    setError(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 grid lg:grid-cols-2">
        {/* Left brand panel */}
        <section className="bg-agus-gradient text-white flex flex-col justify-between p-10 lg:p-16 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-indigo-gold flex items-center justify-center shadow-lg shadow-indigo-900/30">
                <PhoneCall className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">AGUS SYSTEMS</div>
                <div className="text-xs text-indigo-200">Prospect Intake · License Agent Handoff</div>
              </div>
            </div>
          </div>

          <div className="relative space-y-6 max-w-md">
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
              One clean workspace for capturing and routing prospect information.
            </h1>
            <p className="text-indigo-100 text-base leading-relaxed">
              Representatives complete the Prospect Information Questionnaire and
              transfer it to a License Agent. The agent sees the case on their
              dashboard, calls the prospect, and resolves it. At end of day the
              cards auto-clear while every record stays archived in the database.
            </p>
            <ul className="space-y-3 text-sm text-indigo-100">
              <li className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-300 mt-0.5 shrink-0" />
                Role-based dashboards for Representative and License Agent.
              </li>
              <li className="flex items-start gap-2">
                <UserCog className="h-4 w-4 text-amber-300 mt-0.5 shrink-0" />
                Manual handoff — rep picks the LA before transfer.
              </li>
              <li className="flex items-start gap-2">
                <PhoneCall className="h-4 w-4 text-amber-300 mt-0.5 shrink-0" />
                Live call timer, notes, recording upload & full audit trail.
              </li>
            </ul>
          </div>

          <div className="relative text-xs text-indigo-200">
            © {new Date().getFullYear()} AGUS SYSTEMS · Internal use only
          </div>
        </section>

        {/* Right login form */}
        <section className="flex items-center justify-center p-6 lg:p-10 bg-stone-50">
          <Card className="w-full max-w-md shadow-xl border-slate-200">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl text-indigo-950">Sign in</CardTitle>
              <CardDescription>
                Pick your role to pre-fill the demo credentials, or enter your own.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={role} onValueChange={(v) => switchRole(v as 'verifier' | 'agent')}>
                <TabsList className="grid grid-cols-2 w-full mb-6">
                  <TabsTrigger value="verifier" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white">
                    Representative
                  </TabsTrigger>
                  <TabsTrigger value="agent" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white">
                    License Agent
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="verifier" className="mt-0">
                  <RoleHint
                    icon={<ShieldCheck className="h-4 w-4" />}
                    title="Representative login"
                    desc="Fill the prospect questionnaire, pick an LA, transfer the call."
                    creds={DEMO.verifier}
                  />
                </TabsContent>
                <TabsContent value="agent" className="mt-0">
                  <RoleHint
                    icon={<UserCog className="h-4 w-4" />}
                    title="License Agent login"
                    desc="Receive prospect cases on your dashboard, handle and resolve them."
                    creds={DEMO.agent}
                  />
                </TabsContent>
              </Tabs>

              <form onSubmit={onSubmit} className="space-y-4 mt-6">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@agus.systems"
                    required
                    autoComplete="username"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="h-11"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-indigo-700 hover:bg-indigo-800 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Signing in…
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>

              <p className="text-xs text-stone-500 mt-6 text-center">
                Demo accounts are pre-seeded. Use the tabs above to switch roles.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

function RoleHint({
  icon, title, desc, creds,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  creds: { email: string; password: string }
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-stone-50 p-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="space-y-0.5">
          <div className="font-medium text-indigo-950">{title}</div>
          <div className="text-xs text-stone-600">{desc}</div>
          <div className="text-xs text-stone-500 mt-1 font-mono">
            {creds.email} · {creds.password}
          </div>
        </div>
      </div>
    </div>
  )
}
