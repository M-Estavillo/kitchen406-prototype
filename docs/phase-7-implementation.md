# Phase 7 — Owner Management integration

Paper-alignment follow-up: see [implemented revisions](phase-7-paper-alignment-revisions.md) for corrected prices/ratings, successful-payment reporting, expanded analytics, marketing event simulation, and ERD record mappings.

Implemented October 9, 2026, against the [approved plan](phase-7-implementation-plan.md) and [revision brief](phase-7-owner-management-ui-revisions.md).

## Preview

Open `index.html`, expand **Mock Controls**, and choose **Enter owner preview**. Alternatively, sign in with `owner@kitchen406.example` / `Kitchen406!` before changing those preview credentials. **Load owner examples** supplies the existing linked operational records. **Simulate draft-ready event** creates a marketing draft from current catalog context; its success/failure selector belongs to Mock Controls.

All state remains in browser memory. Reload or Reset preview restores the baseline. No external accounts, emails, payments, publishing, database writes, or AI requests are made.

## Implemented subphases

| Phase | Owner routes (`#/owner/…`) | Working behavior |
| --- | --- | --- |
| 7.1 Products | `products` | Shared table/cards, search, category/status/subscription filters, name sort, pagination, visible-page selection, activation/deactivation. Catalog flags remain separate from ingredient availability. |
| 7.2 Product editor | `products/new`, `products/:id/edit` | Validated product and variant saves, local image preview, retained variant IDs, inactive variants, restored/discarded drafts, explicit selling prices, links to existing recipes/costing. Newly added variants need a recipe before purchase. |
| 7.3 Categories | `categories` | Add/edit names and status, duplicate-name validation, actual product counts, filtered View Products action. Customer category tabs use the same definitions. |
| 7.4 Ingredients | `ingredients` | Selected material definition editing, unique names, base-unit costs and thresholds, protected referenced units, derived stock state, links to Phase 6 movements. New ingredients start at zero stock. |
| 7.5 Cake configuration | `cake-options` | Options/add-ons with type and availability filters, real ingredient rows and units, duplicate-mapping validation, centavo price conversion. Customer cake options and add-ons read the edited records. Existing explicit size quantities are not multiplied again. |
| 7.6 Occasions | `occasions` | Name/date/status saves, valid date ranges, search/status/date filters, derived draft counts. Saving does not generate a draft. |
| 7.7 Staff accounts | `staff-accounts` | Registry with the existing preview identity, create/edit/deactivate, temporary-password reset, cross-role email uniqueness, setup state. Shared sign-in resolves the selected account. A restricted staff setup form must be completed before operational access. |
| 7.8 Customers | `customers`, `customers/:customer_id` | Read-only directory, phone/name/email search, email-verification filter, selected contact/address/activity records. Inspection never activates the customer account. |
| 7.9 Reviews | `reviews`, `reviews/:id` | Real completed-purchase feedback, one per order-item key; customer text/rating and up to two local photos; standard and custom-cake composers; public rating/count/feed; hide/restore with ERD reason enums and actor metadata. |
| 7.10 Marketing | `marketing`, `marketing/:id` | Independent captions, pending-review/approved/rejected lifecycle, version checks, regeneration simulation, reviewer metadata, clipboard outcome handling, image download. Approval is readiness for manual use, never social publication. |
| 7.11 Reports | `reports`, `reports/:product_id` | One paid receipt per purchase, Manila payment-date periods, product/unit chart, matching receipt tables, product drill-down, delivery-fee separation, explicit cost coverage, separate paid-resolution receipts. Weekly subscription fulfillments are excluded from revenue. |
| 7.12 Notifications/settings | `notifications`, `outbox`, `outbox/:id`, `settings` | Source-based operational and draft feed, shared read acknowledgement, channel-specific send details, existing quotation attempt history, owner profile/password/email OTP and sign-out. Owner changes never mutate the active customer profile. |

## Shared design and integration

The existing header/footer, Playfair Display headings, Plus Jakarta Sans body, colors, cards, buttons, tables, and responsive workspace remain authoritative. The owner navigation groups Operations, Catalog, and Administration. Desktop navigation scrolls within the sidebar; mobile retains the existing horizontal navigation. No generator shell or second design library was imported.

`owner-ui.js` adds reusable collection filters; `ui.workspace` accepts optional navigation groups without changing existing staff callers. Each new screen composes the existing page introduction, panel, field, table, pagination, and modal helpers. Images use a shared preview treatment.

