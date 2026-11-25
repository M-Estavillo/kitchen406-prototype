# Kitchen406 feature checklist

Reviewed November 26, 2026 against the current [BPMNs](BPMNs/) and [ERD-Revised](ERD-Revised.md). The BPMNs define the process steps. The ERD describes both the current SQLite v7 schema and the target entities and constraints.

- `[x]` marks behavior present in the code. Each entry identifies its scope as SQLite, browser prototype, or demo.
- `[ ]` marks remaining implementation or verification work. A checked demo can have a corresponding open item for the live integration.

## Accounts and access

- [x] **SQLite.** Create and verify customer accounts using expiring codes with resend and attempt controls. Verification codes are written to the local outbox. [Customer registration BPMN](BPMNs/customer-create-account.bpmn.xml)
- [x] **SQLite.** Sign in and out, route users to their workspace, and authorize protected server actions by session, role, account state, and staff setup status. [Sign-in BPMN](BPMNs/sign-in.bpmn.xml) · [Session and authorization BPMN](BPMNs/validate-session-and-authorize-action.bpmn.xml)
- [x] **SQLite.** Recover an active customer's password with a one-time code, change a password using the current password, and revoke sessions after a password change. [Password recovery BPMN](BPMNs/forgot-password.bpmn.xml) · [Change password BPMN](BPMNs/change-password.bpmn.xml)
- [x] **SQLite.** Update profile details and verify email changes. Customer codes go to the proposed address, while staff and admin codes go to the current address. [Change email BPMN](BPMNs/change-email-address.bpmn.xml) · [Account backend](auth-server.cjs)
- [x] **SQLite.** Admins can provision staff with temporary credentials, maintain pending staff details, and activate or deactivate access. Correcting a pending email replaces the temporary credentials and revokes setup sessions. First sign-in requires password setup before workspace access. Staff welcome messages support Brevo when configured and a local outbox for development. [Staff creation BPMN](BPMNs/staff-account-creation.bpmn.xml) · [Staff maintenance BPMN](BPMNs/staff-account-maintenance.bpmn.xml) · [Staff email change BPMN](BPMNs/staff-email-change.bpmn.xml) · [First sign-in BPMN](BPMNs/staff-first-sign-in-and-password-setup.bpmn.xml)
- [ ] Connect registration, recovery, and email-change codes to external email delivery. Track delivery outcomes under the ERD's notification model. [Account backend](auth-server.cjs) · [ERD notification entities](ERD-Revised.md#entities)

## Catalog, pricing, and inventory

