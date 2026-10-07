# Phase 6 — Owner Operations Revision Brief

Date: October 6, 2026  
Coverage: Subphases 6.1–6.12  
Based on: [Phase 6 UI review](phase-6-owner-operations-ui-review.md), [ERD](../Chapters/ERD.md), chapter requirements cited in that review, and [confirmed reservation policy](phase-5-paper-revisions.md).

## Purpose

Use this document to revise the uploaded UI Generator screens into a consistent owner workspace. Each subphase specifies what to retain, what to revise, and acceptance checks for the revised result. These are instructions for future changes, not a claim that the screens have already been fixed.

Preserve the bakery's visual style and the useful layouts identified in the review. Connect the owner workspace to the existing customer/staff workflows during integration. Products, categories, account administration, moderation, marketing, and detailed reporting remain Phase 7; Phase 6 may link to those areas without duplicating their management screens.

## Rules for all subphases

### Business rules

| Area | Required behavior |
| --- | --- |
| Payment | Require full QR Ph payment through PayMongo before normal order confirmation. No deposits, manual paid override, direct bank-transfer checkout, discounts, or refund module. |
| Payment resolution | A payment may be Paid while its order remains Payment Resolution Required. Display both truths; do not claim resources are secured or allow normal production in that state. |
| Stock | Checkout holds applicable ingredients; confirmation confirms the reservation. Starting preparation consumes ingredients once. Marking Ready or Completed does not consume them again. |
| Subscriptions | One selected variant and quantity per delivery; exactly four weekly deliveries; one prepaid purchase; no automatic renewal or weekly rebilling. |
| Subscription reservations | Reserve capacity for all four dates at enrollment. Hold the first delivery's ingredients at checkout. Starting preparation consumes that delivery's ingredients and attempts reservation for the next chronological unprepared delivery. Keep future requirements visible if stock is short. |
| Deferment | Maximum one successful deferment per subscription. Preserve original/replacement dates and allocations, the four-delivery count, and the fulfillment-order relationship. Reevaluate the next ingredient reservation chronologically after a date change. |
| Courier delivery | Owner books Lalamove after an eligible standard or subscription fulfillment order is Ready. Preserve one active booking per order. Track courier status separately from production status. |
| Custom cakes | Review and price designs manually. Preserve quotation versions. Acceptance does not confirm production; full QR Ph payment is still required. Use owner delivery or agreed pickup, never Lalamove cake dispatch. |
| Recipes | Track base ingredients and direct packaging materials. Do not introduce in-house dough, syrup, starter, or other prepared subassemblies as separate inventory items. |
| Scheduling | Keep standard, subscription, and custom-cake capacity independent. Apply capacity, inventory, blocked dates, lead times, and cutoffs together. Same-day fulfillment remains prohibited. |
| Existing commitments | Blocking a date, lowering a limit, or changing a subscription schedule must not erase or silently move existing commitments. |
| Roles | Financial/customer information is owner-only. Shared components and data responses must preserve staff restrictions. |

Chapter 3's older subscription-capacity wording needs separate documentation correction. Do not replace the already confirmed four-date capacity policy with week-by-week capacity booking.

### Shared records and interactions

- Use one shared dataset and one bakery-local date basis. An order reference must retain the same customer, contents, prices, fulfillment method/date, and statuses on every screen.
- Keep order, payment, courier, subscription-delivery, and quotation statuses separate. Friendly labels must map to their own ERD states; do not create extra database statuses from display headings.
- Bind selections and actions to stable record IDs. Updating a title is insufficient if quantities, details, or actions still belong to another record.
- Compose search, date, type, and status filters; then sort and paginate. Derive counters from a clearly labeled scope. Do not advertise records unavailable through the page controls.
- Replace placeholder links and routing alerts with navigation that retains the selected reference and relevant filter context.
- Save must validate and update the intended record before showing success. Cancel leaves saved data unchanged; Discard restores saved values. Failed saves retain entered values and offer retry.
- Disable duplicate submission while an action is processing. Demonstrate repeat-safe actions and stale-record handling using shared prototype state; enforce these authoritatively during backend integration.
- Support loading, empty, no-results, failed-load/retry, and relevant invalid-action states. Returning from a scenario must restore a usable screen.

