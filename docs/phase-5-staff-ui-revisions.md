# Phase 5 — Staff Workspace Revision Brief

Date: October 3, 2026

Based on the [Phase 5 review](phase-5-staff-ui-review.md), [chapters and ERD](../Chapters/ERD.md), and confirmed user decisions.

## Purpose

Revise all eight uploaded Phase 5 screens into a consistent staff workspace. Preserve the existing bakery visual style and operational focus. Use the instructions below when revising the UI generator exports and connecting their interactions.

Each subphase lists what to retain, what to change, and how to judge the revised result. These are revision instructions; they do not mean the changes have already been implemented.

## Rules that apply to every subphase

### Confirmed business rules

| Event | Required behavior |
| --- | --- |
| Order confirmation | Reserve required ingredients. Physical stock on hand stays unchanged. |
| Staff starts preparation | Change the selected order from Confirmed to Preparing. Consume its reservations, deduct its ingredient requirements from stock on hand, and record consumption movements exactly once. |
| Staff marks an order Ready | Record readiness without another stock deduction. |
| Staff completes a pickup | Allow Ready to Completed after handoff. Record the staff account and time; do not deduct ingredients again. |
| Courier delivery | Staff see delivery status. The owner books the courier after the order is Ready; delivery updates follow the courier workflow. |
| Custom-cake fulfillment | Show owner delivery or pickup according to the accepted quotation. Do not use Lalamove or other courier booking for cakes. |

For subscriptions, production and consumption apply to the individual weekly fulfillment order, not the prepaid purchase order. Each subscription has four deliveries of its selected product variant and quantity.

**St                                

### Staff access and shared data

- Show order references, operational product information, quantities, ingredient requirements, fulfillment methods, schedules, stock, and staff actor names.
- Exclude customer names, phone numbers, emails, addresses, prices, revenue, ingredient costs, margins, and other owner financial information from staff views and returned data.
- Keep booking, quotation approval, recipe/catalog editing, pricing, capacity configuration, marketing, and account-role administration in the owner workspace.
- Use one shared set of orders, inventory, recipes, movements, notifications, and account details. The same reference must have the same products, method, status, and dates everywhere.
- Keep order status, subscription-delivery status, and courier status separate. Use friendly labels mapped to the ERD values.
- Use a single date basis throughout the prototype. Today must resolve to that date; production use should follow the bakery's local date.
- Hide developer scenario docks from ordinary staff use. Replace labels such as “Phase 5.3,” “RBAC Protected,” and “ERP” with task names.
- Replace placeholder links and routing alerts with working navigation that retains the selected order or ingredient.
- Do not claim live synchronization, offline caching, or successful persistence unless implemented.

### Prototype and integration expectations

For a generated prototype, interactions should update shared demo records, with any reset-on-reload limitation documented outside the operational flow. A success message alone is not a working interaction. Demonstrate loading, empty, failure, and retry states where relevant.

During integration, enforce permissions, persistence, credential validation, and atomic stock/status changes on the server. UI generation cannot establish those guarantees. Do not add new database fields or business capabilities merely to support invented sample labels.

## 5.1 — Staff Dashboard

### Retain

Operational summary cards, attention notices, production summary, fulfillment visibility, inventory watchlist, and upcoming work.

### Revise

1. **Make Today / Next 7 Days functional.** Apply the selected fulfillment-date range to order counts and production sections. Label inventory alerts as current stock alerts so they are not mistaken for date-filtered historical values.
2. **Use consistent records.** Correct `#K406-1039` appearing as both Delivery and Pickup. Link each summary row to its actual production detail.
3. **Separate preparation from fulfillment.** Do not place an October 4 fulfillment under “Today's fulfillment” on October 3. Show future fulfillments in Upcoming; if showing preparation due today, explicitly label that section and expose the fulfillment date.
4. **Use valid production statuses.** Replace a cake's “Scheduled” order-status badge with Confirmed when it is paid and waiting for preparation.
5. **Fix stock alerts.** A Low Stock badge must follow the shared inventory threshold rule. If stock is above threshold but insufficient for planned requirements, show a separate shortage alert with available, required, and missing quantities. Treat “Critical” as alert severity, not a new inventory status.
6. **Reflect completed pickups.** After staff complete a pickup, remove it from the pending pickup count and update relevant completion summaries.
7. **Connect every action.** Queue, inventory, calendar, notification, and fulfillment links must open the corresponding view with the intended filter or record.
8. **Add realistic states.** Show no-work-today, no-current-alerts, loading, and failed-load/retry states without leaving stale summary figures presented as current.

