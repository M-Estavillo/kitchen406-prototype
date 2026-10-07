# Phase 6 — Owner Operations UI Review

Reviewed: October 6, 2026  
Scope: All 12 uploaded Phase 6 subphases, 6.1–6.12.

## Overall assessment

**The generator covered the correct operational areas and produced useful screen layouts, but Phase 6 is not yet a reliable functional prototype.** Keep the overall module structure and much of the information hierarchy. Correct the business-rule contradictions, copied scripts, misleading selection/save behavior, and inconsistent records before integrating these screens into the existing system.

The strongest design choices are separate payment/production information, owner-triggered courier booking, physical/reserved/available inventory columns, owner-controlled pricing, quotation itemization, four-delivery subscription timelines, and separate capacity pools. These are worth retaining.

The most consequential problems are:

1. Deliveries and Custom Cake Requests contain unrelated copied scripts that cause browser errors and override their own functions.
2. Different screens give the same order reference different customers, contents, dates, payment states, and fulfillment states.
3. Custom cake copy introduces deposits and sometimes equates quotation acceptance with production confirmation.
4. Recipe fixtures include prepared dough components, contrary to the single-level raw-ingredient scope.
5. Subscription payment fixtures introduce direct wallet/bank-transfer labels instead of consistently identifying QR Ph.
6. Several selections and save actions leave underlying data unchanged while the interface suggests otherwise.
7. Capacity and scheduling displays do not consistently preserve or recalculate commitments.

This report evaluates the **uploaded generator output**, not the already implemented customer/staff application. No application code or chapter files were changed.

## Review basis and method

Read the chapter text and the standalone ERD before reviewing Phase 6:

| Source | How it informs this review |
| --- | --- |
| [Chapter 1](<../Chapters/Chapter 1.md>) | Scope and limitations: full prepayment, QR Ph only, four-delivery subscriptions, single-level ingredients, owner-only financial information, manual cake delivery, no discounts or same-day fulfillment. |
| [Chapter 2](<../Chapters/Chapter 2.md>) | Rationale for integrated ordering, recipes, inventory, costing, and owner decision support. Features of the related commercial systems are not automatically Kitchen406 requirements. |
| [Chapter 3](<../Chapters/Chapter 3.md>) | Cost formula, independent capacity limits, role separation, gateway confirmation, and courier booking/tracking. |
| [Chapter 4](<../Chapters/Chapter 4.md>) | Proposed workflows, ERD explanations, and owner use cases, especially Figures 19–21 and 25–31. Existing manual processes in Figures 1–4 are background, not instructions to retain manual payment verification. |
| [ERD](../Chapters/ERD.md) | Entity relationships, canonical statuses, snapshots, quotation versions, reservations, movements, and uniqueness rules. |
| [Phase breakdown](../Phases.md) | The detailed 6.1–6.12 list defines this review's coverage. Products, accounts, moderation, marketing, and detailed reports remain Phase 7. |
| [Previously documented decisions](phase-5-paper-revisions.md) | The confirmed policy reserves capacity for all four subscription dates, reserves ingredients initially for the first delivery, and advances ingredient reservations as preparation progresses. |

Opened all 12 `code.html` pages in local Chrome, inspected their rendered desktop screens and source, checked document overflow at a 390 px viewport, and exercised selected primary interactions. Source line numbers below refer to the uploaded HTML files. The separate `screen.png` exports are not proof that the corresponding controls work.

These are standalone browser prototypes. Missing real authentication, database transactions, PayMongo/Lalamove connections, and actual notifications are **implementation work**, not automatically errors in a UI concept. However, wrong business rules, runtime exceptions, actions affecting the wrong record, and visible results inconsistent with entered values are defects even in a prototype. Browser checks here do not establish production readiness or exhaustive accessibility coverage.

### Requirements that need careful interpretation

