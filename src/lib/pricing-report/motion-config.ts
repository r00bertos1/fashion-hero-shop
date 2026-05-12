import type { Transition, Variants } from 'motion/react'

export const CALM_EASE = [0.2, 0.8, 0.2, 1] as const

export const calmTransition: Transition = {
  duration: 0.6,
  ease: CALM_EASE,
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: calmTransition },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
}

export const viewportOnce = { once: true, amount: 0.3 }
