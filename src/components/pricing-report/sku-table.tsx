'use client'

import { useMemo, useState } from 'react'
import type { Sku, SkuCategory } from '@/lib/pricing-report/types'
import { formatDelta, formatPln, formatRecommendation } from '@/lib/pricing-report/format'

interface Props {
  skus: Sku[]
}

type SortKey = 'name' | 'yourPricePln' | 'competitorAvgPln' | 'diffPercent'
type SortDir = 'asc' | 'desc'
type CategoryFilter = SkuCategory | 'all'

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: 'all',     label: 'Wszystkie' },
  { value: 'odziez',  label: 'Odzież' },
  { value: 'obuwie',  label: 'Obuwie' },
  { value: 'dodatki', label: 'Dodatki' },
]

export function SkuTable({ skus }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('diffPercent')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filter, setFilter] = useState<CategoryFilter>('all')

  const visible = useMemo(() => {
    const filtered = filter === 'all' ? skus : skus.filter(s => s.category === filter)
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc' ? String(av).localeCompare(String(bv), 'pl') : String(bv).localeCompare(String(av), 'pl')
    })
    return sorted
  }, [skus, sortKey, sortDir, filter])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  function sortIndicator(key: SortKey): string {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  return (
    <div className="border border-black/10">
      <div className="px-4 py-3 border-b border-black/10 flex flex-wrap gap-3 items-center justify-between">
        <p className="text-sm text-charcoal font-medium">Tabela porównań · {visible.length} produktów</p>
        <div className="flex gap-1 text-xs">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setFilter(c.value)}
              className={`px-3 py-1.5 rounded-full transition-colors ${filter === c.value ? 'bg-charcoal text-white' : 'text-charcoal/60 hover:bg-stone-100'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-warm-gray bg-stone-50">
              <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('name')}>Produkt{sortIndicator('name')}</th>
              <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('yourPricePln')}>Twoja{sortIndicator('yourPricePln')}</th>
              <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('competitorAvgPln')}>Konkurencja{sortIndicator('competitorAvgPln')}</th>
              <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort('diffPercent')}>Δ%{sortIndicator('diffPercent')}</th>
              <th className="px-4 py-3 font-medium">Rekomendacja</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(sku => (
              <tr key={sku.id} className="border-t border-black/5 hover:bg-stone-50/60">
                <td className="px-4 py-3 text-charcoal">{sku.name}</td>
                <td className="px-4 py-3 text-charcoal">{formatPln(sku.yourPricePln)}</td>
                <td className="px-4 py-3 text-charcoal">{formatPln(sku.competitorAvgPln)}</td>
                <td className={`px-4 py-3 ${sku.diffPercent > 0 ? 'text-red-600' : sku.diffPercent < 0 ? 'text-emerald-700' : 'text-charcoal'}`}>
                  {formatDelta(sku.diffPercent)}
                </td>
                <td className="px-4 py-3 text-charcoal">{formatRecommendation(sku.recommendation)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="md:hidden divide-y divide-black/5">
        {visible.map(sku => (
          <li key={sku.id} className="px-4 py-4">
            <p className="text-sm text-charcoal mb-2">{sku.name}</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-warm-gray mb-2">
              <div><span className="block">Twoja</span><span className="text-charcoal text-sm">{formatPln(sku.yourPricePln)}</span></div>
              <div><span className="block">Konkurencja</span><span className="text-charcoal text-sm">{formatPln(sku.competitorAvgPln)}</span></div>
              <div><span className="block">Δ%</span><span className={`text-sm ${sku.diffPercent > 0 ? 'text-red-600' : sku.diffPercent < 0 ? 'text-emerald-700' : 'text-charcoal'}`}>{formatDelta(sku.diffPercent)}</span></div>
            </div>
            <p className="text-sm text-charcoal">{formatRecommendation(sku.recommendation)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