- **Subscription capacity:** Chapter 3 describes week-by-week capacity consumption, but the earlier documented user decision reserves all four dates. Use that confirmed decision for implementation; update Chapter 3 separately. Do not reopen this as an unresolved policy question.
- **Stock reservation versus physical consumption:** Some chapter prose says stock is deducted on confirmation. Chapter 4 and the ERD distinguish requirements, reservations, and physical movements; the documented implementation consumes stock when preparation starts. Owner screens must preserve that distinction.
- **Cake pickup:** Chapter 1 describes manual owner delivery; the ERD permits `pickup` and `delivery` for cake requests/quotations. Pickup is therefore not classified as an invented feature here. Courier booking for custom cakes remains outside scope.
- **Deferment approval:** Chapter 4 says owners can process deferment requests, so an owner review interface is defensible. The ERD's `SubscriptionDeferment` records a successful replacement and has no pending/rejected review lifecycle. An approval queue needs an explicit model decision; it must not silently redefine the existing successful-deferment entity.
- **Reference images:** Chapter 4 requires a reference image while the ERD allows a nullable `img_url`; existing implementation documentation also discusses multiple images and an owner-approved production copy. Treat those as documentation/schema alignment work, not proof that Phase 6's single-image display is sufficient for integration.

## Subphase review

### 6.1 — Owner Dashboard

**Source:** [Owner Dashboard][p61]. **Verdict:** Useful overview; inconsistent operational facts.

**What it did right**

- Prioritizes orders due, readiness, issues, inventory health, and paid sales.
- Brings payment issues, custom requests, deferments, stock concerns, and courier actions into one owner workspace.
- Separates standard, subscription, and cake capacity summaries; identifies manual owner delivery for cakes.
- Keeps sensitive financial/customer information on the owner side, consistent with Chapter 1's role boundary. This is appropriate presentation, not proof of access enforcement.

**What it did wrong or left incomplete**

- **High — Contradictory order identity:** K406-1048 is Andrea M.'s unpaid ₱1,280 order here (lines 681–702), but Maria Santos's paid ₱1,420 order in Orders/Order Details. The owner cannot follow an issue reliably across screens.
- **High — Unpaid inquiries appear to reserve capacity:** “Slot reserved for inquiries in review” (line 526) conflicts with the checkout-hold/payment-confirmation workflow. A pending inquiry is not a confirmed capacity commitment. Label it as an inquiry or explicitly identify a valid temporary checkout hold.
- **Medium — Counts and dates do not reconcile:** “7 Deliveries This Week” is followed by a next batch of 8 deliveries (lines 622–624). Today's queue contains CAKE-087 while the upcoming list puts the same reference on October 8. Use one fixture date and one shared dataset.
- **Medium — Navigation is largely placeholder:** Operational links are mostly `href="#"`; the implemented script principally filters recent-order rows (lines 842–864). Quick actions need actual destinations with the correct record context.
- “Ready to Dispatch,” “Ready for Pickup,” and “Out for Delivery” can be display labels, but must derive from canonical order status plus fulfillment/courier state. Do not introduce them as new `Order.status` values.

**Required correction:** Derive the dashboard from the same records used in 6.2–6.12, define each counter's date/status basis, and connect attention actions to the relevant record.

### 6.2 — Orders

**Source:** [Orders][p62]. **Verdict:** Mostly correct information design; controls are largely cosmetic.

**What it did right**

- Separates order status from payment status, including the important paid-but-`payment_resolution_required` case.
- Identifies standard purchases, weekly subscription fulfillment, and custom cakes; shows subscription week numbers and prepaid labeling.
- Offers relevant search, type, status, method, and fulfillment-date controls.
- Distinguishes pickup, courier delivery, and owner delivery in owner-facing language.

**What it did wrong or left incomplete**

- **High — Filters do not filter:** `setActiveFilter()` changes button styling without applying `filterKey` (lines 829–842). Clicking Completed leaves the same rows visible. Search, select filters, sorting, and pagination are not backed by a complete query/render flow.
- **High — List/detail disagreement:** K406-1048 contains Sourdough Loaf here (lines 475–485), but Pandesal, Cinnamon Rolls, and Brownies in 6.3. Matching totals do not make the records consistent.
- **Medium — Incomplete order-type coverage:** The all-orders type selector omits `subscription_purchase`, one of the ERD's four order types. Either include prepaid purchases with appropriate non-production context, or explicitly define this as a fulfillment-only view and provide access to purchase records elsewhere.
- The “active orders” footer includes a completed row and fixed totals. Counts should reflect the actual selected filter and dataset.

**Required correction:** Make every filter compose with the others, connect View to record-specific details, and distinguish subscription purchase orders from their four operational fulfillment orders.

### 6.3 — Order Details

