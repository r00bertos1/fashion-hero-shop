'use client'

import { useEffect, useState } from 'react'

interface Tab {
  id: string
  label: string
  badge?: string | number
}

interface Props {
  tabs: Tab[]
}

const SCROLL_THRESHOLD = 240

export function StickyTabsNav({ tabs }: Props) {
  const [active, setActive] = useState(tabs[0]?.id ?? '')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const sections = tabs
      .map(t => document.getElementById(t.id))
      .filter((el): el is HTMLElement => el !== null)

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    sections.forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [tabs])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleClick(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActive(id)
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <nav
        className={`sticky top-14 z-20 bg-white border-b border-black/10 -mx-4 px-4 transition-opacity duration-200 ${scrolled ? 'min-[1400px]:opacity-0 min-[1400px]:pointer-events-none' : ''}`}
      >
        <ul className="flex gap-6 overflow-x-auto whitespace-nowrap text-sm py-3">
          {tabs.map(t => {
            const isActive = active === t.id
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => handleClick(t.id)}
                  className={`relative inline-flex items-center gap-2 pb-2 border-b-2 transition-colors ${isActive ? 'border-charcoal text-charcoal' : 'border-transparent text-warm-gray hover:text-charcoal'}`}
                >
                  <span className={isActive ? 'font-medium' : ''}>{t.label}</span>
                  {t.badge !== undefined && (
                    <span className="text-[10px] bg-charcoal text-white rounded-full px-1.5 py-0.5">{t.badge}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <nav
        aria-label="Sekcje raportu"
        className={`hidden min-[1400px]:flex fixed top-32 z-30 flex-col bg-white border border-black/10 transition-all duration-300 ${scrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
        style={{ left: 'max(1rem, calc((100vw - 72rem) / 2 - 152px))', width: '128px' }}
      >
        <ul className="flex flex-col">
          {tabs.map(t => {
            const isActive = active === t.id
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => handleClick(t.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs text-left transition-colors ${isActive ? 'bg-charcoal text-white' : 'text-warm-gray hover:bg-stone-100 hover:text-charcoal'}`}
                >
                  <span className={isActive ? 'font-medium' : ''}>{t.label}</span>
                  {t.badge !== undefined && (
                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${isActive ? 'bg-white/20 text-white' : 'bg-charcoal text-white'}`}>
                      {t.badge}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Wróć na górę"
        className={`fixed bottom-6 right-6 z-30 w-11 h-11 flex items-center justify-center bg-charcoal text-white rounded-full shadow-lg hover:bg-charcoal/90 transition-all duration-300 ${scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  )
}
