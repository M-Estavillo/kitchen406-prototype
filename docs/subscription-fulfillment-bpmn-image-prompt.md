# BPMN image-generation prompt: Subscription confirmation to fulfillment

Copy everything between the separators into an image-generation tool. The capstone paper is the authority for this proposed process; prototype records and simulated integrations are not evidence of actual operations.

---

Create a precise, readable **BPMN 2.0 collaboration diagram** titled **Kitchen406 Prepaid Subscription: Confirmation to Fulfillment — Proposed System**. Emphasize the internal operational work the customer cannot see: four scheduled commitments, background material reservations, batch preparation, preparing-owner attribution, controlled state changes, weekly handoffs, and completion accounting.

## Scope and entry state

Begin at **Subscription confirmed — full payment verified**. Enrollment and full upfront PayMongo QR Ph payment have already succeeded. This is a fixed-term subscription to an eligible bread or pastry product and selected variant/quantity, with **exactly four scheduled weekly fulfillments**. It does not automatically renew or bill again.

At entry, capacity holds for all four fulfillments have become confirmed allocations; the first fulfillment's checkout ingredient reservation is retained. The selected schedule, preparation dates, fulfillment dates, method, product quantities, price snapshots, and applicable delivery details are preserved. Subsequent administrative schedule changes must not rewrite confirmed commitments. For courier delivery, the address is fixed after payment, and delivery fees were included upfront.

Do not draw browsing, enrollment forms, checkout, QR payment initiation, payment failures, or another approval of the confirmed subscription. Exclude standard orders and custom requests completely, including comparison branches. Show the proposed integrations described here even if the prototype uses sample data. Do not invent exact weekdays, preparation durations, or customer records.

## Diagram composition and notation

- Use a very large landscape canvas, preferably A1 landscape or equivalent high-resolution output, white background, crisp dark text, restrained warm brown and muted green accents, generous spacing, and orthogonal connectors. Prioritize legibility over decoration.
- Use one expanded **Kitchen406** pool with lanes **System / Background Services**, **Staff / Authorized Operations**, and **Admin / Owner**. Authorized owners can also perform routine staff operations. Do not imply the person clicking a button necessarily baked the products.
- Use separate compact pools **Registered Customer**, **Lalamove**, and **Notification Providers — Brevo / Semaphore**. Customer-facing tasks should occupy little space compared with internal work.
- Arrange the primary flow left to right: **Confirmed Commitments → Scheduled Materials → Production → Pickup / Courier → Weekly Completion → Subscription Completion**.
- Show the main lifecycle with an expanded subprocess **Process one scheduled fulfillment**, marked with a **parallel multi-instance marker** and annotated **One instance per fulfillment; collection contains exactly four records; each instance follows its own scheduled dates**. This allows later weekly preparation to proceed even if an earlier delivery remains unresolved. Never draw four sequential mandatory waits or treat four weeks as four new purchases.
- Place a separate expanded **non-interrupting message event subprocess** for deferment below the main flow. Use a dashed-border message start event. It operates on an eligible outstanding fulfillment without terminating the subscription or creating an additional weekly instance.
- Use thin start circles, thick end circles, rounded tasks, X-marked exclusive gateways, timer events for scheduled waits, user/service/manual task markers, and message catch events for external responses. Physical baking, packing, and handover are manual tasks; recording actions are user tasks followed by system validation.
- Solid sequence flows stay inside their pool, including lane crossings. Dashed message flows connect separate pools only. Dotted associations connect data and annotations. Label gateway exits and keep loops local. Do not draw sequence flows between pools.
- Keep task labels short. Put detailed rules in numbered callouts. Include a compact notation legend. This must look like a formal operational BPMN diagram, not a website mockup, customer journey, architecture diagram, or bakery illustration.

## A. Register the confirmed commitments

