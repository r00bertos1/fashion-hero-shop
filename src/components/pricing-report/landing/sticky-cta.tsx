'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useSubscription } from '@/lib/pricing-report/use-subscription'
import { CALM_EASE } from '@/lib/pricing-report/motion-config'
import { usePriceVariant } from '@/lib/pricing-report/price-variant-provider'

const SHOW_AT_SCROLL_PX = 480

export function LandingStickyCta() {
  const { isHydrated, isActive } = useSubscription()
  const { price } = usePriceVariant()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SHOW_AT_SCROLL_PX)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const visible = isHydrated && !isActive && scrolled

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="sticky-cta"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.4, ease: CALM_EASE }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
          aria-label="Zamów raport"
        >
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] tracking-[0.12em] uppercase text-warm-gray">
                Raport cen konkurencji
              </p>
              <p className="text-sm font-medium text-charcoal truncate">
                {price} PLN / mies · Anulujesz kiedy chcesz
              </p>
            </div>
            <Link
              href="/pricing-report/checkout"
              className="inline-flex items-center justify-center bg-charcoal text-white px-5 py-2.5 rounded-full text-[12px] tracking-wide whitespace-nowrap hover:bg-charcoal/90 transition-colors"
            >
              Zamów raport
            </Link>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