**Source:** [Order Details: K406-1048][p63]. **Verdict:** Good paid standard-delivery example; incomplete state transition and order-type coverage.

**What it did right**

- Shows checkout price/address snapshots, the customer, payment reference, fulfillment date, and status history.
- The line arithmetic is correct: ₱320 + ₱480 + ₱520 = ₱1,320; adding ₱100 delivery gives ₱1,420.
- Separates confirmed capacity from ingredients already issued to production.
- Disables Lalamove booking while Preparing and exposes it after Mark Ready, matching Chapter 4 Figure 28.

**What it did wrong or left incomplete**

- **High — Mark Ready leaves conflicting status information:** `confirmOrderReady()` updates the action button, tracker styling, and courier card, but does not update the header's Preparing badge or append a Ready history event (lines 724–757). The displayed transition is only partial.
- **Medium — Only one scenario is represented:** Missing record-specific detail states include unpaid/resolution cases, pickup completion, prepaid weekly delivery context, and accepted custom quotation/manual cake fulfillment. This is a coverage gap, not a demand for separate pages for each type.
- **Medium — Courier handoff is an alert:** `triggerLalamoveBooking()` only shows a message (line 760); it does not open 6.5 with the order selected.
- Header time is October 4 while preparation history is already October 6. Align the demo clock and records.

**Required correction:** Render all status/history/resource information from the updated order and support the relevant order-type and fulfillment variants. Keep `OrderStatusHistory` distinct from payment events even if both appear in a combined activity feed.

### 6.4 — Payments / Payment Issues

**Source:** [Payments][p64]. **Verdict:** Good payment-monitoring foundation; the crucial resolution case is missing.

**What it did right**

- Uses QR Ph/PayMongo terminology, payment attempt history, references, amounts, timestamps, errors, and checkout-hold information.
- Distinguishes pending, paid, failed, and expired payments; allows searching/filtering the sample data.
- Explains that pending/failed/expired attempts do not confirm an order and that customers initiate payment retries.
- Does not introduce refunds or a manual “mark paid” control, consistent with the ERD and gateway confirmation rule.

**What it did wrong or left incomplete**

- **High — Paid is treated as proof that resources are secured:** The paid drawer always says capacity and schedule are verified (lines 945–954). Yet `Order.status=payment_resolution_required` exists precisely because money can be received without successful operational confirmation. Show payment receipt and order/resource resolution independently.
- **High — The issue list does not demonstrate that case:** “Needs Attention” is attached to failed/expired fixtures. It is not a substitute for an explicit paid + resolution-required record, explanation, and permitted next step. Do not invent a refund workflow to fill this gap.
- **Medium — Date filter and pagination are decorative:** `applyFilters()` reads search, order type, and sorting but not the date selector (lines 707–784). Pagination counts advertise 21 transactions while only five fixtures are rendered.
- **Medium — Hold states are flattened:** Anything other than Active/Confirmed is displayed as Released (lines 1008–1068), losing the ERD distinction between released and expired holds. Cancelled payment coverage is also absent.
- K406-1052 is Claire D.'s failed ₱860 payment here, but Nina Garcia's paid/resolution-required ₱1,180 order in 6.2.

**Required correction:** Add the explicit payment-resolution view, preserve gateway truth, show canonical order and hold state, and link each attempt to its own checkout hold and purchase order.

### 6.5 — Deliveries / Courier Booking

**Source:** [Deliveries][p65]. **Verdict:** Appropriate scope; broken script composition prevents dependable use.

**What it did right**

- Limits the courier queue to standard and subscription deliveries, excluding custom cake delivery.
- Uses confirmed destination details and the prepaid delivery fee.
- Provides an owner booking confirmation, failed-booking retry, delivery details, and a status timeline.
- Explains status updates from Lalamove without adding a live rider-location map.

**What it did wrong or left incomplete**

