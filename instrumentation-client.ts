import posthog from "posthog-js";

// Keep in sync with DEMO_SESSION_FLAG in src/lib/pricing-report/use-demo-entry.ts.
const DEMO_SESSION_FLAG = "pricing-report:demo-mode";

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
    } catch {
      // sessionStorage may be blocked (privacy mode, embedded contexts) — non-fatal.
    }
  },
});
