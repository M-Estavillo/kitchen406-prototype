# Draft implementation plan: Kitchen406 Phases 1–3

**Status:** Implemented in the customer prototype following approval. See the implementation record below.

**Prepared:** September 30, 2026

### Implementation record

The 13 revisions are connected in the existing HTML/JavaScript application. The implementation includes shared product variants, batch/cutoff checks, subscription enrollment and address reuse, full prepaid pricing, payment/hold states, four linked fulfillment orders, customer management, and one-time deferment. Password recovery now includes a sent-email summary and resend action. Reviews from order details use an order-item key.

The user selected the collision policy: **Next Week moves a colliding delivery to the next available weekly date after the cycle.** The original delivery and other cycle dates are preserved. The prototype uses immediate confirmation after validation, capacity commitments for all four weeks, consistent ₱280 Shokupan / ₱340 standard Babka prices, and a shared ₱100 sample courier fee. Demo scheduling defaults and remaining production dependencies are documented in [README.md](../README.md).

The review table in Section 7 preserves the original source conflicts for paper alignment. Prototype defaults are not new claims about the bakery's production policies. The Chapters and source mockups were left unchanged.

Verification scripts and results are recorded in [verification/README.md](../verification/README.md).

## 1. Proposed outcome

Update the existing customer prototype to reflect the revised storefront and checkout rules, then connect the complete subscription journey:

**Browse → Configure → Delivery address → Review → QR Ph payment → My subscriptions → Subscription details → Defer delivery.**

The main change is to offer two clear purchasing paths for the same product. **Buy Once** uses the regular cart and standard checkout. **4-Week Subscription** starts a separate prepaid enrollment with four weekly deliveries. Subscription availability is evaluated separately from availability for a standard order.

This draft covers the 13 entries in [Revisions.md](../Revisions.md) within the customer phases defined in [Phases.md](../Phases.md). The proposed implementation target is the current HTML/CSS/JavaScript prototype. The Next.js, Prisma, PostgreSQL, and external-service architecture described in the paper is a later production implementation dependency; adopting that stack would require a separate implementation scope.

## 2. Context and source decisions

### What the chapters establish

- [Chapter 1](../Chapters/Chapter%201.md): Kitchen406 is a two-owner, home-based bakery. The platform should reduce manual coordination, enforce capacity, and support standard orders, fixed prepaid subscriptions, and custom cakes. Purchases require accounts and full QR Ph payment. Subscriptions have four weekly deliveries; discounts and automatic renewal are outside the stated model.
- [Chapter 2](../Chapters/Chapter%202.md): The literature supports predictable prepaid commitments, capacity controls, ingredient-linked planning, and owner oversight. It provides context rather than additional customer policies to import into the mockups.
- [Chapter 3](../Chapters/Chapter%203.md): Standard orders and subscriptions have separate capacity limits. A standard fulfillment date must work for the entire cart. Maps supports address and distance checks; Lalamove handles quotations and later booking/status updates. The paper describes subscription capacity being consumed week by week.
- [Chapter 4](../Chapters/Chapter%204.md): The subscription purchase order is distinct from each weekly fulfillment order. A subscription has four delivery records, one permitted deferment, and a history of original/replacement capacity allocations. Figure 11 explicitly includes `next_day` and `next_week` deferment options and subscription statuses `active`/`completed`. Figures 19, 25, and 27 describe capacity validation and payment before activation.

Use `Revisions.md` for the requested changes, `Phases.md` for screen boundaries, and the selected revised mockups for layout and interactions. Cross-check business behavior against the chapters. Where these disagree, record a decision rather than silently treating sample copy as policy.

The UI phases in `Phases.md` are different from the development iterations in Chapter 4. This draft covers customer UI Phases 1–3; the paper's third iteration also mentions custom cakes and moderation, which belong to later UI phases.

### Current application baseline

