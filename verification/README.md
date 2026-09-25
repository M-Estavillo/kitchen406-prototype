# Browser verification

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