### Presentation and prototype boundaries

- Standardize header/sidebar, page headings, cards, forms, badges, and dialogs with the existing application's visual system.
- Remove phase numbers, “engine synced” claims, and floating scenario controls from normal owner flows. Put test scenarios in a separate developer panel.
- Keep whole-page layouts within a 390 px viewport. Use contained table scrolling, stacked cards, and full-width mobile details where appropriate. Keep important actions visible at desktop widths too.
- Give controls accessible names, keyboard access, visible focus, and clear validation. Dialogs must support appropriate focus handling and dismissal without discarding edits unexpectedly.
- A generated prototype may simulate provider responses and retain data only locally, but it must change its demo records consistently. Document simulation/reset limits outside ordinary operational content.
- Do not claim actual payment verification, courier booking, notification dispatch, or persistence from an alert or timer. Production permissions, transactions, provider calls, and audit persistence remain implementation responsibilities.

## 6.1 — Owner Dashboard

### Retain

Operational summary cards, attention queue, today's fulfillment list, separate capacity summaries, inventory health, upcoming commitments, and recent orders.

### Revise

1. **Reconcile all records.** Replace the conflicting K406-1048 examples with one record shared by Orders, Details, Payments, Inventory, and Deliveries. Keep CAKE-087's fulfillment date consistent between today's queue and upcoming work.
2. **Derive totals.** Calculate due/ready/completed orders, stock alerts, and subscription deliveries from their actual records. Remove the “7 deliveries this week / next batch has 8” contradiction.
3. **Define each metric.** Distinguish fulfillment-date counts from payment-date totals. Count a prepaid subscription payment once; its weekly fulfillment records must not add the same payment to paid sales again.
4. **Correct capacity wording.** Remove “slot reserved for inquiries in review.” Show inquiries separately from confirmed allocations and valid temporary checkout holds. Display variety limits and unit limits without treating them as interchangeable.
5. **Separate status meanings.** Use Ready for production state and display pickup/courier context alongside it. Derive In Transit from courier status, not a new order status.
6. **Wire actions.** Payment issues open the correct payment/order; courier actions open the eligible dispatch; stock alerts open the affected ingredient; cake/subscription notices retain their references.
7. **Handle empty/error states.** Show no work/no alerts honestly. A failed load must not present stale totals as newly updated.

### Acceptance checks

- Following one order through all dashboard links preserves its identity and state.
- Preparing, readying, completing a pickup, booking delivery, and restocking update the relevant summaries.
- Inquiry submission alone does not reserve a production slot or add paid sales.

## 6.2 — Orders

### Retain

Search/filter layout, operational summary cards, separate payment/order status columns, subscription cycle labels, and fulfillment method distinctions.

### Revise

1. **Make quick filters functional.** Active, Needs Attention, Ready, and Completed must change the result set, not just button colors. Define which states each grouping contains.
2. **Compose controls.** Apply search, order type, status, fulfillment method/date, sorting, and pagination to the same dataset. Clear Filters restores the documented defaults.
3. **Cover all four order types.** Include Standard Purchase, Subscription Purchase, Subscription Fulfillment, and Custom Cake Purchase in this all-orders view. Identify subscription purchases as prepaid parent transactions without production actions; link their four fulfillments.
4. **Correct item summaries.** K406-1048's items must match its detail page. Distinguish line-item count from total sellable-unit quantity.
5. **Preserve resolution visibility.** Show Paid alongside Payment Resolution Required when applicable, without placing the order in normal production work.
6. **Map fulfillment labels correctly.** Owner Delivery is a cake-delivery display label, not a third `fulfillment_method` enum. Retain pickup/delivery in the underlying model.
7. **Connect record actions and counts.** View opens the selected order. Result/page totals reflect filters; a Completed row must not be described as an active order.

### Acceptance checks

- Selecting Completed removes non-completed rows; adding search narrows that same result set.
- A subscription purchase links to four weekly orders without offering Start Preparation on the purchase itself.
- List and detail views agree on items, prices, dates, customer, and state.

## 6.3 — Order Details

### Retain

Checkout price/address snapshots, item breakdown, payment information, status history, resource information, and the Ready-before-booking gate.

### Revise

