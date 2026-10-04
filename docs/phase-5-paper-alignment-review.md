# Phase 5 implementation review against the paper and ERD

Date: October 4, 2026  
Scope: The integrated application, not the original UI Generator exports.  
Verdict: **Partially aligned. The staff interface demonstrates the intended operational scope, but several shared workflows conflict with the paper or lack the records required by the ERD.**

This is the review snapshot before the subsequent website revisions. See [the revision results](phase-5-paper-revisions.md) for fixes, the user-confirmed subscription policy, verification, and remaining production qualifications.

This review does not change application code. It supplements the [original export review](phase-5-staff-ui-review.md), [revision brief](phase-5-staff-ui-revisions.md), and [implementation report](phase-5-implementation.md).

## 1. Review basis

### Sources and interpretation

| Source | Used to assess |
| --- | --- |
| [Chapter 1](../Chapters/Chapter%201.md), sections 1.4.1 and 1.4.2 | Staff restrictions, three purchasing workflows, inventory-driven availability, four deliveries, base ingredients, and owner-delivered cakes. |
| [Chapter 2](../Chapters/Chapter%202.md), sections 2.1.3–2.1.5 and synthesis | Rationale for centralized production planning and recipe-based inventory. Related-system features are not automatically Kitchen406 requirements. |
| [Chapter 3](../Chapters/Chapter%203.md), BoM, scheduling, RBAC, authentication, and API discussions | Material planning, booking limits, access separation, payment and delivery responsibilities, and production architecture. |
| [Chapter 4](../Chapters/Chapter%204.md), Figures 7, 16–23, 25, and 27–29 | Staff functions, account setup, material records, subscription commitments, fulfillment, notifications, recipes, and stock operations. |
| [ERD](../Chapters/ERD.md) | Exact entities, relationships, statuses, identity fields, timestamps, and uniqueness/atomicity constraints. |

The ERD attribute table and chapter explanations are the data-model references used here; embedded diagram artwork was not independently validated against that table. This review is not a certification that every diagram and prose description agrees.

Two user decisions also govern the implementation:

- Staff may complete a Ready pickup after handoff.
- Confirmation reserves ingredients; starting preparation deducts physical stock exactly once. Ready and Completed do not deduct again.

Those decisions are retained. Where chapter wording suggests otherwise, the paper needs clarification rather than silently reversing the agreed behavior.

### Method and limits

Reviewed the staff UI/state modules, shared inventory, authentication, customer purchase adapters, subscription scheduling, and existing verification coverage. Ran targeted state probes in a separate disposable Chrome tab, which was closed afterward. These probes use the loaded application services; they are not new end-to-end payment-provider tests.

The previous implementation run reported 63 passing Phase 5 checks. That suite was inspected, not rerun for this document. Its success does not prove paper alignment: it does not cover several negative cases identified below. No real payment, courier, email, or SMS service was exercised.

## 2. Alignment by subphase

“Aligned” below means the demonstrated local behavior matches the requirement. Persistence, server authorization, and database constraints remain separate production obligations.