1. System start event **Subscription confirmed — full payment verified** → service task **Publish four scheduled fulfillment records**. Associate data object **Confirmed subscription and four fulfillments** with selected variant/quantity, original and current dates, preparation dates, method, fixed delivery destination where applicable, payment reference, completed/remaining counts, and unused deferment allowance.
2. Service task **Preserve capacity and product-amount snapshots**. All four weeks already have confirmed subscription capacity. Default capacity is ten units per subscription product per week, configurable by the owner. Preserve each fulfillment item's share of the actual prepaid product amount, based on original quantities and selling-price snapshots. Consistent currency rounding must make the shares total the original prepaid product amount; delivery fees are excluded.
3. Service task **Retain first ingredient reservation; project later needs**. Associate **Recipe / single-level BoM**, **Ingredient reservations and movements**, and **Capacity allocations**. Callout: ingredient requirement equals recipe quantity per selected variant multiplied by ordered quantity. Stock reservation commits available stock; physical consumption is recorded later. Do not reserve all four weeks' ingredients at confirmation.
4. Service task **Queue confirmation and operational notifications**. Show outgoing notifications as background work using the notification detail below. Continue into the four-instance weekly subprocess without waiting for notification delivery.

## B. Process one scheduled fulfillment — four independent instances

### Materials and scheduled preparation

5. Exclusive gateway **First fulfillment with retained reservation?**
   - **Yes:** use the retained first-week reservation; do not reserve it again.
   - **No:** intermediate timer **One day before this fulfillment's preparation date** → service task **Calculate BoM needs and reserve ingredients**.
6. Gateway **Required reservation available?**
   - **Yes:** continue toward scheduled preparation.
   - **No:** service task **Alert owner: ingredient shortage** → authorized operations task **Replenish stock and record restocking** → service task **Record stock movement; retry reservation** → return to the reservation check. Physical purchasing/replenishment is manual; the platform records quantities and the acting account. Retry must not duplicate reservations. Keep the paid fulfillment pending; do not silently cancel, mark completed, charge again, or grant an automatic deferment.
7. Timer **Scheduled preparation date reached**. Date-sensitive waits must use the current saved schedule if a valid deferment changed this outstanding fulfillment. Use Philippine local time, **Asia/Manila**. Show applicable upcoming-fulfillment notifications as asynchronous side effects.
8. Staff user task **Review production calendar and fulfillment details**: product variant, quantity, recipe, due dates, method, and operational contact/delivery information. Allow production planning across due subscription fulfillments without merging their records or counts.

### Owner allocations and production controls

9. Staff user task **Assign preparing owners per product line**. Callout: the two designated baking owners are the only eligible recipients. One selected owner receives 100%; selecting both proposes 50/50 and allows whole-number percentages totaling 100%, with each receiving 1–99%. Each allocation covers the full line quantity and may differ between weekly fulfillments. Staff are recorded as action performers, not automatically granted a share.
10. Staff user task **Confirm start of preparation** → system task **Validate action and commit production start**. Validate authorization, paid state, applicable status, current record version, valid allocations for every line, and material availability.
11. Gateway **Validation and save successful?** **No:** preserve the prior saved allocation and operational state → **Review issue and retry**. **Yes:** **Set Preparing; record ingredient consumption**. Commit the combined update consistently and record inventory movements. Consume the reserved ingredients once, at production start; do not deduct again at Ready, booking, or completion.
12. Manual tasks **Prepare and bake subscription products** → **Finish and pack this fulfillment**. These summarize physical work, without invented hardware integration or automated measurement of waste/yield.
13. User task **Review actual owner contributions; mark Ready** → system task **Validate transition and save Ready**. Retain allocations unless an authorized edit is needed while unlocked. Record allocation changes with previous/new owners and percentages, acting account, and timestamp. Apply the same failure-preserves-state rule.
14. Service task **Publish Ready status; queue applicable notification** → gateway **Saved fulfillment method?** with **Bakery pickup** and **Courier delivery** exits. Ready alone does not complete a fulfillment or create fulfilled sales.

### Bakery pickup branch

