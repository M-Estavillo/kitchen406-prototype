# BPMN image-generation prompt: Standard order confirmation to fulfillment

Copy everything between the separators into the image-generation tool. This prompt describes the proposed system in the capstone paper, rather than treating the prototype's sample data or simulated integrations as production behavior.

---

Create a precise, readable **BPMN 2.0 collaboration diagram** titled **Kitchen406 Standard Order: Confirmation to Fulfillment — Proposed System**. Show the operational work behind the customer interface: production scheduling, ingredient reservations and consumption, preparing-owner attribution, controlled status transitions, physical preparation, pickup or courier handoff, and completion recording.

## Scope and starting assumptions

Start at **Standard order confirmed — full payment verified**. This is one paid, one-time bread-and-pastry order containing one or more product variants and quantities, with one selected fulfillment date and either bakery pickup or courier delivery. All lines share that date. Payment through PayMongo QR Ph and checkout validation have already succeeded. Production capacity has been confirmed and the checkout ingredient reservations retained. For delivery, the validated address, contact details, and quoted delivery fee are already stored.

Do not draw browsing, cart, checkout, address validation, payment initiation, or payment failure. Do not add another payment or owner approval of an already confirmed order. Exclude subscription and custom-request workflows entirely, including comparison branches or explanatory boxes about them. Describe the paper's intended integrations even if the website uses sample records and simulated services.

## Composition and BPMN notation

- Use a large landscape canvas, preferably A2 landscape or equivalent high resolution, white background, dark legible text, and restrained warm brown and muted green accents. Prioritize readable labels over decoration.
- Arrange the diagram left to right in five aligned phases: **Confirmed and Scheduled**, **Production Controls**, **Preparation**, **Pickup or Courier Delivery**, **Completion**. Phase headings are visual guides, not extra BPMN participants.
- Draw one expanded pool **Kitchen406**, with three lanes: **System / Background Services**, **Staff / Authorized Operations**, and **Admin / Owner**. Routine operational tasks in the Staff lane may also be performed by an authorized owner; do not imply staff are the only people who physically bake.
- Add separate compact pools **Registered Customer**, **Lalamove**, and **Notification Services — Brevo / Semaphore**. The customer pool shows only relevant notifications and receipt or collection. Keep external pools compact so internal work dominates.
- Use thin-circle start events, thick-circle end events, rounded task rectangles, X-marked exclusive gateways, appropriate user-task/service-task/manual-task markers, and intermediate message catch events for provider replies and delivery updates. Physical baking and packing are manual tasks; saving status is a user task followed by system processing.
- Solid sequence flows stay within a pool and may cross its lanes. Dashed message flows with open arrowheads connect different pools only. Dotted associations connect annotations and data artifacts. Label decision exits. Never connect separate pools with sequence flows.
- Use a clear upper pickup path and lower courier path after the fulfillment-method gateway. Route retry loops below their related activities. Use short task labels and numbered callouts for detailed rules. Avoid crossing arrows and tiny paragraphs inside task boxes.
- Include a small notation legend. Render all specified labels accurately; do not replace the diagram with a customer journey, website mockup, architecture diagram, or decorative bakery illustration.

## Required process flow

### 1. Confirmed order enters operations

1. Start in the System lane with **Standard order confirmed — full payment verified**.
2. System service task **Publish confirmed order to active orders and production calendar**. Associate the data object **Confirmed order**: order reference, paid state, product variants and quantities, selected fulfillment date, fulfillment method, and relevant contact or delivery details.
3. System task **Retain ingredient reservations and project material requirements**. Associate **Recipe / BoM**, **Ingredient reservations**, and **Confirmed production capacity**. Add a note: **Required ingredient quantity = recipe quantity per variant × ordered quantity. Reservation commits stock; it is not physical consumption. Do not reserve or deduct the same stock again.**
4. System task **Queue confirmation and internal operational notifications**. Treat sending as background work that does not make preparation wait for an email or SMS acknowledgment. Use the notification subprocess described below.
5. Staff user task **Review scheduled order and recipe requirements**. Show products, variants, quantities, fulfillment date and method, and relevant preparation/contact details. Staff review the scheduled production workload; confirmed orders are not automatically started immediately after payment.

### 2. Attribute preparation and validate the start