| Area | What exists | Implication |
| --- | --- | --- |
| Storefront and product detail | Catalog fixtures, variants, reviews, shared navigation, subscription badges | Revise the existing screens and add the purchase choice. |
| Authentication | Sign-in, registration, OTP verification, forgot/reset dialogs | Align password recovery with the new reference; avoid a duplicate implementation. |
| Standard commerce | Connected cart, checkout, simulated payment, confirmation, orders | Keep these connected while revising scheduling and sharing suitable components. |
| Calendar | Fixed October–December 2026 demo calendar; all Sundays blocked; generic cutoff state | Replace blanket rules with explicit batch and whole-cart availability. |
| Delivery addresses | Saved addresses, editable map pins, address validation, Google driving-distance checks | Reuse this work for subscription addresses. |
| Subscription management | Navigation placeholder and a sample subscription order | Add the actual enrollment and management flows. The sample order does not represent a subscription lifecycle. |
| Runtime | In-memory commerce/authentication; Maps can call Google when configured | Keep prototype payments/orders clearly simulated. Production enforcement remains a separate dependency. |

Relevant files: [app/app.js](../app/app.js), [app/product.js](../app/product.js), [app/auth.js](../app/auth.js), [app/commerce-state.js](../app/commerce-state.js), [app/checkout.js](../app/checkout.js), [app/address-map.js](../app/address-map.js), and [app/delivery-route.js](../app/delivery-route.js).

## 3. Screen-by-screen changes

All mockup links below point to the nested source directory under `stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/`.

| Revision | Selected reference | Proposed work |
| --- | --- | --- |
| **1.1 Catalog** | [Subscription-aligned catalog][m11] | Use “Available for subscription” wording. Keep standard availability and subscription availability distinct. Link product cards and navigation to the connected flows. |
| **1.2 Product detail** | [Dual purchase options][m12] | Add Buy Once / 4-Week Subscription selection. Buy Once retains variant, quantity, subtotal, and cart action. Subscription carries the selected product/variant/quantity into configuration, with account gating and return-to-flow behavior. |
| **1.3 Reviews** | [Same combined product screen][m12] | Keep reviews on the product page. Preserve rating, optional comment, maximum two photos, and one review per completed order item. Switching purchase modes must preserve review behavior. |
| **1.7 Forgot/reset password** | [Password recovery modal][m17] | Compare and align existing dialogs with the supplied forgot, sent, resend, reset, invalid/expired, loading, error, and success states. The revision note says this mockup is missing, but the supplied folder now contains it. |
| **2.2 Fulfillment** | [Batch/cutoff-aligned checkout][m22] | Before the applicable cutoff, allow the upcoming batch if all cart items qualify. After cutoff, use the next qualifying batch. Include mixed-cart constraints, capacity, blocked dates, stock, and revalidation. Remove automatic Sunday blocking. |
| **3.1 Subscription products** | [Products/program overview][m31] | Build the subscription listing with setup and Buy Once links. Show four-delivery product subtotals separately from delivery fees. Support available, full, temporarily unavailable, loading, error, empty, and guest states. |
| **3.2 Configuration** | [Cleaned configuration][m32] | Add product/variant, quantity per delivery, schedule, available start date, and a calculated four-delivery preview. Fix the term at four deliveries. Show unavailable schedules and recoverable loading/errors. |
| **3.2B Delivery address** | [Subscription address][m32b] | Add a dedicated address step using the existing saved-address/map behavior. Select the address for all four deliveries, verify serviceability, and show fee per delivery × four. Replace conflicting prices and unsupported courier copy. |
| **3.3A Review** | [Aligned review][m33a] | Show product, variant, weekly quantity, all four dates, selected address, product subtotal, four delivery fees, and the full prepaid total. Editing earlier steps must update the review. Block payment during validation or unresolved conflicts/price changes. |
| **3.3B Payment** | [Aligned subscription payment][m33b] | Pay the complete four-delivery amount. Add waiting, detected, delayed verification, confirmed, failed, expired, and revalidation states. Activate once after confirmed payment. |
| **3.4 My subscriptions** | [Lifecycle-aligned list][m34] | Show unpaid enrollment separately from active/completed subscriptions. Add continue payment and cancel setup, filters, search, sorting, progress, next delivery, and empty/loading/error states. |
| **3.5 Details** | [Lifecycle and fulfillments][m35] | Show four fulfillment records, associated order links, payment breakdown, delivery snapshot, current progress, and deferment availability/history. Completed subscriptions offer a new enrollment through Subscribe Again. |
| **3.6 Defer delivery** | [Next Day / Next Week][m36] | Keep both options. Preview the changed date, check availability, confirm, and update the affected fulfillment. Include either/both dates unavailable, allowance used, loading, error, and success. Resolve the date-collision policy in Section 7 before finalizing this behavior. |