15. Staff manual task **Hold packed fulfillment for collection**. Customer task **Collect at bakery** exchanges a collection message with **Hand over products** in Kitchen406.
16. Staff user task **Confirm actual pickup** → system task **Validate and save pickup completion**. Require applicable paid/Ready state, valid allocations, and current record version. Failure retains the previous state for review/retry. Successful actual pickup goes to shared weekly completion. Do not require a customer app receipt acknowledgment.

### Courier delivery branch

17. Admin / Owner user task **Initiate Lalamove booking for this Ready fulfillment**. Only the owner initiates booking, after production has reached the required ready stage. Confirmation and Ready status do not automatically book a rider.
18. System task **Validate booking; lock owner allocations**. Require paid/Ready fulfillment, valid allocations on every line, stored delivery details, current record, and no conflicting active or unresolved booking. Each weekly fulfillment is its own courier order.
19. System send task **Submit stored delivery details to Lalamove** → message flow to external task **Process booking** → correlated booking-result catch event in Kitchen406.
20. Gateway **Booking result?**
   - **Accepted:** save booking reference and status → continue to delivery updates.
   - **Failed / cancelled:** retain the incomplete fulfillment; alert the owner and allow review/retry. Allocation review may resume while the order is incomplete and no active or unresolved booking remains.
   - **Unknown / unresolved:** retain the allocation lock; owner reviews/reconciles booking status before attempting another booking. Never treat a timeout as proof that no booking exists or create duplicate bookings blindly.
21. Staff manual task **Hand packed products to assigned courier**, coordinated with Lalamove **Collect and transport products**. Catch correlated **Delivery-status update** messages; service task **Validate and save latest status** → gateway **Delivered?**.
22. **No, delivery ongoing:** publish latest available status and await another update. **Failure / unresolved:** alert owner for operational review and retain incomplete state; do not invent a guaranteed redelivery or automatic refund. **Yes:** save valid Delivered result and continue to weekly completion. Duplicate/stale events must not regress or duplicate completion.
23. Courier callout: use the fixed enrollment address. Display provider delivery statuses, without live rider-location tracking. Differences between prepaid delivery fees and actual courier charges are absorbed by the bakery; do not request extra payment or automatically refund differences.

### Shared weekly completion

24. Merge the successful pickup and valid Delivered paths with an exclusive merge → service task **Record completion timestamp and lock allocations** → **Update completed / remaining counts once** → **Recognize this fulfillment's product sales once**.
25. Associate **Fulfillment completion and allocation audit records**. Callout: fulfilled sales use actual completion date and this fulfillment's preserved product amount, excluding delivery fees. Recorded payments count the upfront payment once by payment date. These are different reporting views and must not be added together as total sales. Owner percentages apply to product sales and estimated costs/profit; no payout is created.
26. Queue applicable completion/status notifications and end this subprocess instance with **Weekly fulfillment completed**. The enclosing multi-instance subprocess finishes only when all four instances have completed.
27. Main process task **Mark subscription Completed; remaining = 0** → end event **All four fulfillments completed — subscription ends**. Add a small annotation **One enrollment-level review becomes eligible; no automatic renewal**. Do not draw a review-writing or re-enrollment workflow.

## C. Optional deferment — separate non-interrupting event subprocess

28. Customer task **Request deferment of upcoming fulfillment** sends a message to the event subprocess start **Deferment request received**.
29. System gateway **Upcoming, unfulfilled; before preparation day begins; allowance unused?** **No:** **Reject request; retain schedule and allowance** → notify customer → end this request only. A rejected request does not terminate the main subscription.
30. **Yes:** service task **Check only two replacement dates**. Label them exactly **Day after affected fulfillment's scheduled date** and **One week after subscription's final scheduled fulfillment**. Check sufficient subscription production capacity; do not search farther ahead.
31. Gateway **Any candidate has capacity?** **No:** reject without changing schedule or consuming allowance. **Yes:** **Offer available date(s)** → message to customer **Choose and confirm offered date**. Without confirmation, do not apply a change or consume the allowance.
32. Catch **Customer-confirmed replacement date** → system task **Revalidate eligibility and capacity; apply deferment consistently**. Protect against concurrent requests and a preparation boundary crossed before commit. If validation fails, preserve the original saved state and notify the customer.
33. On success: **Reschedule affected record; preserve original schedule and capacity history; update applicable capacity allocations; mark allowance used** → **Notify customer and operations** → end **Deferment applied**. No manual owner approval. Preserve that fulfillment's product amount and the total of four fulfillments. Update date-dependent background work consistently without duplicate reservations; do not invent an unspecified stock-transfer policy.
34. Deferment callout: a successful deferment may extend the subscription's calendar end date. It does not complete, delete, or add a fulfillment. All other weekly commitments remain intact. Only one successful deferment is permitted per enrollment.

