# Phase 5 Staff UI Review

Reviewed: October 3, 2026

## Overall assessment

**The eight screens cover the intended staff workspace, but they need corrections before integration.** The generator generally understood the separation between staff operations and owner management. The strongest parts are the production queue layout, quantity-only inventory view, read-only recipes, and operational notification feed.

The main problems are incorrect order transitions, unsupported recipe components, inconsistent sample records, incomplete calendar behavior, and actions that report success without changing their underlying data. The custom-cake detail scenario also contradicts the owner-delivery requirement.

This is a review of the uploaded Phase 5 exports, not a review or modification of the existing integrated application.

### Review method and limits

- Read Chapters 1–4, the ERD entity/constraint specification, and the phase breakdown.
- Visually opened all eight supplied `screen.png` files and inspected their corresponding `code.html`, including scripts and alternate scenarios.
- Traced handlers to distinguish working local interactions from static controls and simulated success messages.
- Findings about behavior below come from source inspection. No browser interaction suite, live API, authentication, database, or mobile rendering test was run for these exports.
- A missing backend is an expected prototype limitation. An incorrect business rule or an interaction that switches to the wrong order is a separate defect that should be corrected even in a prototype.

## Requirements used

| Source | Relevant requirements |
| --- | --- |
| [Chapter 1](../Chapters/Chapter%201.md), Scope 7–9 and Limitations 8, 10 | BoM-driven inventory; staff limited to operational work; customer and financial data restricted; standard/subscription courier deliveries; owner-handled custom-cake delivery; single-level base-ingredient inventory. |
| [Chapter 2](../Chapters/Chapter%202.md), recipe inventory and production scheduling discussions | Production is driven by confirmed commitments; ingredients, recipes, and orders must remain connected. Related systems provide context, not additional Kitchen406 requirements. |
| [Chapter 3](../Chapters/Chapter%203.md), BoM, costing, capacity, RBAC, logistics | Variant ingredient quantities; packaging as a direct material; separate configurable capacity pools; owner courier booking after readiness; restricted staff access. |
| [Chapter 4](../Chapters/Chapter%204.md), Figures 7, 23, 28, 29 and their explanations | Staff dashboard, schedules, order updates, recipes/custom-cake specifications, delivery visibility, restocks, adjustments with attribution, and permitted account changes. Owners maintain recipes/catalog/pricing and staff accounts. |
| [ERD](../Chapters/ERD.md) | Exact entity relationships, order/delivery statuses, four subscription deliveries, inventory reservations and movements, account fields, and shared notification acknowledgement. |
| [Phases](../Phases.md), Phase 5 | Eight subphases; no customer identity/contact/address or owner financial information in staff views. |

Where prose and the ERD differ, this report identifies the difference instead of silently making a new business rule.

## Screen index

Each link opens the reviewed HTML; `screen.png` in the same directory is its supplied visual reference. Line numbers cited below refer to that HTML. Some exports put the entire shared header on line 4.

| Phase | Export | Verdict |
| --- | --- | --- |
| 5.1 | [Staff Dashboard][s51] | Good scope; static and internally inconsistent. |
| 5.2 | [Production Queue][s52] | Good operational structure; subscription fixtures and fulfillment states need correction. |
| 5.3 | [Production / Order Details][s53] | Major correction needed: transitions replace the selected order. |
| 5.4 | [Inventory][s54] | Good quantity presentation; saving and adjustment defaults are incorrect. |
| 5.5 | [Stock Movements][s55] | Useful history design; reversal behavior and schema mapping need correction. |
| 5.6 | [Recipes][s56] | Correct read-only intent; BoM violates the base-ingredient model. |
| 5.7 | [Production Calendar][s57] | Appropriate staff scope; navigation, selected-day content, counts, and layout need work. |
| 5.8 | [Notifications / Account Settings][s58] | Appropriate feature groups; account simulation and notification schema gaps remain. |

## 5.1 — Staff Dashboard

### What it got right