### Acceptance checks

- Range changes update the intended sections; every displayed total agrees with its records.
- One order never changes fulfillment method between panels.
- Starting preparation, marking Ready, completing pickup, or restocking updates the relevant dashboard information.

## 5.2 — Production Queue

### Retain

Date grouping, search, type/status filters, product quantities, inspection drawer, and Start Preparation / Mark Ready controls.

### Revise

1. **Correct subscription examples.** Show one selected variant and its quantity per weekly fulfillment, with “Delivery 2 of 4” or the applicable cycle. Remove unrelated multi-product combinations unless represented by a real single bundle variant.
2. **Correct courier state examples.** A Preparing order must not already have a booking under the agreed workflow. Show booking pending until Ready and owner booking.
3. **Sort by real dates and available schedule information.** Within a date, 8:00 AM must precede 9:00 AM. Replace arbitrary urgency ranks. Do not invent precise windows where the source record has only a date.
4. **Use shared transitions.** Start Preparation changes the selected order and consumes its ingredient reservations exactly once. Mark Ready updates that same order without another deduction. Update history and the linked subscription delivery where applicable.
5. **Add Complete Pickup.** Display it only for Ready pickup orders. Ask staff to confirm handoff, then set Completed and record actor/time. Do not offer it for courier or owner-delivery orders.
6. **Make counters unambiguous.** Derive summary counts from the selected date/type/search scope before applying a particular status filter; label that scope. Date tabs and result counts must derive from data rather than hardcoded totals.
7. **Connect the detail drawer.** Open Full Production Details must retain the selected reference. Inventory warnings should open the affected ingredient or shortage details.
8. **Handle failed or stale actions.** Disable submission while processing. If another staff member already advanced the order, refresh the record and explain its current state. Do not report success if stock validation or saving fails.

### Acceptance checks

- Every transition preserves reference, items, quantities, dates, and method.
- Double-clicking Start Preparation produces one stock deduction and one logical transition.
- A completed pickup leaves the active queue and remains available through completed/history views.
- Search, grouping, sorting, counters, and empty results agree.

## 5.3 — Production / Order Details

### Retain

Item/variant quantities, order-scaled requirements, fulfillment information, status history, readiness confirmation, and separate examples for each order type.

### Revise

1. **Replace scenario-switching status actions.** Starting or finishing a selected order must never load the hardcoded `#K406-1038` standard-order scenario. Update the selected record and rerender its own content.
2. **Use the same actions as the queue.** Show Start Preparation for Confirmed, Mark Ready for Preparing, and Complete Pickup for Ready pickup orders. Share the stock-consumption and history logic with Phase 5.2.
3. **Explain ingredient use briefly.** Before starting, show the order's required quantities and reservation/shortage state. Use plain confirmation copy such as “Start preparing this order? Its reserved ingredients will be recorded as used.”
4. **Correct cake fulfillment.** Replace “climate-controlled courier,” inherited Courier Delivery labels, and courier sign-off copy with the accepted quotation's owner delivery or pickup method.
5. **Complete cake specifications.** Show accepted shape, flavor, size, color, icing, add-ons and quantities, approved production notes, reference image, and base-ingredient requirements. Remove placeholder image URLs and contradictory tier counts. Filter any customer-identifying content before exposing notes/images to staff.
6. **Use valid status badges.** “Pastry Station” is not an order status. If a station has no supported data source, omit it.
7. **Correct the history.** Populate status, actor, and timestamps from this order's history. Remove invented item-level baking events unless an agreed model actually records them.
8. **Simplify the checklist.** Under the current ERD, treat it as an optional local preparation aid and remove claims that every check is mandatory. A required, persisted checklist would need an explicit model decision.
9. **Resolve Bake Ticket.** Implement a printable ticket containing permitted operational fields only, or remove the button from the revised prototype until printing is supported.
10. **Cover final and exceptional states.** Show Completed pickups, read-only courier progress, cancelled/not-found orders, loading, save failure, and preparation blocked by insufficient ingredients. Do not provide status actions inappropriate to the current state.

### Acceptance checks

