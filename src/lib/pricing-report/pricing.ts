// src/lib/pricing-report/pricing.ts
// Single source of truth for the Pricing Report price + A/B variants.

export const PRICE_VARIANTS = [99, 149, 199] as const
export type PriceVariant = (typeof PRICE_VARIANTS)[number]

export const DEFAULT_PRICE: PriceVariant = 149
export const CURRENCY = 'PLN' as const
export const PLAN_KEY = 'pricing_report_monthly' as const

/** PostHog multivariate flag key. */
export const FLAG_KEY = 'pricing-report-price' as const
/** Neutral cookie name — value is the price number, never a "variant" label. */
export const VARIANT_COOKIE = 'pr_variant' as const
/** 90 days, in seconds. */
export const VARIANT_COOKIE_MAX_AGE = 60 * 60 * 24 * 90

/** Maps PostHog flag variant keys to prices. */
export const FLAG_VARIANTS: Record<string, PriceVariant> = {
  'price-99': 99,
  'price-149': 149,
  'price-199': 199,
}

export function isValidVariant(value: unknown): value is PriceVariant {
  return (
    typeof value === 'number' &&
    (PRICE_VARIANTS as readonly number[]).includes(value)
  )
}

export function parseVariant(raw: string | null | undefined): PriceVariant | null {
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return isValidVariant(n) ? n : null
}

export function priceFromFlag(
  variantKey: string | boolean | null | undefined,
): PriceVariant | null {
  if (typeof variantKey !== 'string') return null
  return FLAG_VARIANTS[variantKey] ?? null
}

export function formatPriceLabel(price: PriceVariant): string {
  return `${price} PLN / mies`
}
