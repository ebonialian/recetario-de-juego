'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

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
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (error) {
      console.error(error)
      alert('Hubo un error enviando el link. Probá de nuevo.')
      return
    }
    setSent(true)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (user) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>{user.email}</span>
        <button onClick={handleLogout} className="underline">
          Cerrar sesión
        </button>
      </div>
    )
  }

  if (sent) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Te mandamos un link a {email}, revisá tu mail.
      </p>
    )
  }

  return (
    <form onSubmit={handleLogin} className="flex items-center justify-center gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        className="rounded-full border px-3 py-1 text-xs"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-terracota px-3 py-1 text-xs text-peach"
      >
        {loading ? '...' : 'Ingresar'}
      </button>
    </form>
  )
}