- **High — Payment-page code overrides delivery functions:** A second script beginning at line 991 contains `PAYMENTS_DATA` and redefines `renderStatusBadge()` and `setTabFilter()`. Chrome throws a null-field error at line 1171 during initialization. Clicking a courier tab reaches the payment filter and throws again.
- **High — Courier status cells render blank:** The overridden badge function expects a payment status string while the delivery renderer passes a delivery object. Confirmed in the rendered table.
- **High — Incompatible shared fixture:** K406-1048 is ready for delivery on October 4 here, but Preparing for October 6 in 6.3. K406-1052 is dispatchable/retryable here but requires payment resolution in 6.2. These examples undermine the booking gate.
- **Prototype limitation — Booking and refresh are simulations:** Booking sets `status='booked'` and invents a random tracking reference; Refresh waits then rerenders (lines 959–979). “Automated Lalamove webhook sync active” should be identified as demo copy until connected.
- UI group names such as Ready to Book/Issues are useful, but store the ERD delivery states (`pending`, `booked`, `in_transit`, `delivered`, `failed`, `cancelled`) separately from order readiness. The current `ready`/`transit`/`issues` fixture values need an adapter or normalization.

**Required correction:** Remove the copied payment script, isolate delivery functions, bind to actual ready/paid eligible orders, and model one active booking per order with repeat-safe retry behavior.

### 6.6 — Inventory

**Source:** [Inventory][p66]. **Verdict:** Strong column structure; misleading details and stock operations.

**What it did right**

- Separates physical stock, reserved stock, available stock, threshold, unit cost, and availability.
- Shows future requirements and shortages separately from the movement ledger.
- Includes restocks, consumption, adjustments, reasons, related orders, and the person/system responsible.
- Explains how insufficient ingredients affect products; packaging appears as a direct inventory material.

**What it did wrong or left incomplete**

- **High — Selecting another ingredient only changes the title:** `selectIngredient()` leaves butter's units, quantities, cost, commitments, and products in place (lines 556–565). Selecting Eggs shows kilograms and ₱420/kg. Movement calculations also hardcode butter's 5.0 physical/3.8 reserved quantities (lines 652–674).
- **High — Stock submission records nothing:** `submitMovement()` only closes the dialog (lines 676–678); the stock table and ledger do not change.
- **High — The stated physical-adjustment rule is wrong:** The modal says stock cannot be reduced below reserved stock (line 480). Spoilage/theft can physically leave less than the reserved quantity. Record the real nonnegative count, retain an audit trail, flag affected commitments, and prevent unsupported preparation/new reservations. The current code merely displays the warning; it does not implement a valid stock-adjustment workflow either.
- **Medium — Shortage basis is ambiguous:** Butter's 4.1 kg requirement is compared against 1.2 kg available, but some listed commitments may already be included in 3.8 kg reserved. Explicitly separate reserved requirements from additional unreserved demand to avoid counting reservations twice. This is a clarification needed in the presentation, not a proven arithmetic error without the missing allocation links.
- **Medium — Conflicting totals:** The summary shows one upcoming shortage while three shortage cards appear. Butter's listed next-seven-day commitments include October 9, but the 4.1 kg aggregate says needed by October 7.
- Movement history lacks a consumption-reversal example/filter, which the ERD supports. Generic “Owner” should resolve to the actual acting account in a multi-owner audit trail.

**Required correction:** Bind detail/modal data to inventory IDs, record real movements, keep quantity units consistent, distinguish future unreserved needs, and reuse the established reservation/consumption policy.

### 6.7 — Recipes & Costing

**Source:** [Recipes & Costing][p67]. **Verdict:** Correct pricing concept; invalid recipe examples and incomplete saves.

**What it did right**

- Supports variant recipes, direct packaging materials, unit quantities/costs, utility overhead, global markup, and owner-set final prices.
- Clearly separates suggested price from active selling price.
- Correctly calculates the Sourdough example: materials ₱66.37 + overhead ₱25 = ₱91.37; 30% markup gives ₱118.78; at ₱160 selling price, estimated margin is 42.9%.
- Shows missing-recipe and missing-cost states rather than presenting incomplete costs as complete estimates.

**What it did wrong or left incomplete**

