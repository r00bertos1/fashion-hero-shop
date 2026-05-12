<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the FashionHero shop. Here's what was done:

- **Client-side initialization** via `instrumentation-client.ts` (Next.js 16 best practice), with exception capture enabled and a reverse proxy through `/ingest` to avoid ad blockers.
- **Reverse proxy rewrites** added to `next.config.ts` routing `/ingest/*` to the EU PostHog ingestion endpoint.
- **Server-side client** created at `src/lib/posthog-server.ts` using `posthog-node` for future server-side event capture.
- **User identification** integrated into `src/components/auth-provider.tsx` — `posthog.identify()` is called on login and registration with email and name, and `posthog.reset()` is called on logout.
- **12 events** instrumented across 8 files covering the full e-commerce funnel from discovery to checkout, plus wishlist activity, search, and the pricing report subscription flow.

## Event table

| Event Name | Description | File |
|---|---|---|
| `user_logged_in` | User successfully logs in | `src/components/auth-provider.tsx` |
| `user_registered` | New user registers an account | `src/components/auth-provider.tsx` |
| `user_logged_out` | User logs out | `src/components/auth-provider.tsx` |
| `product_viewed` | User views a product detail page | `src/app/products/[slug]/recently-viewed-section.tsx` |
| `product_added_to_cart` | User adds a product to cart | `src/components/product-info.tsx` |
| `product_wishlisted` | User adds a product to their wishlist | `src/components/wishlist-provider.tsx` |
| `product_unwishlisted` | User removes a product from their wishlist | `src/components/wishlist-provider.tsx` |
| `search_performed` | User searches for a product (≥2 chars) | `src/components/search-modal.tsx` |
| `checkout_initiated` | User clicks Place Order on checkout page | `src/app/checkout/page.tsx` |
| `collection_viewed` | User views a product collection/category | `src/components/collection-view.tsx` |
| `pricing_report_subscription_started` | User initiates pricing report payment | `src/app/pricing-report/checkout/page.tsx` |
| `pricing_report_subscription_activated` | Pricing report subscription is activated | `src/app/pricing-report/success/page.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](https://eu.posthog.com/project/177883/dashboard/677469)
- [E-commerce Purchase Funnel](https://eu.posthog.com/project/177883/insights/mNOLDkrB) — product_viewed → added to cart → checkout initiated
- [Product Add to Cart Trend](https://eu.posthog.com/project/177883/insights/IsMR6Z4P) — daily cart adds vs checkout initiations
- [User Sign-ups & Logins](https://eu.posthog.com/project/177883/insights/DJFJkpLX) — registration vs login trends
- [Pricing Report Subscription Funnel](https://eu.posthog.com/project/177883/insights/Hwl7vVcP) — payment started → subscription activated
- [Wishlist vs Cart Engagement](https://eu.posthog.com/project/177883/insights/ZYM3VhOn) — wishlist intent vs cart commitment

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