### Mockup selection and copy cleanup

- Use `subscription_products_program_overview` for 3.1. Older `subscription_introduction_eligible_products` versions remain reference history; the `..._factual` folder contains only a screenshot.
- Use `subscription_configuration_cleaned_aligned` for 3.2. The older `subscription_configuration` folder contains only a screenshot.
- Preserve the source mockups as references and implement the changes in the shared app shell. Reuse existing local product images; several revised screenshots show broken remote images or logos.
- Replace old “subscription eligible” positioning with the two purchasing paths. Keep an internal product-to-subscription-offering relationship, since only configured offerings should appear in the subscription program.
- Remove unsupported claims such as guaranteed slots before payment, temperature-controlled vans, dedicated courier routes, a universal 4 PM cutoff, a 48-hour fermentation rule, and the password mockup's “10% Pantry Credit.”
- Keep phase numbers, mockup route instructions, and implementation notes inside the inspector/documentation. Customer screens should use ordinary navigation labels.
- Treat product weights, prices, schedule windows, and sample dates as fixture data requiring consistency, rather than business facts implied by a screenshot.

## 4. Shared behavior and data

### 4.1 Product identity and availability

Use one product and variant source across catalog, product detail, standard cart, subscription setup, and subscription records. Numeric prices should drive calculations; display strings should be formatted from those values.

Model these separately:

- Availability for a standard purchase on the selected fulfillment date.
- Whether a product has a subscription offering.
- Availability of subscription schedules and capacity for the requested quantity.

A full subscription schedule must not disable Buy Once when standard availability permits it. Conversely, a subscription badge alone must not imply that enrollment can proceed.

### 4.2 Standard-order scheduling

Introduce a scheduling helper that evaluates the complete cart against the chosen date, using a controllable Asia/Manila demo clock. Configuration should describe batch dates, cutoff timestamps, lead times, blocked dates, capacity, and ingredient availability.

The result should identify whether a date is available and explain why it is blocked. Cart changes must invalidate a selected date when an added product or increased quantity makes that date unavailable. Recheck before continuing and before payment.

The revised mockup itself uses fixed October scenarios rather than a complete scheduling engine. Reproduce its intended rules through shared logic and explicit fixtures; do not copy its dates as permanent rules. Sundays can be available when the configured rules allow them. Exact cutoff values and capacity baselines remain review items.

### 4.3 Subscription draft and pricing

Keep the enrollment draft separate from the standard cart. It should hold product/variant IDs, quantity per delivery, schedule, first date, four calculated dates, selected address, validation results, and quotation state.

Calculate all screens from the same values:

```text
Products per delivery = variant unit price × quantity per delivery
Product subtotal      = products per delivery × 4
Delivery total        = fee per delivery × 4
Full prepaid total    = product subtotal + delivery total
```

Reference examples from 3.3A/3.3B, subject to fixture approval:

| Product | Unit price | Quantity per delivery | Products × 4 | Delivery × 4 | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Shokupan | ₱280 | 1 | ₱1,120 | ₱400 | **₱1,520** |
| Shokupan | ₱280 | 2 | ₱2,240 | ₱400 | **₱2,640** |
| Babka | ₱340 | 1 | ₱1,360 | ₱400 | **₱1,760** |

The fee is per dispatch, not per loaf. Address changes invalidate serviceability and quotation results. Product, variant, quantity, schedule, or start-date changes invalidate the affected calculations and availability checks. A price change requires reviewing and accepting the updated total before a new payment attempt.

### 4.4 Addresses and delivery checks

Reuse the existing address fields and Google Maps behavior. Keep coordinates, one default address, editing, validation, and stale-response protection. Store the chosen address as a purchase snapshot so later edits to the saved address do not rewrite paid commitments.

