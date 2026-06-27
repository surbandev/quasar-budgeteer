# Budgeteer Roadmap

A working plan to evolve Budgeteer into a focused, mobile-first budgeting product:
**glanceable on iPhone/Android, powerful on the web.**

> Status legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[?]` needs a decision

---

## Product thesis

Budgeteer should not try to beat Mint at bank aggregation or YNAB at envelope
budgeting. It should own **financial foresight**:

> "See your financial future, try alternatives, and know what's coming —
> on your phone in 10 seconds, on the web when you're making big decisions."

Our existing moat is **scenario-based forward planning** (recurring events, loan
amortization, cloneable/combinable scenarios, projected calendar). Everything in
this roadmap should sharpen forward planning and the mobile/web split.

### Decisions locked in
- **Planning-only — NOT a transaction tracker.** Budgeteer projects what *should*
  happen from your planned income/bills/scenarios. It does **not** track paid status,
  record "actual" amounts, reconcile against reality, import bank transactions, or
  sync with banks. (This removes the old Phase 4 "planned vs actual", Phase 9 bank
  sync, and any mark-as-paid ideas.)
- **iOS is a real target now** — add the Capacitor iOS project and ship to TestFlight.
- Full roadmap, sequenced below by phase.

---

## Current state (baseline)

What exists today (for shared context as we build):

- **Frontend:** Quasar 2 + Vue 3 `<script setup>`, Pinia (setup-style stores in
  `src/stores/`), Vue Router, Chart.js via `vue-chartjs`, Luxon + date-fns.
- **Pages:** Overview, Spending, Calendar (deprecated view → redirects to Overview),
  Transaction, Entries, Tools, Weave, Feedback, Settings (User/Profile/Admin),
  Scenario create/delete, Login/Register.
- **Navigation:** `MainLayout.vue` bottom tabs = Overview / Budget / Tools / Sign Out.
  Same bottom nav is reused on desktop (≥1024px).
- **Backend:** Node/Express, DAL + logic split, MySQL-ish (collation scripts),
  projection engine in `backend/logic/analysis.js` (`calculateOccurrences`,
  frequency expansion), loans logic, scenario clone/combine.
- **Mobile shell:** Capacitor **Android only** (`src-capacitor/`, `@capacitor/android`,
  `@capacitor/app`). No iOS project. No push, biometrics, or widgets yet.
- **Monetization:** Register page offers Basic ($4.99) and Premium ($9.99) but tiers
  are mostly *described*, not *enforced*.
- **Tests:** Vitest (unit + store), Playwright (e2e), backend Vitest config.

### Known rough edges to fix along the way
- `Budget` bottom tab routes to `/spending`, not the calendar — label/route mismatch.
- `PageCalendar` calendar view is a dead-end stub ("Calendar moved to Overview").
- **Sign Out** occupies a primary bottom-nav slot.
- Desktop uses the phone bottom nav instead of a web-appropriate layout.
- README is still Quasar boilerplate; no product/contributor docs.

---

## Phase 0 — Foundations & cleanup (fast, unblock everything)

Low-risk groundwork that later phases depend on.

- [x] Fix `Budget` tab → renamed to **Spending** to match its `/spending` destination.
- [x] Resolve deprecated `PageCalendar` view → `beforeEnter` guard redirects bare
      `/budget` and `?view=calendar` to `/overview`; live `transaction`/`scenarios` views kept.
- [x] Move **Sign Out** out of the primary bottom nav → now a bubble on the Tools page.
- [x] Replace boilerplate README intro with a short product description + roadmap link.
- [x] Fixed broken delete fallbacks (`/calendar?view=calendar` 404 and dead-stub links → `/overview`).
- [x] e2e credentials moved to env vars (`E2E_PASSWORD`/`E2E_USERNAME`); added
      `test:e2e` / `test:e2e:ui` scripts; split VS Code launch into **Run Vitest** / **Run E2E**.
- [ ] Audit responsive breakpoints used across pages (`@media` 600 / 768 / 1024).
- [ ] Add a shared `useFormatting` util check (currency/date) to avoid per-page drift.
- [ ] Confirm CI runs `npm run lint`, `test:run`, `test:api` cleanly before feature work.

**Decision (0-A): DONE** — Renamed the tab to **Spending** (matches where it went)
and redirected the dead calendar stub to Overview. Scenario management became the
**Plan** tab destination in Phase 1.

> Note: the `scenarios` view inside `PageCalendar` (`/budget?view=scenarios`) was
> dormant/unlinked; it is now the **Plan** tab landing. The transaction view is the
> FAB target. The legacy `?view=calendar` branch is dead and can be deleted later.

---

## Phase 1 — Navigation & mobile UX quick wins

Make the daily mobile experience match the mental model of money.

- [x] Redesign mobile bottom nav to 4 intent-based tabs:
      **Home** (Overview) · **Spending** · **Plan** (`/budget?view=scenarios`) · **More** (Tools).
- [x] Add a center **FAB** for "Add transaction" (→ `/budget?view=transaction`).
- [x] Actions on upcoming transactions: **tap-to-edit** — items on Overview now
      navigate to the transaction editor. *(Mark-paid dropped: planning-only app.)*
- [x] Add a **"Safe to spend"** number (horizon = **end of current month**, per 1-B).
      = remaining income this month − remaining bills this month. Shown in the Overview snapshot.
- [x] Tighten Overview density on small screens → date pickers wrapped in a collapsible
      **"Custom date range"** (collapsed by default; quick-range presets stay in the header).

**Decision (1-A): DONE** — Went with **4 tabs + center FAB** (more thumb-friendly).
Implemented via a 5th empty "fab-spacer" tab slot in the middle so the floating FAB
has dedicated space and doesn't overlap real tabs.

**Decision (1-B): DONE** — "Safe to spend" uses an **end-of-current-month** horizon.

---

## Phase 2 — iOS / native parity (Capacitor)

Make "mobile-first for iPhone" literally true.

> ⚠️ **Platform constraint:** iOS native builds require **macOS + Xcode**. On the
> current Windows dev machine we can scaffold the iOS project, config, and scripts,
> but building/running/TestFlight steps need a Mac (or a macOS CI runner).

- [x] Add `@capacitor/ios` dependency + idempotent `scripts/ios.sh` that generates the
      `src-capacitor/ios` project (and runs `pod install`) on first run on a Mac.
- [x] Add `npm run build:cap:ios` / `dev:cap:ios` / `ios:run` / `ios:build` + README docs +
      VS Code launch configs ("Run on iOS", "Build iOS + open Xcode").
- [ ] Verify the app boots in the iOS simulator and on a device. *(Must be run on the Mac —
      cannot be validated from the Windows dev machine.)*
- [ ] **Biometric unlock** (Face ID / Touch ID) after first login (re-auth gate).
- [ ] **Push / local notifications** — reminders that a *planned* bill is coming up
      (e.g. "Rent is due in 3 days"). Purely informational; no paid tracking.
- [ ] **Home-screen widget(s):** "bills due this week" / "projected balance on payday".
- [ ] Use `@capacitor/app` lifecycle hooks for session refresh + background sync.
- [ ] Stand up TestFlight pipeline (build, upload, internal testers).

**Open question (2-A):** Push notifications via **Capacitor Local Notifications**
(no server, scheduled on device) or **server-driven push** (APNs/FCM)? Local is
simpler and offline-friendly; server push enables remote/marketing messages.

**Open question (2-B):** Do we need an Apple Developer account + bundle id set up
now, or is `com.surbanwebdev.budgeteer` (current Android appId) the intended iOS id too?

---

## Phase 3 — Web vs mobile experience split

Earn the "detailed web version" promise instead of one responsive app everywhere.

- [ ] On web (≥1024px), replace bottom nav with a **left sidebar**.
- [ ] **Split-pane Overview**: calendar + transaction detail/editor side by side.
- [ ] **Scenario compare table**: Default vs "New apartment" vs "Side gig" with deltas
      (income / expenses / end-of-month balance).
- [ ] **Bulk edit** transactions/events (multi-select, edit, delete).
- [ ] Keyboard shortcuts for power users (add, navigate months, save).
- [ ] Printable / exportable **reports** (month summary, scenario summary).

| Mobile (quick & reassuring) | Web (deep & powerful) |
| --- | --- |
| Today's balance, next 7 days of bills | Multi-month scenario comparison |
| Quick-add planned transaction | Bulk edit, keyboard shortcuts |
| Swipe through months | Split-pane calendar + editor |
| Widgets & notifications | Printable reports, plan export (CSV/PDF) |

**Open question (3-A):** Build the web layout as a **separate layout component**
(`WebLayout.vue` vs `MainLayout.vue`) or a single layout that swaps chrome by
breakpoint? Separate is cleaner but duplicates some wiring.

---

## Phase 4 — ~~Planned vs actual (trust)~~ REMOVED — planning-only app

**Cut.** Budgeteer is a planning/forecasting tool, not a transaction tracker.
There is no "actual amount", paid status, reconciliation, CSV import of real
transactions, or bank sync. The old plan to compare projections against reality
does not fit the product.

Items already satisfied or relocated:
- **Running projected balance line** already exists as the white "Cash Flow" line on
  the Overview chart (`cumulativeCashFlow` in `SpentThisMonthChart.vue`).
- **Plan export** (CSV/PDF of your *projection*, not bank data) lives in Phase 3.

Candidate *planning-native* replacements (decide if/when wanted — none assume actuals):
- [ ] **Category targets**: set a planned monthly limit per category; flag when your
      *planned* spending in a category exceeds the target. (Plan vs intent, not reality.)
- [ ] **Forecast insights**: projected end-of-month / end-of-year balance, lowest
      projected balance and the date it occurs ("tightest day").
- [ ] **Reschedule a planned item** from the upcoming list (move a planned bill's date).

---

## Phase 5 — Scenarios as the moat

Double down on what competitors don't do well.

- [x] **Scenario compare** (`/compare`): per-scenario Income / Expenses / Savings / Net for
      a selectable month, with deltas vs the Base plan. Pure summarizer in
      `src/js/scenarioSummary.js` (unit tested) reusing the existing per-scenario event fetch
      (`summarizeScenarioForRange`). Entry points: Plan view button + Overview scenario menu.
- [ ] Promote **scenario combine** ("layers") to a first-class mobile UI (toggle chips:
      Base + Car payment + New subscription) — backend already supports combining.
- [ ] **"Apply scenario"** flow: promote a what-if to the live plan in one step.
- [ ] **Goal overlays**: e.g. "save $500/mo for emergency fund" as a scenario constraint.

**Open question (5-A):** Goals — model as a special **scenario/event type**, or a
separate **goals** entity with its own store and progress tracking?

---

## Phase 6 — Engagement: tie Weave to the core loop

Weave (bills-as-Flappy-Bird) is memorable but currently isolated in Tools.

- [ ] Weave surfaces this month's **planned bills** as pipes (a fun way to review the plan).
- [ ] Streak rewards for **checking Overview weekly** / reviewing the upcoming plan.

**Decision (6-A): DONE** — Weave stays a read-only "review the plan" nudge that can
deep-link into editing a planned item. No paid tracking (planning-only app).

---

## Phase 7 — Monetization & onboarding

Make the tiers real and reduce empty-app abandonment.

- [ ] Enforce tier limits:
      - Basic: 1 profile, limited active scenarios, shorter history.
      - Premium: unlimited profiles/scenarios, 1-year view (`isOneYearView` exists),
        advanced analytics, export, priority support.
- [ ] Gate Premium-only features visibly (e.g. scenario compare, export) with upsell.
- [ ] **5-minute setup wizard** on first login:
      1) add paycheck → 2) add rent/mortgage → 3) see first projection →
      4) optional "what if I cut subscriptions?" scenario.
- [ ] Billing integration check (how are subscriptions actually collected today?).

**Open question (7-A):** What is the **payment/billing** mechanism — App Store /
Play Store in-app purchase (required for native subscriptions per store rules),
Stripe on web, or both? This affects how tiers are enforced and where upgrade happens.

---

## Phase 8 — Trust, security & polish

- [x] **Theming system**: `data-theme` on `<html>` + CSS variable tokens in `app.scss`
      (`--page-bg`, `--title-gradient`, glass/accent/header/nav tokens, runtime
      `--q-primary`). Theme store (`src/stores/theme.js`) persists choice to
      localStorage; boot file applies it pre-render. Picker lives under
      **User Settings → Appearance**. Ships **Midnight** (default) + **Holographic**.
- [ ] More themes (the token system makes adding one ~= a new `[data-theme]` block).
- [x] **Home performance**: data for the Home chart is now preloaded at sign-in and
      cached for the session (`src/stores/overview.js`), so the Overview renders
      instantly on first navigation and on every return (no refetch). Cache is
      invalidated on transaction add/edit/delete and cleared on logout. Shared
      daily aggregation lives in `src/js/dailyTotals.js` (unit tested). Chart
      entrance animation restored (single 0.7s draw) now that data is ready first.
- [x] **Session enforcement**: stale/expired sessions now bounce to `/login` from
      anywhere. Centralized teardown in `src/js/session.js` (JWT `exp` check +
      auth/cache clear + router-mode-safe redirect). Wired into the router guard
      (checks expiry on every navigation, no network call), both axios 401
      interceptors (fixes broken `window.location.replace` redirect under hash/
      mobile mode), and boot validation. Never land on a cached Home with a dead
      session.
- [ ] **2FA** for web sessions.
- [ ] User-facing **data export** + **delete account** (backend already has DB backup scripts).
- [ ] Reduce UI duplication (floating math-equation background everywhere → keep for brand
      pages, simplify Settings/Feedback for speed).
- [ ] Accessibility pass (contrast on dark glass UI, focus states, screen-reader labels).
- [ ] Performance: verify bundle size with vite-bundle-analyzer; lazy-load heavy pages
      (Weave, charts) where not already.

---

## Phase 9 — ~~Bank sync~~ REMOVED — planning-only app

**Cut.** Bank aggregation only makes sense for tracking actual spending, which
Budgeteer does not do. Explicitly out of scope.

---

## Suggested sequencing (at a glance)

1. ~~**Phase 0**~~ — cleanup/unblock ✅ done
2. ~~**Phase 1**~~ — nav redesign + FAB + tap-to-edit ✅ done
   (note: "safe to spend" was later removed — it implies a known bank balance,
   which a planning-only app does not track)
3. **Phase 2** — iOS + TestFlight (scaffolding done; device verify needs the Mac)
4. **Phase 5** — scenarios moat (the planning differentiator)
5. **Phase 3** — web layout fork (sidebar, scenario compare, plan export)
6. **Phase 7** — premium gating + onboarding
7. **Phase 6** — Weave review loop
8. **Phase 8** — trust/polish (continuous)

> ~~Phase 4 (planned vs actual)~~ and ~~Phase 9 (bank sync)~~ are removed — Budgeteer
> is planning-only. Phase 5 (scenarios) is now the primary feature focus since it's
> the core planning differentiator.

---

## Open questions log (consolidated)

Answer these as we go; each blocks part of its phase.

- ~~**0-A** Budget tab → calendar projection or scenario management?~~ **DONE:** renamed to Spending; scenarios became the Plan tab.
- ~~**1-A** Bottom nav: 4 tabs + FAB, or 5 tabs with center "Add"?~~ **DONE:** 4 tabs + center FAB.
- ~~**1-B** "Safe to spend" horizon: next income event, or end of month?~~ **DONE:** end of current month.
- **2-A** Notifications: Capacitor local, or server-driven push (APNs/FCM)?
- **2-B** iOS bundle id / Apple Developer account ready?
- **3-A** Web layout: separate `WebLayout.vue`, or breakpoint-swapped chrome?
- ~~**4-A** Actuals storage~~ — N/A, Phase 4 removed (planning-only).
- ~~**4-B** CSV import of bank data~~ — N/A, Phase 4 removed. (Plan *export* lives in Phase 3.)
- **5-A** Goals: scenario/event type, or separate goals entity?
- ~~**6-A** Weave write-back~~ **DONE:** read-only review nudge, no paid tracking.
- **7-A** Billing: App/Play IAP, Stripe web, or both?
- ~~**9-A** Bank sync~~ — N/A, removed (planning-only).
