'use client'

import { useContext } from 'react'
import { SubscriptionContext, type SubscriptionContextValue } from './subscription-provider'

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) {
    throw new Error('useSubscription must be used within <SubscriptionProvider>')
  }
  return ctx
}