- Focuses on confirmed orders, preparation, readiness, stock alerts, and upcoming production rather than sales or profits.
- Shows operational references, product variants, quantities, methods, and subscription week numbers without customer names, contacts, or addresses.
- Makes custom-cake owner delivery visible and treats courier information as status visibility rather than booking authority.
- Provides sensible entry points into the queue, inventory, and calendar.

### What it got wrong or left incomplete

1. **The same order has conflicting fulfillment methods.** `#K406-1039` is Delivery in the production table but Pickup in the fulfillment panel (lines 379–386 and 480–484). Both must derive from the same `Order.fulfillment_method`.
2. **The Today table contains an October 4 fulfillment under an October 3 heading.** The cake may legitimately require preparation today, but the table explicitly describes today's fulfillment schedule (lines 319–320, 398–410). Separate preparation date from fulfillment date or revise the heading and expose both.
3. **“Scheduled” is presented as a custom-cake production status.** `Order.status` has `confirmed`, `preparing`, and `ready`, not `scheduled`. Use Confirmed for an approved paid cake awaiting preparation; keep schedule information separate.
4. **Inventory status lacks a consistent definition.** Bread Flour is labelled Low with 5.8 kg available against a 5.0 kg threshold (lines 543–547). If this is a forecast shortage, show the required quantity and shortage explicitly. Otherwise derive the badge from the same stock/threshold rule as Inventory. “Critical” can be alert severity, but it is not an ERD inventory status.
5. **The dashboard is static.** It has placeholder navigation and no application logic for Today / Next 7 Days or updating cards. Integrate counts and links with the shared operational records.

## 5.2 — Production Queue

### What it got right

- Groups work by date and exposes type, status, reference, products, quantity, and fulfillment method.
- Supports local search, type/status/date filtering, empty results, and an inspection drawer.
- Offers the intended Confirmed → Preparing → Ready actions and recalculates status summary counts in memory.
- Uses four-cycle subscription labels and owner-delivery labels for cakes; does not expose financial or customer fields in the queue dataset.

### What it got wrong or left incomplete

1. **Subscription fixtures imply multiple independently selected products in one subscription.** For example, `K406-SD-084` contains sourdough and croissants, and `K406-SD-085` contains a loaf plus a pastry selection (dataset beginning at line 494). The ERD has one `Subscription.variant_id` and `quantity_per_delivery`. Use that variant for each weekly fulfillment. A sold bundle could be one configured variant, but these fixtures do not represent it that way.
2. **Courier Booked appears while subscription orders are Preparing.** Chapter 3 Logistics and Chapter 4 Figure 28 place booking after Ready. Correct the sample delivery states unless a revised booking policy is explicitly adopted.
3. **Urgency sorting is inaccurate.** Tomorrow's 9:00 AM cake and 8:00 AM subscription both have `timeRank: 1`; the 9:00 AM entry precedes the 8:00 AM entry. Sort by actual scheduled timestamps, including dates for the Upcoming group.
4. **Status changes only mutate the queue array.** `setStatus()` (line 1081) has no shared order history, inventory effect, subscription-delivery update, or persistence. Preserve the working local interaction when integrating it with those records. Prevent invalid/stale transitions at the authoritative data layer.
5. **Required pickup completion is missing.** Ready cards only indicate staging. The user confirmed during this review that staff may complete pickups after handoff. Add a Ready ? Completed action for pickup orders, with confirmation and actor/timestamp history. Courier delivery completion must remain tied to its separate fulfillment workflow.
6. **The summary cards always count the entire dataset.** They do not follow the selected filters. This can be intentional, but label them “All active orders” or make them reflect the visible result set.

## 5.3 — Production / Order Details

### What it got right

- Includes item quantities, variants, recipe quantities scaled to an order, preparation information, fulfillment status, and a lifecycle view.
- The initial standard-order view correctly explains that the owner books the courier after the kitchen marks the order Ready.
- Includes standard, subscription, custom-cake, loading, not-found, and stock-alert scenarios.
- Includes a confirmation dialog for readiness and keeps financial/customer details out of the visible production sheet.

