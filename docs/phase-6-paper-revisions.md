# Phase 6 revisions from the paper review

Date: October 7, 2026

This implements the seven website findings in the [paper alignment review](phase-6-paper-alignment-review.md). It preserves the shared header, footer, page introductions, cards, controls, and modal system.

| Finding | Implemented revision |
| --- | --- |
| F1: Late standard payments | When the checkout hold is no longer active, confirmation revalidates scheduling and capacity as well as ingredients. A paid receipt that cannot secure resources enters payment resolution and cannot enter production. Valid active commitments survive later capacity reductions or date blocking without being counted twice. |
| F2: Checkout/payment audit | Added independent checkout-hold records. Payment attempts retain their originating hold ID, amount, creation time, and reference. Ingredient transfer/consumption no longer changes checkout status. Late recovery uses separate material reservations linked to the original expired/released hold; it does not rewrite payment history or invent another payment attempt. |
| F3: Cancellation | Standard, subscription, and cake cancellation close the active unpaid attempt and release its checkout hold. Previous terminal attempts remain historical records. |
| F4: Pickup quotations | Customer quotation and payment views use the selected fulfillment method. Pickup shows bakery collection instructions, no destination prompt, and no delivery charge. |
| F5: Payment dates | Payment filtering uses Manila calendar dates, matching displayed timestamps. The page explicitly identifies the filter as attempt creation date. |
| F6: Overhead inheritance | Recipe editing provides “Use default overhead” and “Custom overhead.” Saving an inherited recipe preserves inheritance. Custom zero remains valid, and an override can be removed. |
| F7: Notification failures | Failed quotation messages create one owner-only attention item per quotation. Retries retain individual attempt outcomes, visible in quotation details. Success resolves the attention item without deleting earlier failures. Customer notification grouping remains separate from these owner alerts. |

## Implementation and verification

[checkout-holds.js](../app/checkout-holds.js) owns the prototype checkout audit lifecycle. Existing order, subscription, and cake commands use this shared state; ingredient reservations retain their own identities and lifecycle. Owner payment views read checkout state directly.

[phase6-revisions.cjs](../verification/phase6-revisions.cjs) exercises the seven reported problems, late receipt outcomes for full/blocked/cutoff/stock cases, valid active commitments, cancellation in all three purchase flows, actual recipe form submissions, notification retry history, and staff isolation. It uses a separate browser tab and closes it afterward.

**Verification result:** All nine affected suites passed, totaling 435 checks, including 23 focused revision checks. All 54 application JavaScript files passed syntax checks.

Run browser suites sequentially against the Chrome debugging endpoint on port 9222. See the [verification record](../verification/README.md) for fresh results and the existing suite commands.

## Preserved policy and remaining work

- All four subscription dates reserve capacity at enrollment. Only the next applicable delivery reserves ingredients, and preparation consumes them once. The confirmed policy takes precedence over older chapter wording.
- Customer deferment remains automatically validated, with four deliveries and one successful deferment. The paper's owner “processing” wording still needs a decision before introducing an approval queue.
- Cake daily capacity remains configurable. Whether one cake per date is an invariant or a default remains a paper/policy decision.
- Multiple reference images, approved production copies, and structured negotiated design changes still need the schema/policy decisions described in the review. Restock quantity and cost editing remain separate workflows.
- The chapter sources have not been rewritten. The original review remains a historical record; this document records the implemented corrections.
- Checkout records, notification attempts, role checks, and provider outcomes remain browser-memory prototype features. Reload/reset clears them. Durable ERD persistence, server authorization, real provider callbacks, and participant UAT remain production work.