1. **Complete status transitions.** Start Preparation and Mark Ready update the same order, its header, tracker, history, resource state, and linked views. Mark Ready must not leave a Preparing badge or omit the history event.
2. **Apply the shared stock workflow.** Preparation consumes reserved ingredients once. Block unsupported preparation when ingredients are insufficient. Readiness/completion must not deduct stock again.
3. **Render type-specific details.** Show the prepaid parent/cycle for subscription fulfillments, the four linked orders for subscription purchases, and accepted quotation/specification for cakes. Keep source references navigable.
4. **Show valid fulfillment actions.** Ready pickup orders can be completed after handoff. Ready eligible courier orders open 6.5 with the order selected. Custom cakes show owner delivery or pickup without courier controls; owner-delivery completion must reflect actual handoff, not quotation acceptance.
5. **Preserve snapshots.** Later customer-address or product-price changes must not rewrite this order's purchased details.
6. **Keep history accurate.** Record actor and timestamp for status changes. A combined activity feed may include payment events, but do not store them as invented order statuses.
7. **Cover exceptional states.** Include pending payment, payment resolution, cancelled, completed, not found, loading, failed save, and stale status. Disable actions inappropriate to those states.

### Acceptance checks

- Preparing → Ready updates the header, history, queue, and dashboard while preserving all order details.
- Courier booking is unavailable before Ready and never appears for custom cakes or pickups.
- Repeating readiness/completion does not consume more ingredients or duplicate the transition.

## 6.4 — Payments / Payment Issues

### Retain

QR Ph/PayMongo terminology, attempt history, provider references, amounts, timestamps, error details, and checkout-hold information.

### Revise

1. **Separate receipt from operational confirmation.** Show payment status, order status, and hold state independently. Replace unconditional “capacity and schedule verified” copy with the actual resource outcome.
2. **Add a paid-resolution scenario.** Demonstrate a paid attempt whose hold expired or whose resources could not be secured. Explain the specific issue and link to the order/affected resource. Keep production blocked while unresolved.
3. **Avoid invented recovery actions.** Do not add refund, mark-paid, or force-confirm buttons. The owner's permitted resolution workflow remains a decision listed below; provide accurate inspection/navigation now.
4. **Preserve attempt-to-hold history.** Show each attempt's own reference, amount, timestamps, outcome, and related hold. A retry has a fresh validated hold; do not overwrite earlier attempts.
5. **Cover canonical states.** Include cancelled payments and distinguish expired holds from explicitly released holds. Keep Needs Attention as an operational grouping, not a gateway status.
6. **Implement date controls and pagination.** Custom Range needs actual start/end inputs. Combine date, search, type, status, and sort, with counts derived from results.
7. **Reconcile linked fixtures.** K406-1052 must have the same customer, amount, and payment/operational state as Orders. Keep provider success and notification-delivery success separate.

### Acceptance checks

- A paid-resolution case remains visibly Paid but cannot be mistaken for a confirmed production order.
- Failed/expired attempts remain in history after a retry, each with its correct hold.
- Date filters change results, and all displayed pages are reachable.

## 6.5 — Deliveries / Courier Booking

### Retain

Ready-to-book queue, owner booking confirmation, checkout destination/fee snapshot, issue handling, and courier status timeline.

### Revise

1. **Remove copied payment code.** Delete the unrelated payment dataset/render/filter functions from this screen. Give delivery handlers their own module scope so they cannot be overwritten by payment handlers.
2. **Restore badges and tabs.** Render every row's delivery status and make courier tabs filter the delivery dataset without browser exceptions.
3. **Enforce eligibility.** Book only Ready standard/subscription fulfillment orders with confirmed prepaid coverage and valid delivery details. Exclude pickup, cake delivery, subscription purchase parents, and payment-resolution cases.
4. **Use the same order/date as Details.** An order Preparing for October 6 must not be dispatchable on October 4 in another screen. Confirm the selected recipient/order in the booking dialog.
5. **Prevent duplicate booking.** Disable submission during processing; recheck for an existing active booking. Distinguish provider failure from an unknown/pending response so retry does not blindly create a second booking.
6. **Normalize courier state.** Store Pending, Booked, In Transit, Delivered, Failed, and Cancelled using the ERD values. Ready to Book is derived from readiness plus delivery state; Issues is a filter group.
7. **Make simulation honest.** Use clearly documented demo responses during UI revision. Remove unsupported “webhook sync active” claims; Refresh must show the latest available response, loading, and failure states rather than unconditional success.
8. **Keep tracking in scope.** Use status history and booking references. Do not add live rider-location tracking or courier dispatch for custom cakes.