### What it got wrong or left incomplete

1. **High priority: status actions switch order identity.** `confirmStatusTransition()` (line 438) loads a generic Ready scenario. That scenario always renders `#K406-1038`, Chocolate Babka ×2, and Country Sourdough ×1. Starting preparation for the Confirmed scenario `#K406-1044` likewise calls `loadScenario('standard')`, which renders `#K406-1038`. Subscription and cake completion also become this standard order. Update the selected record's status while preserving its ID, items, type, schedule, and fulfillment method.
2. **High priority: the cake scenario incorrectly uses courier delivery.** Its shared fulfillment template remains Courier Delivery, and its dispatch copy says “Handled via climate-controlled courier.” The requirements specify owner-handled cake delivery outside courier integration. Render owner delivery or the accepted quotation's pickup method, with appropriate handoff wording.
3. **The cake scenario is not a complete accepted specification.** It uses `src="placeholder"` (line 875), inconsistent “1 custom tier” versus “3 Tiers,” and a “PASTRY STATION” status. Present the accepted shape/flavor/size/color/icing selections, add-ons and quantities, design instructions/reference image, and ingredient requirements. Use an actual order status; a work station can be supplementary information.
4. **The initial activity log belongs to different products.** It names Cinnamon Roll Box and Classic Sourdough, while the visible items are Chocolate Babka and Country Sourdough (lines 344–345). The initial order reference also differs from the regenerated standard scenario. Generate the log from the selected order.
5. **The checklist does not gate the sign-off it claims to require.** The dialog can confirm with unchecked boxes. Either enforce the checklist or label it as an optional local aid; its completion has no persistence model in the ERD.
6. **Bake Ticket is an unimplemented action.** There is no corresponding print behavior in the inspected handler code. Implement a staff-safe ticket or remove the action until supported.
7. **The lifecycle omits final fulfillment behavior.** Clearly distinguish Ready from Completed and courier In Transit/Delivered. The user confirmed that staff can complete pickups after handoff; add that action and its history.

## 5.4 — Inventory

### What it got right

- Separates On Hand, Reserved, Available, Threshold, and Status without showing costs.
- Includes permitted restock and physical-count adjustment forms, actor attribution, units, previews, and the documented adjustment reasons.
- Shows ingredient usage in recipes and provides search, status filters, low-stock/out-of-stock states, and loading/error/empty scenarios.
- Does not offer recipe, product price, or margin editing.

### What it got wrong or left incomplete

1. **High priority: saves only show a toast.** `handleRestockSubmit()` (line 1329) and `handleAdjustSubmit()` (line 1415) close the form and announce success without updating inventory rows or creating a stock movement. Even a local prototype should update its shared records so the next action sees the new quantity.
2. **A zero stock balance becomes 18.5 in the adjustment default.** `parseFloat(currentVal) || 18.5` (line 1360) treats valid zero as missing, then prefills 18.0. Opening Adjust for zero-stock butter can therefore propose a large fictitious increase. Keep zero valid, distinguish invalid numbers explicitly, and initially prefill the actual recorded count.
3. **Prepared stock is introduced as a base ingredient.** Active Sourdough Starter has its own On Hand/Reserved/Available row (lines 754–779). If this is made in-house, it conflicts with Chapter 1's exclusion of prepared intermediate inventory. Expand its base ingredients into the product BoM. If it is genuinely purchased as a raw input, document that distinction.
4. **Sort and pagination are incomplete.** `applySorting()` only announces a sort; it does not reorder rows. The page advertises 24 ingredients, but contains 12 rows and no implemented second-page data flow. Filtering counts only the loaded rows while tabs retain the larger static totals.
5. **Ingredient drawers reuse the same history.** The name, quantities, and recipe usage change, but the sample movement section remains fixed. Load movements by `inventory_id`.
6. **Reserved stock is described too narrowly.** “In production” and “today's active bakes” do not explain checkout holds and confirmed reservations. Derive availability from active reservation states and distinguish reservations from already consumed ingredients.
7. **The summary's 18.4 kg needs a defined scope.** The table mixes kg, L, and pcs. Display totals by unit or use a count of ingredients with reservations; never sum unlike units under kg.

