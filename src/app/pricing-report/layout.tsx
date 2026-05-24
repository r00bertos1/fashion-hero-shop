import { cookies } from 'next/headers'
import { PriceVariantProvider } from '@/lib/pricing-report/price-variant-provider'
import { VARIANT_COOKIE, parseVariant } from '@/lib/pricing-report/pricing'

export default async function PricingReportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const store = await cookies()
  const initialVariant = parseVariant(store.get(VARIANT_COOKIE)?.value)
  return <PriceVariantProvider initialVariant={initialVariant}>{children}</PriceVariantProvider>
}
