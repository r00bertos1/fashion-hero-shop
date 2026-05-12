'use client'

import { Clock } from 'lucide-react'
import { motion } from 'motion/react'
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/pricing-report/motion-config'

const steps = [
  {
    n: 1,
    title: 'Zamawiasz subskrypcję',
    body: 'Krótki formularz, płatność, gotowe. Bez instalacji ani konfiguracji.',
  },
  {
    n: 2,
    title: 'Analizujemy codziennie',
    body: 'Codzienny monitoring cen, weryfikacja przez analityków FashionHero.',
  },
  {
    n: 3,
    title: 'Raport co tydzień + alerty',
    body: 'Cotygodniowy raport dostępny w systemie + alerty o nagłych obniżkach konkurencji w czasie rzeczywistym.',
  },
] as const

export function LandingHowItWorks() {
  return (
    <section className="px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light text-charcoal mb-12 text-center md:text-left">
          Jak to działa
        </h2>

        <div className="relative">
          {/* Connecting line (md+ only). Sits behind the circles, anchored to their vertical center. */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[16.6667%] right-[16.6667%] top-5 hidden h-px bg-charcoal/10 md:block"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={viewportOnce}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ transformOrigin: 'left' }}
              className="h-full bg-charcoal/30"
            />
          </div>

          <motion.ol
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="relative grid gap-10 md:grid-cols-3 md:gap-8"
          >
            {steps.map((s) => (
              <motion.li
                key={s.n}
                variants={fadeUp}
                className="flex flex-col items-center text-center md:items-center"
              >
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/30 bg-white text-sm font-medium text-charcoal">
                  {s.n}
                </span>
                <h3 className="text-xl font-medium text-charcoal mb-2">{s.title}</h3>
                <p className="text-charcoal/80 text-sm max-w-xs">{s.body}</p>
              </motion.li>
            ))}
          </motion.ol>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: 0.4 }}
          className="mt-12 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-charcoal/20 bg-white px-4 py-2 text-[12px] tracking-wide text-charcoal">
            <Clock className="h-3.5 w-3.5 text-warm-gray" />
            Pierwszy raport w 24h od aktywacji
          </span>
        </motion.div>
      </div>
    </section>
  )
}