- Standard, subscription, and cake examples retain their identities throughout preparation and readiness.
- Pickup completion records the staff actor and time; no later transition consumes ingredients again.
- Cake information matches the accepted specification and never falls back to a standard-order delivery template.
- Visible history and any printed ticket belong to the selected order.

## 5.4 — Inventory

### Retain

Quantity-only stock table, On Hand / Reserved / Available / Threshold columns, ingredient drawer, restock form, adjustment form, and operational stock alerts.

### Revise

1. **Make saves update records.** Restocking and physical-count adjustments must update stock, recalculate available quantity/status, and create an attributed stock movement. Refresh the drawer, table, alerts, and related views before announcing success.
2. **Fix zero handling.** Opening Adjust for an ingredient with zero stock must prefill zero. Remove the fallback that converts zero to 18.5 and proposes 18.0.
3. **Validate quantities.** Restock must be a positive finite quantity. Physical count may be zero but cannot be negative. Respect the ingredient's unit and supported precision. Display the resulting signed adjustment before confirmation.
4. **Keep stock concepts distinct.** Reserved includes relevant active held/confirmed reservations, not already consumed stock. Available is on hand minus active reserved quantities. Starting preparation reduces both physical on hand and the consumed reservation quantity; do not subtract the same requirement twice.
5. **Use base ingredients.** Remove in-house prepared starter/dough stock rows. If a starter is genuinely purchased as a base input, document that source instead of treating an in-house preparation as raw inventory.
6. **Implement sort and pagination.** Search/filter the full dataset; then sort and paginate it. Counts must match the available records. Do not advertise 24 records while providing only 12 with inactive page controls.
7. **Load ingredient-specific history.** The selected drawer must show that ingredient's movements and recipe usage, not the same flour history for every row.
8. **Fix the reservation summary.** Use “Ingredients with reservations” or show totals separately by unit. Do not combine kg, L, and pcs into one kg number.
9. **Remove unsupported location claims.** Omit bins/racks unless their values have an agreed source. Keep threshold/status read-only and system-derived within this revision.
10. **Handle discrepancies without concealing them.** If a physical count is below existing reservations, show an operational shortage requiring attention. Do not silently discard reservations or pretend all orders remain covered.

### Acceptance checks

- A 10 kg restock creates one +10 kg movement and changes the displayed balance by 10 kg.
- Adjusting recorded stock to the same physical count does not create a misleading change.
- Zero-stock adjustments remain zero until staff deliberately enter another count.
- The 10 kg / 2 kg reservation example in the shared rules works across queue, inventory, and movements.

## 5.5 — Stock Movements

### Retain

Read-only movement history, ingredient/type/source/date filtering, actor attribution, linked order references, and movement details without cost fields.

### Revise

1. **Use ERD movement types.** Map display labels to Restock, Consumption, Consumption Reversal, and Adjustment. Do not introduce a generic Reversal type for every correction.
2. **Replace generic Reverse Movement for manual adjustments.** Offer Record Correction, opening the selected ingredient's adjustment flow. Record a new adjustment with reason Correction and notes referencing the original movement. Preserve the original entry.
3. **Apply corrections to current stock.** Do not swap an old movement's before/after balances. Explain the present balance, proposed change, and result before saving.
4. **Prevent repeated submissions.** Use one operation identity per submitted correction. Repeated clicks/retries must not create duplicate entries or stock updates. A later intentional correction remains a separate action.
5. **Tie consumption to preparation.** Consumption entries should identify the fulfillment order and reservation and be created when preparation starts. Do not describe confirmation alone as physical consumption.
6. **Limit consumption reversals to actual recovered stock.** Do not automatically restore ingredients merely because a prepared order is cancelled. Display consumption reversals from the appropriate validated workflow; this revision does not add an unrestricted staff consumption-undo feature.
7. **Make filters and pagination real.** Add start/end inputs for Custom Range, calculate Today/Last 7 Days/Last 30 Days from timestamps, and derive totals/page counts from the filtered records.
8. **Show the actual actor.** Include owner and other staff accounts as applicable, alongside System. A system-created consumption event can separately indicate the staff member who initiated preparation when supported by its record.
9. **Fix units and historical balances.** Use movement counts or totals grouped by unit. Only show historical before/after balances if they can be derived reliably from the ledger and opening balance; otherwise omit them until supported.
10. **Connect order links.** An order-linked movement opens that fulfillment order's production detail, preserving the reference and staff data restrictions.

### Acceptance checks

