'use client'

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'pricing-report:subscription'

export interface SubscriptionContextValue {
  isHydrated: boolean
  isActive: boolean
  activatedAt: string | null
  activate: () => void
  deactivate: () => void
}

export const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

interface PersistedState {
  activatedAt: string | null
}

function readStorage(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (typeof parsed.activatedAt === 'string' || parsed.activatedAt === null) return parsed
    return null
  } catch {
    return null
  }
}

function writeStorage(state: PersistedState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function clearStorage(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [activatedAt, setActivatedAt] = useState<string | null>(null)

  useEffect(() => {
    const stored = readStorage()
    if (stored) setActivatedAt(stored.activatedAt)
    setIsHydrated(true)
  }, [])

  const activate = useCallback(() => {
    const now = new Date().toISOString()
    setActivatedAt(now)
    writeStorage({ activatedAt: now })
  }, [])

  const deactivate = useCallback(() => {
    setActivatedAt(null)
    clearStorage()
  }, [])

  const value: SubscriptionContextValue = {
    isHydrated,
    isActive: activatedAt !== null,
    activatedAt,
    activate,
    deactivate,
  }

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}