### Acceptance checks

- Page load and all status tabs produce no exceptions or blank status cells.
- Repeated confirmation creates one active booking for the selected order.
- A failed booking remains retryable only after checking current booking state; a successful booking updates the dashboard/details.

## 6.6 — Inventory

### Retain

Physical/reserved/available/threshold columns, owner-visible costs, ingredient details, future requirements, movement history, and restock/adjustment forms.

### Revise

1. **Bind the entire view to the ingredient.** Selecting Eggs must load its piece unit, quantities, cost, commitments, product usage, history, and modal data. Remove butter-specific constants from generic handlers.
2. **Record actual changes.** Successful restocks/adjustments update physical stock, derived availability/status, movement history, and affected views. Attribute each movement to the actual account and retain its operation identity.
3. **Validate quantities and units.** Restock is positive and finite; physical stock can be zero but not negative. Preview the signed change and resulting physical balance using the selected ingredient's unit.
4. **Allow truthful shortage recording.** If damage/spoilage leaves physical stock below reservations, record reality and flag affected commitments. Do not discard reservations or reject a real count solely to preserve apparent coverage. Show negative available quantity as a shortage or explicitly display the deficit separately.
5. **Separate forecasts from reservations.** Identify which requirements are already reserved and which are future/unreserved. Do not subtract the same requirement twice. Show due dates and projected reservation timing where supported.
6. **Apply the subscription policy.** Display all future requirements, with only the appropriate next delivery reserved. Starting preparation/restocking can advance or retry reservation; a future projected date alone does not consume stock.
7. **Fix ledger and summaries.** Include Consumption Reversal where applicable, actual actors, linked fulfillment orders/reservations, and accurate shortage counts/date ranges. Never automatically restore consumed ingredients just because an order was cancelled.
8. **Keep costs consistent.** Owner-entered inventory costs feed recipe suggestions without automatically changing active selling prices. Do not introduce a new historical costing method implicitly; missing cost data must remain explicit.

### Acceptance checks

- A 10 kg restock adds exactly 10 kg and one movement, including after a repeated submission.
- Switching Butter → Eggs replaces all ingredient-specific data and units.
- A count below reservations creates a visible shortage without erasing commitments; all shortage totals agree.

## 6.7 — Recipes & Costing

### Retain

Variant recipes, material quantities/costs, packaging, utility overhead, global markup, suggested price, owner-set price, estimated margin, and missing-data states.

### Revise

1. **Flatten prepared components.** Replace Brioche Dough Base, Babka Dough, and in-house syrup with their constituent raw ingredients. Separate salt and yeast unless a documented purchased premix is the actual inventory item. Avoid double counting constituents.
2. **Bind recipe rows to inventory IDs.** Use each selected ingredient's unit and cost; convert compatible units explicitly. Merge or reject duplicate ingredients to preserve one `(variant_id, inventory_id)` pair.
3. **Save the edited BoM.** Read selected ingredients and quantities, validate positive finite amounts, update the chosen variant, and rerender the saved values. Changing flour from 550 g to another quantity must change requirements and costs.
4. **Use one costing formula.** Materials = sum of normalized quantity × unit cost. Production cost = materials + effective utility overhead. Suggested price = production cost × (1 + markup/100). Estimated margin = (selling price − production cost) / selling price × 100 for a positive selling price.
5. **Handle zero and invalid values deliberately.** Do not replace zero with default markup/overhead through truthiness checks. Permit explicit zero where applicable; reject negative/nonfinite charges and show validation instead of silently substituting values.
6. **Recalculate every affected view.** Settings, recipe, inventory cost, and overhead changes update table costs/margins and the inspector. Remove the hardcoded ₱91.37 table-margin calculation.
7. **Keep price approval explicit.** Recalculation changes suggestions only. Update Selling Price changes the selected variant after owner confirmation and must not rewrite existing order/quotation price snapshots.
8. **Preserve missing-data behavior.** Missing recipe/cost prevents a complete cost/margin claim. Add real search, category/status filters, sorting, pagination, and working Inventory links.

