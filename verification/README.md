# Browser verification

## Phase 5 paper-review revisions — October 4, 2026

`node verification/phase5-revisions.cjs` passes **32 checks** covering stock-short subscription payments, checkout/retry holds, competing reservations, rolling subscription material planning, deferment, stock recovery, stable audit IDs, separate courier/order statuses, low-stock events, the production-copy approval form, and preparation dates. Approved cake details fit 1440/390/320 px. No uncaught browser exceptions.

Regression results: Phase 5 browser **63**, Phase 2 browser **95**, subscription browser **71**, Phase 4 state **28**, and subscription state **13** checks passed. Application JavaScript passes syntax checks. The Phase 2 inspector fixture uses an unbooked payment date and expects the new canonical Ready status.

See [revision details and remaining limits](../docs/phase-5-paper-revisions.md) and [approved cake screenshot](staff-approved-cake.png). Run browser suites sequentially on Chrome port 9222.

## Phase 5 — October 4, 2026

Run `node verification/phase5-browser.cjs` with Chrome's debugging endpoint on port 9222. Browser suites share one page and must run sequentially.

- **63 passing checks**, no uncaught exceptions: access gates, staff routes, safe operational projections, ingredient reservations and consumption, repeat/stale updates, shortage rollback, stock corrections, notifications, password changes, customer round trips, and responsive widths from 320 to 1440 px.
- Passing regressions: Phase 2 browser (95), subscription browser (71), browser edges (15), Phase 4 state (28), subscription state (13), address/map browser (16), and delivery-route checks.
- All application JavaScript passes `node --check`.
- The older storefront smoke and Phase 4 browser suites stop at selectors removed by existing customer UI edits: `#product-search-input` and `[data-p4=cake-addon]`. Full passes are not claimed for those two suites.

The staff suite writes [the dashboard screenshot](staff-dashboard-desktop.png). See [Phase 5 implementation notes](../docs/phase-5-implementation.md) for credentials, routes, component boundaries, and outstanding production work.

## Phase 4 — October 1, 2026

Custom Cakes and Customer Account were checked in local headless Chrome. Payments, owner review, notification delivery, and credential changes use the prototype state; reference-image checks read local files. Maps responses were stubbed in the existing map suites.

| Suite | Coverage / result |
| --- | --- |
| `node verification/phase4-state.cjs` | 28 checks: estimates, required references, immutable snapshots, quote versions, weekly/day capacity and cutoff boundaries, ingredient holds, payment idempotency, retries and late-payment resolution, expiry, decline/revision rules, profile/email/password changes, cancelled async credential work, address defaults/archive, event grouping, and customer isolation. |
| `node verification/phase4-browser.cjs` | 144 checks: complete request-to-quotation-to-payment journey, three actual local reference images, submission failure/retry, historical offers and decline notes, account menu, profile/email/password changes, old-password rejection, address reuse/archive, notification categories, customer switching, deep-link prerequisites, keyboard focus, Escape, loading/error recovery, responsive widths, and unique DOM IDs. No uncaught exceptions. |
| Existing regression suites | Storefront/auth smoke (35), auth/browser edges (15), standard checkout/orders (95), subscriptions in browser (71), subscription state (13), address/map editor (16), and delivery-route boundary/race/error checks passed. |

All application JavaScript passes `node --check`. Phase 4 screens fit 1440, 768, 390, and 320 pixel viewports. Desktop cake options, desktop quotation, and mobile profile screenshots were visually reviewed with inspectors closed:

- [Cake options](cake-options-desktop.png)
- [Cake quotation](cake-quotation-desktop.png)
- [Mobile account profile](account-profile-mobile.png)

The state suite needs Node only. Browser suites use the same Chrome debugging endpoint on port 9222 described below and should run sequentially because they share a page target. They navigate to the workspace's `index.html` and update screenshot artifacts.

See [Phase 4 implementation notes](../docs/phase-4-implementation.md) for walkthrough steps and fixture policies. These tests do not establish real authentication, payments, uploads, message delivery, or transactional backend enforcement.

## Phases 1–3 revisions — September 30, 2026

The revised prototype was checked using local headless Chrome. Google APIs were stubbed for repeatable address and distance checks; no real payment or courier transaction was submitted.