The current app checks a primary driving route of **at most 10,000 meters**, including the boundary. Retain that behavior pending review; the new mockup's city/zone labels should not override it. The configured bakery origin is currently a temporary Liloan location, so exact serviceability remains dependent on the final origin.

`address-map.js` currently reads `C.checkout` directly, while `delivery-route.js` reads the standard checkout draft and refreshes only the checkout route. Make both accept the active flow's address/context so subscription setup can reuse them without overwriting standard checkout state. Adapt messages to the flow: subscription delivery errors should not offer a pickup action that subscription enrollment does not support.

Recipient/contact information should come from customer or delivery-contact data, consistent with the existing address model. Do not silently add the mockup's contact fields to Address. Keep courier fees as clearly identified prototype quotations until real integration is separately implemented.

### 4.5 Payment, subscription, and fulfillment lifecycle

Use separate records for:

| Record | Responsibility |
| --- | --- |
| Enrollment draft / pending purchase order | Editable setup and unpaid checkout; resumable from the pending-enrollment area. |
| Payment attempt / checkout hold | Fixed amount and checkout snapshot, attempt state, expiry, and temporary resource hold. |
| Subscription | Paid commitment linked to customer, variant, schedule, address, and purchase order. Lifecycle: active → completed. |
| SubscriptionDelivery | Exactly four fulfillment obligations with stable cycle numbers, dates, status, and fulfillment-order links. |
| SubscriptionDeferment | Affected delivery, chosen option, original/replacement dates, and allocation history. |

This follows Chapter 4's entity relationships. Any additional prototype snapshot fields are implementation proposals, not claims that those fields already exist in the ERD.

- Confirmed payment creates/activates the subscription and its four obligations exactly once. Repeated clicks or repeated confirmation events must not duplicate them.
- Subscription payment must leave the standard cart untouched. The current `C.setPayment` settles cart quantities for non-fixture orders, so subscription activation needs a separate handler or explicit order-type dispatch.
- Unpaid, failed, or expired enrollment must never count as active. Cancelling unpaid setup releases its temporary hold without changing paid subscriptions.
- Detected/delayed payments remain pending verification. Prevent another payment attempt until their outcome is resolved.
- Expiry and retry require resource revalidation. A success arriving after expiry needs an explicit resolution state if the commitment cannot be secured; never prompt a customer to pay again for a confirmed charge.
- Each weekly fulfillment links to its own operational order. Those orders represent prepaid deliveries and must not request the full subscription payment again or count that revenue four more times.
- Compute progress from completed fulfillments. Display “Upcoming” as a presentation label where appropriate; do not confuse it with the subscription's status.
- Keep four fulfillment obligations after deferment. A changed date can extend the calendar span; completion means all four deliveries were fulfilled, rather than simply reaching the original end date.
- Subscribe Again starts a new enrollment using current prices and availability.

### 4.6 Deferment

Allow one successful deferment per subscription. Keep Next Day and Next Week as requested in `Revisions.md` and represented in Chapter 4 Figure 11.

Before confirmation, validate the selected delivery's state, remaining allowance, replacement schedule/capacity, blocked dates, and applicable cutoff. Revalidate on submission. Record the original date and replacement allocation, and update the related fulfillment order when applicable. Leave other delivery records unchanged unless a different collision policy is agreed.

Reserve the replacement and release the original allocation as one operation. A failed check or cancelled dialog must preserve the original date and allowance. Repeated confirmation must consume the allowance only once. Paid totals remain historical snapshots; any fee-adjustment policy needs a separate decision.

## 5. Proposed code organization

File names below are proposals; keep responsibilities small and reuse existing helpers where they fit.

