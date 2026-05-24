# Pricing Report — Price A/B + Email Capture (Design)

**Date:** 2026-05-24
**Status:** Approved (design); pending implementation
**Context:** Fake-door test in the FashionHero seller panel. Goal: validate sellers'
willingness to pay for a "Competitor Pricing Report". No real payment (no Stripe) at this stage.

## Goals

1. Raise the headline price from **49 → 149 PLN/mo** and run a **3-variant price A/B test (99 / 149 / 199)**.
2. Add a **required email field on checkout** as the new **primary conversion metric**
   (`pricing_report_email_captured`), storing the raw email as a lead in **Supabase**.
3. Ensure the resolved price flows as a `price` property onto **every** funnel event.
4. Keep demo traffic (`demo_mode: true`) excluded from the metric.

**Out of scope:** real Stripe payment, custom subdomain (dropped — not needed for the course).

## Decisions (locked)

- **Lead storage:** Supabase table `pricing_report_leads`, written from a server API route.
- **Price source-of-truth precedence:** `?price` URL param → PostHog flag → default 149.
- **Variant must be invisible to the user:** the `?price` param is stripped from the URL via a
  middleware redirect before the page renders; only the price number is ever shown — never a
  "variant" label.
- **Keep the simulated subscription activation** after email capture so the user can still preview
  the report panel.
- **Official `@supabase/supabase-js` client** (teaching template; standard path).
- **Provisioning done by the agent** via Supabase + Vercel MCP (table + env vars), not a manual
  checklist. Exception: the PostHog multivariate flag is created manually in the PostHog UI.

## A. Price: single source of truth

### `src/lib/pricing-report/pricing.ts` (new — the only place prices live)

```
PRICE_VARIANTS = [99, 149, 199] as const
DEFAULT_PRICE  = 149
CURRENCY       = 'PLN'
PLAN_KEY       = 'pricing_report_monthly'
FLAG_KEY       = 'pricing-report-price'
VARIANT_COOKIE = 'pr_variant'   // neutral name; value is the price number

// PostHog multivariate flag variant keys → price
FLAG_VARIANTS = { 'price-99': 99, 'price-149': 149, 'price-199': 199 }

isValidVariant(n): n is PriceVariant      // 99 | 149 | 199
parseVariant(raw: string | null): PriceVariant | null
priceFromFlag(variantKey: string | null): PriceVariant | null
formatPriceLabel(price): `${price} PLN / mies`   // reuse existing pl-PL conventions
```

### Resolution order (made invisible to the user)

1. **`middleware.ts`** matches `/pricing-report/:path*`, `/account/:path*`, `/demo`. If a valid
   `?price=99|149|199` is present:
   - sets cookie `pr_variant` (value = the price; `Path=/`, `Max-Age` ~90 days, `SameSite=Lax`,
     not `HttpOnly` because the client must read it to render the price),
   - issues a **temporary redirect (307)** to the same path with **only** the `price` param removed
   (any other params, e.g. `?demo=1`, are preserved so `useDemoEntry` still works).
   The param therefore never lingers in the address bar.
   - Must verify the Next.js 16 middleware + cookie API against `node_modules/next/dist/docs/`
     before writing (AGENTS.md rule).
2. **`PriceVariantProvider` (client context) + `usePriceVariant()` hook** (new under
   `src/lib/pricing-report/`). The provider is mounted in the **root `layout.tsx`** (covers both
   `/account` and `/pricing-report`) and **seeded server-side** with the `pr_variant` cookie value
   read via `next/headers cookies()`. So the outreach cohort renders the correct price on first
   paint — **no flash**. (If the root layout turns out to be a client component, read the cookie in
   a thin server wrapper and pass `initialVariant` down — verify during implementation.)

The cookie is the **persistence** layer, not a precedence tier above the flag: a fresh `?price`
always overwrites it (step 1), an existing cookie is reused across funnel pages, and an organic
flag result is written into it once for stability. Effective runtime order:
fresh URL param → persisted cookie → flag → default 149.
3. If no cookie (organic visitor): start at `DEFAULT_PRICE` (149), then resolve the **PostHog
   multivariate flag** client-side via `posthog.onFeatureFlags` / `getFeatureFlag(FLAG_KEY)`, map
   the variant key → price, and **cache the result to the `pr_variant` cookie** for stability.
   Organic visitors are not the primary measured cohort, so a one-paint price settle here is
   acceptable.

`usePriceVariant()` returns `{ price: PriceVariant, currency: 'PLN', planKey, label }`.

### Replace hardcoded `49`

All six display sites and three event payloads switch to the resolved price:
- Display: `landing/hero.tsx`, `landing/offer-card.tsx`, `landing/sticky-cta.tsx`,
  `pricing-report/banner.tsx`, `pricing-report/checkout/page.tsx`, `pricing-report/success/page.tsx`.
- Events: `pricing_report_banner_clicked`, `pricing_report_subscription_started`,
  `pricing_report_subscription_activated` — `price: 49` → `price: <resolved variant>`.

