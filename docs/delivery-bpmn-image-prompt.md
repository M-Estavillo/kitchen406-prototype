# BPMN image-generation prompt: Delivery Process

Copy the prompt between the separators into an image-generation tool.

---

Create a readable, academically styled **BPMN 2.0 collaboration diagram** titled **Kitchen406 Delivery Process — Proposed System**. Depict the delivery workflow specified in the Kitchen406 capstone paper, including the planned Lalamove integration, even though the current website prototype simulates courier operations.

## Visual format and BPMN notation

- Use a wide landscape canvas, preferably A3 landscape or equivalent high resolution, with a white background, dark text, and restrained warm bakery-colored accents.
- Arrange the main process left to right, with checkout on the left, preparation and booking in the middle, and delivery completion on the right. Keep task labels short and readable; avoid crossing connectors.
- Create an expanded **Kitchen406** pool with lanes **Website System**, **Staff**, and **Admin / Owner**. Create separate participant pools for **Registered Customer**, **Google Maps Platform**, and **Lalamove**. Keep external-service pools compact; show only their relevant tasks and messages.
- Use thin-circle start events, thick-circle end events, rounded task rectangles, user-task and service-task markers where appropriate, and exclusive gateways marked with an X. Label gateway exits explicitly.
- Use solid sequence-flow arrows only within a pool; sequence flows may cross lanes in the same pool. Use dashed message flows with open arrowheads only between participant pools. Connect notes using dotted associations, not sequence flows.
- Show a small legend for events, tasks, gateways, sequence flows, and message flows.

## Main workflow: standard orders and weekly subscription fulfillments

1. In Registered Customer, begin with **Delivery selected**. The customer performs **Select saved address or add address** and sends the selected address to Kitchen406.
2. Website System performs **Validate address and service area**, exchanging location and route/distance requests and responses with Google Maps Platform. The external task is **Return location and route information**.
3. Add the exclusive gateway **Address valid and serviceable?**
   - **No:** Website System performs **Show address error; block continuation** and informs the customer. The customer returns to **Select saved address or add address**. Do not allow the invalid address to reach quotation or payment.
   - **Yes:** Continue to **Request delivery quotation**.
4. Exchange a quotation request and response with Lalamove, whose task is **Return delivery quotation**. Website System performs **Show delivery fee in order summary**. The customer performs **Review total and pay**.
5. Show payment confirmation as a collapsed subprocess **Confirm successful payment**, followed by Website System task **Confirm order and store delivery details**. Treat successful payment as a prerequisite for the downstream flow; do not expand payment-provider internals.
6. Staff performs **Prepare scheduled fulfillment**, then **Mark order Ready**. Website System performs **Make ready order available for delivery booking**. Show preparation as one compact segment, without expanding recipes or inventory.
7. Admin / Owner performs **Initiate courier booking**. Website System performs **Submit stored delivery details to Lalamove**. Send a booking request to Lalamove task **Process courier booking**, and return the booking result.
8. Add the exclusive gateway **Booking confirmed?**
   - **Yes:** Website System performs **Store booking reference and status**, then proceeds to delivery monitoring.
   - **No / failed:** Website System performs **Show booking error; retain order details**. Admin / Owner performs **Review and retry eligible booking**, returning to the booking step. Do not mark the order delivered or completed on this branch.
9. In Lalamove, show **Carry out delivery** and **Send delivery-status updates**. Use a dashed message flow labeled **Status webhook** to a Kitchen406 intermediate message catch event **Delivery status received**.
10. Website System performs **Update delivery status and history**, then **Display latest status and send applicable customer update**. Send a message to Registered Customer task **View latest delivery status**. The customer-facing view shows status information only.
11. Add the exclusive gateway **Delivery completed?**
    - **No / ongoing:** Return to **Delivery status received**, waiting for another update.
    - **Failed / cancelled:** Website System performs **Show delivery exception**. Admin / Owner performs **Review exception and rebook if eligible**. Return to booking only when rebooking is permitted; do not automatically create another booking.
    - **Yes:** Website System performs **Record completed fulfillment**, followed by end event **Delivery completed**. In Registered Customer, end with **Order received** after the delivery handoff. Keep physical receipt distinct from merely viewing a status update.

## Annotations to include in the diagram

- Beside checkout and booking: **Quotation at checkout; courier booking only after Ready and initiated by Admin / Owner. Payment does not automatically book a courier.**
- Beside preparation: **Standard delivery orders and each weekly subscription fulfillment follow this process. Each subscription fulfillment has its own order, booking, and tracking record. Subscription enrollment is prepaid; do not charge again each week.**
- Beside subscription quotation: **Four scheduled weekly fulfillments. Delivery fees form part of the prepaid total; later courier-fee differences are absorbed by the bakery. Delivery address is fixed after payment confirmation.**
- Beside status display: **Latest provider-reported delivery status only; no live rider-location tracking.**
- Beside external-service interactions: **If location, quotation, booking, or status retrieval fails, show an error and allow an appropriate retry. Preserve existing records and the latest known status. Do not treat an unknown booking outcome as a confirmed failure or create duplicate active bookings.** Keep this as a note rather than several large extra branches.

## Scope exceptions and implementation disclosure

Place two small scope notes below the main process:

- **Pickup:** Standard orders may use bakery pickup instead. Pickup bypasses courier quotation, courier booking, and tracking, with no delivery fee. The pickup workflow is outside this diagram.
- **Custom cakes:** Owners arrange and deliver custom cakes independently outside the system's courier workflow. No Lalamove quotation, booking, or tracking is shown for custom-cake delivery. Do not invent a detailed owner-delivery subprocess.

Place a clearly readable footer inside the image:

**Proposed workflow based on the Kitchen406 capstone paper. The current website prototype simulates courier booking and status updates; it does not connect to the real Lalamove API.**

## Accuracy constraints

Make delivery management the visual focus. Do not depict live GPS rider movement, a moving rider map, customer-triggered courier booking, booking immediately after checkout, cash on delivery, recurring weekly subscription payments, automatic rebooking, or Lalamove delivery for custom cakes. Do not invent exact Lalamove API status codes, guaranteed arrival times, rider assignment rules, proof-of-delivery uploads, or customer confirmation requirements. Use plain business status descriptions. Keep all labels legible and preserve correct BPMN pool boundaries and connector types.

---

## Source basis

- [Kitchen406 - Capstone Paper](../Chapters/Kitchen406%20-%20Capstone%20Paper.md): Section 4.16, Delivery Management (FR-DEL-01 through FR-DEL-16); Section 4.15, Order Fulfillment; Section 4.17, Notifications; Logistics Provider API discussion; business rules BR-19, BR-20, and BR-32; subscription address restriction in the scope limitations.
- The booking/retry and retrieval-error handling also follows the paper's **Deliveries / Courier Booking** interface description (Figure 46).
- [Prototype courier adapter](../app/delivery-state.js): explicitly local, with demo booking references and simulated status advancement. The diagram intentionally describes the paper's proposed integration and discloses this prototype limitation.
