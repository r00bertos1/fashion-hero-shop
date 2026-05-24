'use client'

import Link from 'next/link'
import { Mail, Shield, XCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/pricing-report/motion-config'
import { usePriceVariant } from '@/lib/pricing-report/price-variant-provider'

const features = [
  {
    title: 'Monitoring do 100 produktów',
    body: 'Najpopularniejsze SKU z Twojego sklepu – wybierane wspólnie przy starcie.',
  },
  {
    title: '5 największych konkurentów',
    body: 'Codzienne śledzenie cen w Twojej kategorii Fashion.',
  },
  {
    title: 'Raport dostępny w systemie',
    body: 'Co tydzień nowy raport w panelu online. W każdej chwili eksport do PDF lub Excel do dalszej analizy w Twoim zespole.',
  },
  {
    title: 'Alerty o nagłych obniżkach',
    body: 'E-mail i powiadomienie, gdy konkurent obniży cenę o więcej niż 5%.',
  },
] as const

const trustBadges = [
  { icon: Shield, label: 'Bez zobowiązań długoterminowych' },
  { icon: Mail, label: 'Wsparcie e-mail w 24h' },
  { icon: XCircle, label: 'Anulujesz jednym mailem' },
] as const

export function LandingOfferCard() {
  const { price } = usePriceVariant()

  return (
    <section className="bg-stone-100 px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <p className="text-[11px] tracking-[0.12em] uppercase text-warm-gray text-center mb-3">
          Co dokładnie kupujesz
        </p>
        <h2 className="text-3xl md:text-4xl font-light text-charcoal text-center mb-12">
          Raport cen konkurencji
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="bg-white border border-black/10 overflow-hidden"
        >
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="space-y-6 p-8 md:p-12"
          >
            {features.map((f) => (
              <motion.li
                key={f.title}
                variants={fadeUp}
                className="border-b border-black/5 pb-6 last:border-b-0 last:pb-0"
              >
                <h3 className="text-lg font-medium text-charcoal mb-2">{f.title}</h3>
                <p className="text-charcoal/80 text-sm">{f.body}</p>
              </motion.li>
            ))}
          </motion.ul>

          {/* Price / CTA block — tonal shift to anchor the eye */}
          <div className="border-t border-black/5 bg-stone-50/60 px-8 md:px-12 py-10 text-center">
            <p className="text-5xl font-light text-charcoal mb-1">
              {price} <span className="text-lg text-warm-gray">PLN / mies</span>
            </p>
            <p className="text-xs text-warm-gray mb-7">
              Faktura VAT · Anulujesz kiedy chcesz
            </p>
            <Link
              href="/pricing-report/checkout"
              className="inline-flex items-center justify-center bg-charcoal text-white px-8 py-4 rounded-full text-sm tracking-wide hover:bg-charcoal/90 transition-colors"
            >
              Zamów raport
            </Link>
            <p className="text-xs text-warm-gray mt-3">
              Dostęp aktywowany natychmiast po płatności. Pierwszy raport otrzymasz w ciągu 24h.
            </p>

            <ul className="mt-8 grid gap-3 text-[12px] text-warm-gray sm:grid-cols-3">
              {trustBadges.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center justify-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
