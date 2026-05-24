import posthog from "posthog-js";

// Keep in sync with DEMO_SESSION_FLAG in src/lib/pricing-report/use-demo-entry.ts.
const DEMO_SESSION_FLAG = "pricing-report:demo-mode";
// Keep in sync with VARIANT_COOKIE in src/lib/pricing-report/pricing.ts.
const VARIANT_COOKIE = "pr_variant";

function readPriceVariantCookie(): number | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${VARIANT_COOKIE}=(\\d+)`));
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