- [x] **SQLite.** Create, rename, show, hide, and remove unused categories. Manage products, variants, uploaded covers, availability, and subscription eligibility. Save variant recipes and approved final selling prices. [Category BPMN](BPMNs/product-category-management.bpmn.xml) · [Product and variant BPMN](BPMNs/product-and-variant-maintenance.bpmn.xml) · [Variant recipe BPMN](BPMNs/variant-recipe-maintenance.bpmn.xml) · [Inventory and catalog schema](database/inventory.sql)
- [x] **Browser prototype.** Calculate recommended prices from material costs, markup, and effective utility overhead. Approved variant prices are saved to SQLite. [Product costing BPMN](BPMNs/product-costing-and-final-selling-price.bpmn.xml) · [Pricing state](app/pricing-state.js)
- [x] **SQLite.** Maintain ingredient and packaging records, including archive, restore, and guarded removal. Record restocks with weighted-average unit cost and physical count corrections with movement history. The owner can view recipe usage and filter movement history. [Material maintenance BPMN](BPMNs/inventory-material-maintenance.bpmn.xml) · [Restocking BPMN](BPMNs/inventory-stock-restocking.bpmn.xml) · [Stock adjustment BPMN](BPMNs/inventory-physical-stock-adjustment.bpmn.xml)
- [x] **SQLite.** Validate recipes and archived materials, snapshot material requirements, check physical stock less active reservations, and reserve stock transactionally during standard and subscription checkout. Starting preparation consumes confirmed reservations and records the movements. [Stock validation and reservation BPMN](BPMNs/inventory-stock-validation-and-reservation.bpmn.xml) · [Standard ordering backend](ordering-server.cjs) · [Subscription backend](subscription-server.cjs)
- [ ] Persist default markup and utility overhead in `PricingConfig` so recommendations use shared settings across sessions. [ERD pricing and variant entities](ERD-Revised.md#entities)
- [ ] Populate the owner inventory reservation panel from SQLite, including the associated order, reserved quantity, status, and hold expiry. Use stock after active reservations for the ERD's available and low-stock status rules. [Owner inventory](app/owner-inventory.js) · [ERD inventory rules](ERD-Revised.md#additional-relationship-and-constraint-rules)
- [ ] Align Shop behavior with checkout for products in hidden categories. Those products currently appear under All Products, while both checkout APIs require an active category. [Current SQLite behavior](ERD-Revised.md#current-sqlite-behavior)
- [ ] Carry operational status reversal and its linked stock consumption reversal into SQLite, with audit history. [Browser reversal logic](app/fulfillment-state.js) · [ERD inventory movement](ERD-Revised.md#entities)

## Standard orders

- [x] **Browser prototype.** Browse the storefront, select variants and quantities, manage the shopping bag, and review checkout. [Catalog](app/catalog.js) · [Commerce state](app/commerce-state.js)
- [x] **SQLite with demo payment.** Validate pickup or courier checkout against the Manila noon cutoff, blocked dates, capacity, prices, and ingredient availability. Save the order and snapshots, confirm or cancel demo payment, and release held resources on cancellation or expiry. The demo payment window is 30 minutes and the resource hold is 32 minutes. [Standard checkout and pickup BPMN](BPMNs/standard-order-checkout-and-pickup.bpmn.xml) · [Ordering schema](database/ordering-v3.sql)
- [x] **SQLite.** Record preparation, readiness, pickup arrival, and handoff completion. Show saved order status to the customer and authorized owner or staff. [Standard checkout and pickup BPMN](BPMNs/standard-order-checkout-and-pickup.bpmn.xml) · [Pickup fulfillment schema](database/pickup-fulfillment-v4.sql)
- [ ] Persist each customer's shopping bag using `Cart` and `CartItem` and retain the applicable cart link on standard orders. [ERD cart and order entities](ERD-Revised.md#entities)
- [ ] Implement live PayMongo payment confirmation and failure handling, including duplicate callbacks and late payments after resources have been released. [ERD payment and order entities](ERD-Revised.md#entities)

## Production Calendar

- [x] **Owner and staff UI.** Browse week and month views, select a date to see its agenda, and filter by order type or status. View capacity, subscription preparation batches, and ingredient requirements for confirmed orders and orders awaiting payment. [Owner calendar](app/owner-scheduling.js) · [Staff calendar](app/staff-ui.js)
- [x] **SQLite.** Save blocked dates, standard capacity limits, and subscription capacity and timing settings. Daily and weekly cake limits and cake timing currently use browser state. [Capacity settings](app/capacity-state.js) · [ERD scheduling rules](ERD-Revised.md#ordering-and-production-scheduling)
- [ ] Save cake capacity and timing settings and show the admin-selected cake bake date on the calendar once cake orders are persisted. Keep the agreed pickup or delivery date on the order. [ERD scheduling rules](ERD-Revised.md#ordering-and-production-scheduling)

## Subscriptions

- [x] **SQLite with demo payment.** Select an eligible variant, quantity, schedule, and fulfillment method. Hold four dates and the first cycle's materials. One prepaid demo payment activates four fulfillment orders with zero additional amounts payable. [Subscription checkout BPMN](BPMNs/subscription-checkout-and-activation.bpmn.xml) · [Subscription schema](database/subscriptions-v5.sql)
- [x] **SQLite.** Manage product subscription weekdays. Preserve dates on existing holds and paid cycles. Return stale checkout drafts for review when the applicable schedule changes. [Inventory and catalog backend](inventory-server.cjs) · [Subscription backend](subscription-server.cjs)
- [x] **SQLite.** Reserve later-cycle materials when due, retry shortages at preparation, and record pickup or courier progress. Allow one eligible deferment to the next day or next week, retaining the original allocation and prepaid amounts. Complete the subscription when all four cycles are fulfilled. Due reservations and missed-pickup processing currently run on subscription API activity. [Subscription cycle and deferment BPMN](BPMNs/subscription-cycle-fulfillment-and-deferment.bpmn.xml)
- [ ] Schedule due material reservations, shortage retries, and missed-pickup processing so they can run when no subscription API request arrives. [Subscription backend](subscription-server.cjs) · [Subscription cycle and deferment BPMN](BPMNs/subscription-cycle-fulfillment-and-deferment.bpmn.xml)
- [ ] Connect prepaid subscription checkout to live payment and retain the one-payment, four-fulfillment rule. [Subscription checkout BPMN](BPMNs/subscription-checkout-and-activation.bpmn.xml) · [ERD reporting rules](ERD-Revised.md#reporting-rules)

## Saved addresses and courier fulfillment

- [x] **SQLite.** Save, edit, remove, and set default delivery addresses. Standard and subscription checkout snapshot the address and server-validated delivery fees. [Courier BPMN](BPMNs/courier-address-and-fulfillment.bpmn.xml) · [Courier schema](database/courier-v6.sql)
- [x] **Demo and configurable quotation adapter.** Check delivery eligibility and quote per-date fees. The default mode uses demo addresses and fees. The provider mode is wired for Google Maps routing and Lalamove quotations. [Quotation adapter](courier-quotation.cjs)
- [x] **SQLite with simulated courier.** Record owner booking requests, reconcile pending outcomes, retry failed or cancelled bookings, track courier progress, and record delivery completion. [Courier BPMN](BPMNs/courier-address-and-fulfillment.bpmn.xml) · [Courier booking logic](courier-booking.cjs)
- [ ] Implement live courier booking, reconciliation, and status updates through completion. Keep safe retry behavior when the provider outcome is unknown. [Courier booking logic](courier-booking.cjs) · [ERD delivery entities](ERD-Revised.md#entities)
- [ ] Align saved-address removal with the target lifecycle. SQLite currently deletes the saved row and retains the existing checkout snapshot. The ERD models an archived status. [Address backend](address-server.cjs) · [ERD address entity](ERD-Revised.md#entities)

## Custom Cakes

- [x] **Browser prototype.** Configure a cake, attach reference images, submit a request, issue and revise an owner quotation, respond to an offer, and accept it for demo checkout. [Cake request and checkout state](app/cake-state.js) · [Owner quotation state](app/owner-cake-state.js)
- [x] **Browser prototype.** Record owner-managed cake delivery, unsuccessful handoff, and eventual completion. [Operational fulfillment state](app/fulfillment-state.js)
- [ ] Persist cake options, ingredient quantities, requests and reference images, versioned quotations, and owner-selected add-on ingredients. Enforce ownership of the accepted quotation, the one-to-three image rule, and separate request and quotation expiry. Base the seven-day lead time on the original request submission. [ERD cake constraints](ERD-Revised.md#additional-relationship-and-constraint-rules)
- [ ] Turn an accepted quotation into a durable cake order with payment, capacity and ingredient reservations. Persist the admin-selected bake date separately from the fulfillment date and apply cake capacity to that bake date. Save pickup completion or owner-managed delivery and the latest handoff failure reason. [ERD scheduling rules](ERD-Revised.md#ordering-and-production-scheduling) · [ERD cake handoff rules](ERD-Revised.md#additional-relationship-and-constraint-rules)

## Customer Reviews

- [x] **Browser prototype.** Eligible customers can rate and review a purchased item after confirming receipt. A completed subscription also has a review flow. Visible reviews appear on the product page. Admins can hide or restore them and view the moderation history. [Customer orders](app/orders.js) · [Review state and moderation](app/owner-reviews.js)
- [ ] Persist feedback and support customer image uploads. Validate one review per eligible order item and up to three images. Align the current subscription review, which is keyed by subscription, with the ERD's order-item relationship. Persist moderation actor, reason, and time. [ERD feedback entities](ERD-Revised.md#entities)

## Sales Analytics

- [x] **Browser prototype.** Record preparing-owner shares and display recorded payments, fulfilled product sales, owner attribution, unallocated work, and estimated profit. The report reads available order data, including saved standard and subscription transactions. [Owner allocation](app/earnings-allocation.js) · [Sales Analytics](app/owner-analytics.js)
- [ ] Persist item-level allocations and audit history using eligible admin IDs. Enforce one or two owners totaling 100% at the required transitions and lock attribution during active courier booking or after completion. [ERD allocation rules](ERD-Revised.md#allocation-rules)
- [ ] Base owner-attributed reporting on persisted allocations and fulfillment completion. Reconcile prepaid product shares and centavo rounding, exclude delivery fees from fulfilled sales, and show unavailable profit when cost inputs are missing. [ERD reporting rules](ERD-Revised.md#reporting-rules)

## Notifications

- [x] **SQLite.** Store the customer inbox, owner and staff alerts, and per-account read status. Create alerts for standard orders, fulfillment, subscription activity, account security, and low physical inventory. [Customer inbox](app/notifications.js) · [Notification migration](database/notifications-v7.sql)
- [x] **Local outbox.** Queue transactional email files, log outcomes and attempt history, retry after 5, 15, and 30 minutes, and give owners a final-failure alert and retry action. [Notification backend](notification-server.cjs)
- [x] **Browser prototype.** Show custom cake and quotation notifications using the existing browser records and simulated dispatch. [Quotation notification state](app/owner-cake-state.js)
- [ ] Connect live transactional email and SMS dispatch. Persist custom cake notifications when requests and quotations are migrated to SQLite. [ERD notification persistence](ERD-Revised.md#notification-persistence)

## Verification

- [x] The SQLite v4–v7 migration and fulfillment suite passed, covering persisted addresses, standard courier checkout, subscription checkout, restart, and fulfillment. [SQLite suite](verification/subscription-sqlite.cjs)
- [x] The delivery route, delivery tracking, and earnings allocation suites passed with stand-ins or browser state. [Route suite](verification/delivery-route.cjs) · [Tracking suite](verification/delivery-tracking-state.cjs) · [Allocation suite](verification/earnings-allocation.cjs)
- [ ] Update the local auth and ordering regression fixture for the v6 `CourierBooking` table and rerun it. It still queries `SubscriptionCourierBooking`, and Windows reported a locked SQLite file during cleanup. [Local auth suite](verification/local-auth.cjs)
- [ ] Resolve the cake state suite's opening estimate assertion and rerun the cake flow. The current run returned 0 where the test expected 20,000. [Cake state suite](verification/phase4-state.cjs)
- [ ] Verify the browser flows against the current SQLite build and exercise live integrations when available.