6. Staff user task **Assign preparing owner(s) to every product line**. Attach this exact rule: **Owner A 100%; Owner B 100%; or both owners, initially 50% each. For a split, Owner A receives a whole-number share from 1–99% and Owner B receives the remainder. Each line totals 100% and its allocation covers its entire quantity. The acting staff account receives no owner share.**
7. Staff user task **Confirm Start Preparation** when production is due.
8. System service task **Validate and save preparation transition**, followed by an exclusive gateway **Preparation update valid?**. Its associated checklist must include: paid and confirmed order; permitted current status; valid allocations on every line; material availability; and current order version.
9. **No:** System task **Keep saved state; show validation or conflict reason** → Staff task **Review latest order; correct allocation or material issue** → return to the relevant assignment or start action. For a material discrepancy, a compact optional subprocess **Record restock or justified stock adjustment** may feed this correction task. Its note says **Authorized staff or owner records quantity; adjustments require a reason; preserve inventory movement history. No automatic purchasing.** Do not imply every confirmed order must be restocked.
10. **Yes:** System task **Save allocations; set Preparing; record ingredient consumption**. Link to **Inventory movements** and **Allocation / status audit history**. Record the acting account and applicable timestamps; a combined update must succeed before its state changes are committed. A rejected or stale save preserves the prior allocations and operational state.
11. Add an inventory callout: **Actual ingredient consumption is recorded when preparation starts, using the retained material allocation. Do not deduct ingredients again at Ready, pickup, booking, or delivery completion. Monitor low-stock thresholds, alert the owner, and block new orders for products whose required ingredients are depleted. These alerts do not automatically cancel this paid order.**

### 3. Prepare the products and mark Ready

12. Staff manual task **Prepare and bake ordered products** → manual task **Finish and pack order**. These summarize physical bakery work; do not invent an automated oven, weighing device, quality-control module, recipe-specific baking times, or mandatory inspection approval.
13. Staff user task **Review actual owner contributions**. Permit allocation corrections while the order is incomplete and unlocked. Record prior/new selections and percentages, acting account, and time. This review may retain the current allocation; do not force an unnecessary change.
14. Staff user task **Mark Ready** → System task **Validate transition; retain allocations; save Ready**. Refer to the same payment, applicable status/material, allocation, and version safeguards. If validation or saving fails, retain the previous state and return for review. Use one reusable validation callout rather than duplicating a large error branch.
15. System task **Publish Ready status and queue applicable update**. Customer sees status, fulfillment date, and method. Add the note **Ready is not Completed and creates no fulfilled sale.**
16. Exclusive gateway **Selected fulfillment method?** with **Bakery pickup** and **Courier delivery** exits. Use the method already stored on the order; this is not a new customer selection.

### 4A. Bakery pickup

17. Staff task **Hold ready order for scheduled collection**. Send the applicable ready-for-pickup update to the customer through the background notification mechanism.
18. Customer task **Collect order at bakery** exchanges a collection message with Staff manual task **Hand over order to customer**. Physical handover precedes completion recording.
19. Staff user task **Confirm actual pickup** → System task **Validate pickup completion**. Require the paid Ready order, valid line allocations, and current version; an invalid or failed save preserves the previous saved state for review and retry.
20. On valid pickup confirmation, flow to the shared completion segment. Do not draw a delivery fee, courier booking, or a mandatory customer app acknowledgment on this branch.

### 4B. Courier delivery

21. Admin / Owner user task **Initiate courier booking for paid Ready order**. Booking is initiated by the owner; confirmation or Ready status alone does not book a courier.
22. System task **Validate booking prerequisites and lock allocations**. Validate paid/Ready state, every line's allocation, current record, stored delivery information, and absence of a conflicting active or unresolved booking. Reject an invalid attempt without changing saved operational state.
23. System send task **Submit stored order and delivery details** sends a **Booking request** message to Lalamove task **Process courier booking**. Catch the correlated **Booking result** in Kitchen406.
24. Exclusive gateway **Booking outcome?**:
    - **Confirmed:** System task **Store booking reference and delivery status**; retain the allocation lock and continue.
    - **Definitively failed / cancelled:** System task **Record exception; keep fulfillment incomplete** → Admin / Owner task **Review issue and eligible allocation changes; retry booking** → return to prerequisite validation. A failed booking does not automatically cancel the paid order or refund it.
    - **Unknown / unresolved:** System task **Preserve pending reference and allocation lock** → Admin / Owner task **Review and reconcile booking outcome** → return to the outcome decision when resolved. Do not blindly retry or create a duplicate active booking.
25. Lalamove task **Arrange courier collection** exchanges a collection message with Staff manual task **Hand packed order to courier**. Lalamove then performs **Transport and deliver order**. Collection or dispatch does not complete the fulfillment.
26. Lalamove sends **Delivery-status update** messages to Kitchen406 intermediate message catch event **Courier status received**. System task **Match booking; process update; save latest status and history** → **Publish latest status and queue applicable update**.
27. Exclusive gateway **Delivery outcome?**:
    - **Ongoing:** loop to **Courier status received** and wait for a subsequent update.
    - **Failed / cancelled:** retain the incomplete order and route to owner exception review and eligible rebooking after the prior booking is definitively resolved. Allocation review is permitted only while incomplete and no active/unresolved booking remains.
    - **Delivered:** System task **Accept valid Delivered update once**, then continue to shared completion. The courier physically delivers to the customer; the provider's valid Delivered update establishes system completion. A customer receipt acknowledgment is not required.
28. Attach this courier note: **Display the latest provider-reported status only; no live rider-location tracking. Duplicate Delivered updates must not create duplicate completion records or fulfilled sales. Preserve the latest known state when an external operation fails.**

### 5. Shared completion