| Suite | Coverage / result |
| --- | --- |
| `node verification/subscription-state.cjs` | 13 checks: exact prices, four delivery fees, cutoff boundary, product-specific lead times, independent capacity pools, four-week holds, expiry/retry, repeat-safe activation, payment resolution, address/price snapshots, deferment collision/rollback, and completion. |
| `node verification/subscription-browser.cjs` | 71 checks: account gating and return, configuration, shared address editing, route limits, payment expiry/retry/activation, linked orders, direct prepaid payment guard, list/details, one deferment, re-enrollment, price acceptance, pending cancellation, sample records, category filtering, and shared-map DOM cleanup. |
| `node verification/browser-smoke.cjs` | 35 existing storefront, authentication, review, and responsive checks. |
| `node verification/browser-edge.cjs` | 15 authentication, focus, history, OTP, unique-ID, and local-image checks. Images are explicitly decoded so offscreen lazy loading does not produce false failures. |
| `node verification/phase2-browser.cjs` | 95 standard checkout/order checks; expected totals updated for the shared ₱100 courier fixture and ten-unit limit. Completed reviews are keyed by order item. |
| `node verification/delivery-route.cjs` | Route distance boundaries, missing/failed routes, changed address/origin, stale responses, and pickup bypass. |
| `node verification/address-map-browser.cjs` | 16 address checks including map lookup races, default address, optional fields, editing/cancellation, and distance validation. |

Subscription screens were checked at 1440, 768, 390, and 320 pixels. The desktop listing and mobile subscription details were saved to `subscriptions-desktop.png` and `subscription-details-mobile.png` and visually reviewed. Browser suites reported no uncaught exceptions. Application JavaScript also passes `node --check`.

The prototype reserves capacity across all four paid deliveries. Inventory availability uses fixtures; a production ingredient ledger and server-side transactional enforcement remain outside this change. Reload or Reset preview clears in-memory records.

Completed with local headless Chrome on 2026-09-22.

- 35 flow and layout checks: catalog search/pagination, error state, product identity, variant pricing, sold-out behavior, protected sign-in and return, review success/error, registration validation, OTP attempts/resend/success, forgot/reset success and invalid/expired states.
- 15 edge checks: section anchors, review return route, Escape, inert background, focus trap, browser history, OTP paste and real timer expiry, every authentication mock option, unique DOM IDs, and local product images.
- Tested viewport widths: 1440, 768, 390, and 320 pixels.
- No uncaught JavaScript exceptions during either pass.
- Screenshots were visually reviewed.

The scripts use Node's built-in WebSocket and Chrome DevTools Protocol, with no added packages. To rerun, launch an isolated headless Chrome with --remote-debugging-port=9222 and a temporary --user-data-dir, then run:
    node verification/browser-smoke.cjs
    node verification/browser-edge.cjs

Scripts save screenshots in this directory. Their file URLs are derived from the repository path. Tailwind and Google Fonts still need network access. These checks validate the prototype UI, not any backend service.

## Phase 2 integration — 2026-09-25

- `node verification/phase2-browser.cjs`: 95 checks covering the connected product → bag → delivery/pickup → review → payment → confirmation → orders journey.
- Includes removal/undo, invalid stock and quantity, address validation, serviceability and quotation failures, price acceptance, timer expiry, payment retry, verification locks, stale-session revalidation, idempotent confirmation, cancellation, and the existing product review composer.
- Exercises every calendar scenario, payment inspector state and order lifecycle state, mixed fixtures, search, pagination, guest gates, unknown references and unique DOM IDs.
- All eight Phase 2 views checked at 1440, 768, 390 and 320 pixels without horizontal overflow. Desktop fulfillment and mobile order-detail screenshots saved and visually reviewed.
- Existing Phase 1 suites rerun: 35 flow/layout checks and 15 edge checks passed.
- No uncaught browser exceptions across these runs. All application JavaScript passes `node --check`.

The scripts select a Chrome page target explicitly, avoiding extension background pages. They change only the in-memory demo and screenshot artifacts. Start with a fresh page when manually testing: browser reload resets all prototype data.

Google Maps address checks: `node verification/address-map-browser.cjs` uses the local Chrome debugging session on port 9222 and stubbed Google APIs to verify missing configuration, lookup races, drag/search results, optional fields, default-address changes, editing/cancellation, and review readiness. Real Google API calls require the browser key and map ID from `app/maps-config.js`.
