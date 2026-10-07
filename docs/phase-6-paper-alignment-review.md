# Phase 6 — Owner Operations: Paper and ERD Alignment Review

**Review date:** October 7, 2026  
**Scope:** The integrated application, covering subphases 6.1–6.12 and their shared customer/staff workflows.  
**Result:** **Partially aligned at the prototype level.** The main owner workflows follow the paper, but seven implementation findings and several unresolved model/policy differences prevent a claim of full alignment.

**Revision follow-up:** The seven website findings were subsequently addressed; see [implemented revisions and verification](phase-6-paper-revisions.md). This review preserves the original findings and outstanding policy/production qualifications.

This reviews the implementation after integration, rather than repeating the review of the original UI Generator exports. No application fixes are included in this review.

## 1. Basis and limits of the review

The review compared application code and targeted browser behavior with:

- [Chapter 1](../Chapters/Chapter%201.md): objectives, scope, exclusions, payment, inventory, capacity, and role boundaries.
- [Chapter 2](../Chapters/Chapter%202.md): costing and operational rationale, particularly sections 2.1.7 and 2.1.9.
- [Chapter 3](../Chapters/Chapter%203.md): proposed architecture and functional requirements for costing, scheduling, payments, logistics, and notifications.
- [Chapter 4](../Chapters/Chapter%204.md): textual ERD explanations and proposed workflows, especially Figures 17–22 and 25–31.
- [ERD](../Chapters/ERD.md): entities, fields, relationships, enums, and constraints. The schema table and chapter figure descriptions were reviewed; this is not a claim that every embedded diagram image was visually inspected.
- [Phase 5 confirmed policy revisions](phase-5-paper-revisions.md), [Phase 6 implementation plan](phase-6-implementation-plan.md), and [implementation record](phase-6-implementation.md).

The paper is the business baseline. Previously confirmed user decisions take precedence where they deliberately revise that baseline; these differences are recorded separately below. Existing-process illustrations in Chapter 4 are not treated as requirements to restore manual bank transfers or payment-proof uploads. Phase 7 account management and full financial analytics are not counted as missing Phase 6 screens.

The application remains an in-memory browser prototype. A working screen or simulated provider response does not establish database, server authorization, or live integration compliance.

### Verification performed

Code inspection was supplemented by ten targeted browser probes in a separate local preview tab. These covered late standard payments after capacity changes and date blocking, hold identity, subscription hold presentation, cancellation, pickup quotation presentation, payment date filtering, overhead inheritance, notification failure visibility, and cake daily limits. The tab was closed after testing; the user's existing preview tab was not used for these mutations.

The [verification record](../verification/README.md) reports **412 previously passing checks across eight suites**. Those suites were not rerun for this documentation-only review. Their recorded success does not cover all the cases below or substitute for the paper's user evaluation process.

## 2. Review of every subphase

“Aligned” below means the observed prototype behavior supports the stated requirement, not that the production architecture is complete.