## 5.5 — Stock Movements

### What it got right

- Shows quantities, timestamps, ingredient, movement type, source/reason, and recorded-by information without costs.
- Distinguishes automated consumption from staff restocks/adjustments.
- Provides useful detail fields and preserves history by proposing a compensating entry instead of deleting the original.
- Includes functioning local search/type/ingredient/source filters and loading/error/empty layouts.

### What it got wrong or left incomplete

1. **High priority: generic adjustment reversal does not map cleanly to the ERD.** The reversal action is exposed for manual adjustments, but `InventoryMovement.movement_type` supports `consumption_reversal`, not a generic `reversal`. A correction of a manual adjustment should be a new `adjustment` with a correction reason and traceable reference, unless the schema is deliberately extended. This is a modeling issue, not evidence that all staff corrections are forbidden.
2. **Reversals can be repeated and do not update live inventory.** `executeReversal()` (line 1110) repeatedly prepends entries. It has no duplicate protection and sets before/after values by swapping the original historical balances, ignoring later movements. Apply a signed correction to the current stock atomically with a unique operation key. If reversals are retained, define their eligibility and prevent duplicate reversal of the same event.
3. **The history is partial while the counters imply completeness.** There are 10 sample records, but the page continues to say 42 and shows five page buttons. Custom Range is offered without a corresponding date-range filter implementation; Last 7 Days simply accepts every sample record.
4. **The summary expresses mixed movements in kg.** The dataset includes eggs in pcs and cream in L. Use separate totals per unit or movement counts, and compute summaries from the same range as the table.
5. **Only System and Elena are available as source filters.** The ERD also permits owner-recorded movements. Actor names should come from the linked account; do not label every manual actor as Elena.
6. **Before/after balances require a defined data source.** The ERD stores quantity deltas, not those two fields. Derive historical balances from an ordered ledger and an opening balance, or explicitly add snapshots. Do not invent historical values in the UI.

## 5.6 — Recipes

### What it got right

- Keeps recipes read-only for staff and omits ingredient costs, selling prices, markup, overhead, and margins.
- Supports recipe/category search, product selection, variant selection, ingredient quantities and units, and availability badges.
- Clearly distinguishes a one-unit reference BoM from order-scaled requirements.
- Includes an unconfigured-BoM state rather than silently showing a complete recipe when no ingredients exist.

### What it got wrong or left incomplete

1. **High priority: the BoM uses intermediate preparations as ingredients.** The default Shokupan lists 100 g Yudane Starter as one BoM row (line 328); sourdough recipes also use prepared starters. Chapter 1 Limitation 10 and Chapter 3 BoM require direct base ingredients. For 100 g of a 1:1 flour/water preparation, represent 50 g flour and 50 g water in the BoM and keep the preparation method in instructions. Avoid counting the same flour/water twice.
2. **Packaging is only descriptive.** Chapter 3 costing treats packaging as a direct material line, but the displayed default BoM lists ingredients only and gives packaging separately as text. Include its material quantities where tracked, while continuing to hide costs from staff.
3. **Weight figures are unreliable.** The default recipe states 943 g raw and approximately 750 g baked with 12–14% moisture loss, but those weights imply about 20.5% loss. Its inputs also mix ml and g, so a total mass needs explicit conversion assumptions. Calculate consistent figures or omit unsupported derived metrics.
4. **Operational metadata lacks an agreed storage model.** Station, SKU, BoM revision, dough temperature, fermentation instructions, raw/baked weights, and packaging specifications are hardcoded fields outside the listed product/variant/BoM attributes. Useful read-only notes can be retained, but identify their owner-maintained source before treating them as supported application features.
5. **Prototype terminology leaks into staff work.** Labels such as “Phase 5.3,” “RBAC Protected,” “Immutable,” and “kitchen ERP” should become plain task labels such as Production Details, Inventory, and Read-only recipe. Move the scenario dock into a development-only testing area.

