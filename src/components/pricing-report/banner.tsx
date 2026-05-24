'use client'

import Link from 'next/link'
import posthog from 'posthog-js'
import { useSubscription } from '@/lib/pricing-report/use-subscription'
import { usePriceVariant } from '@/lib/pricing-report/price-variant-provider'

export function PricingReportBanner() {
  const { isHydrated, isActive } = useSubscription()
  const { price, currency, planKey } = usePriceVariant()
  if (!isHydrated || isActive) return null

  function handleBannerClick() {
    posthog.capture('pricing_report_banner_clicked', {
      surface: 'account_panel',
      plan: planKey,
      price,
      currency,
    })
  }

  return (
    <div className="border border-charcoal bg-stone-100 p-6 mb-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
      <span className="text-[10px] tracking-[0.12em] uppercase bg-charcoal text-white px-2 py-1 self-start">
        Nowe
      </span>
      <div className="flex-1">
        <p className="text-charcoal font-medium mb-1">
          Raport cen konkurencji — {price} PLN/mies
        </p>
        <p className="text-charcoal/70 text-sm">
          Codzienny monitoring 100 produktów + 5 konkurentów. Co tydzień gotowe rekomendacje cenowe.
        </p>
      </div>
      <Link
        href="/pricing-report"
        onClick={handleBannerClick}
        className="inline-flex items-center justify-center bg-charcoal text-white px-5 py-3 rounded-full text-xs tracking-wide hover:bg-charcoal/90 transition-colors whitespace-nowrap"
      >
        Aktywuj raport →
      </Link>
    </div>
  )
}