| Files | Work |
| --- | --- |
| `app/products.js`, `app/catalog.js`, `app/product.js`, `app/templates.js` | Consistent variant/price data, availability labels, combined product/review screen, purchase-mode actions. |
| `app/auth.js` | Align recovery dialogs; preserve enrollment context through sign-in and verification. |
| New `app/scheduling.js` | Date generation, batch/cutoff validation, whole-cart constraints, and subscription replacement-date checks. |
| `app/commerce-state.js`, `app/checkout.js`, `app/orders.js` | Use scheduling helper; handle subscription purchase versus fulfillment orders; prevent cart settlement and payment reuse errors. |
| `app/address-map.js`, `app/delivery-route.js`, optionally new `app/address-ui.js` | Reusable address selection, editing, maps, and distance checks with explicit flow context. |
| New `app/subscription-state.js` | Enrollment drafts, pricing, payment/activation transitions, four delivery records, and deferment history. |
| New `app/subscription-checkout.js` | Configuration, address, review, and payment views. |
| New `app/subscriptions.js` | Program listing, customer list/details, deferment views, and route integration. |
| `app/app.js`, `app/core.js`, `index.html` | Shared navigation, script loading, auth gates, return routes, and inspector/reset integration. |
| New `app/subscriptions.css` plus existing shared styles | Responsive subscription screens following the existing typography, colors, spacing, and controls. |
| `README.md`, `verification/` | Revised source decisions, setup notes, fixtures, and relevant verification coverage. |

Proposed routes: `#/subscriptions` for discovery; `#/subscription/configure`, `/address`, `/review`, and `/payment/<purchaseId>` for enrollment; `#/my-subscriptions` for the customer list; `#/subscriptions/<id>` for details; and `#/subscriptions/<id>/defer/<deliveryId>` for deferment. Final names can follow the current router's conventions.

Protected routes should retain the intended destination after authentication. Missing drafts, unknown IDs, and reloads after in-memory state is lost need recovery screens rather than fabricated records. Reset preview should clear all subscription drafts, payment attempts, lifecycle fixtures, and validation state consistently.

## 6. Implementation order and acceptance checks

| Step | Deliverable | Acceptance checks |
| --- | --- | --- |
| **1. Agree on rules and fixtures** | Selected mockups, product/variant mapping, price table, cutoff configuration, lifecycle mapping | One consistent product/price source; decisions in Section 7 settled for affected behavior. |
| **2. Update storefront and scheduling** | 1.1–1.3, 1.7, and 2.2 revisions | Buy Once still works; reviews/auth recover correctly; before/at/after cutoff cases; mixed carts; no same-day fulfillment; Sunday availability follows configuration. |
| **3. Build enrollment through review** | 3.1, 3.2, 3.2B, 3.3A | Product choice survives sign-in; four dates recalculate; address edits invalidate checks; all three pricing examples agree across screens. |
| **4. Connect payment and management** | 3.3B, 3.4, 3.5 | No unpaid active subscriptions; one activation per purchase; pending verification protected; retry/expiry handled; order links and progress agree; standard bag preserved. |
| **5. Add deferment** | 3.6 and synchronized detail/list/order updates | One successful use; unavailable dates blocked; submission rechecked; original schedule preserved on failure; exactly four obligations remain; collision behavior matches the agreed rule. |
| **6. Review the complete experience** | Responsive app, updated inspector and documentation | Full guest-to-subscription journey and standard-order regression checks pass; screenshots reviewed with inspectors closed. |

### Verification during implementation

Use focused state tests for pricing, cutoff boundaries, separate capacity pools, payment idempotency, stale quotations, and deferment allocation changes. Add browser coverage for the connected subscription journey and its error/recovery paths.

Reuse the existing suites where applicable:

- `node verification/browser-smoke.cjs`
- `node verification/browser-edge.cjs`
- `node verification/phase2-browser.cjs`
- `node verification/delivery-route.cjs`
- `node verification/address-map-browser.cjs`

Update obsolete assertions about hardcoded dates/Sunday blocking to the agreed rules. Add proposed `verification/subscription-state.cjs` and `verification/subscription-browser.cjs` for the new behavior. Check widths 1440, 768, 390, and 320 pixels; keyboard focus, Escape, dialog focus trapping, browser Back, disabled actions, status announcements, and missing-image fallbacks.

Use injected Maps responses for repeatable address tests, including 10,000-meter boundaries, failure/no route, and late responses. Tests for this prototype verify frontend behavior; they do not demonstrate real payment, courier booking, or server-side capacity enforcement.

## 7. Decisions for our review