| Subphase | What aligns | What remains incomplete or incorrect | Assessment |
| --- | --- | --- | --- |
| **5.1 Dashboard** | Summaries derive from shared paid orders; date scope and current stock alerts are distinguished; financial/customer data is omitted. | Stock notifications do not run on every availability change. Future unreserved subscription demand is not represented by current available stock. | Partial |
| **5.2 Production Queue** | Shared references, quantities, date/type/status filters, guarded Confirmed → Preparing → Ready flow, and Ready pickup completion. | Upstream subscription acceptance can create unreserved commitments. Order/delivery status separation and audit identity need correction. | Aligned core flow; shared-model gaps |
| **5.3 Production Details** | Selected order retains its identity; requirements scale by quantity; cake selections and owner delivery are preserved; physical use occurs once. | Approved production notes/reference images are absent; courier state is inferred; history contains only staff transitions from this session. | Partial |
| **5.4 Inventory** | Base inputs, on-hand/reserved/available separation, positive restocks, zero physical counts, adjustment reasons, and derived thresholds. | Stock changes do not update storefront availability consistently; retry holds and subscription reservations are incomplete. | Partial |
| **5.5 Stock Movements** | Signed changes, before/after quantities, timestamps, reasons, order links, filtering, and correction entries. | Actor names replace account IDs; reservation links and persistent operation uniqueness are missing. | Partial ERD alignment |
| **5.6 Recipes** | Read-only product/variant quantities, direct base ingredients, packaging as a material, and no staff price/recipe editing. | Recipes are hardcoded examples, not owner-maintained ProductBOM records. | Aligned presentation; unvalidated data |
| **5.7 Calendar** | Shared fulfillment records, day/week/month views, date selection, filters, blocked dates, and original/replacement subscription date context. | Preparation-day scheduling is absent; capacity timing conflicts within the paper remain unresolved. | Partial |
| **5.8 Notifications / Settings** | Shared read acknowledgement/time, profile edits, current-password checks, restricted email/role, and active/setup gates. | Notification enums/references differ from the ERD; stock events are incomplete/noisy; provisioning and first-use setup are not implemented. | Partial |

The shared header, footer, page introductions, and cards meet the user's consistency request. The paper does not prescribe a particular hero layout or card radius, so those visual choices are not paper-compliance defects.

## 3. Findings requiring implementation changes

### F1 — High: Subscriptions can activate without sufficient ingredients

**Requirement:** Chapter 1 scope items 3 and 7, Chapter 3 scheduling, and Chapter 4 Figure 27 require inventory checks alongside capacity checks. Checkout must hold applicable inventory while payment is pending.

**Evidence:** [subscription-state.js](../app/subscription-state.js), `B.configReason`, `B.createPurchase`, and `B.retry`, check capacity but do not reserve shared ingredients. In [staff-integration.js](../app/staff-integration.js), `B.pay` first creates an active subscription and four paid fulfillment orders, then tries to reserve the first delivery. A shortage emits a notification without reversing activation or assigning payment resolution.

**Confirmed probe:** Set flour to zero and confirm a valid four-date subscription payment through `B.pay`. The result was an **active** subscription, **four** fulfillment orders, payment **confirmed**, and **zero** ingredient reservations.

**Required revision:** Validate and temporarily hold the ingredients due under the agreed reservation policy before payment. On confirmation, confirm that hold atomically. If a late payment cannot secure required resources, record a payment-resolution outcome and keep the affected work out of the normal production queue. Do not invent an automatic refund; the ERD excludes refund handling.

**Acceptance:** Depleted first-delivery ingredients block checkout; loss of a released hold before a late payment produces resolution rather than normal confirmed production.

### F2 — High: Standard payment retry does not restore the ingredient hold

**Requirement:** Chapter 4 Figure 27 and `CheckoutHold` / `InventoryReservation` require resources to be held during payment, including a new payment attempt.

**Evidence:** [orders.js](../app/orders.js), `retry-payment`, updates the deadline and calls `C.setPayment(o, 'waiting')`. The integration wrapper releases inventory for failure/expiry but reserves again only through order creation or payment confirmation. The retry action does not call order creation. Consequently, the released reservation stays released while the replacement payment is pending.

**Impact:** Another checkout can claim the ingredients during the retry. Confirmation may then fall into resolution despite having presented a new payable attempt.

**Required revision:** Revalidate and acquire a new inventory/capacity hold before presenting the retry payment. Link each attempt to its own hold, as required by `Payment.hold_id` uniqueness.

**Acceptance:** Fail or expire a held order, retry it, and assert an active ingredient hold exists throughout the new payment window. Competing checkout must see that reserved quantity.

### F3 — High: Product availability is not derived from shared inventory