| Subphase | What aligns with the paper | Remaining issue or qualification | Assessment |
| --- | --- | --- | --- |
| **6.1 Dashboard** | Derived operational counts, upcoming commitments, low-stock attention, and payment-resolution links use shared records. Subscription purchase totals avoid counting each prepaid fulfillment as new revenue. | Failed customer notifications do not reach owner attention (**F7**). Operational purchase totals are not the period-filtered sales/profit analytics described for the broader system. | Partial |
| **6.2 Orders** | Shared records cover standard purchases, subscription purchases and fulfillments, and custom cakes. Search, combined filters, pagination, and links support owner monitoring. | An invalid late standard payment can enter the confirmed queue (**F1**). The list cannot correct an upstream confirmation error. | Aligned presentation; confirmation defect |
| **6.3 Order Details** | Purchased item, address, and fulfillment snapshots; subscription/quotation links; preparation/readiness actions; actor history; and manual cake/pickup handoff match the operational flow. | Payment/hold history inherits **F2–F3**. Server-side atomicity and durable audit history remain unimplemented. | Partial |
| **6.4 Payments & Issues** | QR Ph attempts, order state, paid-resolution cases, references, and filters are exposed separately. There is no owner mark-paid shortcut. | Hold identity/status is unreliable (**F2**), cancelled attempts remain pending (**F3**), and date filters disagree with displayed local dates (**F5**). | Requires revision |
| **6.5 Deliveries** | Owner booking is limited to eligible Ready standard/subscription delivery orders. Pickup and custom cakes are excluded. Booking, reconciliation, and courier progress are separate from production state. | Provider outcomes are simulated. Retried bookings do not yet form a complete persistent ERD delivery history. | Aligned prototype; production/model work remains |
| **6.6 Inventory** | Physical, reserved, and available quantities are distinguished. Unit-aware restocking/count adjustments, requirements, movement actors, costs, and thresholds support the paper's inventory goals. Staff financial restrictions remain separate. | Stock timing follows the confirmed policy rather than older Chapter 3 wording (**D1**). Restock entry and unit-cost editing are separate; the owner must update the cost before a restock if that movement is to capture a changed purchase cost. | Mostly aligned, with policy/workflow qualifications |
| **6.7 Recipes & Costing** | Flat variant BoMs, packaging, missing-cost handling, materials plus overhead and markup, suggested prices, margins, and explicit selling-price changes follow the costing proposal. | Saving a recipe silently creates an overhead override and cannot restore default inheritance (**F6**). Persisted pricing metadata remains incomplete. | Requires revision |
| **6.8 Cake Requests** | Original submissions, references, customer context, feasibility review, rejection, lifecycle, and quotation history support manual owner review. | Failure to notify the customer is visible on the quotation but is not raised in owner attention (**F7**). Multiple references/approved production copies need a schema decision (**D4**). | Mostly aligned |
| **6.9 Quotation Builder** | Explicit charges, fulfillment method/date/window, expiry, versioned issued quotations, accepted-content locks, notification retry, and owner-approved production instructions support the proposed quotation workflow. | Pickup quotations are incorrectly presented to customers as delivery (**F4**). Negotiation supports notes and quotation terms; structured changes to originally selected options/add-ons are not exposed in the builder. | Partial |
| **6.10 Subscriptions** | Four-delivery timelines, purchase/fulfillment links, one successful deferment, reservation visibility, and retained original/replacement allocation history match the principal subscription model. | Upfront capacity follows confirmed policy (**D1**). Owners inspect deferments but cannot process them; clarify Chapter 4's wording before adding an approval workflow (**D2**). | Aligned to confirmed policy; paper clarification needed |
| **6.11 Capacity Calendar** | Separate standard, subscription, and cake pools; real dates; held/confirmed usage; product grouping; and linked commitments support resource planning. | Late standard receipts bypass capacity revalidation (**F1**). The common view is not a full persistent allocation ledger. Cake same-day policy needs clarification (**D3**). | Partial |
| **6.12 Blocked Dates & Scheduling** | Block reasons, lead/cutoff rules, separate schedules, product/fallback settings, draft handling, and preservation of existing commitments support scheduling requirements. | A late payment can confirm a previously expired standard checkout on a newly blocked date (**F1**). Cake daily-limit configuration exposes the policy ambiguity in **D3**. | Partial |

## 3. Implementation findings

### F1 — High: Late standard payments can confirm against full or blocked capacity

**Requirement:** Chapter 1's capacity controls and Chapter 4, Figure 27 require resource validation before operational confirmation. The ERD separates receipt of payment from order confirmation and permits `payment_resolution_required`.

**Evidence:** In [staff-integration.js](../app/staff-integration.js), the `C.setPayment` wrapper checks `schedule.standard` for a waiting/retry transition, but the confirmed branch checks only ingredient reservation before delegating to the original payment handler. It does not revalidate standard capacity or blocked dates when the original hold has expired or been released.

**Observed reproductions:**