### Acceptance checks

- The reference example remains ₱66.37 + ₱25 = ₱91.37; 30% markup yields ₱118.78; ₱160 selling price gives 42.9% estimated margin.
- Saving recipe quantities or overhead updates all matching table/detail values; the active selling price stays unchanged until explicitly saved.
- Zero markup remains zero, and duplicate ingredients cannot silently double-count consumption.

## 6.8 — Custom Cake Requests

### Retain

Request inbox, original specifications, add-ons, reference images/notes, preliminary estimate, feasibility checks, rejection, and quotation history.

### Revise

1. **Remove copied recipe content.** Delete the unrelated recipe/pricing modals, dataset, and handlers. Restore request-specific loading/empty/error functions without global-name collisions.
2. **Render the selected request completely.** Selection updates reference, customer, specifications, image/notes, date/window, fulfillment, estimate, feasibility, history, and actions together.
3. **Target rejection correctly.** Reject the selected request through its ID, update its actual status, and refresh filters/counts. Do not hardcode CCR-1048 or only change a badge.
4. **Correct payment copy.** Replace “Pending deposit” and “Accepted: confirmed” with the actual quotation/payment context. Accepted but unpaid means awaiting full QR Ph payment, not confirmed production.
5. **Cover request lifecycle.** Include Pending Review, Negotiating, Quoted, Accepted, Rejected, and Expired using ERD mappings. Keep request status distinct from the subsequent order's production state.
6. **Connect quotations.** Create Quotation opens 6.9 for this request; existing requests show their actual versions and accepted version. Preserve the original submission when negotiation produces a revised quotation.
7. **Derive feasibility.** Show current weekly/daily cake capacity, blocked-date, lead-time, and configured-material checks with reasons for failure. Keep design feasibility and complexity as owner decisions.
8. **Align production references.** Display the references available from the existing customer flow and provide access to the original submission. Keep any owner-approved staff production copy distinct; its final schema is a decision below.

### Acceptance checks

- Selecting Angela after Maria changes all details and quotation/rejection targets to Angela's request.
- Rejection updates the selected record and counts without changing another request.
- All request scenarios load without recipe-related errors; unpaid acceptance never appears as paid production.

## 6.9 — Custom Cake Quotation Builder

### Retain

Original request snapshot, options/add-ons breakdown, manual complexity charge, owner delivery fee, internal cost guidance, preview, expiry, and version history.

### Revise

1. **Keep the request identity intact.** Use the request selected in 6.8, including its customer, references, options, add-ons, and requested arrangements. Avoid a new unrelated reference for the same example.
2. **Validate inputs.** Require valid date/window/method and applicable destination. Reject negative/nonfinite complexity or delivery fees; allow zero where valid. Do not use negative charges as discounts.
3. **Synchronize the preview.** Date, time window, fulfillment method, destination, charges, total, and confirmation dialog must reflect current edits. Pickup removes the delivery charge and destination from the customer quotation.
4. **Show current feasibility.** Revalidate scheduling/material context and explain conflicts. Do not promise a guaranteed slot merely because a quotation was issued. Checkout must revalidate and hold resources before payment confirmation.
5. **Issue a real prototype version.** Store an issued quotation snapshot, version number, timestamps/expiry, and linked request status. Show the new version in history. A revision creates a new version and preserves earlier versions with appropriate statuses.
6. **Lock accepted content correctly.** Disable editing of the accepted version; revised offers follow the version workflow. Replace “Accepted & Production Locked” with separate quotation acceptance and payment/order status.
7. **Keep notification outcomes distinct.** Issued quotation and customer notification delivery are separate outcomes. A failed notification must not claim delivery or cause a duplicate quotation on retry.
8. **Remove unsupported claims.** Delete “Verified Mobile” and “chilled climate control” unless independently supported by agreed features/data. Keep original customer requests and approved production instructions clearly distinguished.

### Acceptance checks

