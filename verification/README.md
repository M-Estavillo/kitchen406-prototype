# Browser verification

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