State and rendering are divided between `catalog-state.js`, the `owner-*` feature modules, and `phase7-integration.js`. The existing owner controller retains routing, access gating, error simulation, form generation checks, modal dismissal, and reset. New scripts load before the owner controller and final application bootstrap.

Important connections:

- Inactive products/categories and variants cannot enter new checkout or subscription enrollment. Direct product routes and stale carts are checked. Catalog price changes require explicit cart acceptance. Paid line items and quotation snapshots stay intact.
- Live inventory-derived availability survives catalog reset and product creation. Ingredient costs update existing pricing calculations without silently changing selling prices.
- Product editors reject overwriting a price changed through Phase 6 while the editor was open. Variant drafts preserve repeated fields and avoid duplicate DOM IDs.
- Staff credentials operate on registry records. Password setup and operational access are separate gates; inactive accounts cannot access staff operations.
- Feedback is keyed by `order.id + ':' + item.key`, the prototype adapter for the ERD's unique purchased order item. Public projections omit hidden records. Moderation retains rating/comment/images.
- Post drafts use `pending_review`, `approved`, and `rejected`; generation uses `product_highlight` or `seasonal_occasion`; draft notifications use `post_draft_ready`. The simulator reuses local catalog imagery and records regeneration metadata; it does not generate novel images or call Gemini.
- Outbox summaries are labelled as summaries. Quotation events with detailed recorded attempts use those attempts instead of duplicate channel summaries. No automatic retry schedule or payment override is fabricated.
- Password/OTP/staff credential fields are excluded from owner draft retention. Session invalidation clears pending owner email verification.

## Reporting policy

This prototype groups receipts by payment date in Asia/Manila. It excludes unpaid/cancelled transactions and prepaid weekly fulfillment records. The subscription purchase represents all four deliveries. Delivery charges are outside product revenue.

Costs are **current recipe and overhead estimates**, not historical profit. Only standard items with complete cost data contribute to covered revenue and estimated margin. Unsupported cake/subscription costs remain outside coverage. Paid-resolution receipts are displayed separately. Records without a usable payment timestamp are counted as excluded rather than assigned an invented date.

The user confirmed successful payment date as the sales recognition basis during the paper-alignment revision. Category inactivity policy and durable cost history still need to be carried into the production specification explicitly.

## Verification

Executed using a temporary Node 22 runtime and isolated headless Chrome with CDP. Browser suites run sequentially. The new suite checks all Phase 7 routes at 1440, 768, 390, and 320 px; selected-record forms; stale saves; staff sign-in/setup; review moderation/public rendering; OTP; notification identity; and complete reset.

| Suite | Result |
| --- | --- |
| `phase7-browser.cjs` | 129 checks, no browser exceptions |
| `phase7-state.cjs` | 8 reporting reconciliation checks after paper-alignment revisions |
| `phase7-alignment-browser.cjs` | 37 focused paper-alignment checks, no browser exceptions |
| `owner-browser.cjs` | 78 checks, no browser exceptions |
| `owner-integration.cjs` | 32 checks, no browser exceptions |
| `phase6-revisions.cjs` | 23 checks |
| `phase5-browser.cjs` | 63 checks, no browser exceptions |
| `phase5-revisions.cjs` | 32 checks, no browser exceptions |
| `phase2-browser.cjs` | 95 checks, no browser exceptions |
| `subscription-state.cjs` | 13 checks |
| `subscription-browser.cjs` | 71 checks, no browser exceptions |
| `phase4-state.cjs` | 28 checks |
| `phase4-browser.cjs` | 144 checks, no browser exceptions |

Application JavaScript passes syntax checks. Product list screenshots are in [desktop](../verification/phase7-products-1440.png) and [mobile](../verification/phase7-products-390.png), inspected against the existing owner design.

The older cake browser suite initially stopped because customer add-on controls had been removed and its upload fixture referenced a nonexistent `celebration-cake.jpg`. The Phase 7 integration connects the managed add-ons to customer selection, and the test now uploads the existing `custom-cake.png`; its complete 144-check run passes. Historical screenshots generated by unrelated suites are not part of this handoff.

## Production limits

Authorization, credentials, OTP, uploaded images, edits, and action metadata are local simulation only. A production service needs server-side authorization, persistence, secure credentials, actual email/SMS providers, protected media storage, transaction-level concurrency, historical cost snapshots, scheduling, and a real generation adapter. The app makes no claim of a permanent complete audit trail or automatic publishing.

Marketing and feedback queues start empty until their connected workflows create records. This avoids owner-only fixture reviews disconnected from purchases. Existing operational example loading and reset remain available through Mock Controls.
