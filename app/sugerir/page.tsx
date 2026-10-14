import Link from 'next/link'
import type { Metadata } from 'next'
import Logo from '@/components/Logo'
import { SuggestForm } from '@/components/recetario/suggest-form'

export const metadata: Metadata = {
  title: 'Sumá una idea · Compinches',
}

export default function SugerirPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[640px] px-4 pb-10 md:px-8">
      <header className="pt-6 pb-6">
        <Link href="/" aria-label="Volver al inicio" className="inline-flex">
          <Logo alto={28} />
        </Link>
      </header>
      <SuggestForm />
    </main>
  )
}