- A correction adds one traceable movement and updates Phase 5.4 without deleting history.
- Correcting an older event uses current stock and accounts for intervening movements.
- Date filters, record counts, actor names, units, and pagination are accurate.

## 5.6 — Recipes

### Retain

Read-only recipe library, product/category search, variant selection, per-unit quantities, ingredient availability, and missing-BoM/loading/error states.

### Revise

1. **Flatten recipes into base ingredients.** Replace in-house Yudane, levain, dough, and similar intermediate BoM rows with their constituent ingredient quantities. Keep preparation instructions as descriptive notes where supported.
2. **Avoid double counting.** For a 100 g 1:1 flour/water preparation, account for 50 g flour and 50 g water once in the final per-unit requirement. Do not also retain the 100 g intermediate as tracked consumption.
3. **Include tracked packaging quantities.** Packaging that is part of the direct-material BoM must appear with units and quantities. Staff may see materials but not their costs.
4. **Keep variant quantities precise.** Label the reference as “Ingredients for 1 [variant unit].” A six-pack is one sellable unit; explain its piece count without treating six pieces as six purchased packs.
5. **Fix or remove unsupported weight calculations.** Correct the 943 g raw / 750 g baked / 12–14% loss inconsistency. Do not add ml to g without a defined conversion. Omit optional yield metrics if their data is not reliable.
6. **Remove invented metadata.** Omit unsupported SKU/revision/station fields and default fermentation instructions. Retain instructions only if they come from an agreed owner-maintained source; do not add staff recipe editing.
7. **Use current stock information.** Availability badges must match Inventory. Link an ingredient to its inventory detail and link order-specific scaling through the relevant production order.
8. **Clean up language.** Use Recipes, Inventory, Production Details, and Read-only. Remove phase numbers, protection badges, and claims of live cache synchronization from normal content.

### Acceptance checks

- Every tracked requirement resolves to an inventory base ingredient or tracked packaging material.
- Selecting another variant changes its actual quantities and units.
- Order-scaled requirements in Phase 5.3 equal the selected variant's per-unit BoM multiplied by order quantity, aggregated by ingredient.
- No financial or recipe-editing controls appear for staff.

## 5.7 — Production Calendar

### Retain

Read-only schedule, order-type distinctions, day/week/month modes, agenda, blocked-date visibility, deferred-delivery labels, and detail inspector.

### Revise

1. **Implement selected-date state.** Today goes to the shared current date. Previous/Next advances by the selected view's day/week/month. Render a complete month grid, including required leading/trailing dates.
2. **Rebuild the agenda on selection.** Clicking Wednesday must load Wednesday's orders, totals, and details, not Tuesday's records under a different heading.
3. **Use one filtered dataset.** Type, status, search, and Show Completed must affect the visible calendar, agenda, inspectors, and counts consistently. Completed is distinct from Ready.
4. **Count fulfillment orders consistently.** Label commitment counts as orders. A multi-item order counts once, although it can display several item rows. Label quantities by sellable units and clarify pack sizes; do not mix loaves, packs, and individual pieces into an unexplained total.
5. **Fix all summary arithmetic.** Remove the conflicting 19/21 weekly commitments and Tuesday's incorrect 18-unit total. Calculate counts rather than typing them into cards.
6. **Use real inspector records.** Every displayed order opens its matching details. Missing records show a clear unavailable/not-found state instead of invented “Artisan Batch Item” data. Production Details must navigate rather than show a routing alert.
7. **Respect capacity examples.** Use fixtures consistent with the default cake limits, or document a real owner-configured override in development data. Staff remain unable to alter limits or blocked dates.
8. **Distinguish dates accurately.** Show fulfillment dates and supported subscription preparation days. Do not imply persisted oven shifts, routes, or precise preparation windows that the system does not store. Display deferments on the replacement date with the original date retained as context.
9. **Improve layout.** Set readable minimum widths for week columns, provide clear horizontal scrolling when needed, and allow the agenda to collapse. Prefer a day/agenda presentation on small screens. Keep order references, status badges, and action targets legible.
10. **Handle view states consistently.** Loading/error/empty states must apply to the current date range and filters. Retry must preserve that context.

### Acceptance checks

- Every date selection loads matching records; all dates in the displayed month are reachable.
- Counts agree between dashboard, queue, calendar, and agenda under the same scope.
- Completed pickups appear only when the selected view/filter includes completed orders.
- Rescheduled subscription deliveries appear once on the replacement date rather than being duplicated as active work on both dates.

