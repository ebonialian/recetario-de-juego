'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { CircleAlert, MailCheck } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (error) {
      console.error(error)
      setError(true)
      return
    }
    setSent(true)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (user) {
    return (
      <div className="micro flex items-center justify-center gap-2 text-noche-suave">
        <span>{user.email}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="min-h-11 px-1 text-noche underline underline-offset-4"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  if (sent) {
    return (
      <p role="status" className="micro inline-flex items-center gap-1.5 text-noche">
        <MailCheck className="size-[18px] shrink-0 text-exito" strokeWidth={2} aria-hidden="true" />
        Te mandamos un link a {email}. Abrilo desde tu mail para entrar.
      </p>
    )
  }

  return (
    <form onSubmit={handleLogin} className="flex w-full max-w-sm flex-col gap-1 text-left">
      <label htmlFor="email-login" className="etiqueta text-noche">
        Entrá con tu mail para guardar tu historial
      </label>
      <div className="flex gap-2">
        <input
          id="email-login"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="cuerpo h-11 min-w-0 flex-1 rounded-control border-[1.5px] border-noche-suave bg-superficie px-3 text-noche placeholder:text-noche-suave"
        />
        <button
          type="submit"
          disabled={loading}
          className="opcion h-11 shrink-0 rounded-control border-2 border-noche px-4 text-noche transition-colors hover:bg-arena disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Recibir link'}
        </button>
      </div>
      {error && (
        <p role="alert" className="micro mt-1 inline-flex items-center gap-1.5 text-error">
          <CircleAlert className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          No pudimos mandar el link. Revisá el mail y probá de nuevo.
        </p>
      )}
    </form>
  )
}