1. Create a standard checkout and expire its payment/hold.
2. Set the product's daily capacity to two units and confirm a competing order that uses those two units.
3. Deliver a late successful payment for the original order.
4. The original order becomes paid and confirmed; usage reaches **four units against a limit of two**.

A separate probe expired a checkout, blocked its date, and then delivered payment success. The result was still **paid and confirmed on the blocked date**.

**Required revision:** When no valid guaranteed checkout hold remains, revalidate and acquire the complete resource bundle before confirming the order. Preserve a valid existing commitment without double counting it. If payment succeeds but capacity, scheduling, or stock cannot be secured, retain the receipt and use payment-resolution state without releasing the order to production. Do not solve this by silently discarding payment or adding an owner force-confirm action.

**Acceptance checks:** Late success against full capacity, blocked dates, elapsed cutoff, and insufficient stock must enter resolution. Valid normal success must confirm once without duplicate allocations or deductions.

### F2 — High: Checkout holds are conflated with material reservations and payment history can be rewritten

**Requirement:** Chapter 4, Figures 18–20 and the ERD define distinct `CheckoutHold`, `Payment`, and `InventoryReservation` records. A payment attempt's relationship to its originating checkout hold is audit history; transferring materials to a fulfillment order is a separate operation.

**Evidence:** [inventory-state.js](../app/inventory-state.js), `I.reserve`, assigns a newly acquired material hold ID to the current attempt. [owner-orders.js](../app/owner-orders.js), `paymentRows`, derives the displayed checkout-hold status from inventory reservation history rather than an independent checkout-hold record.

**Observed behavior:**

- A late successful standard payment changed the same attempt's hold reference from `IH1` to `IH3`, with only one payment attempt present. The old material hold remained released, but the attempt no longer pointed to it.
- A successfully paid subscription displayed its hold as **Released** because ingredients were released from the purchase parent and transferred to the first delivery. That transfer did not mean the checkout failed or was abandoned.

Explicit expiry paths also release material reservations; that state alone cannot reliably distinguish checkout expiry from deliberate release.

**Required revision:** Introduce independent checkout-hold records and lifecycle state. Keep a payment attempt linked to its original hold. Record recovery reservations separately; create a new payment attempt only for an actual new payment attempt. Confirmed checkout history must remain confirmed when material reservations transfer or are consumed. Render checkout and material states independently.

**Acceptance checks:** A paid subscription shows a confirmed checkout and the correct delivery-level material reservation. Late receipts retain the original attempt/hold association. Actual retries produce separate attempts. Expired, released, confirmed, and consumed resources are not treated as interchangeable.

### F3 — Medium: Cancelled unpaid purchases still appear as pending payments

**Requirement:** The ERD gives `Payment` its own state, including `cancelled`. Chapter 4, Figure 27 describes distinct checkout/payment outcomes. Owner inspection must reflect those outcomes accurately.

**Evidence:** Cancellation paths in [subscription-state.js](../app/subscription-state.js), [cake-state.js](../app/cake-state.js), and [commerce.js](../app/commerce.js) update purchase/order payment state without consistently updating the active attempt. [operations-state.js](../app/operations-state.js), `R.payments`, reads the attempt state.

**Observed behavior:** Creating and then cancelling an unpaid subscription produced purchase payment `cancelled`, attempt state `waiting`, and owner payment status `pending`.

**Required revision:** Route cancellation through a shared payment-attempt transition. Cancel the applicable active unpaid attempt while retaining previous terminal attempts and their history. Keep order cancellation and payment status separate when a payment was already received.

**Acceptance checks:** Cancel unpaid standard, subscription, and cake checkouts. Their active attempts must appear under Cancelled rather than Pending, and no production order may be released.

### F4 — Medium: Customer quotation views mislabel pickup as owner-managed delivery

**Requirement:** Chapter 4, Figures 21 and 26 and the ERD's quotation fulfillment fields require the issued quotation to preserve and present the agreed fulfillment terms. Chapter 1 excludes custom cakes from the automated courier workflow; it does not make every cake a delivery.