| Decision | Evidence / conflict | Proposed treatment |
| --- | --- | --- |
| **Prototype scope** | The repository is a working vanilla-JavaScript prototype; the paper specifies a production Next.js stack. | Complete the revised customer prototype first. Plan production architecture and integrations separately. |
| **Deferment destination and collision** | Revisions, Phases, Figure 11, and 3.6 retain Next Day / Next Week. Chapter 1 and the 3.1 FAQ describe moving a skipped delivery to the end of the cycle. The 3.6 sample moves Oct 30 to Nov 6, which already has delivery 4. | Keep both UI options. Agree whether Next Week means exactly +7 days or the next free weekly batch after the cycle, and whether two obligations may share a date. Do not silently merge deliveries or shift the entire schedule. Align the paper and FAQ afterward. |
| **Capacity commitment and inventory timing** | Chapter 3 says weekly consumption rather than reserving the full cycle; Chapter 4 and payment copy imply availability across the commitment before confirmation. | Prefer securing capacity for all four paid obligations at activation, tracked per week. Separately define ingredient reservation/deduction timing. Confirm this and revise the conflicting paper text before treating it as settled. |
| **Prices, variants, and eligible offerings** | Current catalog Shokupan starts at ₱220; revised configuration/review use ₱280 for 450g; 3.2B uses ₱360. Sourdough names/weights/prices and croissant subscription flags also differ. | Approve one variant table. Proposed subscription examples use ₱280 Shokupan and ₱340 Babka from 3.3A/3.3B, with any ₱220 variant represented separately only if real. |
| **Courier fees** | Current standard checkout uses a ₱95 demo fee; subscription references use ₱100; four future dispatches are prepaid. | Use one quotation interface and clearly named fixtures. Confirm whether the same sample address should quote the same rate, and how later booking/deferment fee differences are handled in production. |
| **Cutoff and quantity limits** | Revised 2.2 states the before/after rule without final timestamps. 3.2B's footer invents 4 PM. Chapter 3 gives configurable baselines of four standard varieties/day, ten units/variety/day, and ten subscription units/product/week; the app currently permits twelve units per cart line. | Confirm real batch/lead/cutoff settings and capacity units across variants. Keep values configurable; cart input limits must not substitute for date-specific capacity. Specify exact-at-cutoff behavior and deferment notice/state restrictions. |
| **Who completes a deferment** | Chapter 4 says owners can process requests; 3.6 shows immediate customer confirmation. | Propose automatic confirmation after validation for the customer prototype. Confirm whether production needs owner approval; if so, add pending/rejected states and allowance rules. |
| **Delivery area and address changes** | Existing code uses a 10 km driving route and temporary Liloan origin; mockups use broad Metro Cebu zones and a single-address explanation. | Reuse current route validation and one address snapshot for enrollment. Confirm the exact bakery origin and policy for changing an active subscription's address before promising either behavior. |

## 8. Later dependencies

Phases 4–7 cover customer account management, custom cakes, staff workspaces, owner controls, moderation, analytics, and AI marketing. They remain outside this implementation draft except for navigation and shared data relationships needed by Phases 1–3.

Before live operation, the production implementation must supply authenticated persistence and ownership checks, transactional capacity/stock holds, verified and repeat-safe payment callbacks, independent server validation, courier quotation/booking/status integration, and notification delivery. The draft's state models should make that work possible without suggesting those services already exist.

[m11]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_storefront_catalog_phase_1.1_subscription_aligned/code.html
[m12]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_1.2_1.3_product_detail_with_dual_purchase_options_customer/code.html
[m17]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_1.7_forgot_reset_password_modal/code.html
[m22]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_2.2_checkout_fulfillment_batch_cutoff_aligned/code.html
[m31]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_3.1_subscription_products_program_overview/code.html
[m32]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_3.2_subscription_configuration_cleaned_aligned/code.html
[m32b]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_3.2b_subscription_delivery_address/code.html
[m33a]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_3.3a_subscription_review_aligned_accurate_pricing/code.html
[m33b]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_3.3b_subscription_payment_aligned_accurate_pricing/code.html
[m34]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_3.4_customer_subscriptions_list_lifecycle_pricing_aligned/code.html
[m35]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_3.5_customer_subscription_details_lifecycle_fulfillments/code.html
[m36]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_3.6_defer_delivery_accurate_rules_copy/code.html