- **High — Prepared components violate the stated inventory scope:** Cinnamon uses “Brioche Enriched Dough Base” (line 1162); Babka uses “Enriched Babka Dough” and “Simple Sugar Syrup” (lines 1186–1189). Kitchen406 does not track in-house prepared subassemblies. Expand these into base ingredients. Combined salt/yeast lines should likewise reference separately tracked ingredients unless an actual purchased premix is explicitly intended.
- **High — Save Recipe ignores the edited recipe:** `saveRecipeBOM()` validates positive quantities, closes, and rerenders the unchanged data (lines 1506–1520). Changing flour to 999 still leaves the stored/displayed recipe at 550 g.
- **Medium — Invalid/zero pricing inputs are mishandled:** `parseFloat(...) || default` silently converts zero markup/overhead to 30%/₱25 (lines 1401–1402, 1455). Negative settings are not consistently rejected. Define valid bounds and distinguish zero from missing input.
- **Medium — Master table and inspector diverge:** Settings/overhead changes update the inspector without recomputing every table row. Selling-price updates calculate the Sourdough table margin using hardcoded ₱91.37, even after overhead changes (lines 1436–1444).
- **Medium — Ingredient selectors are not reliable material bindings:** Added rows use hardcoded units/rates; saves do not enforce the ERD's unique `(variant_id, inventory_id)` recipe pair. Repeated ingredients should be merged or rejected.

**Required correction:** Use raw inventory IDs and unit conversions, persist recipe quantities, recompute all affected displays from one formula, and retain explicit owner approval of final prices.

### 6.8 — Custom Cake Requests

**Source:** [Custom Cake Requests][p68]. **Verdict:** Good review content; high-priority selection and script defects.

**What it did right**

- Preserves the original customer submission, options, add-on quantities, reference image, notes, requested date/window, and destination.
- Separates preliminary estimate from the owner quotation and provides a quotation-history area.
- Presents capacity, blocked-date, lead-time, and ingredient checks while retaining manual owner judgment of design feasibility.
- Includes request rejection and a path toward quotation creation.

**What it did wrong or left incomplete**

- **High — Unrelated recipe code is appended:** Recipe modals start at line 1077 and recipe scripts at line 1354. The duplicate `setSimulatorState()` replaces the request function. Chrome errors at line 1529 on load; request state controls also throw because they target recipe elements that do not exist.
- **High — Selecting a request does not change its details:** `selectRequest()` changes selection state/highlighting and logs to the console, but leaves Maria/CCR-1048 in the detail panel (lines 906–931). This makes review actions ambiguous for the selected customer.
- **High — Rejection is hardcoded to CCR-1048:** `confirmRejection()` updates that row's badge regardless of the selected record and does not update `requestsData` (lines 1043–1053).
- **High — Deposit and confirmation copy contradicts requirements:** Accepted is summarized as “3 confirmed” and “Pending deposit or payment confirmation” (lines 329–336). Use “Quotation accepted — awaiting full QR Ph payment” where applicable. Acceptance alone is not a confirmed production order.
- **Medium — Create Quotation only logs a routing message:** It does not open the selected request in 6.9 (lines 1068–1069). The builder also uses a different request reference for the apparently same Maria example.
- Negotiating is an ERD request state but has no demonstrated list/detail treatment.

**Required correction:** Remove the copied recipe module, make selection and actions target the same request ID, represent the full request lifecycle, and connect quotation creation/revision with version history.

### 6.9 — Custom Cake Quotation Builder

**Source:** [Quotation Builder][p69]. **Verdict:** Mostly correct quotation structure; incomplete validation and immutable-version behavior.

**What it did right**

- Separates options, add-ons, manual complexity charge, and owner delivery fee; the default ₱1,850 + ₱650 + ₱250 = ₱2,750 is correct.
- Shows fulfillment arrangements, expiry, a customer-facing quotation preview, and version history.
- Distinguishes internal cost guidance from customer pricing.
- Correctly states that issuing/accepting the quotation does not confirm production and that full QR Ph payment is required.

**What it did wrong or left incomplete**

- **High — Locked scenario contradicts the payment gate:** `setSimState('locked')` says “Quotation Accepted & Production Locked” without a paid state and does not actually disable editing (lines 925–928). Locking an accepted quotation is valid; claiming production confirmation from acceptance is not.
- **High — Validation permits negative charges:** Entering −₱100 complexity reduces the preview to ₱2,000. The calculation and issue action do not enforce nonnegative charges (lines 865–880, 912–915). The no-discount scope does not support using negative complexity as a price reduction.
- **Medium — Fulfillment preview becomes stale:** Choosing pickup hides the fee/address input areas and removes the fee, but the quotation still displays its delivery destination. Changing the time-window button changes styling only (lines 883–909). Bind date, window, method, address, and fee into one quotation snapshot.
- **Medium — Issuing only displays a success alert:** No issued version, immutable snapshot, status transition, or notification record is created; history remains a draft (lines 912–915). Add realistic revision/superseded/expired/accepted states.
- **Medium — Unsupported assurances:** “Verified Mobile” and “chilled climate control” are not established by the chapters/ERD. Email verification does not establish a verified phone number, and manual cake delivery does not establish refrigerated transport. Remove these claims unless explicitly supported.
- The request-revision instruction promises a customer revision mechanism not demonstrated in 6.8. Preserve the original submission and explicitly define how negotiated changes become the approved quotation/production instructions.

