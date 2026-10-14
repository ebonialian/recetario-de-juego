import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import Logo from '@/components/Logo'
import { HistoryView } from '@/components/recetario/history-view'

export const metadata: Metadata = {
  title: 'Tu historial · Compinches',
}

export default function HistorialPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[760px] px-4 pb-10 md:px-8">
      <header className="flex items-center justify-between gap-4 pt-6 pb-6">
        <Link href="/" aria-label="Volver al inicio" className="inline-flex">
          <Logo alto={28} />
        </Link>
        <Link
          href="/"
          className="opcion inline-flex min-h-11 items-center gap-1 text-noche underline underline-offset-4"
        >
          <ChevronLeft className="size-5" strokeWidth={2} aria-hidden="true" />
          Buscar ideas
        </Link>
      </header>
      <HistoryView />
    </main>
  )
}
