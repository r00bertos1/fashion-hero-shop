'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'
import { usePriceVariant } from '@/lib/pricing-report/price-variant-provider'

export default function SuccessPage() {
  const { price, currency, planKey } = usePriceVariant()
  const captured = useRef(false)

  useEffect(() => {
    // Fire activation exactly once; price may settle after mount when the flag
    // resolves, and we must not emit duplicate subscription_activated events.
    if (captured.current) return
    captured.current = true
    posthog.capture('pricing_report_subscription_activated', {
      plan: planKey,
      price,
      currency,
    })
  }, [price, currency, planKey])

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-charcoal text-white flex items-center justify-center text-3xl mb-8">
        ✓
      </div>
      <h1 className="text-3xl font-light text-charcoal mb-4">
        Subskrypcja aktywna
      </h1>
      <p className="text-charcoal/80 mb-10">
        Twój pierwszy raport jest gotowy. Sprawdź panel sprzedawcy, by zobaczyć tabelę cen, alerty i rekomendacje.
      </p>
      <Link
        href="/account/pricing-report"
        className="inline-flex items-center justify-center bg-charcoal text-white px-8 py-4 rounded-full text-sm tracking-wide hover:bg-charcoal/90 transition-colors"
      >
        Otwórz raport
      </Link>
      <p className="text-[11px] text-warm-gray mt-8">
        To jest demo — nie nastąpiła realna transakcja.
      </p>
    </div>
  )
}
