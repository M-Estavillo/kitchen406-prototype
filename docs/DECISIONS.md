# Kitchen406 prototype decision register

Date: 2026-09-13. Status: implementation authorized by the user after delegating unresolved decisions to the assistant. This register distinguishes documentary requirements from assistant-selected prototype assumptions. It does not claim that assumptions appeared in the paper.

## Source and scope

Chapters 1–4 are the requirements source. The user explicitly confirmed that the separate `Kitchen 406 Proposal Paper (9).md` final attribute table supersedes conflicting diagrams and that capacity pools are independent. All 43 business entities are retained. The prototype runs real authentication, authorization, PostgreSQL persistence, and internal business logic. Only external services are simulated. No production deployment, automatic Facebook posting, discounts, refunds, or auto-renewal is included.

## D01 — Four-delivery capacity commitment

Decision: hold all four subscription fulfillment dates during checkout; confirm all four on successful payment. Reason: Chapter 4 Figure 19 requires availability before commitment and the final allocation schema supports cycle-specific reservations. This prevents accepting money for an unavailable future slot. Conflict resolved: Chapter 3's week-by-week capacity statement must be revised. Stock reservation remains separate. Impact: no new entity.

## D02 — Capacity interpretation

Decision: independent standard/subscription/cake pools. Variety is Product, aggregating its variants. One sellable variant (including a pack) is one unit. Defaults: standard four varieties/day and ten units/product/day; subscriptions ten units/product/week; cakes two/week and one/day. Reason: Chapter 3 and CapacityAllocation.product_id. Assumptions: Monday–Sunday business week, Asia/Manila timezone. Blocked dates prevent fulfillment and scheduled subscription preparation. Configuration changes must not invalidate paid commitments; reject and show the conflicts. Impact: constraints/service validation, no shared-resource table.

## D03 — Time defaults

Assumptions: standard lead time 24 hours; first subscription delivery 48 hours; custom cakes seven days. Booking cutoff noon on the final eligible booking day, in Asia/Manila; both minimum lead time and cutoff apply. Checkout hold 15 minutes; quotation validity 48 hours, limited by fulfillment lead time/cutoff. Reason: the paper requires configurable lead times/cutoffs but supplies no numerical values. These are visible prototype defaults, not inferred owner policy. Same-day orders prohibited.

## D04 — Inventory lifecycle

Decision: checkout holds stock due for reservation; payment confirms reservations; entering preparation physically consumes once. Available stock = physical stock minus active held/confirmed reservations. Snapshot material requirements at checkout/payment so recipe edits cannot rewrite paid commitments. Reason: Chapter 4 separates requirements, reservations, and physical movements; this avoids double deduction. Correction: earlier 'deduct on confirmation' text means reserve, not physical consumption. Assumption: subscription stock reserves 48 hours before fulfillment; future shortages alert owners and block preparation without cancelling the commitment. Restocking resolves shortage. Impact: existing material/reservation/movement entities; transactional updates and idempotency.

## D05 — Deferment

Decision: one successful deferment per subscription, matching the final unique constraint. Assumptions: request at least 48 hours before fulfillment and before preparation; automatic approval if validations pass. next_day moves selected delivery by one day; next_week appends it on the fixed weekday one week after the current final delivery, implementing Chapter 1's skipped-week extension. Other deliveries stay unchanged. Full/blocked/stock-ineligible target rejects atomically. Preserve original dates and allocations. Reason: support both documented options without losing or duplicating any of four commitments. Impact: no new entity; clarify meaning of next_week in paper.

## D06 — Staff access

Decision: follow Chapters 1/3 restrictions over Figure 7's conflicting permissions. Staff see order references, production details, recipes without cost, quantities, schedules, and courier statuses. They update fulfillment statuses and inventory quantities. No customer identity/contact/address, financial values, reports, quotations, marketing, capacity settings, or account management. Owners book deliveries and coordinate customers. Staff restock quantity; owners enter costs. Reason: operational delegation without disclosure of owner-only customer/financial information. Impact: backend field filtering and permission enforcement; correct Figure 7.

## D07 — Fulfillment and delivery

Decision: standard pickup/courier, subscription delivery-only, cake pickup/owner delivery. QR Ph only. Owners book courier when ready; cake delivery has no Lalamove record. Assumptions: fictional Cebu origin and 15 km simulated route-distance service limit. Quote all four subscription delivery fees upfront; bakery absorbs later booking/deferment differences. Editing saved address never changes paid snapshots; no active-subscription address change. Reason: final fulfillment enums, required subscription address, full prepayment, no refund/additional-charge module. Impact: add checkout fee snapshot to Order; actual booking cost remains Delivery.fee. Per-cycle orders preserve subscription fee breakdown.

## D08 — Cake computation and history

Assumptions: estimate is sum of option prices plus addon price × quantity. Final quote adds manual complexity and delivery fee. Size scale_factor scales non-size option ingredient quantities; size-specific lines and addon quantities are added separately. Prices are explicit and not scaled again. Negotiation uses updated request and versioned quotes; no in-app conversation/chat entity. Reason: implements existing CakeOption/CakeAddon/Quotation structures without an invented chat module. Add immutable specification_snapshot to each quotation containing agreed design/options/addons/materials, plus material_cost_snapshot for historical costing. Paid production uses accepted snapshot. This prevents later edits changing accepted terms. Impact: added quotation attributes; no new entity.