**Evidence:** The owner command correctly stores pickup with no delivery fee or address. However, [cake-builder.js](../app/cake-builder.js), `B.fulfillment`, always renders an owner-managed delivery heading and an address. [cake-requests.js](../app/cake-requests.js) uses this helper and a delivery-specific fee label.

**Observed behavior:** An owner-issued quotation had method `pickup`, fee `0`, and address `null`. Its customer view still displayed **Owner-managed delivery** and **Select a delivery address**. The stored terms and customer-facing terms disagreed.

**Required revision:** Render the quotation's fulfillment snapshot through a method-aware shared component. For pickup, show collection instructions and omit destination/address prompts. Apply consistent labels to quotation review, acceptance, payment, and order details.

**Acceptance checks:** Review both pickup and delivery quotations as the customer, including after a revised version is issued. The displayed method, fee, address, and resulting order must agree.

### F5 — Medium: Payment date filters use UTC while timestamps display Manila time

**Requirement:** Accurate payment inspection and date-based reporting depend on a consistent business date. This is a consistency finding inferred from the paper's operational reporting requirements; the ERD does not explicitly prescribe a timezone.

**Evidence:** [owner-orders.js](../app/owner-orders.js) extracts filter dates with `toISOString().slice(0,10)`. [owner-ui.js](../app/owner-ui.js) displays timestamps in `Asia/Manila`.

**Observed behavior:** An attempt at `2026-10-14T00:30:00+08:00` displayed October 14, but its filter date was October 13. Filtering for October 14 returned no matching payment.

**Required revision:** Use one shared Manila business-date helper for displayed dates and filtering. Label whether the filter means attempt creation or payment receipt; do not substitute one for the other silently.

**Acceptance checks:** Include attempts around local midnight and UTC midnight. A payment must match the date shown in the selected date field.

### F6 — Medium: Recipe editing silently disables default-overhead inheritance

**Requirement:** Chapter 3's costing module and Chapter 4, Figures 17 and 29 specify a default utility overhead with optional product-specific overrides. `ProductVariant.utility_overhead` is nullable in the ERD, supporting inheritance.

**Evidence:** [owner-inventory.js](../app/owner-inventory.js) prepopulates a required overhead input with the effective default. [pricing-state.js](../app/pricing-state.js), `P.save`, always stores that value as an override and provides no way to clear it.

**Observed behavior:** Saving an existing recipe with the unchanged default of 25 created an override of 25. Changing the global default to 50 then left that variant at 25, even though the owner had not explicitly chosen a custom overhead.

**Required revision:** Add an explicit “Use default overhead” choice. Persist inheritance as null/absence; only store an override when selected. Allow an existing override to return to inheritance. Preserve zero as a valid explicit override.

**Acceptance checks:** Editing only BoM quantities must preserve inheritance. Global changes affect inherited variants but not explicit overrides. Switching back to default restores inheritance.

### F7 — Medium: Failed quotation notifications do not reach owner attention

**Requirement:** Chapter 4's administrator framework and Figure 22 distinguish customer notification logs from internal system notifications. The ERD includes `SystemNotification.notification_send_failed` and recipient-role targeting.

**Evidence:** [owner-cake-state.js](../app/owner-cake-state.js), `Q.notify`, updates the quotation's notification state and customer event. [staff-state.js](../app/staff-state.js) exposes only a limited operational event set, and [owner-orders.js](../app/owner-orders.js) builds dashboard attention from payment-resolution and low-stock conditions. There is no corresponding owner failure event/feed entry.

**Observed behavior:** Simulating quotation notification failure left the quotation marked failed, with no internal event and a dashboard showing no attention items. The quotation detail's retry control works, but the owner must already know which quotation to reopen.

**Required revision:** Emit a role-targeted internal failure event linked to the quotation and notification attempt. Surface unresolved failures in owner attention or a shared notification center. Keep customer delivery logs separate from internal acknowledgement and avoid duplicate alerts during retries.

**Acceptance checks:** A failed quotation message creates a discoverable owner alert. Staff do not receive restricted customer/financial content. A successful retry preserves failed-attempt history and resolves the appropriate alert.