## 5.7 — Production Calendar

### What it got right

- Shows standard, subscription, and custom-cake commitments, production status, quantities, and fulfillment methods without sensitive customer or financial fields.
- Gives staff visibility into blocked dates and deferred deliveries without offering capacity editing or drag-to-reschedule controls.
- Includes day/week/month presentations, an agenda, a detail inspector, and empty/loading/error scenarios.
- Uses cycle labels such as Week 2 of 4 and preserves an original date in a rescheduled card.

### What it got wrong or left incomplete

1. **High priority: selecting a day changes only the agenda heading.** The day-column handler (lines 1054–1066) leaves Tuesday's cards and totals under the newly selected date. Rebuild the agenda from that day's records.
2. **Navigation is mostly a fixed demonstration.** Today always opens Tuesday, October 6 (lines 951–979, 1173–1175); previous/next controls do not implement date changes. The month view includes only September 28–October 18. Implement a real selected date/range and render all dates for the month.
3. **Filters do not consistently govern the views.** Filtering operates on `.commitment-card` elements; the separate day/month/agenda content does not share a filtered dataset. Show Completed has no implemented filtering behavior. Keep selection, summaries, and every visible view synchronized.
4. **Inspector fallbacks invent production details.** References outside the seven-entry `commitmentDatabase` become “Artisan Batch Item” / “Scheduled” instead of showing their real card data or a not-found state (lines 1070–1097). The production-detail action only displays a routing alert (line 869).
5. **Counts and units disagree.** Tuesday has quantities 4 + 2 + 3 + 1 = 10 sellable units but claims 18 “loaves & packs.” Day header commitments sum to 21 for the week while the classification says 19. Friday splits one order `#K406-1038` across two product cards, so define whether counts mean orders, order items, or production tasks and calculate them consistently.
6. **Default capacity examples need reconciliation.** The week contains three custom cakes; a later month cell says two cakes on one day. Chapter 3 defaults are two per week on different dates. Limits are owner-configurable, so these examples are not proof of an enforcement defect. Use default-compliant fixtures or explicitly document the non-default capacity configuration behind them.
7. **The supplied desktop image is difficult to scan.** With the agenda open, narrow day columns clip badges and wrap references heavily; later days require horizontal exploration. Widen minimum day columns, make scrolling obvious, and offer a usable list/day layout at smaller widths. Mobile behavior still needs browser verification.
8. **Preparation timing is presented without a complete model.** The ERD has fulfillment dates and subscription preparation/fulfillment days, but no general oven schedule, shifts, or time-slot tasks for all orders. Distinguish actual fulfillment commitments from supplementary preparation notes and clarify where timed tasks would be stored.

## 5.8 — Staff Notifications / Account Settings

### What it got right

- Keeps the feed operational: order preparation, schedule changes, stock alerts, delivery status, and cake specifications.
- Supports local category/unread filtering and single/all acknowledgement with changing unread counts.
- Offers first/last-name changes and a password form with current/new/confirmation fields.
- Keeps the role and login email read-only; staff account creation and role configuration remain outside this workspace.

### What it got wrong or left incomplete