## D09 — Cancellation and payment exceptions

Assumptions: customer may cancel unpaid checkout; expiry releases resources. No self-service cancellation of paid orders/subscriptions, and no ordinary owner cancellation that erases paid obligations. Late payment reacquires original resources atomically if possible; otherwise Payment remains paid and Order becomes payment_resolution_required. Owner can retry confirmation under original agreed terms after resolving availability. Rescheduling/settlement outside these terms requires future approved workflow, never fake refunds. Failed delivery retains obligation and permits owner rebooking. Courier delivered completes courier order; owner completes pickup/manual cake delivery. Reason: honors no refunds and final exception state while retaining commitments. Impact: audit events in existing history, no refund table.

## D10 — Analytics and costing

Assumptions: sales recognized on paid date; subscription revenue counted only on purchase order, fulfillment payable zero. Fulfillment counts/consumption reported separately. Historical margin uses item material and overhead snapshots, described as estimated production margin. Delivery fees separate from product margin. Ingredient costs use latest owner-entered cost, not FIFO/weighted average. Reason: avoids double-counting subscriptions and rewriting historic margins after recipe changes. Impact: add material_cost_snapshot and overhead_cost_snapshot to OrderItem; preserve snapshot selling price.

## D11 — Marketing triggers

Paper: automatic caption/image drafts grounded in system data; owner review/edit/regeneration/approval; manual publication. Assumptions: new product on activation; weekly Monday 09:00 evaluation; low demand means zero paid sales in 14 days; occasions within seven days; subscription reminders when feasible four-week slots start within seven days. One draft per trigger occurrence. Mock Gemini returns deterministic caption and local fixture image, with failure scenario. Reason: paper names events but not thresholds/cadence. Impact: add PostDraft.trigger_key for idempotency.

## D12 — Notifications

Assumptions: email for account actions, confirmations, quotes, status/deferment/subscription updates; SMS for ready/courier/24-hour delivery reminder/deferment events. Renewal reminder after fourth fulfillment. Failure retries after 1, 5, 15 minutes, then alerts owner. Shared SystemNotification acknowledgement follows final table. Reason: operational reminders need deterministic timing and retry history described in Chapter 4 but absent from final table. Impact: NotificationLog adds attempt_count, next_attempt_at, provider_message_id, event_key. Outbox mock displays payloads with access restrictions; real tokens used for account verification.

## D13 — Accounts and technical defaults

Decision: temporary staff password must change before operational access, matching StaffProfile flag. Email verification required for customers. Real password hashing, signed sessions, backend ownership/role checks, active-account checks. Prototype defaults: verification codes expire after ten minutes, max five attempts; password minimum ten characters; reset/change invalidates older sessions. Auth.js credentials/JWT strategy avoids introducing library OAuth tables over the business Account entity. Local PostgreSQL/Prisma and Next.js/React/TypeScript retained. Exact dependency versions pinned in package-lock.json. Reason: preserve paper architecture and account entities. No credentials in decision document.

## D14 — External boundaries and testability

PayMongo: pending/success/failure/expiry/cancellation/duplicate/late callbacks. Lalamove: quotes/book/fail/rebook/tracking. Maps: seeded addresses/coordinates/simulated route distance and rejection. Gemini: data-grounded deterministic mock drafts and fixture image. Brevo/Semaphore: local outboxes with failures/retries. Cloudinary: actual local file storage. Internal jobs execute real expiry/reservation/reminder logic through a worker and protected test controls. Reason: user authorized external mocks but prohibited mocking internal logic. No real external delivery, payment, messaging, or publication occurs.

## Schema additions approved through delegated decisions

All 43 final entities remain. Added attributes only: Order.checkout_delivery_fee; OrderItem.material_cost_snapshot / overhead_cost_snapshot; CustomCakeQuotation.specification_snapshot / material_cost_snapshot; PostDraft.trigger_key; NotificationLog.attempt_count / next_attempt_at / provider_message_id / event_key. Prototype-only durable settings (test clock, mock response controls) are infrastructure configuration, separately identified and not presented as business ERD entities. Additional constraints enforce role/profile, owner/address, quotation/request, cycle, ingredient, and active-reservation integrity. Any further significant structural issue must be surfaced before changing the design.

## Review notes

The defaults above are intentionally visible and adjustable where the schema supports configuration. Test results and implementation limitations will be recorded separately rather than rewriting assumptions as facts. Original source documents are not modified.

## D15 — Pending subscription enrollment (explicit user approval)

Added `pending_payment` to Subscription.status, explicitly approved by the user during implementation. Reason: the original enum cannot persist the chosen schedule and four delivery commitments before successful payment without incorrectly marking an unpaid subscription active. Checkout creates the pending subscription and four pending-payment fulfillment orders; successful payment atomically activates it. No new table.
