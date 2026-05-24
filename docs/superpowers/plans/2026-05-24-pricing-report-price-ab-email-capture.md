# Pricing Report — Price A/B + Email Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Pricing Report fake-door from a fixed 49 PLN to a 149 PLN default with a hidden 3-variant price A/B test (99/149/199), and add a required email-capture step on checkout that stores leads in Supabase — with `price` on every PostHog event and demo traffic excluded.

**Architecture:** A single price source-of-truth (`pricing.ts`) feeds a client `PriceVariantProvider` mounted in scoped `/account` and `/pricing-report` layouts. A `src/proxy.ts` (Next 16's renamed middleware) reads `?price=`, persists it to a neutral `pr_variant` cookie, and redirects to strip the param so the variant never shows in the URL. The price is registered as a PostHog super-property so all events carry it. Checkout gains a validated email field that POSTs the raw email to a Supabase-backed API route (PII stays out of PostHog; only a SHA-256 `email_hash` is sent).

**Tech Stack:** Next.js 16 (App Router, React 19, TS strict), `posthog-js` (client) / `posthog-node` (server), `@supabase/supabase-js`, Vitest (new, for unit tests), Tailwind v4. Provisioning via Supabase / Vercel / PostHog MCP tools.

**Spec:** `docs/superpowers/specs/2026-05-24-pricing-report-price-ab-email-capture-design.md`

---

## File Structure

**Create:**
- `src/lib/pricing-report/pricing.ts` — price constants + variant helpers (the only place prices live)
- `src/lib/pricing-report/pricing.test.ts` — unit tests for the helpers
- `src/lib/pricing-report/email.ts` — email normalize/validate/hash helpers
- `src/lib/pricing-report/email.test.ts` — unit tests for the helpers
- `src/lib/pricing-report/price-variant-provider.tsx` — client context + `usePriceVariant()`
- `src/proxy.ts` — strip `?price`, set cookie, redirect (Next 16 proxy, not middleware)
- `src/app/account/layout.tsx` — server layout seeding the provider from the cookie
- `src/app/pricing-report/layout.tsx` — server layout seeding the provider from the cookie
- `src/app/api/pricing-report/lead/route.ts` — Supabase insert endpoint
- `vitest.config.ts` — test runner config

**Modify:**
- `instrumentation-client.ts` — register `price` super-property from the cookie at load
- `src/app/pricing-report/checkout/page.tsx` — email field + lead POST + `pricing_report_email_captured` + price from hook
- `src/app/pricing-report/success/page.tsx` — price from hook on event
- `src/components/pricing-report/banner.tsx` — price from hook (display + `banner_clicked` event)
- `src/components/pricing-report/landing/hero.tsx` — price from hook (CTA copy)
- `src/components/pricing-report/landing/offer-card.tsx` — price from hook (price block)
- `src/components/pricing-report/landing/sticky-cta.tsx` — price from hook (sticky copy)
- `package.json` — `@supabase/supabase-js` dep + `test` script

**Provision (MCP, no code):** Supabase table `pricing_report_leads`; env vars `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (local + Vercel); PostHog multivariate flag `pricing-report-price`.

---

## Task 1: Set up Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

Run: `npm i -D vitest`
Expected: adds `vitest` to devDependencies, no errors.

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Add the test script**

In `package.json`, add to `"scripts"` (keep the existing entries):

```json
    "test": "vitest run"
```

- [ ] **Step 4: Verify the runner works (no tests yet)**

Run: `npm test`
Expected: Vitest runs and reports "No test files found" (exit 0 or the "no tests" message) — this confirms the runner is wired.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

---

## Task 2: Price source-of-truth (`pricing.ts`)

**Files:**
- Create: `src/lib/pricing-report/pricing.ts`
- Test: `src/lib/pricing-report/pricing.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/pricing-report/pricing.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PRICE,
  PRICE_VARIANTS,
  formatPriceLabel,
  isValidVariant,
  parseVariant,
  priceFromFlag,
} from './pricing'

