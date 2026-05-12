# AI Website Clone Template

A reusable template for reverse-engineering any website and rebuilding it as a pixel-perfect clone using [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

Point it at a URL, run `/clone-website`, and Claude Code will inspect the site via Chrome MCP, extract design tokens and assets, write component specs, and dispatch parallel builder agents to reconstruct every section — all in isolated git worktrees that merge automatically.

## Quick Start

1. **Use this template** — click "Use this template" on GitHub (or clone it)
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Edit `TARGET.md`** — set the URL, scope, and fidelity level for the site you want to clone
4. **Run the skill** in Claude Code:
   ```
   /clone-website <url>
   ```
5. **Customize** (optional) — after the base clone is built, modify as needed

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with Chrome MCP enabled (required for site inspection)

## Tech Stack

- **Next.js 16** — App Router, React 19, TypeScript strict
- **shadcn/ui** — Radix primitives + Tailwind CSS v4
- **Tailwind CSS v4** — oklch design tokens
- **Lucide React** — default icons (replaced by extracted SVGs during cloning)

## How It Works

The `/clone-website` skill runs a multi-phase pipeline:

1. **Reconnaissance** — screenshots, design token extraction, interaction sweep (scroll, click, hover, responsive)
2. **Foundation** — updates fonts, colors, globals, downloads all assets
3. **Component Specs** — writes detailed spec files (`docs/research/components/`) with exact computed CSS values, states, behaviors, and content
4. **Parallel Build** — dispatches builder agents in git worktrees, one per section/component
5. **Assembly & QA** — merges worktrees, wires up the page, runs visual diff against the original

Each builder agent receives the full component specification inline — exact `getComputedStyle()` values, interaction models, multi-state content, responsive breakpoints, and asset paths. No guessing.

## Project Structure

```
src/
  app/              # Next.js routes
  components/       # React components
    ui/             # shadcn/ui primitives
    icons.tsx       # Extracted SVG icons
  lib/utils.ts      # cn() utility
  types/            # TypeScript interfaces
  hooks/            # Custom React hooks
public/
  images/           # Downloaded images from target
  videos/           # Downloaded videos from target
  seo/              # Favicons, OG images
docs/
  research/         # Extraction output & component specs
  design-references/ # Screenshots
scripts/            # Asset download scripts
TARGET.md           # Clone target configuration
AGENTS.md           # Agent instructions & code style
```

## Commands

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # ESLint check
```

## Configuration

Edit **`TARGET.md`** before cloning:

- **URL** — the site to reverse-engineer
- **Pages** — which pages to replicate
- **Fidelity** — pixel-perfect, high fidelity, or structural
- **Scope** — what's in/out of scope
- **Customization plans** — modifications to apply after the base clone

## Pricing Report (demo)

Demo fake-door dodany w ramach AI Product Heroes — w panelu klienta pojawia się banner promujący subskrypcję raportu cen konkurencji (49 PLN/mies). Pełny flow: banner → landing → fake checkout → widok raportu z 25 mock SKU, alertami, historią 4 tygodni, listą konkurentów i mock eksportem (PDF placeholder + realny CSV).

Landing został rozbudowany pod konwersję (calm motion, hover/idle animacje preview raportu, sekcja social proof, sticky CTA) z zachowaniem palety brandu FashionHero.

- **Live demo:** https://fashion-hero-shop-five.vercel.app
- **Origin discovery:** [fake door prototype](https://competitor-price-report-fd-v2.lovable.app)
- **Spec:** [`docs/superpowers/specs/2026-05-10-pricing-report-demo-design.md`](docs/superpowers/specs/2026-05-10-pricing-report-demo-design.md)

### Trasy
- `/demo` — pedagogiczny landing dla testerów / warsztatu (jeden CTA do panelu)
- `/account?demo=1` — bezpośrednie wejście do testu (pomija pedagogiczny intro)
- `/account` — panel sprzedawcy z bannerem (wymaga zalogowania)
- `/pricing-report` — landing publiczny
- `/pricing-report/checkout` — fake checkout
- `/pricing-report/success` — ekran sukcesu
- `/account/pricing-report` — widok raportu (wymaga „aktywnej subskrypcji" w localStorage)

### Demo entry (powtarzalna ścieżka testu)

Żeby tester wylądował od razu w panelu z widocznym bannerem (bez bramki logowania i bez odgrzewania stanu subskrypcji), użyj jednej z dwóch ścieżek:

- **`/demo`** — landing z krótkim wprowadzeniem i CTA prowadzącym do `/account?demo=1`. Lepsze do warsztatu.
- **`/account?demo=1`** — bezpośredni URL. Lepsze do udostępniania w testach.

Na `/account?demo=1` hook `useDemoEntry` (`src/lib/pricing-report/use-demo-entry.ts`):
1. seeduje mock usera `demo@fashionhero.pl` (przez istniejący `AuthProvider`)
2. resetuje stan subskrypcji (Mode 1: **każde wejście od nowa**)
3. zdejmuje `?demo=1` z URL przez `history.replaceState`
4. oznacza sesję tabu flagą `sessionStorage['pricing-report:demo-mode']` (do tagowania eventów w analityce)

W breadcrumbie panelu pojawia się dyskretna pigułka `Demo · konto testowe`, żeby tester widział, że jest w trybie demo. Reset jest świadomie powtarzalny — kolejne otwarcie URL-a daje czystą ścieżkę testu.

### Analytics (PostHog)

PostHog (EU Cloud) wpięty przez `instrumentation-client.ts` z reverse-proxy na `/ingest/*` w `next.config`. Klucze w `.env.local`:

```
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_…
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Mierzony event fake-door testu: **`pricing_report_banner_clicked`** (na klik bannera w `/account`, z properties `surface`, `plan`, `price`, `currency`). Eventy z sesji demo są tagowane property `demo_mode: true` — `posthog.register()` w `useDemoEntry` (po seedzie) i w `instrumentation-client.ts` (`loaded` callback czyta `sessionStorage`), żeby flaga przeżyła odświeżenie strony w tej samej karcie. Filtrowanie demo vs prod ruchu zrobisz w PostHog UI po property `demo_mode`.

### Status
Demo, bez backendu. Stan subskrypcji w `localStorage` (`pricing-report:subscription`). Mock dane statyczne w `src/lib/pricing-report/data.ts`. Eksport PDF to statyczny placeholder, CSV — realny.

### Lokalnie
```bash
npm install
npm run dev
```
Otwórz `http://localhost:3000/demo` → klik CTA → wylądujesz w panelu z widocznym bannerem.

## License

MIT