**Required correction:** Validate all quotation fields, synchronize the preview, preserve versions, and separate quotation locking from paid order confirmation.

### 6.10 — Subscriptions

**Source:** [Subscriptions][p610]. **Verdict:** Correct four-delivery concept; payment, lifecycle, and deferment gaps.

**What it did right**

- Shows fixed four-delivery prepaid commitments, quantity per delivery, product/variant, progress, recipient, and preparation/fulfillment schedule.
- Separates the original prepaid purchase from weekly fulfillment order references and states that weekly deliveries do not create recurring billing.
- States that subscriptions do not automatically renew.
- Shows original/replacement dates and the single-deferment allowance; unconfirmed previews are distinguished from active commitments.

**What it did wrong or left incomplete**

- **High — Payment method fixtures conflict with QR Ph-only scope:** Other detail records show “GCash via PayMongo,” “Maya via PayMongo,” and “Bank Transfer (BDO)” (lines 758, 794, 831). Customers may use an eligible app to scan QR Ph, but the platform's payment method must still be QR Ph. Do not imply separate direct wallet/bank-transfer integrations.
- **High — Approving a deferment does not reschedule the underlying delivery:** It sets a global display flag and changes a table cell (lines 1249–1265). The delivery data still contains the original date and pending badge. No replacement capacity allocation or ingredient reservation update is performed.
- **High — Validation badges are fixed sample assertions:** Capacity, stock, blocked dates, and 48-hour notice are hardcoded true (lines 707–711). These cannot substantiate approval. Demonstrate rejected eligibility and repeat/second-deferment prevention too.
- **Model alignment — Pending approval requires a defined record:** The ERD stores one successful deferment, with original/replacement allocation links. Define a separate pending-request representation if manual review is intended. Similarly, Pending Payment belongs to a subscription purchase/enrollment view, not a new `Subscription.status` enum; cancelled subscriptions also need display coverage.
- **Medium — Filters overwrite each other:** Search, status, and product/timing functions independently set row visibility (lines 1285–1327). After selecting Completed, searching Maria brings back an Active row. Compose all predicates together.
- **Medium — Dates and state recovery are inconsistent:** The header says October 4, but October 16/23 deliveries are already fulfilled. Empty/loading simulations replace table markup without restoring it when returning to an active scenario (lines 1330–1399).
- Only the next-day deferment is demonstrated. Include the ERD's `next_week` case, original-date retention, unchanged four-delivery count, and fulfillment-order linkage.

**Required correction:** Retain the timeline design but use one coherent clock/data model, QR Ph payment records, and actual validated deferment updates consistent with the previously confirmed reservation policy.

### 6.11 — Capacity Calendar

**Source:** [Capacity Calendar][p611]. **Verdict:** Correct independent-pool design; dates and remaining capacity are unreliable.

**What it did right**

- Shows independent standard daily, subscription weekly/product, and custom cake weekly limits.
- Includes standard variety and unit ceilings, the different-cake-date rule, temporary checkout holds, and blocked dates.
- Makes clear that capacity availability does not override ingredient requirements.
- Keeps existing commitments unchanged when configuring future booking limits.

**What it did wrong or left incomplete**