describe('pricing helpers', () => {
  it('default price is 149 and is a valid variant', () => {
    expect(DEFAULT_PRICE).toBe(149)
    expect(PRICE_VARIANTS).toEqual([99, 149, 199])
    expect(isValidVariant(149)).toBe(true)
  })

  it('isValidVariant rejects non-variants', () => {
    expect(isValidVariant(49)).toBe(false)
    expect(isValidVariant('149')).toBe(false)
    expect(isValidVariant(null)).toBe(false)
  })

  it('parseVariant accepts valid query strings only', () => {
    expect(parseVariant('99')).toBe(99)
    expect(parseVariant('149')).toBe(149)
    expect(parseVariant('199')).toBe(199)
    expect(parseVariant('49')).toBeNull()
    expect(parseVariant('abc')).toBeNull()
    expect(parseVariant(null)).toBeNull()
    expect(parseVariant(undefined)).toBeNull()
  })

  it('priceFromFlag maps known variant keys', () => {
    expect(priceFromFlag('price-99')).toBe(99)
    expect(priceFromFlag('price-149')).toBe(149)
    expect(priceFromFlag('price-199')).toBe(199)
    expect(priceFromFlag('control')).toBeNull()
    expect(priceFromFlag(false)).toBeNull()
    expect(priceFromFlag(undefined)).toBeNull()
  })

  it('formatPriceLabel renders the PLN/mies label', () => {
    expect(formatPriceLabel(149)).toBe('149 PLN / mies')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- pricing`
Expected: FAIL — cannot resolve `./pricing` (module does not exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/pricing-report/pricing.ts`:

```ts
// src/lib/pricing-report/pricing.ts
// Single source of truth for the Pricing Report price + A/B variants.

export const PRICE_VARIANTS = [99, 149, 199] as const
export type PriceVariant = (typeof PRICE_VARIANTS)[number]

export const DEFAULT_PRICE: PriceVariant = 149
export const CURRENCY = 'PLN' as const
export const PLAN_KEY = 'pricing_report_monthly' as const

/** PostHog multivariate flag key. */
export const FLAG_KEY = 'pricing-report-price' as const
/** Neutral cookie name — value is the price number, never a "variant" label. */
export const VARIANT_COOKIE = 'pr_variant' as const
/** 90 days, in seconds. */
export const VARIANT_COOKIE_MAX_AGE = 60 * 60 * 24 * 90

/** Maps PostHog flag variant keys to prices. */
export const FLAG_VARIANTS: Record<string, PriceVariant> = {
  'price-99': 99,
  'price-149': 149,
  'price-199': 199,
}

export function isValidVariant(value: unknown): value is PriceVariant {
  return (
    typeof value === 'number' &&
    (PRICE_VARIANTS as readonly number[]).includes(value)
  )
}

export function parseVariant(raw: string | null | undefined): PriceVariant | null {
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return isValidVariant(n) ? n : null
}

export function priceFromFlag(
  variantKey: string | boolean | null | undefined,
): PriceVariant | null {
  if (typeof variantKey !== 'string') return null
  return FLAG_VARIANTS[variantKey] ?? null
}

export function formatPriceLabel(price: PriceVariant): string {
  return `${price} PLN / mies`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- pricing`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pricing-report/pricing.ts src/lib/pricing-report/pricing.test.ts
git commit -m "feat(pricing-report): price source-of-truth + variant helpers"
```

---

## Task 3: Email helpers (`email.ts`)

**Files:**
- Create: `src/lib/pricing-report/email.ts`
- Test: `src/lib/pricing-report/email.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/pricing-report/email.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { hashEmail, isValidEmail, normalizeEmail } from './email'

describe('email helpers', () => {
  it('normalizeEmail trims and lowercases', () => {
    expect(normalizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com')
  })

  it('isValidEmail accepts well-formed addresses', () => {
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('  Anna.Kowalska@sklep.pl ')).toBe(true)
  })

  it('isValidEmail rejects malformed addresses', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('no-at-sign')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('a @b.co')).toBe(false)
  })

  it('hashEmail is a deterministic 64-char hex digest, case/space-insensitive', async () => {
    const a = await hashEmail('Test@Example.com ')
    const b = await hashEmail('test@example.com')
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- email`
Expected: FAIL — cannot resolve `./email`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/pricing-report/email.ts`:

```ts
// src/lib/pricing-report/email.ts
// Email normalization, validation, and privacy-safe hashing (no raw PII to PostHog).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email))
}

/** SHA-256 of the normalized email, hex-encoded. Works in browser + Node 18+. */
export async function hashEmail(email: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeEmail(email))
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- email`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pricing-report/email.ts src/lib/pricing-report/email.test.ts
git commit -m "feat(pricing-report): email normalize/validate/hash helpers"
```

---

## Task 4: Lead API route (Supabase)

**Files:**
- Create: `src/app/api/pricing-report/lead/route.ts`
- Modify: `package.json` (dependency)

- [ ] **Step 1: Install the Supabase client**

Run: `npm i @supabase/supabase-js`
Expected: adds `@supabase/supabase-js` to dependencies.

- [ ] **Step 2: Write the route handler**

Create `src/app/api/pricing-report/lead/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashEmail, isValidEmail, normalizeEmail } from '@/lib/pricing-report/email'
import { isValidVariant } from '@/lib/pricing-report/pricing'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { email, price, currency, utmSource, utmCampaign, demoMode } = body

  if (typeof email !== 'string' || !isValidEmail(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }
  if (!isValidVariant(price)) {
    return NextResponse.json({ error: 'invalid_price' }, { status: 400 })
  }

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 500 })
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  })

  const { error } = await supabase.from('pricing_report_leads').insert({
    email: normalizeEmail(email),
    email_hash: await hashEmail(email),
    price_variant: price,
    currency: typeof currency === 'string' ? currency : 'PLN',
    utm_source: typeof utmSource === 'string' ? utmSource : null,
    utm_campaign: typeof utmCampaign === 'string' ? utmCampaign : null,
    demo_mode: demoMode === true,
  })

  if (error) {
    console.error('[pricing-report] lead insert failed:', error.message)
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Typecheck the route**

Run: `npx tsc --noEmit`
Expected: no type errors. (If `tsc` flags unrelated pre-existing issues, confirm none are in `route.ts`.)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/app/api/pricing-report/lead/route.ts
git commit -m "feat(pricing-report): Supabase-backed lead capture API route"
```

---

## Task 5: Price variant provider + hook

**Files:**
- Create: `src/lib/pricing-report/price-variant-provider.tsx`

- [ ] **Step 1: Write the provider**

Create `src/lib/pricing-report/price-variant-provider.tsx`:

```tsx
'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import posthog from 'posthog-js'
import {
  CURRENCY,
  DEFAULT_PRICE,
  FLAG_KEY,
  PLAN_KEY,
  VARIANT_COOKIE,
  VARIANT_COOKIE_MAX_AGE,
  priceFromFlag,
  type PriceVariant,
} from './pricing'

export interface PriceVariantValue {
  price: PriceVariant
  currency: typeof CURRENCY
  planKey: typeof PLAN_KEY
}

const PriceVariantContext = createContext<PriceVariantValue | null>(null)

function persistVariant(price: PriceVariant) {
  document.cookie = `${VARIANT_COOKIE}=${price}; path=/; max-age=${VARIANT_COOKIE_MAX_AGE}; samesite=lax`
}

/**
 * `initialVariant` comes from the server-read `pr_variant` cookie (see the
 * account / pricing-report layouts). When it is non-null the visitor already has
 * a pinned variant (outreach link or a prior visit) — we trust it and skip the
 * flag. When null (organic), we default to 149 and resolve the PostHog flag.
 */
export function PriceVariantProvider({
  initialVariant,
  children,
}: {
  initialVariant: PriceVariant | null
  children: React.ReactNode
}) {
  const [price, setPrice] = useState<PriceVariant>(initialVariant ?? DEFAULT_PRICE)
  const hasCookie = useRef(initialVariant != null)

  useEffect(() => {
    // Keep `price` on every event (incl. pageviews) as a super-property.
    posthog.register({ price })
  }, [price])

  useEffect(() => {
    if (hasCookie.current) return
    function resolveFromFlag() {
      const fromFlag = priceFromFlag(posthog.getFeatureFlag(FLAG_KEY))
      if (fromFlag != null) {
        setPrice(fromFlag)
        persistVariant(fromFlag)
      }
    }
    return posthog.onFeatureFlags(resolveFromFlag)
  }, [])

  return (
    <PriceVariantContext.Provider value={{ price, currency: CURRENCY, planKey: PLAN_KEY }}>
      {children}
    </PriceVariantContext.Provider>
  )
}

export function usePriceVariant(): PriceVariantValue {
  const ctx = useContext(PriceVariantContext)
  if (!ctx) {
    throw new Error('usePriceVariant must be used within <PriceVariantProvider>')
  }
  return ctx
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new type errors in `price-variant-provider.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pricing-report/price-variant-provider.tsx
git commit -m "feat(pricing-report): price variant provider + usePriceVariant hook"
```

---

## Task 6: Proxy — strip `?price`, set cookie, redirect

**Files:**
- Create: `src/proxy.ts`

> **Next 16 note:** the old `middleware` file convention is renamed to `proxy`. The file must be `src/proxy.ts` (same level as `src/app`) and export a function named `proxy`. Verified in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.

- [ ] **Step 1: Write the proxy**

Create `src/proxy.ts`:

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { VARIANT_COOKIE, VARIANT_COOKIE_MAX_AGE, parseVariant } from '@/lib/pricing-report/pricing'

export const config = {
  matcher: ['/account/:path*', '/pricing-report/:path*', '/demo'],
}

export function proxy(request: NextRequest) {
  const variant = parseVariant(request.nextUrl.searchParams.get('price'))
  if (variant == null) {
    // No valid ?price — let the request through untouched.
    return NextResponse.next()
  }

  // Strip ONLY the price param (keep e.g. ?demo=1) so the variant never shows in the URL.
  const url = request.nextUrl.clone()
  url.searchParams.delete('price')

  const response = NextResponse.redirect(url) // 307 temporary redirect
  response.cookies.set(VARIANT_COOKIE, String(variant), {
    path: '/',
    maxAge: VARIANT_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
  return response
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 3: Manually verify the redirect strips the param and sets the cookie**

Run: `npm run dev` (in a background shell), then:
Run: `curl -sI "http://localhost:3000/account?price=99&demo=1"`
Expected: `HTTP/1.1 307`, a `location:` header pointing to `/account?demo=1` (no `price`), and a `set-cookie: pr_variant=99; Path=/; ...` header.
Then stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/proxy.ts
git commit -m "feat(pricing-report): proxy strips ?price into a hidden cookie"
```

---

## Task 7: Scoped layouts seed the provider from the cookie

**Files:**
- Create: `src/app/pricing-report/layout.tsx`
- Create: `src/app/account/layout.tsx`

> **Next 16 note:** `cookies()` from `next/headers` is async and opts the subtree into dynamic rendering. We confine it to `/account` and `/pricing-report` (already personalized) so the shop stays static. Verified in `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`.

- [ ] **Step 1: Create the pricing-report layout**

Create `src/app/pricing-report/layout.tsx`:

```tsx
import { cookies } from 'next/headers'
import { PriceVariantProvider } from '@/lib/pricing-report/price-variant-provider'
import { VARIANT_COOKIE, parseVariant } from '@/lib/pricing-report/pricing'

export default async function PricingReportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const store = await cookies()
  const initialVariant = parseVariant(store.get(VARIANT_COOKIE)?.value)
  return <PriceVariantProvider initialVariant={initialVariant}>{children}</PriceVariantProvider>
}
```

- [ ] **Step 2: Create the account layout**

Create `src/app/account/layout.tsx`:

```tsx
import { cookies } from 'next/headers'
import { PriceVariantProvider } from '@/lib/pricing-report/price-variant-provider'
import { VARIANT_COOKIE, parseVariant } from '@/lib/pricing-report/pricing'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const store = await cookies()
  const initialVariant = parseVariant(store.get(VARIANT_COOKIE)?.value)
  return <PriceVariantProvider initialVariant={initialVariant}>{children}</PriceVariantProvider>
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/pricing-report/layout.tsx src/app/account/layout.tsx
git commit -m "feat(pricing-report): seed price provider from cookie in scoped layouts"
```

---

## Task 8: Register `price` super-property early (cookie at load)

**Files:**
- Modify: `instrumentation-client.ts`

This guarantees even the first `/account` `$pageview` carries `price` for the outreach cohort
(whose variant is already in the cookie before the page loads).

- [ ] **Step 1: Read the current file**

The current `instrumentation-client.ts` registers `demo_mode` from sessionStorage in the
`loaded` callback. We add a cookie read for the price variant alongside it.

- [ ] **Step 2: Edit the `loaded` callback**

Replace the `loaded` callback body so it reads both flags. The full file becomes:

```ts
import posthog from "posthog-js";

// Keep in sync with DEMO_SESSION_FLAG in src/lib/pricing-report/use-demo-entry.ts.
const DEMO_SESSION_FLAG = "pricing-report:demo-mode";
// Keep in sync with VARIANT_COOKIE in src/lib/pricing-report/pricing.ts.
const VARIANT_COOKIE = "pr_variant";

function readPriceVariantCookie(): number | null {
  const match = document.cookie.match(/(?:^|;\s*)pr_variant=(\d+)/);
  if (!match) return null;
  const n = Number(match[1]);
  return n === 99 || n === 149 || n === 199 ? n : null;
}

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://eu.posthog.com",
  defaults: "2026-01-30",
  debug: process.env.NODE_ENV === "development",
  loaded: () => {
    try {
      if (window.sessionStorage.getItem(DEMO_SESSION_FLAG) === "1") {
        posthog.register({ demo_mode: true });
      }
      const price = readPriceVariantCookie();
      if (price != null) {
        posthog.register({ price });
      }
    } catch {
      // sessionStorage / cookies may be blocked (privacy mode, embedded contexts) — non-fatal.
    }
  },
});
```

(Note `VARIANT_COOKIE` is declared for documentation/sync; the regex uses the literal name to keep
the early-load bundle dependency-free, mirroring the existing `DEMO_SESSION_FLAG` pattern.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add instrumentation-client.ts
git commit -m "feat(pricing-report): register price super-property from cookie at load"
```

---

## Task 9: Wire price into landing, banner, and success (display + events)

**Files:**
- Modify: `src/components/pricing-report/banner.tsx`
- Modify: `src/components/pricing-report/landing/hero.tsx`
- Modify: `src/components/pricing-report/landing/offer-card.tsx`
- Modify: `src/components/pricing-report/landing/sticky-cta.tsx`
- Modify: `src/app/pricing-report/success/page.tsx`

- [ ] **Step 1: Update the banner (display + event)**

In `src/components/pricing-report/banner.tsx`:

Add the import:

```tsx
import { usePriceVariant } from '@/lib/pricing-report/price-variant-provider'
```

Inside `PricingReportBanner`, read the price (after the existing `useSubscription()` line):

```tsx
  const { price, currency, planKey } = usePriceVariant()
```

Replace `handleBannerClick` so the event carries the resolved price:

```tsx
  function handleBannerClick() {
    posthog.capture('pricing_report_banner_clicked', {
      surface: 'account_panel',
      plan: planKey,
      price,
      currency,
    })
  }
```

Replace the heading text:

```tsx
        <p className="text-charcoal font-medium mb-1">
          Raport cen konkurencji — {price} PLN/mies
        </p>
```

- [ ] **Step 2: Update the hero CTA copy**

In `src/components/pricing-report/landing/hero.tsx`:

Add the import:

```tsx
import { usePriceVariant } from '@/lib/pricing-report/price-variant-provider'
```

Inside `LandingHero`, after the `useReducedMotion()` line:

```tsx
  const { price } = usePriceVariant()
```

Replace the CTA link text:

```tsx
            Zamów raport – {price} PLN/mies
```

- [ ] **Step 3: Update the offer-card price block**

In `src/components/pricing-report/landing/offer-card.tsx`:

Add the import:

```tsx
import { usePriceVariant } from '@/lib/pricing-report/price-variant-provider'
```

Inside `LandingOfferCard`, add at the top of the function body:

```tsx
  const { price } = usePriceVariant()
```

Replace the price line:

```tsx
            <p className="text-5xl font-light text-charcoal mb-1">
              {price} <span className="text-lg text-warm-gray">PLN / mies</span>
            </p>
```

- [ ] **Step 4: Update the sticky CTA copy**

In `src/components/pricing-report/landing/sticky-cta.tsx`:

Add the import:

```tsx
import { usePriceVariant } from '@/lib/pricing-report/price-variant-provider'
```

Inside `LandingStickyCta`, after the `useSubscription()` line:

```tsx
  const { price } = usePriceVariant()
```

Replace the price copy line:

```tsx
                {price} PLN / mies · Anulujesz kiedy chcesz
```

- [ ] **Step 5: Update the success event with price**

In `src/app/pricing-report/success/page.tsx`:

Add the imports:

```tsx
import { usePriceVariant } from '@/lib/pricing-report/price-variant-provider'
```

Inside `SuccessPage`, read the price and include it in the event:

```tsx
export default function SuccessPage() {
  const { price, currency, planKey } = usePriceVariant()

  useEffect(() => {
    posthog.capture('pricing_report_subscription_activated', {
      plan: planKey,
      price,
      currency,
    })
  }, [price, currency, planKey])
```

(Leave the rest of the component unchanged.)

- [ ] **Step 6: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/pricing-report/banner.tsx src/components/pricing-report/landing/hero.tsx src/components/pricing-report/landing/offer-card.tsx src/components/pricing-report/landing/sticky-cta.tsx src/app/pricing-report/success/page.tsx
git commit -m "feat(pricing-report): drive displayed price + events from the variant"
```

---

## Task 10: Checkout — email capture + price

**Files:**
- Modify: `src/app/pricing-report/checkout/page.tsx`

- [ ] **Step 1: Replace the checkout page**

Rewrite `src/app/pricing-report/checkout/page.tsx` to add the required email field, the lead POST,
and the `pricing_report_email_captured` event. Full file:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import posthog from 'posthog-js'
import { useSubscription } from '@/lib/pricing-report/use-subscription'
import { usePriceVariant } from '@/lib/pricing-report/price-variant-provider'
import { hashEmail, isValidEmail } from '@/lib/pricing-report/email'
import { isDemoModeSession } from '@/lib/pricing-report/use-demo-entry'

const features = [
  'Codzienny monitoring 100 Twoich produktów',
  '5 największych konkurentów w kategorii Fashion',
  'Cotygodniowy raport w systemie + eksport (PDF/Excel)',
  'Alerty o obniżkach konkurencji powyżej 5%',
] as const

export default function CheckoutPage() {
  const router = useRouter()
  const { activate } = useSubscription()
  const { price, currency, planKey } = usePriceVariant()
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const emailValid = isValidEmail(email)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!emailValid || isLoading) return
    setIsLoading(true)

    const demoMode = isDemoModeSession()
    const utmSource = posthog.get_property('$initial_utm_source') ?? null
    const utmCampaign = posthog.get_property('$initial_utm_campaign') ?? null

    // Raw email goes only to Supabase (skip for demo to avoid junk leads).
    if (!demoMode) {
      try {
        const res = await fetch('/api/pricing-report/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, price, currency, utmSource, utmCampaign, demoMode }),
        })
        if (!res.ok) {
          console.warn('[pricing-report] lead capture returned', res.status)
        }
      } catch (err) {
        console.warn('[pricing-report] lead capture failed', err)
      }
    }

    // PII-safe: only a hash + the variant reach PostHog.
    const emailHash = await hashEmail(email)
    posthog.capture('pricing_report_email_captured', {
      price,
      surface: 'pricing_report_checkout',
      currency,
      email_hash: emailHash,
    })
    posthog.capture('pricing_report_subscription_started', {
      plan: planKey,
      price,
      currency,
    })

    activate()
    router.push('/pricing-report/success')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <nav className="text-[11px] text-warm-gray mb-8 tracking-wide">
        <Link href="/pricing-report" className="hover:text-charcoal transition-colors">Pricing Report</Link>
        <span className="mx-1.5">/</span>
        <span className="text-charcoal">Płatność</span>
      </nav>
      <h1 className="text-3xl font-light text-charcoal mb-2">Subskrypcja Pricing Report</h1>
      <p className="text-charcoal/70 mb-10">
        Aktywujesz cotygodniowy raport cen konkurencji w panelu sprzedawcy.
      </p>
      <form onSubmit={handleSubmit} className="border border-black/10 p-8 mb-6">
        <div className="flex items-baseline justify-between border-b border-black/10 pb-6 mb-6">
          <div>
            <p className="text-sm text-warm-gray">Plan</p>
            <p className="text-lg text-charcoal">Pricing Report — miesięczny</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-warm-gray">Cena</p>
            <p className="text-2xl font-light text-charcoal">{price} PLN / mies</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-charcoal/80 mb-6">
          {features.map(f => (
            <li key={f} className="flex gap-2">
              <span className="text-charcoal">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mb-6">
          <label htmlFor="lead-email" className="block text-sm text-charcoal mb-2">
            Adres e-mail (na niego wyślemy raport)
          </label>
          <input
            id="lead-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="ty@twojsklep.pl"
            className="w-full border border-black/15 rounded-lg px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal"
            aria-invalid={touched && !emailValid}
          />
          {touched && !emailValid ? (
            <p className="text-xs text-red-600 mt-1.5">Podaj poprawny adres e-mail.</p>
          ) : null}
        </div>

        <p className="text-[11px] text-warm-gray bg-stone-100 px-3 py-2 mb-6 rounded">
          To jest demo — nie zostaniesz obciążony i nie zbieramy danych karty.
        </p>
        <button
          type="submit"
          disabled={!emailValid || isLoading}
          className="w-full bg-charcoal text-white py-4 rounded-full text-sm tracking-wide hover:bg-charcoal/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Wysyłam…' : `Zamów raport — ${price} PLN/mies`}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/pricing-report/checkout/page.tsx
git commit -m "feat(pricing-report): required email capture on checkout"
```

---

## Task 11: Provision Supabase table (MCP)

**No code.** Use the Supabase MCP tools (authenticate first if needed).

- [ ] **Step 1: Authenticate to Supabase MCP** (if not already authenticated).

- [ ] **Step 2: Apply the migration** (via the Supabase MCP apply-migration / SQL tool), name `pricing_report_leads`:

```sql
create table if not exists public.pricing_report_leads (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  email_hash    text,
  price_variant integer not null,
  currency      text not null default 'PLN',
  utm_source    text,
  utm_campaign  text,
  demo_mode     boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.pricing_report_leads enable row level security;
-- No anon/auth policies: inserts happen only via the service-role key in the
-- server route (which bypasses RLS), keeping the table closed to clients.
```

- [ ] **Step 3: Capture the project URL + service-role key** from the Supabase MCP (project settings / API keys) for the next task. Treat the service-role key as a secret — never echo it into the repo.

---

## Task 12: Set env vars (local + Vercel MCP)

**No application code.**

- [ ] **Step 1: Add to `.env.local`** (gitignored) for local dev:

```
SUPABASE_URL=<project url from Task 11>
SUPABASE_SERVICE_ROLE_KEY=<service role key from Task 11>
```

- [ ] **Step 2: Set the same two vars on Vercel** via the Vercel MCP (or `vercel env add`) for the
Production, Preview, and Development environments. These are server-only — do **not** prefix with
`NEXT_PUBLIC_`.

- [ ] **Step 3: Verify they are not committed**

Run: `git status --porcelain .env.local`
Expected: no output (the file is gitignored).

---

## Task 13: Create the PostHog feature flag (MCP)

**No code.** Use the PostHog MCP (authenticate first if needed).

- [ ] **Step 1: Authenticate to PostHog MCP** (if not already authenticated).

- [ ] **Step 2: Create a multivariate flag** with key `pricing-report-price`:
  - Variants (roughly even rollout): `price-99` (~33%), `price-149` (~34%), `price-199` (~33%).
  - Enabled for all users (100% of traffic receives some variant).
  - Description: "Pricing Report monthly price A/B (99/149/199 PLN). Maps to FLAG_VARIANTS in src/lib/pricing-report/pricing.ts."

- [ ] **Step 3: Confirm** the flag is active and returns one of the three variant keys.

---

## Task 14: Full verification

**No code** — confirm the whole flow end-to-end.

- [ ] **Step 1: Unit tests + lint + build**

Run: `npm test && npm run lint && npm run build`
Expected: tests PASS, lint clean, build succeeds (note: build needs the Supabase env vars present locally from Task 12, or the route compiles regardless since vars are read at runtime — build should pass without them).

- [ ] **Step 2: Manual funnel check** (dev server `npm run dev`, browser):

  - Visit `/account?price=99&demo=0` → URL becomes `/account` (no `price`); banner shows **99 PLN/mies**.
  - Visit `/pricing-report?price=199` → URL becomes `/pricing-report`; hero/offer-card/sticky show **199 PLN/mies**.
  - With no `?price` and the flag live → price shows 99/149/199 per the assigned flag variant; refresh keeps it stable (cookie cached).
  - Checkout: submit is disabled until a valid email; invalid email shows the error; on submit it routes to `/success`.
  - In PostHog Activity: `pricing_report_banner_clicked`, `pricing_report_email_captured`,
    `pricing_report_subscription_started`, `pricing_report_subscription_activated`, and
    `$pageview` all carry a `price` property; `pricing_report_email_captured` has `email_hash` and
    **no raw email**.
  - Demo path: enter via `/demo` (or `/account?demo=1`), complete checkout → event carries
    `demo_mode: true`; confirm **no row** was inserted in `pricing_report_leads`.
  - Non-demo checkout → a row appears in Supabase `pricing_report_leads` with the correct
    `price_variant`, `email`, `email_hash`, and UTM values.

- [ ] **Step 2b:** Stop the dev server.

- [ ] **Step 3: Final commit** (only if any verification fixes were needed; otherwise nothing to commit).

---

## Out of scope (do not implement)

- Real payment / Stripe — still a fake door.
- Custom subdomain — dropped (not needed for the course).
