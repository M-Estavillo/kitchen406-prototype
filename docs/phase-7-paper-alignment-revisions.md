# Phase 7 — Paper alignment revisions implemented

Date: October 9, 2026.

This records the website revisions made from the [paper alignment review](phase-7-paper-alignment-review.md). The review remains a historical record of the output before these changes. The shared application header, footer, owner navigation, cards, forms, tables, typography, and responsive layout are retained.

## Implemented changes

| Finding | Website change |
| --- | --- |
| F1 — Variant prices | Catalog cards and owner product summaries use one minimum-price selector that excludes administratively unavailable variants. An empty available set displays “No available variants.” Stock eligibility remains a separate purchase check. |
| F2 — Feedback summaries | Every product uses its actual visible feedback for its hero rating, count, review link, and review-section summary. Empty/hidden feedback produces no invented rating. |
| F3 — Payment dates | Reports use the earliest successful attempt's `paid_at`, with the existing order `paidAt` as a legacy fallback. Attempt initiation time is never a substitute. Missing payment times stay excluded and disclosed. |
| F4 — Marketing | All four categories have deterministic generation paths: new product launch, product highlight, subscription-slot reminder, and seasonal occasion. A preview scheduler evaluates events every minute while an owner session is active. Mock Controls can exercise individual categories. |
| F5 — Analytics | Added paid purchase-order count, Monday–Sunday revenue/quantity aggregation, product cost, covered margin amount, and margin percentage. Uncovered cost/margin reads “Not covered.” |
| F6 — Delivery logs | The outbox has canonical preview NotificationLog records: recipient account, allowed type, provider, related entity, status, error, creation time, and successful-send time. Owner verification and staff setup produce linked simulated delivery records. |
| F7 — System notifications | Added payment-received and custom-cake-submitted events, normalized draft/failure notifications, role filtering, stable deduplicated identities, and read flags/timestamps on shared records. Quotation failure references now use an ERD-supported entity. |
| F8 — ERD mapping | Definition saves retain creation/update metadata, cake definitions and occasions retain creator identity, variants use available/unavailable, and a catalog adapter exposes final ERD fields. Feedback includes purchased-item identity and feedback-owned image records. |
| F9 — Account history | Owner profile/password/email changes retain appropriate timestamps. Verification records preserve purpose, hashed proof, target, expiry, attempts, and completion. Staff provisioning retains account/profile/creator identity and a linked setup record; setup expiry and failed attempts are enforced. |

## Decisions applied

- **Sales count on successful payment date**, confirmed by the user. Dates are displayed and filtered in Asia/Manila. Weekly subscription fulfillments do not create additional revenue; the purchase receipt is counted once. Payment-resolution receipts remain separately disclosed.
- **Displayed minimum price uses administratively available variants.** Temporary stock shortages do not erase the configured selling price. Availability and recipe checks still decide whether purchase is permitted.
- **Recipe costs remain current estimates.** They are not historical actual costs. Cake and subscription costs remain outside margin coverage and are labeled accordingly.
- **Cake quantities remain explicit and size-specific**, with nullable `scale_factor`; no additional multiplier is introduced.
- **The final ERD defines notification fields and moderation reasons.** No unsupported retry-scheduling columns, additional moderation-reason text field, or per-user acknowledgement history was introduced.
- **Four-delivery capacity commitments remain intact.** The paper's conflicting capacity wording still needs editorial reconciliation.

## Marketing behavior

Generation uses current purchasable products and configured prices. Highlights prioritize products with fewer purchased units during the preceding 30 days. New launch events identify newly added products with recipes. Subscription reminders evaluate available schedules and remaining capacity across all four deliveries, without changing the subscription draft or reserving capacity. Seasonal context is limited to active occasions that are current or start within 14 days.

Events have stable keys to prevent duplicate drafts. Launch keys are per product; highlight and subscription reminder keys are per product/day; seasonal keys include the occasion. Failed generation creates no draft or consumed event key. The automatic evaluator runs only in the open, signed-in owner preview; it is not a server cron job.

