# BPMN image-generation prompt: Sales Analytics

Copy and paste the prompt below into an image-generation model.

---

Create a **BPMN 2.0 process diagram** showing how an authorized bakery owner uses the Sales Analytics feature in the Kitchen406 website. Base every process detail and label below on the website interface and behavior. Do not add database, payment-provider, payroll, payout, or other systems that are not shown here.

## Visual format

- Wide landscape canvas, white background, clean professional academic presentation style.
- Use standard BPMN start/end events, user tasks, service tasks, exclusive gateways, sequence flows, and data objects where useful.
- Use one pool titled **Kitchen406 Website** with lanes **Customer**, **Staff / Owner Operations**, **Website System**, and **Owner**.
- Keep the path left-to-right, use orthogonal connectors, avoid crossing lines, and make labels readable at presentation size.
- Use restrained bakery-inspired colors only as accents; BPMN symbols and flow direction must remain clear.

## Process flow

1. Start event in Customer lane: **Customer places an order or purchases a subscription**. Include custom cake orders as another website order type.
2. Website System task: **Record successful payment**.
3. Exclusive gateway: **Report basis selected**. Show the default as **Fulfilled sales** and the alternate as **Recorded payments**.

### Fulfilled sales branch (default)

4. Staff / Owner Operations task: **Prepare order and record preparing owner(s) per product line**. Use website labels **Owner A**, **Owner B**, and **Unallocated**. A product line may be assigned to one owner or split between both owners.
5. Staff / Owner Operations task: **Complete fulfillment**. Show pickup confirmation, completed courier delivery, and owner-confirmed custom cake handoff as the website completion routes.
6. Website System task: **Select paid, completed orders**. Use the completion date and product items; for subscription deliveries, include their apportioned product value in completed deliveries.
7. Exclusive gateway: **Prepared-by filter?** Show **All owners**, **Owner A**, **Owner B**, or **Unallocated**. Include the owner filter only on this Fulfilled sales branch.

### Recorded payments branch

8. Website System task: **Select recorded paid purchases** using the paid date. Include the subscription purchase in this report basis; do not treat each later subscription fulfillment as a new payment.
9. Do not show a Prepared-by filter on this branch.

### Shared report flow

10. Owner task: **Choose report period and filters**. Show **Day, Week, Month, Quarter, Year, or Custom range**, product selection, and order type (**All, Standard orders, Subscriptions, Custom cakes**). Show product and order-type filters on both report bases.
11. Website System task: **Filter matching website records and calculate report**.
12. Website System task: **Refresh Sales Analytics dashboard**. Show four metric cards: **Allocated sales / Recorded revenue**, **Estimated profit**, **Average purchase**, and **Units sold** (or **Allocated units** when filtering to a specific prepared-by choice).
13. Website System task: **Display Sales trend, Sales by order type, and Top products**. The trend is daily, weekly, or monthly according to the selected date span; Top products ranks up to five products by revenue.
14. Owner task: **Review sales and product performance**.
15. End event: **Analytics report viewed**.

## Notes to show as BPMN annotations

- **Fulfilled sales count completed work; Recorded payments use paid purchases. These are separate report bases.**
- **Fulfilled sales exclude delivery fees. Subscription product value is allocated across completed deliveries.**
- **Estimated profit uses current ingredient, packaging, and utility cost estimates.**
- **Unassigned completed work remains Unallocated. Staff actions do not earn an owner share.**
- **Changing filters changes the report view.**

## Accuracy and layout constraints

Use only the process and exact interface terms specified here. Do not depict automatic payouts, owner bank transfers, staff commissions, refunds, payroll, tax accounting, a database, or backend services. Keep operational fulfillment as a short upstream part of the diagram; make the report-basis decision and analytics dashboard the visual focus. Distinguish the two report branches clearly and merge them only at the shared filtering and dashboard steps. Do not imply that a payment alone is a fulfilled sale or that a completed order necessarily has an owner assignment.

---

This prompt is based on the Sales Analytics interface and behavior implemented in the website, especially its owner dashboard, order fulfillment, and preparing-owner allocation flows.
