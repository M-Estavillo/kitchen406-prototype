# Phase 5 staff integration

Date: October 4, 2026

Update: The subsequent [paper-review revisions](phase-5-paper-revisions.md) fix subscription/retry holds, add rolling material reservations and stock-driven availability, and provide reviewed cake references and preparation dates. That document supersedes the provisional subscription policy and missing-reference limitations recorded below in this initial implementation snapshot.

The eight staff areas are integrated into the existing browser prototype. They use shared customer order records, one ingredient ledger, and the existing Kitchen406 visual style. The original generated exports remain reference files.

## Try the workspace

1. Open `index.html` and visit `#/staff`.
2. Sign in with **elena@kitchen406.example** and **Kitchen406!**.
3. Open Mock Controls and choose **Load staff orders**, or use **Enter staff preview** from the customer workspace.
4. Open Production Queue, start preparation, mark a pickup Ready, and complete its handoff. Inspect Inventory and Stock Movements to see the corresponding quantities.
5. Use **Return to customer** in Mock Controls to inspect the original customer records. Actual customer purchases also appear in the staff queue after payment.

The sample staff account is already active and set up. Mock Controls also provide loading, empty, load-error, and save-error scenarios. State and password changes reset on reload. The shared scheduling fixture determines Today; it is not the computer's current date.

## Design and component changes

- `app/shell.js` renders the existing header and footer, preserving the IDs used by customer code. Navigation changes with the workspace.
- `app/ui.js` supplies page introductions, panels, buttons, fields, badges, and summary cards. Existing commerce page/panel helpers delegate to these components.
- `app/staff.css` adds workspace navigation, tables, and calendar layouts using the existing colors, typography, card surfaces, borders, and controls.
- Staff dialogs use the existing modal manager, including background locking and keyboard handling.
- Existing storefront and custom-cake heroes retain their current composition. Staff introductions use the compact account/commerce heading treatment.

## Delivered by subphase

| Subphase | Integrated behavior |
| --- | --- |
| 5.1 Dashboard | Today/next-seven-days summaries, current stock alerts, shared production records, upcoming commitments, and working navigation. |
| 5.2 Production queue | Search, type/status/date filters, chronological ordering, guarded preparation/readiness/pickup transitions, stale-version rejection, and repeat-safe commands. |
| 5.3 Order details | Correct selected reference, structured accepted cake selections, quantities and ingredient requirements, own reservations and shortages, fulfillment method, attributed transition history, and optional local checklist. Unsupported printing controls are omitted. |
| 5.4 Inventory | Base-unit stock, active reservations, available quantities, thresholds, filtering/sorting, ingredient details, positive restocks, and physical-count adjustments including zero. |
| 5.5 Movements | Attributed before/change/after records, ingredient/type/actor/date filters, pagination, order links, movement details, and correction adjustments. |
| 5.6 Recipes | Read-only product/variant recipes, quantities per sellable unit, and inventory navigation. Unknown products fail closed. |
| 5.7 Calendar | Day/week/month navigation, selected-date agenda, search/type/status filters, optional completed records, blocked dates, and subscription replacement dates with original-date context. |
| 5.8 Notifications/account | Internal operational feed, shared acknowledgement with timestamps, unread counts, mark-all, failed-save handling, profile edits, and current-password verification. Role/email remain owner-managed. |

## Shared state rules

`app/inventory-state.js` owns ingredient requirements, reservations, stock, and movements. `app/staff-state.js` owns the staff session, operational projections, transition versions/history, and internal events. `app/staff-integration.js` connects these services to existing standard, cake, and subscription flows.

- Standard and accepted-cake payment confirmation reserves requirements without changing on-hand stock.
- Starting preparation validates every requirement before changing any stock. It consumes the reservation and records physical deductions once per order.
- Ready and Completed never consume ingredients again. Only Ready pickups expose staff completion.
- Failed/expired/cancelled holds release ingredients. Shortages prevent preparation; physical-count adjustments can expose shortages against existing reservations.
- Cake capacity holds remain confirmed after material consumption, so preparation does not accidentally free a sold cake slot.
- Weekly subscription orders retain their identity and synchronize Preparing/Ready/fulfilled states with their subscription delivery.
- Customer notifications use the original order's customer ID. Staff-facing projections omit customer contact/address and financial fields.
- Stock quantities and movements are in base units. Recipe quantities are frozen for each order when its requirements are first planned.

## Explicit prototype limits and remaining production work

1. **Persistence and permissions:** Data remains in browser memory. Role checks and safe rendered fields demonstrate behavior; the browser still contains customer records. Server authorization, database persistence, transactions, concurrency protection, and secure credentials remain production work.
2. **Recipes:** Ingredient quantities for the catalog are illustrative, product-specific demo formulations. The owner must validate actual bill-of-materials data and units before operational use. Purchased inputs are listed as base ingredients; sourdough requirements express flour/water directly rather than tracking prepared starter as stock.
3. **Subscription reservation timing:** All four fulfillment requirements are projected, but only the first fulfillment is initially reserved. Later fulfillments validate/consume ingredients when preparation starts. This provisional behavior preserves the existing capacity workflow; the agreed future-week reservation/replenishment policy remains open. First-week shortages currently create an internal alert after subscription activation rather than changing the prepaid purchase into payment resolution.
4. **Cake notes and images:** Staff see structured accepted selections and add-ons. Raw customer notes/reference images remain withheld because an owner-reviewed/redacted production-copy workflow is not present. Supplying that workflow is still required to complete the reference-image revision safely.
5. **Owner integration:** Courier booking, delivery-provider updates, staff provisioning/first-use setup, recipe editing, and costing remain outside this staff prototype. Inactive/unset-up accounts cannot enter the workspace. Restocks capture quantities, not owner financial data.
6. **Notifications:** Internal `orders`/`inventory` categories cover new commitments, transitions, stock attention, and deferments. Database event-enum mapping and cross-session delivery/read synchronization remain pending. Additional readiness events require the schema decision described in the revision brief.
7. **Presentation:** Ingredient tables show the complete small fixture dataset; movement history is paginated. Week/month calendars scroll within their container on narrow screens, with a selectable Day view. Checklists are local reminders and reset when rerendered.

These limits qualify the original revision checklist; this is not a claim that every production requirement has been delivered.

## Verification

The integrated Phase 5 browser suite passes **63 checks** with no uncaught exceptions. It covers access gates, all routes, safe projections, stock arithmetic, duplicate/stale updates, shortage rollback, physical zero counts, password changes, widths of 1440/768/390/320 px, and customer-to-staff-to-customer workflows for standard, cake, and subscription orders.

Passing regression suites: standard checkout/orders (95), subscription browser (71), authentication/browser edges (15), account/cake state (28), subscription state (13), address/map browser (16), and delivery-route checks. All application JavaScript passes syntax checking. The existing state suites exercise their original module harness; the Phase 5 browser suite exercises the integrated services.

Two older browser suites need updates for customer UI changes already present before this integration:

- `browser-smoke.cjs` stops at the removed `#product-search-input` selector.
- `phase4-browser.cjs` stops at the removed `[data-p4=cake-addon]` controls.

Their full results are not claimed as passing. Existing customer edits and uploaded exports were preserved. `git diff --check` reports pre-existing trailing whitespace in `app/catalog.js`.

See [staff dashboard screenshot](../verification/staff-dashboard-desktop.png), [verification instructions](../verification/README.md), and the [implementation plan](phase-5-implementation-plan.md).
