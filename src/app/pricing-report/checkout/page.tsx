'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSubscription } from '@/lib/pricing-report/use-subscription'

const features = [
  'Codzienny monitoring 100 Twoich produktów',
  '5 największych konkurentów w kategorii Fashion',
  'Cotygodniowy raport w systemie + eksport (PDF/Excel)',
  'Alerty o obniżkach konkurencji powyżej 5%',
] as const

export default function CheckoutPage() {
  const router = useRouter()
  const { activate } = useSubscription()
  const [isLoading, setIsLoading] = useState(false)

  async function handlePay() {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    activate()
    router.push('/pricing-report/success')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <nav className="text-[11px] text-warm-gray mb-8 tracking-wide">
        <Link href="/pricing-report" className="hover:text-charcoal transition-colors">Pricing Report</Link>
        <span className="mx-1.5">/</span>
        <span className="text-charcoal">Płatność</span>
      </nav>
      <h1 className="text-3xl font-light text-charcoal mb-2">Subskrypcja Pricing Report</h1>
      <p className="text-charcoal/70 mb-10">
        Aktywujesz cotygodniowy raport cen konkurencji w panelu sprzedawcy.
      </p>
      <div className="border border-black/10 p-8 mb-6">
        <div className="flex items-baseline justify-between border-b border-black/10 pb-6 mb-6">
          <div>
            <p className="text-sm text-warm-gray">Plan</p>
            <p className="text-lg text-charcoal">Pricing Report — miesięczny</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-warm-gray">Cena</p>
            <p className="text-2xl font-light text-charcoal">49 PLN / mies</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-charcoal/80 mb-6">
          {features.map(f => (
            <li key={f} className="flex gap-2">
              <span className="text-charcoal">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-warm-gray bg-stone-100 px-3 py-2 mb-6 rounded">
          To jest demo — nie zostaniesz obciążony i nie zbieramy danych karty.
        </p>
        <button
          type="button"
          onClick={handlePay}
          disabled={isLoading}
          className="w-full bg-charcoal text-white py-4 rounded-full text-sm tracking-wide hover:bg-charcoal/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Przetwarzam płatność…' : 'Zapłać 49 PLN'}
        </button>
      </div>
    </div>
  )
}
