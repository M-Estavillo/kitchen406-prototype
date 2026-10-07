# Phase 6 — Owner Operations Integration

Date: October 6, 2026

Owner Operations is integrated into the existing browser prototype. It uses the current Kitchen406 header, footer, fonts, surfaces, compact page introductions, cards, controls, and modal manager. The uploaded generator exports remain reference material; their standalone scripts are not loaded into the application.

See the [implementation plan](phase-6-implementation-plan.md), [revision brief](phase-6-owner-operations-ui-revisions.md), and [original review](phase-6-owner-operations-ui-review.md).

## Open the workspace

Open `index.html`, open **Mock Controls**, and choose **Enter owner preview**. Choose **Load owner examples** to create linked pickup, courier, pending-payment, payment-resolution, subscription, and cake-request examples. Repeating this action does not duplicate them. Customer and staff workflows continue to use these same records.

Alternatively, use the existing sign-in form:

- Email: `owner@kitchen406.example`
- Preview password: `Kitchen406!`

These are local preview credentials. Reloading the application clears in-memory records. **Reset preview** resets shared and owner data, configuration, and role state. Provider responses and notification delivery remain simulated; the State Inspector controls success, failure, and unknown-response scenarios.

## Integrated screens

| Subphase | Route | Implemented behavior |
| --- | --- | --- |
| 6.1 Dashboard | `#/owner` | Derived fulfillment/stock/payment counts, purchase totals without subscription double billing, attention links, inquiry count, and upcoming commitments. |
| 6.2 Orders | `#/owner/orders` | All four order types, combined search/type/state/method/date filters, operational quick filters, sorting, pagination, and retained list context. |
| 6.3 Order Details | `#/owner/orders/:id` | Purchased item/address snapshots, type-specific parent/quotation links, materials, payment attempts, actor history, shared preparation/readiness, pickup and manual cake handoff. |
| 6.4 Payments | `#/owner/payments` | Distinct attempt/payment/order/hold states, paid-resolution inspection, retry history, references, amount snapshots for newly created holds, date/type/status filters, and pagination. |
| 6.5 Deliveries | `#/owner/deliveries` | Ready-only eligible queue, confirmation, repeat-safe booking, one active booking, unknown-outcome reconciliation, courier history, and separate production/courier states. Cakes and pickups are excluded. |
| 6.6 Inventory | `#/owner/inventory` | Selected-ingredient details, physical/reserved/available quantities, future material requirements, stock movements and actor/cost snapshots, unit-aware restock/count adjustment, owner-only costs and thresholds. |
| 6.7 Recipes & Costing | `#/owner/recipes` | Editable flat variant BoMs, packaging, duplicate validation, overhead/markup settings, missing-cost handling, derived suggestions/margins, category filters, and explicit selling-price updates. |
| 6.8 Cake Requests | `#/owner/cake-requests` | Selected original submission/references, customer context, feasibility checks, correctly targeted rejection, lifecycle, and quotation history. |
| 6.9 Quotation Builder | `#/owner/cake-requests/:id/quotation` | Validated date/window/method/charges/expiry, live preview, immutable issued versions, pickup fee/address removal, accepted-content lock, separate notification retry, and owner-approved staff production copy. Append a quotation ID to view an issued version. |
| 6.10 Subscriptions | `#/owner/subscriptions` | Cross-customer purchase/fulfillment links, four-delivery timeline, progress, totals, reservations, deferment allocation history, product/status/date/search filters, and unconfirmed enrollment separation. |
| 6.11 Capacity Calendar | `#/owner/capacity` | Actual selected dates and day/week/month navigation, three capacity pools, held/confirmed usage, product grouping, cake daily/weekly totals, and linked allocations. |
| 6.12 Scheduling | `#/owner/scheduling` | Real blocked dates/reasons, independent commitments, saved settings versus drafts/discard, per-type lead/cutoff rules including hours/minutes, product/fallback schedules, activation, and preserved existing schedule snapshots. |

Inventory, delivery, payment, subscription, and request routes accept a selected record ID where applicable. Unknown IDs and inaccessible workspaces show restricted/not-found content rather than another record.

## Shared implementation