1. **Profile and password saves are simulated.** `handleSaveProfile()` (line 664) updates a badge after a timeout. `handleUpdatePassword()` (line 723) accepts any nonempty current password, checks new-password length/matching, and announces success without authenticating or changing credentials. These handlers must not be treated as completed account features. Add current-password rejection and save-failure states when connecting account services.
2. **The current user is inconsistent.** The header shows Maria Santos / Shift Lead while the sidebar and settings show Elena Lim / Bakery Staff (line 4). All identity displays should use the authenticated `Account`.
3. **Notification events exceed the ERD enum.** Generic order-ready, delivery-status, and cake-specification-update alerts do not have explicit matching `SystemNotification.notification_type` values. The schema has `new_order`, `low_stock_alert`, and `subscription_deferment_completed`, among others. Keep the useful operational alerts, but explicitly map or extend their types; do not misuse unrelated owner notification types.
4. **Read is mislabeled as Archived.** The initial read cards use Archived (lines 221, 249, 277), but `SystemNotification` has `is_read` and `read_at`, not archive state. Use Read or Acknowledged unless archiving is intentionally added.
5. **Shared acknowledgement is unimplemented and unexplained.** The ERD specifies that one user's acknowledgement marks the notification read. Current handlers only change this page's DOM. Persist the shared read state, update other sessions, and label the effect clearly. Filter records by allowed recipient role and sanitize their message/link content.
6. **A pickup alert waits for courier coordination.** `ORD-1052` is Pickup, yet its body says it awaits owner courier coordination (lines 208–211). Use a pickup handoff message.
7. **Shift assignment and role tiers are unsupported additions.** The settings show Assigned Station & Shift, and say a lead kitchen supervisor controls permissions. `Account.role` supports customer/staff/admin; `StaffProfile` has no station/shift fields. Remove those implied features or agree their schema and authority first. Refer to the owner/administrator for existing account management.
8. **Initial staff setup is not covered here.** The ERD includes `is_temp_pass_changed` and account-setup verification. Verify an existing authentication flow handles first-use setup before staff gain workspace access; this need not become a separate Phase 5 settings screen.

## Shared corrections and integration requirements

### Preserve the staff boundary

The inspected mock content generally omits customer identity/contact/address, sales totals, prices, ingredient costs, and margins. Staff names are legitimate actor information and should remain visible where needed.

This is a UI-level positive finding, not proof of server-side RBAC. When integrating, restrict both actions and returned data. Staff payloads, notification bodies, tickets, images, and free-text cake notes must not inadvertently expose restricted customer/financial information. Owner booking, quotation approval, pricing, recipe editing, capacity changes, marketing, and account-role management remain owner functions.

### Use shared records across all eight screens

- Replace conflicting fixture references, products, dates, stock balances, user names, and unread counts with one shared dataset.
- Use production-eligible standard purchases, subscription fulfillment orders, and paid accepted cake purchases. A subscription purchase is the prepaid parent transaction, not an extra baking task.
- Keep `Order.status`, `SubscriptionDelivery.status`, and `Delivery.status` distinct. Map display wording to their actual enums.
- Aggregate base ingredient requirements per order and inventory item. Confirmed orders reserve ingredients without reducing physical stock on hand. On Confirmed → Preparing, consume the order's reservations and deduct the required ingredients from stock on hand exactly once. Keep holds, reservations, consumption, and physical stock movements separate.
- Replace placeholder links and simulated routing with record-aware navigation; preserve the selected reference when moving between screens.
- Remove live-sync/offline-cache claims unless those capabilities actually exist. The exports simulate these messages.
- Keep QA docks outside the normal staff workspace. They are useful review tools, not operational controls.

### ERD fields that need explicit decisions

| UI concept | Existing model | Required treatment |
| --- | --- | --- |
| Storage bin / rack | No `Inventory.location` | Keep as clearly sourced notes or add a field deliberately. |
| General handoff windows and oven tasks | `Order.fulfillment_date`; cake delivery-window enum; subscription weekday schedule | Define whether these are calculated labels or persisted planning data. |
| Per-item bake activity / checklist / assignment | `OrderStatusHistory` records order status and actor | Do not present invented activity as audited history; define additional records if required. |
| Recipe methods, yields, revisions | Product description plus variant BoM quantities | Agree a source for structured operational instructions. |
| Generic movement undo | Only `consumption_reversal` plus `adjustment` | Use correction adjustments or deliberately revise reversal modeling. |
| Operational event alerts | Limited `SystemNotification.notification_type` enum | Map or extend events before integration. |
| Shift/role tier | No shift model; three account roles | Remove unsupported controls/claims or agree new scope. |