29. Merge valid pickup confirmation and valid courier Delivered processing with an exclusive merge gateway.
30. System service task **Set Completed; record actual completion time; lock allocations**. Preserve product-amount snapshots, completion timestamp, allocation-lock timestamp, and operational/audit history.
31. System task **Make completed product sales available to owner reporting**. Add this concise annotation: **Fulfilled sales use actual completion date and exclude delivery fees. Preparing-owner percentages attribute product sales and estimated production cost/profit. Previously recorded payment remains a separate reporting basis; do not count the same transaction twice. No automatic payout.** Do not expand analytics filters or accounting processes.
32. System task **Publish Completed status; queue applicable notification** → thick-circle end event **Standard order fulfilled**. Show customer receipt/collection as the physical outcome, with no additional customer approval gate.

## Background notifications and compact exception notes

- Represent **Send and log notifications** as a reusable nonblocking background subprocess, linked by dotted associations to confirmation, applicable order-status changes, applicable delivery-status changes, and completion. Make clear that the associations identify triggers and are not sequence flows. In a compact expanded inset, show an independent message start **Notification queued** → **Send via applicable provider; log result** → end **Notification attempt recorded**. Message flows connect that inset with the Brevo/Semaphore participant.
- Notification annotation: **Brevo email / Semaphore SMS as applicable. Log type, provider, recipient context, associated record, and sending status. Retry failed sends up to three times, after 5, 15, and 30 minutes following the preceding failure. After exhaustion, mark Failed, alert Admin / Owner, and allow manual retry. Notification failure does not reverse fulfillment.**
- Add a small exception annotation linked to pickup waiting and delivery exception review: **Non-collection or failed receipt requires owner review. Customer-caused failure may be treated as forfeiture under the stated policy; do not automatically forfeit failures caused by the bakery, courier, or system. Disputes are handled manually. An unfulfilled or forfeited order must not reach the successful-fulfillment end event.** Do not invent a no-show deadline, automatic refund, or automatic dispute engine.
- Add a recovery annotation beside completion: **An authorized accidental status reversal retains audit history and removes the incomplete order from Fulfilled sales. A later valid completion records a new completion time and counts the fulfillment once.** Keep this as a note, not a routine loop or a general permission to edit completed allocations.
- Add an access note: **Staff access covers authorized operations, inventory, schedules, recipes, and necessary fulfillment contact details. Financial reports, pricing configuration, customer administration, and analytics remain owner-only. Owner allocation identifies preparation contribution, not the account clicking an action.**

## Final rendering constraints

Keep the successful path visually dominant and exceptions compact but readable. Do not invent supplier procurement, automatic production equipment, barcode scanning, proof-of-delivery uploads, driver matching rules, guaranteed arrival times, cash on delivery, a second payment, automated refunds, payroll, or owner bank transfers. Use business descriptions rather than invented API status codes. Do not show ingredient consumption at confirmation, a fulfilled sale at Ready, customer-triggered courier booking, or a completed order merely because it was handed to a courier.

Place this readable footer inside the image: **Proposed standard-order workflow based on the Kitchen406 capstone paper. Prototype records and external integrations may be simulated. Scope: confirmed order through actual pickup or courier delivery completion.**

---

## Source basis and modeling notes

Authoritative source: [Kitchen406 - Capstone Paper](../Chapters/Kitchen406%20-%20Capstone%20Paper.md), including its appended Software Requirements Specification:

- **4.7 Standard Order Management; 4.10 Checkout and Payment; 4.11 Production Capacity and Scheduling:** confirmed-order entry conditions, shared fulfillment date, and confirmed capacity. Checkout is a prerequisite, outside the rendered process.
- **4.12 Inventory Management**, especially FR-INV-03–09 and FR-INV-10–20; **4.13 Recipe and Bill of Materials Management:** retained reservations, material planning, preparation-time consumption, thresholds, restocking, adjustments, and single-level BoM.
- **4.15 Order Fulfillment Management**, FR-FUL-01–27: operational visibility, allocations, transition validation, audit history, locks, physical completion, reporting timestamps, and accidental reversal.
- **4.16 Delivery Management**, especially FR-DEL-08–13 and FR-DEL-15, 17–18: stored delivery details, owner-initiated ready-order booking, provider updates, allocation locks, and duplicate-safe completion.
- **4.17 Notification Management**, FR-NOTIF-01–15: applicable event notifications, role-targeted internal notifications, provider logs, retries, and manual retry after failure.
- **4.19 Reports and Analytics; 5.5 Business Rules**, especially BR-03, 14–15, 24–25, and 28–34: completion-based sales and preparing-owner attribution.
- **6.4 Customer-Facing Policies**, OR-POL-07–09: availability for receipt, conditional forfeiture, and manually reviewed disputes.

Physical preparation, packing, collection, and handover are concise manual-task abstractions of fulfillment, not claims that the paper specifies separate automated modules for those actions. Phase headings, the shared merge, and the notification inset are diagram-layout choices. The capstone paper takes precedence over existing prototype behavior and older diagram prompts.
