'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useSubscription } from './use-subscription'

const DEMO_EMAIL = 'demo@fashionhero.pl'
const DEMO_PASSWORD = 'demo'
const DEMO_QUERY_PARAM = 'demo'
const DEMO_SESSION_FLAG = 'pricing-report:demo-mode'

export interface DemoEntryState {
  /** True once URL has been checked and any seeding has finished. */
  ready: boolean
  /** True if the current tab session was started via ?demo=1. */
  isDemoSession: boolean
}

/**
 * Reads `?demo=1` from the URL on mount. When present:
 *   - seeds a demo user via useAuth().login
 *   - resets the pricing-report subscription
 *   - strips the query param from the URL
 *   - flags the tab session for later PostHog tagging
 * The session flag persists across refreshes within the same tab.
 */
export function useDemoEntry(): DemoEntryState {
  const [ready, setReady] = useState(false)
  const [isDemoSession, setIsDemoSession] = useState(false)
  const { login } = useAuth()
  const { deactivate } = useSubscription()

  useEffect(() => {
    let cancelled = false

    async function setup() {
      const params = new URLSearchParams(window.location.search)
      const isFreshDemoEntry = params.has(DEMO_QUERY_PARAM)

      if (isFreshDemoEntry) {
        await login(DEMO_EMAIL, DEMO_PASSWORD)
        deactivate()
        const url = new URL(window.location.href)
        url.searchParams.delete(DEMO_QUERY_PARAM)
        window.history.replaceState({}, '', url.toString())
        window.sessionStorage.setItem(DEMO_SESSION_FLAG, '1')
      }

      if (cancelled) return
      const sessionIsDemo = window.sessionStorage.getItem(DEMO_SESSION_FLAG) === '1'
      setIsDemoSession(sessionIsDemo)
      setReady(true)
    }

    setup()
    return () => {
      cancelled = true
    }
  }, [login, deactivate])

  return { ready, isDemoSession }
}

/**
 * SSR-safe read of the demo flag. Wire this into PostHog so demo traffic
 * carries a `demo_mode: true` property and can be filtered out of real funnels.
 */
export function isDemoModeSession(): boolean {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(DEMO_SESSION_FLAG) === '1'
}