- **High — Date selection returns the wrong date's data:** Every date except October 15 maps to the October 6 scenario (lines 1294–1309). Selecting October 9 still displays Tuesday, October 6 in the inspector.
- **High — Configurable limits do not recalculate remaining capacity:** `getScenarioData()` mixes configurable ceilings with fixed `remaining` values and statuses (lines 968–995). Raising standard units from 10 to 20 leaves an 8-unit allocation with “2 remaining.” Changing subscription/cake limits has analogous risks.
- **High — Ambiguous cake counts violate the intended presentation:** October 13 has one cake, October 17 says “Cake: 2/2 booked,” while the week header says 2/2. If October 17 is a daily count, it breaks the different-date rule and weekly total; if it is a weekly count, label it explicitly and show the date's own allocation.
- **Medium — Unmodeled recurring closures:** Mondays/Thursdays/Sundays appear Off/Prep Only/Rest without a corresponding recurring closure model. Subscription preparation days must not silently disable standard orders. Use explicit blocked dates for unavailable fulfillment dates or document an approved additional scheduling model.
- **Medium — Complete capacity context is absent:** Static examples do not show all four enrollment allocations, their hold/confirmed states, or a linked deferment replacement. Calendar source links should open the actual source/fulfillment orders, not just a request reference such as “Order CCR-1046.”
- Clarify whether “Allocated 8 (1h)” includes the held unit; calculate remaining from all active held and confirmed allocations exactly once. A filled variety count alone does not mean existing varieties cannot accept more units.

**Required correction:** Aggregate real allocation records by selected date/week and product, calculate counts from current limits, and preserve existing allocations when reducing a ceiling while blocking further overcommitment.

### 6.12 — Blocked Dates / Scheduling

**Source:** [Blocked Dates & Scheduling][p612]. **Verdict:** Good explanations; saving and commitment preservation are incomplete.

**What it did right**

- Explicitly states that blocks prevent new bookings without automatically moving existing confirmed commitments.
- Explains that unblocking does not bypass capacity, stock, lead time, or cutoff validation.
- Provides block reasons and creator/date information.
- Separates order-type lead times/cutoffs and product-specific/fallback subscription preparation/fulfillment schedules.
- Warns that changing a schedule must not silently move existing subscriptions.

**What it did wrong or left incomplete**

- **High — Unblocking loses displayed commitments:** December 24 begins with three commitments; deleting its block removes the only stored counts, and the inspector then shows zero (lines 533–538 and the inspector fallback). The registry still lists the date as blocked. Commitments must come from orders/allocations, not the block record.
- **High — Fulfillment Save and Discard call the same function:** Both call `discardRuleChanges()`, which only hides the unsaved bar (lines 623–629, 1244–1247). Save does not update configuration; Discard does not restore the original input values.
- **High — Subscription schedule saves are no-ops:** Save Schedule only closes the modal (line 1585); activation/deactivation controls do not implement state changes. Preparation/fulfillment days and status must actually update a schedule record.
- **Medium — Add Blocked Date selects December 31:** The button calls `selectDate('2026-12-31', ...)` rather than allowing an arbitrary date (line 1002). Month navigation is not implemented.
- **Medium — Registry and counts are stale after edits:** The calendar-cell updater hardcodes “3 comm” for newly blocked dates (line 586), regardless of actual commitments. Registry rows/counts and creator timestamps are fixed fixtures.
- Changing units to Hours must not accidentally permit same-day fulfillment; lead-time and no-same-day rules must both apply. The current form does not demonstrate validation or propagation to customer eligibility.

**Required correction:** Separate schedule/block configuration from existing commitments, implement true save/discard behavior, and update calendar, registry, counts, and customer-facing eligibility from the same records.

## Cross-screen presentation and integration findings

### Responsive behavior

At a 390 px Chrome viewport, the following document widths exceeded the viewport. This measures whole-page horizontal overflow, not merely an intentional table scroll area.

| Subphase | Document width |
| --- | ---: |
| 6.1 Dashboard | 593 px |
| 6.6 Inventory | 641 px |
| 6.7 Recipes & Costing | 603 px |
| 6.8 Custom Cake Requests | 425 px |
| 6.9 Quotation Builder | 699 px |
| 6.10 Subscriptions | 569 px |
| 6.11 Capacity Calendar | 506 px |
| 6.12 Blocked Dates / Scheduling | 727 px |

Orders, Order Details, Payments, and Deliveries did not show whole-document overflow in this check; that does not establish that all controls or dialogs are usable on mobile. On desktop, dense split-pane tables clip columns into scroll areas, and floating prototype controls overlap content. Keep scrolling local to tables, provide a mobile detail view, and move scenario controls into a separate developer panel.

The warm palette and grouped owner navigation are suitable, but heading scale, sidebar branding, and density vary considerably across screens. Consolidate them with the existing application's shared components during integration.

### Shared data and truthful state

