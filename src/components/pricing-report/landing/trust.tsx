'use client'

import { useEffect, useRef } from 'react'
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import {
  CALM_EASE,
  fadeUp,
  staggerContainer,
  viewportOnce,
} from '@/lib/pricing-report/motion-config'

const BRANDS = ['MAVI', 'LIORA', 'NORD', 'ATELIER 7', 'KAMA'] as const

const STATS = [
  { value: 14, prefix: '+', suffix: '%', label: 'średni wzrost marży' },
  { value: 4, prefix: '', suffix: 'h', label: 'tygodniowo zaoszczędzonego czasu' },
  { value: 127, prefix: '', suffix: '', label: 'aktywnych sprzedawców' },
] as const

function StatNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduceMotion = useReducedMotion()
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (latest) => Math.round(latest))

  useEffect(() => {
    if (!inView) return
    if (reduceMotion) {
      motionValue.set(value)
      return
    }
    const controls = animate(motionValue, value, { duration: 1, ease: CALM_EASE })
    return () => controls.stop()
  }, [inView, value, reduceMotion, motionValue])

  return <motion.span ref={ref}>{rounded}</motion.span>
}

export function LandingTrust() {
  return (
    <section className="bg-white px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <p className="text-[11px] tracking-[0.12em] uppercase text-warm-gray text-center mb-3">
          Im już zaufali
        </p>
        <h2 className="text-2xl md:text-3xl font-light text-charcoal text-center mb-12">
          Sprzedawcy, którzy przestali zgadywać
        </h2>

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 mb-16"
          aria-label="Sprzedawcy korzystający z raportu"
        >
          {BRANDS.map((brand) => (
            <motion.li
              key={brand}
              variants={fadeUp}
              className="italic font-serif text-xl text-charcoal/60 tracking-wider"
            >
              {brand}
            </motion.li>
          ))}
        </motion.ul>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-10 sm:grid-cols-3 border-t border-black/10 pt-12"
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="text-center"
            >
              <p className="font-light text-4xl md:text-5xl text-charcoal">
                {stat.prefix}
                <StatNumber value={stat.value} />
                {stat.suffix}
              </p>
              <p className="mt-3 text-[11px] tracking-[0.12em] uppercase text-warm-gray">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