## Business rules needing clarification

Two rules were confirmed during the review; the remaining questions affect implementation and are not assumed resolved.

1. **Confirmed: staff can complete pickup orders.** The user explicitly confirmed this during the review. Implement Ready ? Completed after handoff, retain the pickup method and order identity, and record the staff actor and completion time. The missing action is a requirement gap.
2. **Confirmed: deduct physical stock when preparation starts.** The user selected this rule after clarification. Order confirmation reserves the required ingredients; the Confirmed → Preparing transition records consumption and reduces `Inventory.stock_on_hand`. Consume the corresponding `InventoryReservation` records and create `InventoryMovement` consumption entries atomically with the transition. Repeated clicks or retries must not deduct again, and marking Ready or Completed must not deduct again. For subscriptions, apply this to the individual weekly fulfillment order. Align the earlier chapter wording about deduction on confirmation with this decision. Before consumption, releasing a reservation does not add stock on hand; any later consumption reversal must represent ingredients actually returned to usable stock, not an automatic assumption that used ingredients were recovered.
3. **Which subscription capacity statement is authoritative?** Chapter 3 describes week-by-week capacity consumption rather than full reservation at enrollment; Chapter 4 describes availability for scheduled deliveries before commitment. Reconcile this for future-week calendar commitments and reservations. It does not authorize staff to change capacity.
4. **How is staff restocking reconciled with owner costing?** Quantity-only staff restocking respects the financial boundary, but the ERD also maintains costs. Define whether owner cost entry follows separately and which cost basis remains in use meanwhile.

## Recommended correction order

1. Fix record-preserving order transitions, cake fulfillment, recipe base ingredients, inventory writes/defaults, and movement corrections.
2. Apply the confirmed pickup-completion and consumption-at-preparation rules, align the chapter wording, and map UI concepts to the ERD.
3. Connect a shared dataset and real navigation; then repair calendar selection, date movement, filters, totals, and incomplete pagination.
4. Connect authentication and shared notifications; add meaningful failure/stale-state handling.
5. Refine clipped layouts, replace development terminology, and move QA controls out of operational views.

### Acceptance checks for the corrected implementation

- Advancing standard, subscription, and cake orders preserves their identity and data and records the correct actor/status history. Staff can complete Ready pickup orders after handoff.
- A subscription shows exactly four deliveries of its selected variant; weekly fulfillment updates the corresponding delivery, not the prepaid parent.
- Cakes use the accepted specification and owner delivery/pickup; courier booking appears only in its authorized workflow.
- Restocking/adjusting changes inventory and creates exactly one attributed movement; zero quantities remain zero until intentionally changed.
- Confirmation reserves ingredients without reducing stock on hand. Starting preparation consumes the reservation and reduces stock exactly once; retries and later Ready/Completed transitions do not deduct again.
- Corrections use current stock, preserve history, and cannot accidentally apply twice.
- BoM requirements resolve to base ingredients and tracked packaging, with valid unit conversions and order scaling.
- Day/week/month, filters, selected-day agenda, inspector, and counts agree on the same records.
- Acknowledgement survives reload and is shared according to the ERD; owner-only messages stay inaccessible to staff.
- Account saves reject wrong credentials and handle failures; all identity labels use the same account.
- Validate desktop/mobile layout, keyboard navigation, dialog focus/Escape, and server-side role/data restrictions during implementation testing.

[s51]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_5.1_staff_dashboard_refocused_operational_revision/code.html
[s52]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_5.2_staff_production_queue_small_bakery_operational_workspace/code.html
[s53]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_5.3_production_order_details/code.html
[s54]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_5.4_staff_inventory_small_bakery_operational_digital_pantry/code.html
[s55]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_5.5_staff_stock_movements_artisanal_bakery_operational_history/code.html
[s56]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_5.6_staff_recipes_reference/code.html
[s57]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_5.7_staff_production_calendar/code.html
[s58]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_5.8_staff_notifications_account_settings/code.html