**Requirement:** Chapter 1 scope item 7 and Chapter 3 scheduling explicitly disable ordering affected products when ingredients are depleted.

**Evidence:** [catalog.js](../app/catalog.js) and [product.js](../app/product.js) use fixture availability flags. [subscription-state.js](../app/subscription-state.js), `B.offering`, also uses fixture/scenario availability. `I.change` does not update those flags or supply a shared availability selector. Standard cart validation does consult the ingredient ledger, which is a useful final guard but does not satisfy consistent product availability.

**Confirmed probe:** With flour at zero, Babka's product `available` value remained `true`.

**Required revision:** Derive product/variant eligibility from its BoM and available ingredients, alongside manual catalog status and the applicable scheduling policy. Use that result across catalog, product details, cart, and subscriptions. Recalculate after reservation, release, consumption, and stock adjustment.

**Acceptance:** Depleting a required ingredient disables affected purchase paths; restocking restores eligible products without changing unrelated products.

### F4 — High: Future subscription material planning has no reservation schedule

**Requirement:** `OrderMaterialRequirement` includes `fulfillment_date` and `reserve_at`; each reservation belongs to a specific ingredient requirement.

**Evidence:** [inventory-state.js](../app/inventory-state.js), `I.plan`, stores only an ingredient-to-quantity map. `I.reserve` stores a whole-order bundle with no requirement IDs or reserve-at schedule. The subscription adapter initially reserves only delivery one. No job or lifecycle hook advances reservation to the next delivery; later orders consume directly when preparation starts if stock is available.

**Impact:** “Rolling reservation” in the implementation report describes a provisional policy, not an implemented rolling scheduler. Future confirmed demand can remain unreserved until staff start work. Deferments cannot update reservation timing that is not stored.

**Required revision:** Represent the ERD requirement records and implement an explicit reservation policy for each weekly fulfillment. Recalculate its timing on deferment while preserving the original scheduling history. Keep projected requirements distinct from presently reserved stock.

**Acceptance:** Advance the reservation clock through all four cycles and defer one delivery. Verify only the intended requirements reserve at each boundary and that no cycle disappears from material planning.

### F5 — Medium: Operational statuses conflate separate ERD entities

**Requirement:** `Order.status` uses `ready`; courier progress belongs to `Delivery.status`. `SubscriptionDelivery.status` permits `scheduled`, `preparing`, `ready`, `fulfilled`, and `cancelled`.

**Evidence:** [staff-state.js](../app/staff-state.js), `S.orderStatus`, normalizes `ready-pickup` / `ready-delivery` but leaves `in-transit` as an order status. `S.project` infers courier progress from order status or an optional `staffCourier` value. Existing subscription state stores `pending` / `deferred`, which are not the ERD delivery-status enum. Deferment is represented separately in the ERD.

**Required revision:** Add explicit model mappings. Keep order readiness, delivery-provider progress, and subscription fulfillment status distinct. Display a deferment as schedule context, with its actual fulfillment status still valid. Do not infer courier delivery merely because an order is Completed.

**Acceptance:** An in-transit courier delivery does not create an unsupported Order status; a deferred unprepared subscription fulfillment remains `scheduled` with linked deferment context.

### F6 — Medium: Staff audit records lack stable identity and reservation references

**Requirement:** `OrderStatusHistory.changed_by_account_id`, `InventoryMovement.performed_by_account_id`, optional `reservation_id`, unique `operation_key`, and atomic stock/movement updates.

**Evidence:** [staff-state.js](../app/staff-state.js), `S.transition`, stores actor display names. [inventory-state.js](../app/inventory-state.js), `I.move`, also stores a name and order ID without the consumed reservation ID. Staff history is a separate in-memory map, not the complete order history. Operation keys are guarded by a local Set rather than a persisted unique constraint.

