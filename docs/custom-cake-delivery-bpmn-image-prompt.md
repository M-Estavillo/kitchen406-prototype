# BPMN image-generation prompt: Owner-Managed Custom Cake Delivery

Copy the prompt between the separators into an image-generation tool.

---

Create a clean, academically styled **BPMN 2.0 collaboration diagram** titled **Kitchen406 Custom Cake Delivery — Owner-Managed Handoff**. Show how the bakery owners personally deliver a paid custom-cake order and record the completed handoff in the website. Clearly distinguish physical delivery performed outside the platform from order-status recording inside the platform.

## Visual format and notation

- Use a wide landscape canvas, white background, readable dark text, and restrained warm bakery-inspired accents. Arrange the process left to right with orthogonal connectors and no overlapping labels.
- Create an expanded **Kitchen406** pool with lanes **Website System**, **Staff / Owner — Preparation**, and **Admin / Owner — Delivery**. Create a separate **Registered Customer** pool.
- Use standard BPMN start/end events, user tasks for website interactions, manual tasks for physical delivery and receipt, and service tasks for system updates. Use solid sequence flows within each pool and dashed message flows only between pools. Connect annotations using dotted associations.
- Shade the physical delivery tasks lightly and label their area **Manual activities outside the website**. This is a visual grouping within the owner lane, not another participant pool or an automated system.
- Include a compact notation legend. Keep the diagram focused on delivery; summarize earlier quotation, payment, and preparation stages.

## Process to depict

1. Start event in Kitchen406: **Paid custom-cake order confirmed**. Attach a prerequisite note: **Customer has accepted the final quotation and completed the required payment. Delivery is the selected fulfillment method.** Do not expand cake configuration, quotation negotiation, or payment processing.
2. Website System task: **Display confirmed cake order and fulfillment details**. Show a small associated data object **Order details** containing approved cake specifications, customer contact, delivery address, scheduled date, and agreed time window where recorded.
3. Staff / Owner — Preparation task: **Prepare cake to approved specifications**. Treat production as one compact upstream task.
4. Staff / Owner — Preparation user task: **Mark Ready**.
5. Website System task: **Record Ready status and show order progress**. Send a dashed message to the customer's task **View order status**. Clarify through an annotation that the website shows preparation/readiness progress, not live delivery movement.
6. Admin / Owner — Delivery user task: **Review delivery details**. Associate this task with the order-details data object.
7. Admin / Owner — Delivery manual task: **Arrange owner-managed delivery**. Annotate: **Owners handle delivery logistics independently outside the platform.** Keep this generic; do not invent dispatch software, driver assignment, route optimization, or a required messaging channel.
8. Admin / Owner — Delivery manual task: **Personally transport cake to customer**.
9. Admin / Owner — Delivery manual task: **Hand cake to customer**, with a dashed message flow labeled **Cake handoff** to the customer's manual task **Receive cake**. The customer's receipt path ends at **Cake received**.
10. After successful handoff, Admin / Owner — Delivery user task: **Confirm handoff**. This is the website action used to record completion after physical delivery; it does not book transport or trigger a courier API.
11. Website System service task: **Mark order Completed and record status history**. Send a dashed message labeled **Updated order status** to a separate customer message start event **Completion update available**, followed by user task **View completed order** and end event **Completion viewed**. Keep this optional viewing path separate from physical receipt, so the owner does not wait for the customer to open the website before completing the order.
12. Kitchen406 end event: **Owner delivery completed and recorded**.

## Annotations and scope constraints

- **Custom-cake delivery is performed personally by Kitchen406 owners outside the system's courier-delivery workflow.**
- **The website records order readiness and the owner's handoff confirmation. It does not track the owner's journey or automate custom-cake delivery logistics.**
- **Confirm handoff is available for an eligible paid, Ready custom-cake order. Record completion only after the actual handoff.**
- **If delivery cannot be completed, owners resolve the arrangement outside the platform. Do not record a completed handoff until it occurs.** Show this as an annotation on the delivery segment rather than inventing an exception-management workflow.
- **Any applicable delivery fee belongs to the owner-prepared cake quotation. No Lalamove quotation or booking is involved.**
- **Pickup is a separate fulfillment method and is outside this delivery diagram.**

Do not include Lalamove pools, courier bookings, courier status webhooks, live GPS tracking, an owner-location map, automatic in-transit updates, cash-on-delivery collection, customer OTPs, signatures, proof-of-delivery photos, or mandatory customer confirmation inside the website. Do not imply that the paper specifies detailed transport procedures beyond owner-managed delivery. Keep physical transport at the high-level tasks given above.

Place this readable footer inside the diagram:

**Based on the Kitchen406 capstone paper's owner-managed custom-cake delivery scope and the prototype's Confirm handoff action. Physical delivery occurs outside the website; completion is recorded manually.**

---

## Source basis

- [Kitchen406 - Capstone Paper](../Chapters/Kitchen406%20-%20Capstone%20Paper.md): scope limitation 8; Logistics Provider API discussion; Section 4.15, Order Fulfillment; Section 4.16, especially FR-DEL-16; business rule BR-20; policies OR-POL-15 and OR-POL-16. These establish paid custom-cake fulfillment and exclude owner-delivered cakes from Lalamove logistics.
- The paper's **Custom Cake Quotation** interface description supports the owner-defined fulfillment arrangement, delivery fee, date, and time window.
- [Owner order interface](../app/owner-orders.js): provides **Mark Ready**, **Confirm handoff**, and the **Owner-managed delivery** description. The handoff action completes an eligible Ready cake order.
- [Customer order interface](../app/orders.js): displays custom-cake preparation/readiness progress and the Completed stage.

The manual transport and handoff tasks express the paper's owner-delivery requirement at a business-process level; they do not claim that the website implements dispatch or journey tracking.