## D. Compact supporting callouts

- **Notifications:** queue relevant confirmation, upcoming fulfillment, order-status, delivery-status, and internal operational updates. Brevo sends applicable email and Semaphore applicable SMS. Log type, provider, recipient context, related record, and sending status. Retry failures up to three times at 5, 15, and 30 minutes after each preceding failure. After exhaustion, mark Failed, alert the owner, and permit manual retry. Notification failure must not roll back operational completion or block production.
- **Inventory monitoring:** record restocking, consumption, and reasoned adjustments with traceability. Alert at low-stock thresholds; depletion prevents new purchases of affected products. Do not infer automatic cancellation of existing paid commitments or automatic replenishment procurement.
- **Permissions and integrity:** staff see authorized operational details; owners alone see financial reports and analytics. Validate state changes on the server; preserve prior state on failed combined saves. Repeated requests, reservation retries, bookings, and courier events must not duplicate records or financial totals.
- **Exceptional non-completion:** keep undelivered/uncollected work outside the successful-completion path. Customer-caused forfeiture, where applicable under the stated policy, requires owner review; courier, bakery, or system failure does not justify customer forfeiture. Do not depict forfeiture as successful delivery or invent its effect on enrollment counters, which the paper does not specify.
- **Method-change boundary:** pickup is supported. If an authorized change from delivery to pickup is represented at all, use a small note rather than an invented request/approval workflow: any applicable prepaid-fee refund is handled manually by owners at the bakery, outside the platform. No automated refund or post-confirmation address editing.

## Final visual checks

Keep the full lifecycle, weekly subprocess, and deferment subprocess visually distinct but connected by shared fulfillment data. Show exactly four commitments, the first/later-week reservation distinction, consumption at preparation start, capacity-checked deferment, owner-initiated booking, and actual handoff-based completion. Do not crowd the canvas with the full prose: render short task labels and concise numbered callouts. Do not invent subscription cancellation rules, fixed deferment approval, recurring charges, supplier APIs, payroll, or customer confirmation as a completion prerequisite.

---

## Source references

Source: [Kitchen406 - Capstone Paper](../Chapters/Kitchen406%20-%20Capstone%20Paper.md), especially:

- Scope and Limitations §§1.4.1–1.4.2: four fulfillments, pickup/delivery, fixed address, fee handling, deferment, BoM, integrations, and access restrictions.
- SRS §4.8, FR-SUB-01–18: scheduled records, preserved commitments, deferment, apportioned amounts, and payment deduplication.
- SRS §4.11, FR-CAP-06–08 and 17: subscription capacity, all-four capacity commitments, and deferment checks.
- SRS §4.12, FR-INV-03–09 and 17–23: first-week retained reservation, subsequent reservations one day before preparation, shortage/retry, and actual consumption.
- SRS §4.15, FR-FUL-08 and 16–27: action validation, owner attribution, locking, audit history, and completion.
- SRS §§4.16–4.17, FR-DEL-08–15 and 17–18; FR-NOTIF-01–15: owner booking, weekly courier orders, status updates, completion, and notification retries.
- SRS §§4.19, 5.2–5.5, and 6.2–6.4: sales/payment separation, consistency, time zone, prepaid fees, and forfeiture boundaries.

The multi-instance layout, numbered phases, and review/retry routing are BPMN presentation choices. They do not add business rules. Physical baking/packing/handover summarize fulfillment work; unspecified exception outcomes remain for owner review.