## 5.8 — Staff Notifications / Account Settings

### Retain

Operational feed, unread/category filters, acknowledgement, first/last-name editing, read-only role/email, and password-change fields.

### Revise notifications

1. **Use operational events with supported mappings.** New orders, low stock, and subscription deferments must map to their appropriate ERD types. Document any additional order-ready, delivery-status, or cake-specification event types needed before integration; do not silently map them to unrelated events.
2. **Use Read / Acknowledged, not Archived.** There is no archive state in the current `SystemNotification` model.
3. **Explain shared acknowledgement.** Use short copy such as “Acknowledging marks this update as read for the team.” Save the shared read status/time and update unread counts across views and sessions during integration.
4. **Scope mark-all correctly.** Mark only notifications available to the staff role; do not affect inaccessible owner-only records.
5. **Correct fulfillment wording.** Pickup alerts refer to collection/handoff. Courier alerts apply to eligible deliveries. Cakes refer to owner delivery or pickup.
6. **Connect event links.** View Order, View Inventory, and View Calendar must open the related record/date without exposing restricted information.
7. **Use shared counts.** The header bell, sidebar badge, tab, and filters must agree. Include all-read, no-matches, loading, error, and failed-acknowledgement states.

### Revise account settings

1. **Use one authenticated identity.** Replace the conflicting Maria Santos / Elena Lim displays with the same current account across header, sidebar, profile, and activity attribution.
2. **Make profile changes coherent.** Validate first/last names, update all relevant identity labels, and show success only when the save succeeds. Provide a failed-save state that preserves entered values.
3. **Use a genuine password-change flow during integration.** Verify the current password, apply the agreed password policy, check confirmation, update credentials securely, and handle incorrect-password/save failures. The prototype may demonstrate those outcomes but must not represent timeout-only success as implemented security.
4. **Remove unsupported staff tiers and shifts.** Omit Assigned Station & Shift and Shift Lead permission claims. State that the owner/administrator manages the account role and login email under the current design.
5. **Cover first-use setup through authentication.** Ensure temporary-password/account-setup requirements are handled before workspace access. Reuse the existing authentication flow rather than inventing a second staff registration process.

### Acceptance checks

- Acknowledging one notification updates all related unread counters; integration preserves the shared state across reloads/sessions.
- Owner-only notifications and data remain inaccessible to staff.
- Wrong current passwords are rejected; failed profile/password saves never announce success.
- Every current-user label shows the same account.

## Decisions and dependencies that remain open

These do not prevent the visual and local-interaction revisions above. Keep them explicit before backend integration.

| Topic | Interim revision instruction | Decision needed |
| --- | --- | --- |
| Subscription capacity | Display actual accepted weekly fulfillment records. Do not add staff capacity controls or infer ingredient consumption from enrollment. | Reconcile the chapter statements about capacity committed at enrollment versus week-by-week allocation. |
| Staff restock and owner costing | Let staff record quantities without entering or seeing costs. | Define how owners enter associated costs and which cost basis applies until then. |
| Additional internal notification events | Preserve useful operational alert layouts and document proposed event mappings. | Confirm any changes to `SystemNotification.notification_type`. |
| Extra operational metadata | Omit unsupported shifts, stations, storage locations, recipe revisions, and item-level audit claims. | Agree a storage model if these features are deliberately retained later. |
| Chapter wording | Follow the confirmed reserve-on-confirmation / consume-on-preparation rule. | Update earlier chapter statements that describe physical deduction at confirmation. |

## Revision delivery checklist

- [ ] All eight subphases follow the shared rules and their individual revisions.
- [ ] One consistent dataset supports navigation and actions across screens.
- [ ] Staff can complete Ready pickup orders after handoff.
- [ ] Starting preparation deducts ingredients exactly once; readiness/completion do not deduct again.
- [ ] Subscription and cake examples match their supported models and fulfillment rules.
- [ ] Inventory and movement updates agree; corrections preserve history.
- [ ] Calendar navigation, selection, filtering, totals, and responsive layout work.
- [ ] Account and notification outcomes distinguish successful changes from failed or simulated operations.
- [ ] No developer scenario dock or unsupported system claims appear in normal staff flows.
- [ ] Review desktop and mobile layouts, keyboard access, dialog focus/Escape, and readable statuses. Verify server-side permissions and transactional behavior during integration.
