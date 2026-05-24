'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { CALM_EASE } from '@/lib/pricing-report/motion-config'
import { usePriceVariant } from '@/lib/pricing-report/price-variant-provider'

const HEADLINE_WORDS = ['Przestań', 'ręcznie', 'śledzić', 'ceny', 'konkurencji'] as const

export function LandingHero() {
  const reduceMotion = useReducedMotion()
  const wordStagger = reduceMotion ? 0 : 0.06
  const { price } = usePriceVariant()

  return (
    <section className="relative overflow-hidden bg-stone-100 px-4 py-20 md:py-28">
      {/* Decorative blob — single, static, low-key */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 hidden h-[28rem] w-[28rem] rounded-full bg-stone-50/80 blur-3xl md:block"
      />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: CALM_EASE }}
          className="mb-6 inline-flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase text-warm-gray"
        >
          <span className="pr-livedot inline-block h-1.5 w-1.5 rounded-full bg-warm-gray" />
          Nowy moduł FashionHero · Aktualizacja codzienna
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-light text-charcoal leading-tight mb-6">
          <motion.span
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: wordStagger, delayChildren: 0.05 }}
            className="inline-block"
          >
            {HEADLINE_WORDS.map((word, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: CALM_EASE } },
                }}
                className="inline-block mr-[0.25em] last:mr-0"
              >
                {word}
              </motion.span>
            ))}
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: CALM_EASE, delay: 0.35 }}
          className="text-lg text-charcoal/80 max-w-2xl mx-auto mb-10"
        >
          Codzienny monitoring 100 Twoich produktów i 5 największych konkurentów w kategorii Fashion.
          Co tydzień gotowy raport z rekomendacjami cenowymi.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: CALM_EASE, delay: 0.5 }}
        >
          <Link
            href="/pricing-report/checkout"
            className="inline-flex items-center justify-center bg-charcoal text-white px-8 py-4 rounded-full text-sm tracking-wide hover:bg-charcoal/90 transition-colors"
          >
            Zamów raport – {price} PLN/mies
          </Link>
          <p className="text-xs text-warm-gray mt-4">
            Dostęp aktywowany natychmiast po płatności. Pierwszy raport otrzymasz w ciągu 24h.
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[11px] tracking-[0.08em] uppercase text-warm-gray">
            <li>Bez umowy</li>
            <li aria-hidden className="text-warm-gray/40">·</li>
            <li>Faktura VAT</li>
            <li aria-hidden className="text-warm-gray/40">·</li>
            <li>Anulujesz mailem</li>
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
