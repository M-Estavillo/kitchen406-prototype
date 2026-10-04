# Phase 5 revisions from the paper review

Date: October 4, 2026

This revision applies the findings in the [paper alignment review](phase-5-paper-alignment-review.md) to the existing browser prototype. The header, footer, typography, page introductions, cards, forms, and modal system remain shared with the existing site.

## Confirmed subscription policy

The user confirmed this approach during implementation:

- Reserve capacity for all four delivery dates at enrollment.
- Hold ingredients for the first delivery during checkout; confirm them on successful payment.
- Starting preparation consumes that delivery's ingredients once and attempts to reserve the next unprepared delivery.
- Use chronological fulfillment order, including after deferment.
- When the next delivery cannot reserve ingredients, show a shortage and retain its projected requirements. Restocking retries that reservation without consuming ingredients.

Future requirements carry projected reservation dates based on the preceding delivery's preparation schedule. The actual trigger is the preceding delivery starting preparation; the next reservation records the current scheduling date when it becomes eligible. A projected date alone does not automatically consume or reserve future stock.

Chapter 3's capacity wording still needs updating to match this confirmed policy. The chapter files were not edited in this website revision.

## Changes by review finding

| Finding | Website revision | Remaining qualification |
| --- | --- | --- |
| F1: Subscription stock acceptance | Subscription configuration, checkout, retry, and confirmation validate shared ingredients. Checkout holds the first delivery's stock. A payment received without sufficient ingredients enters resolution and creates no normal production commitments. | Payments remain simulated. |
| F2: Standard retry holds | A retry revalidates capacity and obtains a fresh inventory hold before returning to Waiting. Failure requires revalidation instead of presenting a payable attempt. Attempts carry the new inventory hold reference. | A real CheckoutHold/Payment transaction still needs backend implementation. |
| F3: Inventory-driven availability | Product availability combines the owner's availability flag with recipe ingredients. Catalog, product quantity/variant actions, cart additions/validation, and subscription eligibility consult shared inventory. Visible catalog/product availability refreshes after stock changes. | Demo catalog flags and owner recipe quantities are still fixtures. |
| F4: Weekly material planning | Added per-ingredient requirement records with dates and reservation timing, reservation history, and reservation IDs. The next unprepared delivery is reserved on preparation/restock; deferment releases an outdated next-delivery reservation and selects the next chronological commitment. | Browser maps retain compatibility bundles; these are not migrated relational tables. |
| F5: Separate statuses | Staff transitions now store `ready`; legacy ready labels map at the boundary. Courier transit is recorded under `delivery.status`, not inferred from completion. Subscription deliveries normalize to scheduled/preparing/ready/fulfilled/cancelled, with deferment shown as schedule context. An explicit order-record adapter maps legacy type/payment labels to ERD values. | Existing customer fixture labels remain accepted inputs. Real courier events are not connected. |
| F6: Audit identity | Stock movements carry account IDs, reservation references, and operation keys. Status history carries account IDs and timestamps; shared status changes and confirmed subscription/cake orders record history. Staff names resolve through the stable ID in history/movement views and movement filters. | Database uniqueness, transaction rollback, persistent records, and concurrent-session enforcement remain backend work. |
| F7: Notifications | Internal events use supported new-order, low-stock, and deferment types with recipient and entity metadata. Low-stock alerts trigger on entering a low-stock condition, reset after recovery, and do not repeat because another ingredient changed. Reservations/releases also evaluate alerts. Shared acknowledgement updates both read flags and time. | No unsupported readiness notification enum was added. Cross-session delivery/read synchronization remains pending. |
| F8: Cake references | Added an owner-review simulator that creates a quotation-specific approved instruction/image copy. Staff details display only that reviewed copy alongside accepted selections. Staff cannot approve or edit it through the normal workspace. | The simulator is a developer tool, not real administrator authorization. The reviewed-copy record is an explicit proposed extension that still needs an agreed production schema. Content review is manual. |
| F9: Preparation calendar | Added separate Fulfillment and Subscription preparation date views. Cards show both dates where available. Preparation days derive from the subscription schedule and follow replacement fulfillment dates. | Demo schedules use Thursday preparation for Friday fulfillment, Friday for Saturday, and Monday for Tuesday. The owner must confirm these fixture days before operational use. |

## Trying the revised features

### Inventory and subscriptions

1. Create a subscription through the customer enrollment flow.
2. While payment is pending, inspect the ingredient hold in the staff Inventory view.
3. After payment, open its first weekly fulfillment and start preparation.
4. Stock Movements records physical usage with the staff account/reservation references. The next chronological delivery now holds ingredients.
5. If stock is insufficient, the order card/details and operational feed show the issue. Restock the affected ingredient to retry the next reservation.

### Approved cake instructions and images

1. Sign in as a customer in the prototype and submit a cake request. Use the existing owner quotation simulator to issue a quotation.
2. Outside the staff workspace, open **Mock Controls → Owner: review cake production copy**. When viewing a quotation, the action selects it; otherwise it selects the newest eligible quotation.
3. Enter production instructions, select reviewed reference images, and confirm that the selected content contains no customer-identifying information.
4. Approve the copy, then inspect the paid cake order from the staff workspace. Only the reviewed copy is displayed; raw customer notes are not automatically copied.

This owner action is deliberately located in Mock Controls until the owner workspace and server authorization are implemented. The copy belongs to a specific quotation version; a new quotation needs its own reviewed copy.

### Calendar

Open **Production Calendar → Dates to show → Subscription preparation**. This switches the date basis without creating a second fulfillment record or doubling order counts. Standard orders and cakes without a supported preparation schedule remain in the fulfillment view.

## Verification

| Command | Result |
| --- | --- |
| `node verification/phase5-revisions.cjs` | 32 checks passed; no uncaught browser exceptions. Covers shortage/resolution, checkout and retry holds, competition for stock, next-delivery reservations, deferment, stock recovery, actor references, status separation, notifications, the actual production-copy form, preparation dates, and cake details at 1440/390/320 px. |
| `node verification/phase5-browser.cjs` | 63 checks passed; no uncaught browser exceptions. |
| `node verification/phase2-browser.cjs` | 95 checks passed; no uncaught browser exceptions. The inspector payment fixture now uses an unbooked date and assertions expect canonical Ready statuses. |
| `node verification/subscription-browser.cjs` | 71 checks passed; no uncaught browser exceptions. |
| `node verification/phase4-state.cjs` | 28 checks passed in the existing state harness. |
| `node verification/subscription-state.cjs` | 13 checks passed in the existing state harness. |
| Application JavaScript syntax | Passed `node --check`. |

The prior storefront smoke and Phase 4 browser suites still contain selectors removed by earlier customer UI edits; a full pass for those suites is not claimed here. Browser suites must run sequentially because they share a Chrome page.

The [approved cake screenshot](../verification/staff-approved-cake.png) was visually checked. The new controls use the existing page/card/dialog styling.

## Work still required before production

This revision does not implement a backend migration. Data resets on reload. Auth.js sessions, owner provisioning and first-use staff setup, secure credential storage, database transactions, owner-approved recipe/cost data, real payment/courier/notification providers, and multi-session verification remain necessary. Browser role checks and Mock Controls are not a confidentiality boundary.

The review findings are addressed at the prototype behavior level, with the model and production qualifications above. The website should still be described as a prototype, not as a completed implementation of every ERD constraint.
