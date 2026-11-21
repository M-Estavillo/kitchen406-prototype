# Kitchen406 BPMN List

This list groups the proposed BPMNs by business outcome. Shared subprocesses are defined once and referenced by their parent processes.

Source: [Capstone paper and SRS](../Chapters/Kitchen406%20-%20Capstone%20Paper.md), supplemented by the current website prototype.

## Main transaction BPMNs

| BPMN title | Purpose | Subprocesses |
| --- | --- | --- |
| **Standard Ordering** | Handle a one-time purchase from product selection through fulfillment. | Order Checkout → Payment → Order Fulfillment |
| **Subscription** | Handle enrollment and four prepaid fulfillments. | Subscription Enrollment → Payment → Scheduled Fulfillment; optional Deferment |
| **Custom Cake Ordering** | Handle a cake request, quotation, payment, and fulfillment. | Cake Request → Quotation → Payment → Order Fulfillment |

These are overview diagrams. Keep their detailed tasks and exception paths in the subprocess BPMNs below.

## Subprocess BPMNs

Each entry represents one diagram. Shared entries are referenced rather than duplicated.

| BPMN title | Purpose | Used by |
| --- | --- | --- |
| **Order Checkout** | Capture cart items, fulfillment method, date, and delivery details; validate the purchase before payment. | Standard Ordering |
| **Subscription Enrollment** | Capture the product, quantity, schedule, and fulfillment arrangement for four prepaid commitments. | Subscription |
| **Cake Request** | Capture cake specifications, reference images, requested fulfillment details, and the preliminary estimate. | Custom Cake Ordering |
| **Quotation** | Review feasibility, issue or revise the final quotation, and record acceptance or expiry. | Custom Cake Ordering |
| **Booking Validation** | Check applicable capacity, ingredients, schedules, cut-offs, and blocked dates before accepting or changing a commitment. | Checkout, enrollment, quotation payment, deferment, and late-payment recovery |
| **Payment** | Hold resources, process and verify QR Ph payment, and confirm or release the commitment. Include expiry and late-payment resolution branches. | All three transaction BPMNs |
| **Scheduled Fulfillment** | Wait for each subscription fulfillment's preparation schedule, secure its ingredients, invoke Order Fulfillment, and update completion counts. Repeat for all four commitments. | Subscription |
| **Deferment** | Check eligibility, offer valid replacement dates, and reschedule one subscription fulfillment without adding another fulfillment. | Subscription |
| **Order Fulfillment** | Record preparing-owner allocations, start preparation and ingredient consumption, mark ready, and route the order to pickup or delivery. | Standard orders, subscription fulfillments, and custom cakes |
| **Courier Delivery** | Book and track standard-order and subscription deliveries, resolve booking exceptions, and record delivery completion. | Order Fulfillment |

Pickup and owner-managed cake handoff remain branches within **Order Fulfillment**. Preparing-owner allocation and ingredient consumption also belong there; they do not require separate diagrams in this grouping.

The current [Order Checkout XML](order-checkout.bpmn.xml) expands the booking checks locally for readability. It covers the same shared validation responsibility, rather than introducing another process into this inventory.

## Supporting BPMNs

| BPMN title | Purpose | Included activities |
| --- | --- | --- |
| **Product Setup** | Maintain offerings that can be priced, ordered, and produced. | Products and variants; categories; cake options; recipes; costing and selling-price approval |
| **Inventory Control** | Maintain stock accuracy and resolve material shortages. | Stock review; restocking; adjustments; movement recording |
| **Schedule Setup** | Maintain the rules governing future booking availability. | Capacity limits; batch schedules; cut-offs; blocked dates |
| **Account Management** | Establish and maintain customer and staff access and account information. | Registration and verification; access recovery; staff onboarding and deactivation; profile and address updates |
| **Customer Feedback** | Collect eligible purchase reviews and manage their visibility. | Eligibility check; review submission; moderation |
| **Marketing Content** | Prepare marketing drafts for owner review and manual use. | Generation; review and revision; approval or rejection; export |
| **Sales Reporting** | Report payments, fulfilled sales, product performance, and owner allocations. | Report selection; aggregation; estimated-profit and allocation calculations |
| **Notifications** | Deliver transaction and operational messages and handle delivery failures. | Message preparation; sending; outcome recording; retry |

## Grouping rules

- Consolidate capacity and ingredient checks under **Booking Validation**. Apply only the rules relevant to each caller.
- Keep payment handling, reservation expiry, and late-payment recovery under **Payment**. Checkout ends before payment and resource holds begin.
- Keep production, preparing-owner allocation, pickup, and cake handoff under **Order Fulfillment**.
- Keep subscription scheduling under **Scheduled Fulfillment**, which invokes the shared fulfillment process for each commitment.
- Show customer tracking through status updates and viewing activities in fulfillment and delivery. A separate tracking BPMN is unnecessary unless the interaction becomes more involved.
- Use call activities for separately defined reusable processes. Use embedded subprocesses for detail owned by a single parent.
- Keep browsing, filters, pagination, and dashboard navigation as activities or interface details rather than separate BPMNs.
- Treat notification delivery as independent background work where appropriate; a failed message must not repeat the originating transaction.

**Inventory: 3 parent BPMNs, 10 subprocess BPMNs, and 8 supporting BPMNs.**