## 4. ERD and architecture coverage

These are prototype-to-production gaps, not seven additional screen defects. JavaScript aliases are acceptable when a documented adapter preserves the ERD meaning; matching field names alone is not compliance.

| ERD/architecture area | Current representation | Work needed before claiming full alignment |
| --- | --- | --- |
| Account, AdminProfile, role authorization | Preview session guards, owner role, account actors, safe staff projections. | Real authentication and server permissions. Fields named `created_by_admin_id` currently use preview account IDs; map them to AdminProfile IDs where the ERD requires that FK. Account actor FKs remain a different relationship. |
| Order, OrderItem, status history | Shared order types, purchase snapshots, fulfillment links, and actor-attributed transitions. | Durable records, explicit enum adapters, transactions, and concurrency enforcement. Retain purchase-parent versus fulfillment-order semantics. |
| CheckoutHold and Payment | In-memory attempts and material-hold references. | Correct **F2–F3**, persist distinct holds/attempts, enforce IDs and provider-reference uniqueness, and handle real payment callbacks idempotently. |
| CapacityConfig, CapacityAllocation, BlockedDate | Shared capacity facade; standard usage projected from orders, cake usage from holds, subscription allocations with retained IDs/history. | A durable allocation ledger for every pool, with the ERD's config/source/fulfillment/checkout links and held, confirmed, fulfilled, released, and expired lifecycle. A paid-order projection is not a fulfilled-allocation audit trail. |
| Subscription, SubscriptionDelivery, SubscriptionDeferment | Four deliveries, one successful deferment, retained original/replacement allocations, separate purchase and fulfillment links. | Persist relationships and constraints atomically; reconcile the paper with **D1–D2**. |
| Requirements, reservations, stock movements | Separate future requirements, active material reservations, consumption, actor attribution, operation keys, and available cost snapshots. | Durable transactions, uniqueness and reconciliation under concurrent users. Old missing cost data must remain unknown rather than be invented. |
| ProductBOM, ProductVariant, PricingConfig | Flat editable BoMs, computed suggestions, explicit selling prices, in-memory markup/overhead. | Correct **F6**, persist optional overhead and pricing metadata/updater relationships, and define when suggested prices are recalculated. |
| CakeRequest, options/add-ons, CakeQuotation | Original selections and issued quotation versions are retained; acceptance links to the resulting order. | Persist immutable version content. Resolve storage for approved production copies/multiple references (**D4**) and clarify how negotiated option changes are recorded. |
| Delivery | One current simulated delivery on the order, booking controls, and status history. | Real provider IDs, address/geographic snapshots, persistent booking attempts, and one-active-booking constraints. Replacing the current delivery while carrying forward status text is not preservation of every prior booking record. |
| NotificationLog and SystemNotification | Customer events grouped by channels, quotation notification status, limited internal events. | Correct **F7**; persist per-provider attempts, delivery/error timestamps and retry history. Retrying a grouped event must not overwrite the evidence of an earlier failure. |
| Proposed application stack and providers | Plain JavaScript and browser-memory simulation. | The paper's Next.js/backend/Auth.js/Prisma/PostgreSQL architecture and actual PayMongo, Lalamove, Brevo, and Semaphore integration are not implemented by these screens. |

## 5. Paper and policy decisions to reconcile

### D1 — Update the paper to reflect already confirmed reservation and consumption policy

Chapter 3 describes subscription capacity being consumed week by week rather than reserved fully at enrollment, and describes ingredient deduction upon confirmation. The [confirmed Phase 5 policy](phase-5-paper-revisions.md) instead establishes:

- Reserve capacity for all four subscription dates at enrollment.
- Hold ingredients for the first applicable delivery during checkout/confirmation.
- Consume physical stock once when preparation starts.
- Then reserve ingredients for the next chronological delivery; retry shortages after restocking.
- Re-evaluate chronological order after a deferment.

