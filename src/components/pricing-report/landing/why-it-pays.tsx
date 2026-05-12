'use client'

import { motion } from 'motion/react'
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/pricing-report/motion-config'

const cards = [
  {
    title: 'Oszczędność czasu',
    body: 'Zamiast poświęcać 4 godziny tygodniowo na ręczne sprawdzanie cen u konkurencji – otrzymujesz gotowe dane i rekomendacje w 5 sekund po otwarciu maila.',
    stat: '~16h / mies → 5s',
  },
  {
    title: 'Większy zysk',
    body: 'Nie trać marży tam, gdzie konkurencja jest droższa od Ciebie. Nie trać sprzedaży tam, gdzie jest tańsza. Każda rekomendacja to konkretna kwota w PLN.',
    stat: '+8–14% marży',
  },
  {
    title: 'Spokój ducha',
    body: 'Alerty 24/7 — wiesz natychmiast, gdy konkurent obniży cenę o więcej niż 5%. Reagujesz zanim klient zauważy różnicę.',
    stat: '< 2 min reakcji',
  },
] as const

export function LandingWhyItPays() {
  return (
    <section className="bg-stone-50 px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light text-charcoal mb-3">
          Dlaczego to się opłaca?
        </h2>
        <p className="text-charcoal/70 mb-12">
          Trzy realne problemy każdego sprzedawcy w Fashion – jedno rozwiązanie.
        </p>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid md:grid-cols-3 gap-6"
        >
          {cards.map((card) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              className="group flex flex-col bg-white border border-black/10 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-charcoal/20 hover:shadow-md"
            >
              <h3 className="text-xl font-medium text-charcoal mb-3">{card.title}</h3>
              <p className="text-charcoal/80 mb-6 flex-1">{card.body}</p>
              <p className="text-sm text-warm-gray font-mono tracking-tight">{card.stat}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