The `success` page is reached after a client navigation, so it can read `usePriceVariant()` from
the provider (cookie already set). No price is passed through the URL.

## B. Email capture on checkout (new primary metric)

`src/app/pricing-report/checkout/page.tsx`:

- Add a **required email input** with format validation (HTML5 `type=email` + a simple regex
  guard). Submit button disabled until the email is valid.
- Button copy: `Zamów raport — {price} PLN/mies` (drop "Zapłać"; no payment).
- On submit, in order:
  1. `POST /api/pricing-report/lead` with `{ email, price, currency, utmSource, utmCampaign, demoMode }`.
     - **Raw email goes only to Supabase**, never to PostHog.
     - In a **demo session** the client **skips the lead POST** (no junk leads).
  2. Compute `email_hash` = SHA-256 of the normalized email (`trim().toLowerCase()`) via Web Crypto
     (`crypto.subtle.digest`), then fire:
     `posthog.capture('pricing_report_email_captured', { price, surface: 'pricing_report_checkout', currency: 'PLN', email_hash })`.
     `email_hash` enables dedup without exposing PII. Demo sessions still fire the event — it carries
     the `demo_mode: true` superproperty and is excluded from the metric.
  3. Keep the existing simulated activation (`activate()`) + `router.push('/pricing-report/success')`.
- **Error handling:** the lead POST is best-effort. If it fails, log + show a quiet toast but still
  fire the PostHog event and proceed to success (the event is the metric).

`utmSource`/`utmCampaign` are read client-side from PostHog person props
(`posthog.get_property('$initial_utm_source')` / `'$initial_utm_campaign'`) and forwarded to the
lead row for cohort fallback.

## C. Supabase lead store

### Table `pricing_report_leads`

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
-- RLS enabled; no anon/auth policies. Writes happen only via the service-role key
-- in the server route, which bypasses RLS. This keeps the table closed to clients.
alter table public.pricing_report_leads enable row level security;
```

### API route `src/app/api/pricing-report/lead/route.ts`

- `POST` handler (Node runtime). Validates email format server-side; returns `400` on invalid,
  `500` on insert failure, `200` on success.
- Uses `@supabase/supabase-js` `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` — both
  **server-only** env vars (NOT `NEXT_PUBLIC_*`). The service-role key must never reach the client.
- Inserts the lead. Also computes/stores `email_hash` server-side for consistency.

### Env vars (provisioned by the agent via Vercel MCP + written to `.env.local`)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

## D. UTM tracking

PostHog autocapture already records `$initial_utm_*` — **no capture code needed**. We additionally
forward `utm_source`/`utm_campaign` into the lead row (section B) for cohort fallback when UTM is
lost on a return visit. The funnel filter is configured in the **PostHog UI** (no code):

> Funnel: `$pageview /account` (UTM) → `pricing_report_banner_clicked` → `$pageview /pricing-report`
> → `$pageview /pricing-report/checkout` → `pricing_report_email_captured` →
> `$pageview /pricing-report/success`, filtered by `utm_source = outreach` **AND** `demo_mode != true`.
> **Primary metric** = unique `pricing_report_email_captured` ÷ unique on `/account`.

## E. Manual step (cannot be automated — no PostHog MCP)

Create a PostHog **multivariate** feature flag `pricing-report-price` with three variants:
`price-99`, `price-149`, `price-199` (even rollout). Until it exists, organic visitors default to
149; outreach links via `?price=` are unaffected.

## Testing

- **Unit (pricing.ts):** `parseVariant`, `isValidVariant`, `priceFromFlag`, and resolution
  precedence (URL param > cookie > flag > default).
- **Unit:** email validation + `email_hash` normalization.
- **Manual / funnel:** `?price=99` redirects to a clean URL and renders 99 end-to-end
  (landing → banner → checkout → success); `price` appears on all four events; a demo session
  skips the lead insert yet still excludes itself from the metric; lead row lands in Supabase with
  the correct variant + UTM.

## File-change summary

| File | Change |
|------|--------|
| `src/lib/pricing-report/pricing.ts` | **new** — constants, variant helpers, flag map |
| `src/lib/pricing-report/price-variant-provider.tsx` | **new** — context + `usePriceVariant()` |
| `middleware.ts` | **new** — strip `?price`, set cookie, redirect |
| `src/app/layout.tsx` | seed + mount `PriceVariantProvider` from cookie |
| `src/app/api/pricing-report/lead/route.ts` | **new** — Supabase insert |
| `src/app/pricing-report/checkout/page.tsx` | email field + new event + price from hook |
| `src/app/pricing-report/success/page.tsx` | price from hook on event |
| `landing/hero.tsx`, `landing/offer-card.tsx`, `landing/sticky-cta.tsx`, `pricing-report/banner.tsx` | price from hook (display + banner event) |
| `package.json` | add `@supabase/supabase-js` |
| Supabase | `pricing_report_leads` table (via MCP) |
| Vercel/`.env.local` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (via MCP) |