Use shared IDs for orders, customers, inventory, variants, requests, quotations, subscriptions, and allocations. Reconcile dashboard totals, selected-record details, calendar dates, and payment/delivery state before demonstrating an end-to-end journey. “Saved,” “issued,” “booked,” or “notification dispatched” should follow a successful simulated state change in the prototype and a successful server operation in the real system.

All owner routes/actions ultimately require server-side owner authorization. Owner labels and hidden navigation do not establish access control. Preserve the staff restriction on financial/customer information when sharing components with Phase 5.

Prototype-only fields should not silently become schema additions. For example, verified mobile, delivery time windows for subscriptions, courier notes, pending deferment review, and approved production instructions need either a defined existing source/snapshot representation or an explicitly agreed extension.

## Recommended correction order

| Priority | Work | Completion evidence |
| --- | --- | --- |
| 1 | Remove unrelated scripts from 6.5 and 6.8. | Both pages load without exceptions; courier status tabs and request state controls work. |
| 1 | Correct full-payment, quotation acceptance, QR Ph-only, and raw-ingredient rules. | No deposit/direct bank-transfer claims, no production confirmation from quotation acceptance alone, no in-house dough subassemblies in BoMs. |
| 1 | Use a coherent shared fixture dataset and clock. | Following one order across dashboard, details, payment, inventory, and delivery preserves identity, totals, dates, and state. |
| 1 | Fix selected-record and save behavior. | Ingredient/request selection updates all details; stock/recipe/quotation changes update the intended record and relevant views. |
| 1 | Fix capacity/deferment/block calculations. | Date selection is accurate, changed limits recompute availability, deferment preserves four deliveries, and block/unblock never erases commitments. |
| 2 | Add missing lifecycle/error scenarios. | Paid-resolution case; pending/cancelled purchase contexts; quote revisions/expiry; pickup/manual cake completion; next-week deferment and unavailable replacement dates. |
| 2 | Wire navigation, composed filters, and accurate counts. | Owner actions open the correct module/record; filtering and pagination match the dataset. |
| 2 | Make narrow layouts and dialogs usable. | No whole-page overflow at 390 px; primary actions and selected-record details remain reachable. |

### Decisions to settle before full implementation

These do not block this review, but should be explicit before building the complete owner workflow:

1. **Deferment review:** Is owner approval mandatory, or do valid customer deferments complete automatically with owner visibility? If approval is required, specify where pending/rejected requests are stored and when the one-deferment allowance is consumed.
2. **Paid payment-resolution cases:** Define the owner's permitted resolution actions when payment succeeds after the resource hold becomes invalid. Keep full prepayment and the ERD's no-refund-handling scope; do not invent a manual confirmation bypass.
3. **Negotiated cake production details:** Align the quotation workflow with the existing owner-approved production-copy proposal, including multiple references if retained, while preserving the customer's original submission and quotation versions.

The four-date subscription capacity policy is already documented as confirmed and does not require another decision.

## Source index

Each link opens the reviewed HTML; its folder also contains the generator's `screen.png`.

[p61]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase6/stitch_kitchen406_owner_dashboard/kitchen406_owner_dashboard/code.html
[p62]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase6/stitch_kitchen406_owner_dashboard/kitchen406_orders/code.html
[p63]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase6/stitch_kitchen406_owner_dashboard/kitchen406_order_details_k406_1048/code.html
[p64]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase6/stitch_kitchen406_owner_dashboard/kitchen406_payments/code.html
[p65]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase6/stitch_kitchen406_owner_dashboard/kitchen406_deliveries/code.html
[p66]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase6/stitch_kitchen406_owner_dashboard/kitchen406_inventory/code.html
[p67]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase6/stitch_kitchen406_owner_dashboard/kitchen406_recipes_and_costing/code.html
[p68]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase6/stitch_kitchen406_owner_dashboard/kitchen406_custom_cake_requests/code.html
[p69]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase6/stitch_kitchen406_owner_dashboard/kitchen406_custom_cake_quotation_builder/code.html
[p610]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase6/stitch_kitchen406_owner_dashboard/kitchen406_subscriptions/code.html
[p611]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase6/stitch_kitchen406_owner_dashboard/kitchen406_capacity_calendar/code.html
[p612]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase6/stitch_kitchen406_owner_dashboard/kitchen406_blocked_dates_scheduling/code.html