- ₱1,850 selections + ₱650 complexity + ₱250 delivery = ₱2,750; pickup gives ₱2,500 and removes delivery wording.
- Negative complexity cannot be issued; changing a time window updates the preview and saved snapshot.
- Issuing creates a version; revising preserves the earlier one; acceptance alone does not confirm production.

## 6.10 — Subscriptions

### Retain

Fixed prepaid commitment list, product/variant and quantity, four-delivery timeline, linked purchase/fulfillment orders, progress, address, and deferment date context.

### Revise

1. **Normalize payment methods.** Replace direct GCash/Maya/bank-transfer fixture labels with QR Ph via PayMongo. An app used to scan QR Ph is not a separate platform payment method.
2. **Separate enrollment from subscription lifecycle.** Pending Payment belongs to an unconfirmed purchase/enrollment preview. Actual subscriptions use Active, Completed, or Cancelled; previews must not count as active production commitments.
3. **Use consistent dates and totals.** Completed deliveries cannot occur after the shared current date. Calculate product total from quantity × unit price × four and delivery total from the four fee snapshots. Never rebill weekly fulfillments.
4. **Update real records on deferment.** Validate current eligibility, update the affected scheduled date/linked fulfillment, preserve its original date, release/replace its capacity allocation, and recalculate chronological ingredient reservation timing. Keep exactly four deliveries.
5. **Demonstrate both supported deferment options.** Cover next-day and next-week behavior under the established customer rules, including unavailable dates, cutoff failure, and an already-used allowance. Do not invent a new interpretation of next-week scheduling from the display label alone.
6. **Remove fixed validation assertions.** Evaluate capacity, inventory under the rolling policy, blocked dates, and timing from the shared records. A failed replacement must leave the original commitment unchanged and consume no successful-deferment allowance.
7. **Separate pending approval from successful deferment.** If manual review is retained, label it as the unresolved workflow/model choice below. Never store pending/rejected requests as successful `SubscriptionDeferment` records or use one global approval flag across subscriptions.
8. **Compose filters and restore views.** Search, status, product, delivery timing, sort, and pagination work together. Empty/loading demonstrations must return to a usable populated view. Links open the correct purchase, fulfillment, calendar, or schedule.

### Acceptance checks

- Completed + search for an Active customer returns no matching subscription, rather than overriding the status filter.
- Successful deferment updates the calendar/order and retains four deliveries; repeated submission does not consume a second allowance.
- An unavailable replacement leaves the original allocation/date intact; all unpaid previews remain outside active counts.

## 6.11 — Capacity Calendar

### Retain

Three independent capacity pools, standard variety/unit limits, weekly product subscription limits, cake limits, temporary holds, blocked dates, and selected-date details.

### Revise

1. **Use real date selection.** Every calendar date loads its own allocations and related week. Today and previous/next controls follow the selected day/week/month mode and shared date basis.
2. **Calculate available capacity.** Sum relevant active held and confirmed allocations once. Show held versus confirmed quantities clearly; subtract their combined usage from the configured limit. Released/expired holds must no longer reduce availability.
3. **Recompute after settings changes.** Update remaining quantities, badges, calendars, and summaries for all pools. Preserve existing commitments when lowering a ceiling; show over-limit usage and block additional bookings rather than deleting allocations.
4. **Respect product grouping.** Standard variety limits count products, with quantities aggregated across applicable variants. Subscription limits apply per product/week. Do not treat each customer order or variant as a new independent variety quota.
5. **Separate cake day/week counts.** Show one booked cake on each occupied date and the aggregate weekly usage. Preserve the different-fulfillment-date rule; do not show two same-day cakes as an ordinary valid default example.
6. **Remove unsupported recurring closures.** Off/Rest/Prep Only must not silently block standard fulfillment because of a subscription preparation schedule. Use actual blocked dates or an explicitly agreed scheduling model.
7. **Expose linked commitments.** Show all four subscription allocations and deferment replacements with correct source/purchase/fulfillment references. Link cake allocations to the actual order and quotation, not a request mislabeled as an order.
8. **Clarify full versus partially available.** A full variety count blocks a new variety, not necessarily additional units of an existing variety with remaining capacity. Ingredient shortages can still block an otherwise available slot.

### Acceptance checks

