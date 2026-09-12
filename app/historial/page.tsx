'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

interface LogEntry {
  id: string
  activity_title: string
  rating: 'up' | 'down' | null
  created_at: string
}

export default function HistorialPage() {
  const [user, setUser] = useState<User | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession()
      const currentUser = sessionData.session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        const { data, error } = await supabase
          .from('user_activity_log')
          .select('id, activity_title, rating, created_at')
          .order('created_at', { ascending: false })

        if (error) console.error('Error cargando historial:', error)
        else setLogs(data as LogEntry[])
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-peach px-4 pb-10">
      <header className="flex items-center gap-2 pt-8 pb-6">
        <Link href="/" className="rounded-full p-2 hover:bg-terracota/10">
          <ArrowLeft className="size-5 text-terracota" />
        </Link>
        <h1 className="font-heading text-2xl font-bold text-terracota">Tu historial</h1>
      </header>

      {loading && <p className="text-center text-sm text-muted-foreground">Cargando...</p>}

      {!loading && !user && (
        <p className="text-center text-sm text-muted-foreground">
          Iniciá sesión para ver tu historial.
        </p>
      )}

      {!loading && user && logs.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Todavía no puntuaste ninguna actividad.
        </p>
      )}

      {!loading && user && logs.length > 0 && (
        <ul className="flex flex-col gap-3">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between rounded-2xl border-2 border-terracota/40 bg-peach p-4"
            >
              <div>
                <p className="font-body text-sm font-semibold text-textdark">{log.activity_title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              {log.rating === 'up' ? (
                <ThumbsUp className="size-5 text-salvia" />
              ) : (
                <ThumbsDown className="size-5 text-terracota" />
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}