The implementation intentionally follows the confirmed policy. **Do not reverse it merely to match the older prose.** Revise the relevant chapters and workflow descriptions to distinguish capacity allocation, ingredient reservation, and physical consumption. The ERD's separate entities support that distinction.

### D2 — Clarify what owners “process” for subscription deferments

Chapter 4, Figure 25 says owners can process deferment requests. The integrated owner screen inspects the results of the existing automatically validated customer deferment workflow. It provides no owner approval or rescheduling command.

The wording does not by itself establish a mandatory approval queue. Choose either to describe owner monitoring of automatic deferments in the paper or explicitly define the owner processing action, permissions, pending states, and one-deferment accounting before implementing it. Do not add an unrestricted override.

### D3 — Resolve the cake same-day limit

Chapter 3 describes two cakes per week on different delivery dates, while also describing configurable ceilings. The ERD includes `max_cakes_per_day`, and owner configuration accepts a daily limit above one.

A probe set the daily limit to two with one existing confirmed cake; the same date became eligible for another cake. Decide whether “different dates” is an invariant or merely the default setup. If invariant, enforce a maximum of one per day; otherwise update the paper to state that the owner can change this limit.

### D4 — Add persistence for approved production copies and multiple references

Owner-approved staff instructions and reference images are useful and respect the confirmed privacy boundary. However, the supplied ERD does not fully describe the implemented approved-copy/multiple-reference structure. Add explicit records or versioned fields with quotation/request links, approval actor/time, and attachment metadata. Keep original customer submissions separate from approved production content.

### D5 — Clarify costing at restock and structured cake negotiation

Chapter 2 associates cost logging with restocking, but the owner currently edits costs separately from the quantity/reason restock form. Either collect the applicable unit cost during owner restocking or clearly define the required cost-update sequence. Staff should not gain access to owner financial controls. The paper does not establish a weighted-average costing rule, so this review does not prescribe one.

Cake negotiation currently revises terms and notes while carrying forward original selected options/add-ons. Clarify whether negotiations can change those structured selections. If they can, the issued quotation needs an agreed-design snapshot and matching material calculation, while preserving the original request and previous versions.

## 6. Design consistency

The integration reuses the existing shell/header/footer and operational page-introduction, card, table, control, and modal patterns through [ui.js](../app/ui.js), [owner-ui.js](../app/owner-ui.js), [workspace.css](../app/workspace.css), and [owner.css](../app/owner.css). The generator exports are reference material rather than separately mounted applications. This supports the user's consistency requirement and avoids a second independent owner data store.

The pickup quotation mismatch (**F4**) shows why consistency must extend to shared fulfillment meaning, not just colors and boxes. Use the same method-aware presentation in owner and customer views. This review did not perform a fresh exhaustive visual/accessibility audit; the implementation's recorded responsive checks remain prior evidence.

## 7. Recommended revision order and completion criteria

1. **Protect confirmation and audit history:** Fix **F1–F2** before treating owner confirmed-order or payment records as authoritative.
2. **Correct owner/customer presentation:** Fix **F3–F5**, including cancelled attempts and pickup terms across linked screens.
3. **Complete configuration and attention behavior:** Fix **F6–F7**, then cover the verified edge cases with focused regression checks.
4. **Reconcile the paper:** Apply the already approved policy in **D1** and resolve **D2–D5** without silently inventing new workflows.
5. **Complete production modeling and integration:** Implement the durable ERD relationships, server authorization, transactions, provider callbacks, and notification history before claiming implementation of the full proposed system.

For the next review, demonstrate the acceptance checks under each finding, rerun the affected owner/customer/staff suites, and preserve the existing four-delivery, one-deferment, role-privacy, and exactly-once consumption behavior. Chapter 4's developer evaluation, iterative owner UAT, and final participant evaluation remain separate evidence requirements; automated prototype checks do not prove those activities occurred.

**Review conclusion:** Phase 6 provides a coherent owner-operations prototype with substantial functional alignment. It still needs the seven revisions above, explicit paper/policy reconciliation, and production persistence/integration work before it can be described as fully aligned with the paper and ERD.
