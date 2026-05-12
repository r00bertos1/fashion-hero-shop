'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { CALM_EASE } from '@/lib/pricing-report/motion-config'

export default function DemoLandingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-100 px-4 py-20 flex items-center justify-center">
      <div className="max-w-xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: CALM_EASE }}
          className="text-[11px] tracking-[0.12em] uppercase text-warm-gray mb-6"
        >
          Demo dla warsztatu · AI Product Heroes
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: CALM_EASE, delay: 0.1 }}
          className="text-3xl md:text-5xl font-light text-charcoal leading-tight mb-6"
        >
          Wejdź w rolę sprzedawcy FashionHero
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: CALM_EASE, delay: 0.25 }}
          className="text-base text-charcoal/80 mb-10 leading-relaxed"
        >
          Za chwilę otworzy się panel sprzedawcy modowego. Rozejrzyj się chwilę
          i kliknij ten element, który Cię najbardziej zainteresuje. Nic nie musisz
          wypełniać — to zajmie pół minuty.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: CALM_EASE, delay: 0.4 }}
        >
          <Link
            href="/account?demo=1"
            className="inline-flex items-center justify-center bg-charcoal text-white px-8 py-4 rounded-full text-sm tracking-wide hover:bg-charcoal/90 transition-colors"
          >
            Otwórz panel sprzedawcy →
          </Link>
          <p className="text-xs text-warm-gray mt-5">
            Konto testowe — nie wymaga rejestracji ani logowania.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
