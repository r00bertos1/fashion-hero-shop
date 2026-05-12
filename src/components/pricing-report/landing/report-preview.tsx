'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import { ArrowDown, ArrowUp, LineChart, TrendingUp } from 'lucide-react'
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { cn } from '@/lib/utils'
import { currentReport } from '@/lib/pricing-report/data'
import { formatDelta, formatPln, formatRecommendation } from '@/lib/pricing-report/format'
import { CALM_EASE } from '@/lib/pricing-report/motion-config'

const BAR_PX_PER_PERCENT = 3
const CHART_MAX_HEIGHT = 96

function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const reduceMotion = useReducedMotion()
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (latest) => Math.round(latest))

  useEffect(() => {
    if (!inView) return
    if (reduceMotion) {
      motionValue.set(value)
      return
    }
    const controls = animate(motionValue, value, { duration: 0.8, ease: CALM_EASE })
    return () => controls.stop()
  }, [inView, value, reduceMotion, motionValue])

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  )
}

export function LandingReportPreview() {
  const previewSkus = currentReport.skus.slice(0, 4)
  const { weekNumber, year, totals, marginByDay } = currentReport

  return (
    <section className="px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <p className="text-[11px] tracking-[0.12em] uppercase text-warm-gray mb-3">Podgląd</p>
        <h2 className="text-3xl md:text-4xl font-light text-charcoal mb-10">
          Zobacz, jak wygląda Twój raport
        </h2>

        <div className="relative">
          {/* Tilted shadow card behind the panel — idle drift (md+) */}
          <div
            aria-hidden
            className="pr-tilt-drift absolute inset-0 -z-10 mx-auto hidden max-w-5xl rounded-lg border border-black/10 bg-stone-50 shadow-md md:block"
          />

          {/* Main mockup */}
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-lg border border-black/10 bg-white shadow-xl">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-black/10 bg-stone-100/70 px-5 py-3">
              <div className="flex items-center gap-2 text-[11px] tracking-[0.08em] uppercase text-warm-gray">
                <LineChart className="h-4 w-4" />
                Pricing Report · Panel sprzedawcy
              </div>
              <div className="hidden items-center gap-3 text-[11px] text-warm-gray md:flex">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] tracking-wide text-emerald-700">
                  <span className="pr-livedot inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Tydzień {weekNumber} · {year}
                </span>
                <span>{previewSkus.length} z 100 produktów</span>
              </div>
            </div>

            <div className="grid gap-6 p-5 md:grid-cols-5 md:p-8">
              {/* Table column */}
              <div className="md:col-span-3">
                <p className="text-[11px] tracking-[0.08em] uppercase text-warm-gray mb-3">
                  Porównanie cen (próbka)
                </p>
                <div className="overflow-hidden rounded-md border border-black/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-100/70 text-[10px] tracking-[0.08em] uppercase text-warm-gray">
                      <tr>
                        <th className="px-3 py-2 font-medium">Produkt</th>
                        <th className="px-3 py-2 text-right font-medium">Twoja</th>
                        <th className="px-3 py-2 text-right font-medium">Konkur.</th>
                        <th className="px-3 py-2 text-right font-medium">Δ%</th>
                        <th className="px-3 py-2 font-medium">Rekomendacja</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {previewSkus.map((sku) => {
                        const showArrow = Math.abs(sku.diffPercent) > 1
                        const isOver = sku.diffPercent > 1
                        const isUnder = sku.diffPercent < -1
                        return (
                          <tr
                            key={sku.id}
                            className="bg-white transition-colors duration-300 hover:bg-stone-50"
                          >
                            <td className="px-3 py-3 text-xs font-medium text-charcoal">{sku.name}</td>
                            <td className="px-3 py-3 text-right font-mono text-xs text-charcoal">
                              {formatPln(sku.yourPricePln)}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-xs text-warm-gray">
                              {formatPln(sku.competitorAvgPln)}
                            </td>
                            <td
                              className={cn(
                                'px-3 py-3 text-right font-mono text-xs',
                                isOver && 'text-rose-600',
                                isUnder && 'text-emerald-600',
                                !showArrow && 'text-warm-gray',
                              )}
                            >
                              <span className="inline-flex items-center gap-1">
                                {isOver ? <ArrowUp className="h-3 w-3" /> : null}
                                {isUnder ? <ArrowDown className="h-3 w-3" /> : null}
                                {formatDelta(sku.diffPercent)}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium transition-opacity duration-300',
                                  sku.recommendation.kind === 'lower' && 'bg-rose-500/10 text-rose-700',
                                  sku.recommendation.kind === 'raise' && 'bg-emerald-500/10 text-emerald-700',
                                  sku.recommendation.kind === 'hold' && 'bg-stone-100 text-warm-gray',
                                )}
                              >
                                {formatRecommendation(sku.recommendation)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[11px] text-warm-gray">
                  W pełnym raporcie: 100 produktów × 5 konkurentów + dodatkowe wnioski jakościowe.
                </p>
              </div>

              {/* Chart + KPIs column */}
              <div className="space-y-4 md:col-span-2">
                <div className="rounded-md border border-black/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] tracking-[0.08em] uppercase text-warm-gray">
                      Potencjalny wzrost marży
                    </p>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div
                    className="mt-3 flex items-end gap-2"
                    style={{ height: `${CHART_MAX_HEIGHT + 16}px` }}
                  >
                    {marginByDay.map((point, i) => {
                      const baseHeight = point.current * BAR_PX_PER_PERCENT
                      const gainHeight = (point.optimized - point.current) * BAR_PX_PER_PERCENT
                      return (
                        <div
                          key={point.day}
                          className="group relative flex flex-1 flex-col items-center gap-1"
                        >
                          {/* Tooltip */}
                          <div
                            role="tooltip"
                            className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-black/10 bg-white px-2 py-1 text-[10px] text-charcoal opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100"
                          >
                            {point.day} · {point.current}% → {point.optimized}%
                          </div>
                          <div className="flex w-full flex-col-reverse overflow-hidden rounded-sm">
                            <div
                              className="pr-bar w-full bg-charcoal/80"
                              style={
                                {
                                  height: `${baseHeight}px`,
                                  '--pr-bar-delay': `${i * 60}ms`,
                                } as CSSProperties
                              }
                            />
                            <div
                              className="pr-bar w-full bg-emerald-500"
                              style={
                                {
                                  height: `${gainHeight}px`,
                                  '--pr-bar-delay': `${i * 60 + 200}ms`,
                                } as CSSProperties
                              }
                            />
                          </div>
                          <span className="text-[10px] text-warm-gray">{point.day}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-warm-gray">
                        <span className="h-2 w-2 rounded-sm bg-charcoal/80" /> Obecna
                      </span>
                      <span className="inline-flex items-center gap-1 text-warm-gray">
                        <span className="h-2 w-2 rounded-sm bg-emerald-500" /> Optymalizacja
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-emerald-700">
                      +<CountUp value={totals.marginUpliftPercent} />%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-black/10 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-[11px] text-warm-gray">Produkty do korekty</p>
                    <p className="mt-1 text-2xl font-light text-charcoal">
                      <CountUp value={totals.skusToAdjust} />
                    </p>
                    <p className="text-[11px] text-warm-gray">z 100</p>
                  </div>
                  <div className="rounded-md border border-emerald-200/70 bg-emerald-50/50 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-[11px] font-medium text-emerald-700">Alerty w tyg.</p>
                    <p className="mt-1 text-2xl font-light text-charcoal">
                      <CountUp value={totals.weeklyAlerts} />
                    </p>
                    <p className="text-[11px] text-warm-gray">obniżek &gt; 5%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