- [Shared UI helpers](../app/ui.js) now support separate owner action namespaces and field IDs, shared tables, and workspace composition. Commerce helpers delegate at their own initialization rather than being redirected by staff integration.
- [Workspace styles](../app/workspace.css) contain the existing operational geometry; old staff class names remain compatible. [Owner styles](../app/owner.css) contain only owner-specific arrangements. Existing customer editorial heroes retain their design; owner pages use the same compact page-introduction system as operational pages.
- [Session context](../app/session-state.js) maps the Owner label to the `admin` role, identifies actors, and invalidates stale forms. Customer activation is never used to inspect another customer's records.
- [Operations selectors](../app/operations-state.js) aggregate existing account buckets, purchase parents, fulfillment orders, and cake orders. They do not maintain a second owner order store.
- [Shared fulfillment](../app/fulfillment-state.js) handles versioned, repeat-safe transitions. Staff retains its own entry guard and safe projection. Stock consumption and histories attribute owner actions to the owner account.
- [Pricing](../app/pricing-state.js) extends existing inventory recipes. Costs and selling prices remain separate; existing material requirements and purchased prices remain snapshots.
- [Capacity facade](../app/capacity-state.js) reads one source per pool: eligible standard orders, subscription allocations, and cake holds. Standard checkout now counts orders across customer buckets. Subscription allocations have stable IDs, retained confirmation identity, and released/replacement history for deferments. No pool is counted twice.
- [Delivery service](../app/delivery-state.js) separates provider simulation from booking eligibility and state changes.
- [Owner cake commands](../app/owner-cake-state.js) issue actual prototype quotation versions using entered charges. They do not use the older customer inspector's arbitrary quotation-price simulator.
- [Owner controller](../app/owner.js) owns route lifecycle, forms, errors, filtering, dialog dismissal protection, and draft restoration. Feature renderers are separated by operational area.

## Important behavior retained

All four subscription capacity dates are reserved at enrollment. Only the appropriate next chronological delivery has an active ingredient reservation; preparation consumes once and advances the reservation attempt. Restocking retries shortages without consuming stock.

Inventory values use their actual base units. For example, the current Egg record is gram-based; the generator's piece-unit example does not change that record. A 10 kg restock into a gram-based ingredient adds 10,000 g. A physical count below reservations records the shortage without deleting commitments.

Recipe and price changes apply to future purchases/requirements. Subscription schedule edits retain existing preparation and fulfillment commitments. Lowering capacity or blocking a date does not erase existing allocations.

Customer deferment remains the existing automatic validated workflow, with one successful deferment and four deliveries. Owner screens inspect its outcome; no new approval queue or unrestricted date override was introduced.

The former customer-accessible production-copy approval control is replaced by owner-only approval attached to a quotation. Staff receives approved instructions/references while original customer content remains separate.

## Verification

The owner browser suite checks navigation, role isolation, shared records, forms, costing, quotations, courier transitions, and responsive layouts at 1440, 768, 390, and 320 px. The integration suite checks failure/retry behavior, paid-resolution cases, attempt snapshots, dirty/stale forms, deferments, preserved commitments, owner sign-in, and repeat-safe fixtures.

Run browser suites sequentially against the existing Chrome debugging endpoint on port 9222:

```text
node verification/owner-browser.cjs
node verification/owner-integration.cjs
node verification/phase5-browser.cjs
node verification/phase5-revisions.cjs
node verification/phase2-browser.cjs
node verification/subscription-browser.cjs
node verification/phase4-state.cjs
node verification/subscription-state.cjs
```

The Phase 5 production-copy check now enters the owner workspace before approval; its staff-privacy assertion is retained. See [verification results](../verification/README.md), [desktop owner view](../verification/owner-dashboard-desktop.png), and [mobile owner view](../verification/owner-dashboard-mobile.png).

## Remaining production and policy work

- Browser role checks, local operation keys, and in-memory mutation sequencing are not server authorization or durable database transactions. Backend implementation must enforce permissions, unique active bookings/holds, optimistic concurrency, and persistent audit history.
- Standard capacity is projected from existing order records and cake capacity from existing holds through a common facade. A production migration still needs persistent ERD `CapacityAllocation` records for every pool, including legacy history. The prototype does not fabricate missing historical data.
- PayMongo, Lalamove, email, and SMS outcomes are simulated. No real payment, courier booking, or notification dispatch is made by these owner controls.
- Paid-resolution recovery remains inspection-only until permitted recovery actions are defined. There is no refund, mark-paid, or force-confirm action.
- Production-copy/multiple-reference persistence and any future owner deferment-approval queue require the schema/policy decisions identified in the plan.
- Existing recipes are sample formulations. Missing costs remain explicit; old movements are not retrospectively assigned invented costs.

The older storefront smoke and Phase 4 browser suites retain previously documented obsolete-selector limitations; this work does not claim a fresh pass for those suites.