**Required revision:** Store stable account/requirement/reservation IDs and ERD timestamps. Render names through the account relationship. Use a database transaction for reservation consumption, movements, on-hand stock, status, and history; enforce operation uniqueness there.

**Acceptance:** Renaming staff does not split their audit identity. Every consumption can be traced to its order and reservation. Concurrent duplicate commands produce one transition and one set of movements. Local synchronous validation is not evidence of cross-session atomicity.

### F7 — Medium: Notifications do not yet match SystemNotification behavior and fields

**Requirement:** The ERD defines specific `notification_type` values, role recipients, related entity references, and shared acknowledgement.

**Evidence:** `S.emit` stores generic `orders` / `inventory` categories and a path. It does not store the supported event type and structured related-entity fields. Read acknowledgement and `read_at` are correctly shared within the local feed. However, `S.changed` creates low-stock keys using total movement count, and normal reservation/release paths do not call that stock-event check.

**Confirmed probe:** With flour low, calling `S.changed` produced one alert. Restocking unrelated salt produced another alert for the same unchanged flour condition; event count rose from one to two.

**Required revision:** Map new orders, low stock, and deferments to their ERD types; define any additional readiness event before persisting it. Evaluate alerts on availability changes, with a clear threshold-crossing/re-alert policy. Use stable related-entity IDs and support intended admin/staff recipients.

**Acceptance:** A reservation that crosses a threshold creates an appropriate alert. Unrelated stock movements do not duplicate an unchanged warning. Acknowledgement persists and does not affect inaccessible notifications.

### F8 — Medium: Cake production information is incomplete

**Requirement:** Chapter 4 Figures 7 and 28 require access to the custom-cake details needed to prepare the order; the request model contains design description and image data. Customer details remain restricted by Chapter 1 RBAC.

**Evidence:** [staff-ui.js](../app/staff-ui.js), `details`, displays accepted option selections/add-ons but replaces notes and references with a message about future owner-reviewed information. No reviewed-copy workflow currently supplies them.

**Required revision:** Provide an owner-reviewed operational description and reference image associated with the accepted design, excluding identifying content. Record the source and approval clearly; agree any additional schema fields rather than inventing them implicitly.

**Acceptance:** Staff can prepare the accepted design from its approved specifications and reference without receiving the customer's contact/address or unreviewed identifying notes.

### F9 — Medium: Calendar shows fulfillment commitments but not preparation schedules

**Requirement:** `SubscriptionSchedule` has both `preparation_day` and `fulfillment_day`; Chapter 4 describes staff using schedules to determine upcoming preparation work.

**Evidence:** [subscription-state.js](../app/subscription-state.js) stores a schedule `day`, while [staff-ui.js](../app/staff-ui.js), `calendar`, places records only by fulfillment date. Replacement/original date context is present and useful.

**Required revision:** Carry the supported preparation day through subscription scheduling and label preparation and fulfillment dates distinctly. This does not require inventing oven shifts or precise production times.

**Acceptance:** A subscription with preparation and delivery on different days appears in the appropriate operational view without being counted as two fulfillment orders.

## 4. Production dependencies, not new staff UI permissions

| Dependency | Current state and required next step |
| --- | --- |
| Server access control | Staff renderers omit sensitive fields and customer routes have role gates, but all records remain in browser memory and developer controls can enter staff mode. Implement the Chapter 3 Auth.js/server boundary before claiming confidentiality. |
| Provisioning and first-use setup | One predefined staff account has `setup: true`; inactive/unset-up access is rejected. `StaffProfile.created_by_admin_id`, temporary-password change, and `AccountVerification` account setup are not implemented. Build the owner provisioning and staff setup journey. |
| Credentials and persistence | Local password hashing/checking demonstrates interaction only. Changes reset on reload. Production credentials/session handling and persistent records are required. |
| Recipe authority | Product-specific example formulas support the demonstration, but the paper requires owner-maintained variant BoMs. Import and validate owner data; do not present sample quantities as the bakery's actual recipes. |
| Owner costs | Keeping cost fields out of staff screens aligns with RBAC. The shared production model still needs `Inventory.cost_per_unit` and the movement cost-snapshot policy for owner reporting. |
| External delivery and notifications | The staff workflow correctly leaves courier booking to the owner and cake delivery outside Lalamove. Real Delivery records, provider events, and notification logs still need implementation. |