Each draft retains the context used to generate it. Approval checks current product, price, occasion, and capacity context. If it changed, the owner must review the current context and save the caption before approving. The draft detail shows the current context alongside the captured context. Already reviewed drafts remain locked.

**Images remain product-image placeholders.** Regeneration records a simulated request and explicitly states that no new AI image was produced. The saved caption is preserved. No Gemini call, social publishing, or external scheduling occurs. A production provider must implement caption/image generation behind this workflow before AI generation can be considered complete.

## Preview record mappings

- `catalogState.record(kind, record, parent)` projects the live catalog definitions into ERD-shaped records rather than maintaining a second mutable catalog. Variant IDs use `product_id:local_variant_id`, preserving existing purchase references.
- Product/category/ingredient/cake metadata is initialized for preview fixtures and updated on saves. Creator and creation time are retained on edits. Preview initialization timestamps describe seeded records, not historical production activity.
- Feedback's purchased-item identity is the existing unique order-plus-item key. `image_records` provides each attachment's feedback ID, image ID, URL/data URI, and creation time; the original image list continues to support rendering. A production OrderItem mapping must preserve the same uniqueness.
- Owner and staff preview account/profile IDs are explicit. The existing `hash` property remains the sign-in authority and maps to Account `password_hash`; no second credential store is introduced.
- For staff setup, the temporary password is the single-use setup proof. Its hash is retained in the preview AccountVerification proof field with purpose `account_setup`; a successful password replacement completes that verification. Setup expires after 24 hours or locks after five attempts, and the owner can issue a new temporary password. This is a documented preview adapter; the backend should finalize whether account setup uses a dedicated OTP or setup token.
- Owner email changes use a ten-minute verification record, retain failed attempt counts, and update email/verification metadata only after successful verification. The plaintext preview code remains available only through Mock Controls; no real email is sent.
- Notification recipients map CustomerProfile references to Account IDs. Email and SMS map to Brevo and Semaphore respectively. Existing channel summaries are explicitly identified as summaries, while quotation send attempts retain their own identities. No unavailable retry history is fabricated.
- Shared operational notification acknowledgements update the source record. Owner-only generated events retain their own canonical records; the owner feed excludes staff-only records.

## Verification

The targeted suites exercise the application through local Chrome and isolated state fixtures. They do not contact real payment, courier, email, SMS, or AI services.

- `verification/phase7-alignment-browser.cjs`: 37 focused checks covering the review findings, all marketing categories, stale-context rejection, canonical logs, quotation summary/attempt deduplication, recipient roles, shared acknowledgement, owner verification, staff setup expiry/completion, and report layout at 1440/390 pixels.
- `verification/phase7-state.cjs`: 8 reporting checks, including payment success across Manila midnight, rejection of attempt-time fallback, weekday reconciliation, subscription receipt counting, incomplete cost coverage, resolution handling, and the owner guard.
- Existing Phase 7 browser suite: 129 checks across all owner routes and 1440/768/390/320-pixel widths.
- Owner browser and integration suites: 78 and 32 checks respectively.
- Phase 6 revision suite: 23 checks. Its recipe-dialog setup now waits for owner navigation to settle before opening the dialog; no assertion was weakened.
- Existing Phase 4 state and subscription state suites: 28 and 13 checks respectively.
- Application JavaScript syntax checks pass. Desktop and mobile reports were visually inspected; screenshots are in `verification/phase7-reports-1440.png` and `verification/phase7-reports-390.png`.

Additional affected checkout, subscription, and account browser regression results are recorded in [verification notes](../verification/README.md).

## Remaining production work

This remains an in-memory prototype. Reload/reset restores the seeded state. Server authorization, durable database constraints and audit records, production password/OTP handling, hosted image storage, actual provider delivery, and scheduled Gemini generation are still required before claiming production compliance with the paper.

The remaining paper ambiguities concerning notification retry prose, optional cake scaling, “Other” moderation explanations, capacity wording, and the Figure 29 actor label are unchanged. The website follows the explicit decisions above; the chapters themselves were not edited.
