import { ActiveSubscriptionBar } from '@/components/pricing-report/landing/active-subscription-bar'
import { LandingFaq } from '@/components/pricing-report/landing/faq'
import { LandingHero } from '@/components/pricing-report/landing/hero'
import { LandingHowItWorks } from '@/components/pricing-report/landing/how-it-works'
import { LandingOfferCard } from '@/components/pricing-report/landing/offer-card'
import { LandingReportPreview } from '@/components/pricing-report/landing/report-preview'
import { LandingStickyCta } from '@/components/pricing-report/landing/sticky-cta'
import { LandingTrust } from '@/components/pricing-report/landing/trust'
import { LandingWhyItPays } from '@/components/pricing-report/landing/why-it-pays'

export default function PricingReportLandingPage() {
  return (
    <>
      <ActiveSubscriptionBar />
      <LandingHero />
      <LandingReportPreview />
      <LandingWhyItPays />
      <LandingHowItWorks />
      <LandingTrust />
      <LandingOfferCard />
      <LandingFaq />
      <LandingStickyCta />
    </>
  )
}
