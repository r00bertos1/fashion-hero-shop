'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import posthog from 'posthog-js'
import { useSubscription } from '@/lib/pricing-report/use-subscription'
import { usePriceVariant } from '@/lib/pricing-report/price-variant-provider'
import { hashEmail, isValidEmail } from '@/lib/pricing-report/email'
import { isDemoModeSession } from '@/lib/pricing-report/use-demo-entry'

const features = [
  'Codzienny monitoring 100 Twoich produktów',
  '5 największych konkurentów w kategorii Fashion',
  'Cotygodniowy raport w systemie + eksport (PDF/Excel)',
  'Alerty o obniżkach konkurencji powyżej 5%',
] as const

export default function CheckoutPage() {
  const router = useRouter()
  const { activate } = useSubscription()
  const { price, currency, planKey } = usePriceVariant()
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const emailValid = isValidEmail(email)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!emailValid || isLoading) return
    setIsLoading(true)

    const demoMode = isDemoModeSession()
    const utmSource = posthog.get_property('$initial_utm_source') ?? null
    const utmCampaign = posthog.get_property('$initial_utm_campaign') ?? null

    // Raw email goes only to Supabase (skip for demo to avoid junk leads).
    if (!demoMode) {
      try {
        const res = await fetch('/api/pricing-report/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, price, currency, utmSource, utmCampaign, demoMode }),
        })
        if (!res.ok) {
          console.warn('[pricing-report] lead capture returned', res.status)
        }
      } catch (err) {
        console.warn('[pricing-report] lead capture failed', err)
      }
    }

    // PII-safe: only a hash + the variant reach PostHog.
    const emailHash = await hashEmail(email)
    posthog.capture('pricing_report_email_captured', {
      price,
      surface: 'pricing_report_checkout',
      currency,
      email_hash: emailHash,
    })
    posthog.capture('pricing_report_subscription_started', {
      plan: planKey,
      price,
      currency,
    })

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
      <form onSubmit={handleSubmit} className="border border-black/10 p-8 mb-6">
        <div className="flex items-baseline justify-between border-b border-black/10 pb-6 mb-6">
          <div>
            <p className="text-sm text-warm-gray">Plan</p>
            <p className="text-lg text-charcoal">Pricing Report — miesięczny</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-warm-gray">Cena</p>
            <p className="text-2xl font-light text-charcoal">{price} PLN / mies</p>
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

        <div className="mb-6">
          <label htmlFor="lead-email" className="block text-sm text-charcoal mb-2">
            Adres e-mail (na niego wyślemy raport)
          </label>
          <input
            id="lead-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="ty@twojsklep.pl"
            className="w-full border border-black/15 rounded-lg px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal"
            aria-invalid={touched && !emailValid}
          />
          {touched && !emailValid ? (
            <p className="text-xs text-red-600 mt-1.5">Podaj poprawny adres e-mail.</p>
          ) : null}
        </div>

        <p className="text-[11px] text-warm-gray bg-stone-100 px-3 py-2 mb-6 rounded">
          To jest demo — nie zostaniesz obciążony i nie zbieramy danych karty.
        </p>
        <button
          type="submit"
          disabled={!emailValid || isLoading}
          className="w-full bg-charcoal text-white py-4 rounded-full text-sm tracking-wide hover:bg-charcoal/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Wysyłam…' : `Zamów raport — ${price} PLN/mies`}
        </button>
      </form>
    </div>
  )
}