Staff should not receive recipe editing, prices/margins, customer addresses, courier booking controls, or account-role administration as a workaround for these gaps.

## 5. Paper inconsistencies that need an explicit decision or wording update

### P1 — Physical deduction timing

Chapter 3's BoM discussion says confirmed orders project and deduct stock. Chapter 4's material-planning explanation and the ERD distinguish requirements, reservations, and physical movements. The user has explicitly chosen physical deduction at preparation start.

**Recommended paper clarification:** Confirmation reduces available stock through reservation. Starting preparation reduces stock on hand and consumes the reservation atomically. Ready/Completed do not deduct again. The implementation's core preparation flow follows this decision.

### P2 — Subscription capacity reservation timing

Chapter 3 says weekly subscription capacity is consumed as each delivery approaches, rather than reserved in full at enrollment. Chapter 4 Figure 19 describes checking/allocating capacity for scheduled deliveries before finalizing the commitment. [scheduling.js](../app/scheduling.js), `D.reserve`, creates allocations for all four dates during enrollment/payment.

**Assessment:** The implementation follows the four-date commitment interpretation. It cannot be called fully aligned with both passages. Resolve the capacity policy in the paper separately from ingredient `reserve_at` timing. Do not assume that a decision about one resource decides the other.

### P3 — Notification prose versus ERD attributes

Chapter 4 Figure 22's explanation mentions `NotificationLog.recipient_type` and retry information. The final attribute table instead specifies `recipient_account_id`, provider/status/error fields, and no explicit retry-count field.

**Recommended correction:** Align that explanation with the final ERD, or explicitly revise the ERD if additional fields are intended. This is a paper maintenance issue, not justification for silently adding fields to staff notifications.

## 6. Verification gaps and revision order

The existing staff tests establish useful behavior: preparation consumes once, shortage validation avoids partial deductions, pickup completion preserves quantities, role gates work locally, and standard/cake/subscription identities survive updates. They do not establish the negative cases below or the paper's planned owner/user acceptance testing.

Recommended order:

1. **Correct commitment/availability defects:** F1 subscription inventory checks, F2 retry holds, F3 shared product availability.
2. **Resolve material and capacity policy:** P2, then F4 reservation timing and deferment handling.
3. **Align records with the ERD:** F5 statuses, F6 identity/audit relationships, F7 notification types and triggers.
4. **Complete staff production information:** F8 approved cake references and F9 preparation schedules.
5. **Build production services and validate with owners:** Auth, provisioning, persistence, atomic commands, owner BoMs, and external integration.

Add acceptance coverage for:

- Zero-stock subscription checkout and late-payment resolution.
- Standard payment retry with a competing checkout.
- Availability after reserve/release/restock/adjustment across all purchase paths.
- Four-cycle material reservation timing and rescheduling.
- Separate order, courier, and subscription-delivery states.
- Stable actor identity after profile changes and reservation-linked movements.
- Low-stock events from reservations and duplicate-warning prevention.
- Approved cake design access without customer data.
- Preparation versus fulfillment dates.
- Multiple staff sessions, reload persistence, and concurrent updates once a backend exists.

## 7. Conclusion

**Keep the shared design and the confirmed preparation/pickup flow.** They fit the staff responsibilities in the paper. The current output is suitable for a functional prototype review, but it should not yet be described as fully aligned or ready for live bakery operation. The highest-priority corrections are subscription stock acceptance, payment retry holds, and inventory-driven availability; the ERD records and the paper's scheduling policy then need reconciliation.
