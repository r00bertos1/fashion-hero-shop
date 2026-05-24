'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import posthog from 'posthog-js'
import {
  CURRENCY,
  DEFAULT_PRICE,
  FLAG_KEY,
  PLAN_KEY,
  VARIANT_COOKIE,
  VARIANT_COOKIE_MAX_AGE,
  priceFromFlag,
  type PriceVariant,
} from './pricing'

export interface PriceVariantValue {
  price: PriceVariant
  currency: typeof CURRENCY
  planKey: typeof PLAN_KEY
}

const PriceVariantContext = createContext<PriceVariantValue | null>(null)

function persistVariant(price: PriceVariant) {
  document.cookie = `${VARIANT_COOKIE}=${price}; path=/; max-age=${VARIANT_COOKIE_MAX_AGE}; samesite=lax`
}

/**
 * `initialVariant` comes from the server-read `pr_variant` cookie (see the
 * account / pricing-report layouts). When it is non-null the visitor already has
 * a pinned variant (outreach link or a prior visit) — we trust it and skip the
 * flag. When null (organic), we default to 149 and resolve the PostHog flag.
 */
export function PriceVariantProvider({
  initialVariant,
  children,
}: {
  initialVariant: PriceVariant | null
  children: React.ReactNode
}) {
  const [price, setPrice] = useState<PriceVariant>(initialVariant ?? DEFAULT_PRICE)
  const hasCookie = useRef(initialVariant != null)

  useEffect(() => {
    // Keep `price` on every event (incl. pageviews) as a super-property.
    posthog.register({ price })
  }, [price])

  useEffect(() => {
    if (hasCookie.current) return
    function resolveFromFlag() {
      const fromFlag = priceFromFlag(posthog.getFeatureFlag(FLAG_KEY))
      if (fromFlag != null) {
        setPrice(fromFlag)
        persistVariant(fromFlag)
      }
    }
    return posthog.onFeatureFlags(resolveFromFlag)
  }, [])

  return (
    <PriceVariantContext.Provider value={{ price, currency: CURRENCY, planKey: PLAN_KEY }}>
      {children}
    </PriceVariantContext.Provider>
  )
}

export function usePriceVariant(): PriceVariantValue {
  const ctx = useContext(PriceVariantContext)
  if (!ctx) {
    throw new Error('usePriceVariant must be used within <PriceVariantProvider>')
  }
  return ctx
}