- Selecting October 9 never displays October 6's inspector data.
- With a limit of 20, 8 confirmed units, and 1 separate held unit, remaining capacity is 11. If the displayed allocated total already includes the held unit, label that total and do not subtract it twice.
- Lowering limits preserves existing allocations; expired holds release capacity; blocking/unblocking does not remove commitments.

## 6.12 — Blocked Dates / Scheduling

### Retain

Blocked-date calendar/registry, reason and creator details, existing-commitment warning, separate lead-time/cutoff rules, and product/fallback subscription schedules.

### Revise

1. **Separate blocks from commitments.** Read commitment counts from orders/allocations independently of `BlockedDate`. Removing a block must leave the same scheduled orders visible.
2. **Implement actual add/edit/remove.** Add Blocked Date opens a date picker, not hardcoded December 31. Enforce one block per date; update calendar, registry, count, reason, and actor/date after each successful change.
3. **Make navigation work.** Previous/next month and Today show the actual selected range. Display zero, three, or any other commitment count from data instead of hardcoded cell text.
4. **Separate Save from Discard.** Save validates and updates scheduling configuration. Discard restores saved inputs. Failed saves retain edits and a visible error; no action should merely hide an unsaved banner.
5. **Validate timing rules.** Apply lead value/unit and cutoff to the correct order type. Selecting Hours must not bypass the no-same-day rule. Keep chosen demo values distinct from fixed system requirements.
6. **Save subscription schedules.** Add/edit must update product scope, preparation day, fulfillment day, and active status. Activate/Deactivate must affect future eligible offerings. Show product-specific versus fallback application clearly.
7. **Protect existing subscriptions.** Schedule edits must not silently move their four stored fulfillment dates or erase commitments. Show affected active subscriptions and direct intentional changes through the permitted workflow.
8. **Propagate configuration.** Calendar, dashboard, subscription offerings, and customer date eligibility must use the saved rules. Unblocking a date does not bypass capacity, stock, lead-time, or cutoff checks.

### Acceptance checks

- Unblocking a date with three commitments leaves three commitments visible and removes its registry block.
- Saving changes updates configuration; discarding restores the old values; cancelled dialogs change nothing.
- Creating/activating a schedule updates future offerings without moving existing subscription deliveries.

## Decisions and documentation alignment

These items must remain explicit; the UI generator must not resolve them by inventing functionality. They do not prevent the independent revisions above.

| Item | What can be revised now | Decision or alignment needed before completing the workflow |
| --- | --- | --- |
| Deferment approval | Correct timelines, validation, single-success allowance, and replacement allocation behavior. | Decide whether valid customer deferments complete automatically or require owner approval. If approval is required, define pending/rejected request storage separately from successful deferments. |
| Paid payment-resolution cases | Show payment receipt, unconfirmed order/resources, issue reason, and linked records accurately. | Define permitted owner recovery actions without introducing refunds or an unchecked force-confirm action. |
| Negotiated cake instructions/references | Preserve original submissions, quotation history, accepted specifications, and owner-only customer data. | Align multiple references and the owner-approved staff production copy with the final schema and customer revision workflow. |
| Earlier chapter wording | Follow confirmed four-date capacity and rolling ingredient reservation policy. | Update capacity/physical-deduction wording separately; do not reverse the confirmed policy to match older prose. |

## Delivery checklist

- [ ] All 12 subphases follow their Retain, Revise, and Acceptance sections.
- [ ] Deliveries and Custom Cake Requests no longer contain unrelated copied scripts or browser exceptions.
- [ ] One coherent dataset/clock supports all cross-screen navigation and counts.
- [ ] Payment, quotation, inventory, subscription, and delivery rules match the shared requirements.
- [ ] Selecting and saving records changes the correct record and all relevant views.
- [ ] Capacity, deferments, blocks, and schedules preserve existing commitments.
- [ ] No success message masks a no-op or failed action.
- [ ] Filters, date navigation, sorting, pagination, and recovery states work.
- [ ] Desktop and 390 px mobile views keep primary controls usable without whole-page overflow.
- [ ] Prototype simulation limits and unresolved decisions are documented accurately.

Prioritize copied-script removal, business-rule corrections, shared record consistency, and misleading save/selection behavior before visual polish. During integration, verify owner permissions, persistent audit records, provider outcomes, and transactional resource changes separately from the generated UI.
