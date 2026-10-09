# Phase 7 — Implemented output review against the paper and ERD

Review date: October 9, 2026.

Follow-up: the website has since been revised. See [implemented paper-alignment revisions](phase-7-paper-alignment-revisions.md) for the changes, verification, and remaining production limits. Findings below describe the pre-revision output.

## Verdict

**Phase 7 is partially aligned with the paper.** The integrated prototype demonstrates most owner management workflows and reuses the existing application design and operational state. It should not yet be described as fully paper-compliant: there are concrete price, feedback, and reporting defects, incomplete marketing and notification workflows, and missing ERD metadata.

This review evaluates the **implemented application**, including its connections to earlier phases, rather than re-reviewing the uploaded UI Generator screens. It supplements the [original UI review](phase-7-owner-management-ui-review.md), [revision brief](phase-7-owner-management-ui-revisions.md), [implementation plan](phase-7-implementation-plan.md), and [implementation record](phase-7-implementation.md). Those documents are supporting context; the chapters and ERD are the acceptance references.

No application fixes were made as part of this review.

## Sources and method

| Reference | Requirements used |
| --- | --- |
| [Chapter 1](../Chapters/Chapter%201.md), objectives and §1.4 | Owner access, purchased-item feedback, inventory and costing, automatic marketing, manual moderation, and scope exclusions. |
| [Chapter 2](../Chapters/Chapter%202.md), pricing, analytics, marketing, and synthesis | Transparent owner-controlled pricing, sales/product/time patterns, operationally grounded marketing. |
| [Chapter 3](../Chapters/Chapter%203.md), design and implementation methodology | Target architecture, costing basis, scheduled generation, Gemini captions/images, notification providers, and role separation. |
| [Chapter 4](../Chapters/Chapter%204.md), data model and use cases | Figures 16–17 and 20–22 for relationships; Figures 23–26 and 29–32 for account, catalog, cake, feedback, reporting, and marketing behavior. Relevant embedded ERD and owner use-case diagrams were also inspected visually. |
| [Final ERD](../Chapters/ERD.md) | Entity attributes, foreign keys, uniqueness, enums, timestamps, and explicit business constraints. |

The review inspected the Phase 7 state and UI modules, shared catalog/product/account behavior, reporting projection, and relevant Phase 6 dependencies. It also ran two isolated Node probes: the actual report builder with a cross-midnight payment fixture, and the catalog minimum-price calculation with an inactive variant. These checks are described below.

This is a source and focused behavior review, not a fresh full browser regression or production security audit. Previous implementation test results are not treated as proof of paper compliance. Findings labeled as source observations were not independently exercised through the UI in this review.

Browser-memory storage, local image previews, simulated delivery, and inspector-driven external events are already declared prototype limits. Their absence from a production backend is tracked separately from defects that can be corrected in this prototype. An in-memory object need not literally be a SQL row, but its identity, constraints, state, and eventual ERD mapping must remain coherent.

## Review by subphase

“Mostly aligned” means the principal workflow matches, with the listed remaining issues. It does not mean production acceptance.

| Subphase | Assessment | What aligns | Required follow-up |
| --- | --- | --- | --- |
| **7.1 Products management** | Mostly aligned | Shared catalog authority; category/status/subscription filters; selected-product actions; administrative visibility remains distinct from stock availability. | Correct prices calculated from inactive variants (F1); retain product timestamps (F8). |
| **7.2 Product editor** | Partial | Product/category/variant edits; explicit final selling prices; stable existing variant references; recipe/costing links; new variants need recipes before purchase. | Correct price projection (F1); map variant status to the ERD and preserve variant metadata (F8). |
| **7.3 Categories** | Mostly aligned | Unique names, active/inactive status, linked product counts, and propagation to storefront categories. | Add creation/update metadata (F8). Category deactivation cascading to storefront visibility is an implementation policy, not an explicit paper rule. |
| **7.4 Ingredients** | Mostly aligned | Base-unit cost and threshold editing; derived stock condition; new ingredients start at zero; movement workflow remains separate; referenced units are protected. | Add ERD timestamps (F8). Preserve the existing separation of stock movements from definition edits. |
| **7.5 Cake options and add-ons** | Mostly aligned | Supported option types, prices, availability, unique ingredient mappings, positive quantities, and customer-builder integration. | Retain creator/timestamps and explicit status mapping (F8). Resolve the nullable scale-factor convention before introducing any multiplier. |
| **7.6 Seasonal occasions** | Partial | Valid date ranges, active/inactive status, saved dates, and linked draft counts. | Add creator identity (F8); define a relevant upcoming/current occasion window for generation (F4). Saving an occasion need not itself generate a draft. |
| **7.7 Staff accounts** | Mostly aligned at workflow level | Owner provisioning, status changes, unique emails across roles, temporary passwords, and forced initial password change before operational access. | Model account/profile identities and setup verification/delivery records (F9). Existing client-side gates are only a preview of production authorization. |
| **7.8 Customer accounts** | Mostly aligned | Read-only customer details, addresses, verification state, and purchase activity; inspecting a customer does not switch the active customer session. | Preserve the Account-to-CustomerProfile mapping when replacing preview storage. No separate blocking paper mismatch was established in this view. |
| **7.9 Review moderation** | Partial | Completed-purchase eligibility; one review per purchased-item key; 1–5 ratings; up to two photos; manual hide/restore using ERD reasons and moderator metadata. | Replace the static product rating/count (F2); map purchased-item keys and image entries to the ERD (F8). |
| **7.10 Marketing drafts** | Partial; generation workflow incomplete | Pending/approved/rejected lifecycle, caption edits, reviewer metadata, edit/regeneration counters, and manual use without social publishing. | Cover all four automatic event categories, operational grounding, relevant occasions, and actual/simulated image-result changes (F4). |
| **7.11 Reports and analytics** | Partial | Period filters, product drill-down, receipt-based quantities/revenue, separate delivery fees, subscription purchase counted once, and disclosed cost coverage. | Correct payment timestamp selection (F3); add order counts, weekday trends, and explicit per-product cost/margin reporting (F5). Confirm revenue-recognition policy. |
| **7.12 Notifications and settings** | Partial | Source-linked feed, channel outcomes, quotation attempt visibility, acknowledgement actions, separate owner identity, and profile/password/email-change forms. | Complete NotificationLog/SystemNotification contracts and event coverage (F6–F7); retain account security-change metadata and linked verification records (F9). |

## Findings and acceptance criteria

### F1 — Inactive variants can determine the displayed product price

**Priority: high. Subphases: 7.1 and 7.2; customer catalog dependency.**

Paper basis: Chapter 4 Figure 24 describes current available product variants and their selling prices; Figure 29 and the ERD distinguish product/variant state and final selling price.

Evidence: [catalog.js](../app/catalog.js), line 77, calculates the minimum of **all** variant prices. [catalog-state.js](../app/catalog-state.js), `C.product`, similarly saves the minimum without filtering inactive variants. Purchase eligibility separately rejects inactive variants.

The calculation probe used an inactive ₱100 variant and an active ₱200 variant. It returned **₱100**, although the active minimum was **₱200**. This is a calculation-level reproduction, not a browser screenshot. It can advertise a price the customer cannot select.

Revision: use one shared price projection for customer cards and owner summaries. For a customer-facing “from” price, define whether the eligible set includes only currently purchasable variants or all administratively available variants, and apply that policy consistently. Exclude administratively unavailable variants in either case; handle an empty eligible set explicitly.

Acceptance: an unavailable cheaper variant cannot lower the advertised selectable price; reactivation and price changes update all affected views.

### F2 — Product hero ratings still advertise hardcoded feedback

**Priority: high. Subphase: 7.9; customer product dependency.**

Paper basis: Chapter 1 §1.4.1 feedback scope, Chapter 4 Figure 30, and ERD CustomerFeedback/FeedbackImage require feedback tied to actual purchased items and manual visibility control.

Evidence: [templates.js](../app/templates.js), lines 287–290, contains the hero rating **4.6 / 18 reviews**. [product.js](../app/product.js), line 120, shows this link only for product 1. [owner-feedback.js](../app/owner-feedback.js), `F.renderPublic`, updates the review list and review-section summary, but not that hero link. This is a source-confirmed inconsistency: the list can have zero or one visible review while the hero still advertises 18.

Revision: derive the hero rating, count, visibility, and destination from the same visible-feedback selector as the review section for every product. Recompute after submission and moderation. Remove product-ID-specific assumptions.

Acceptance: no visible feedback produces no invented rating; adding, hiding, and restoring a review updates both summaries; products other than product 1 expose their real feedback.

### F3 — Reports can assign revenue to the payment-attempt day

**Priority: high. Subphase: 7.11.**

Paper basis: Chapter 4 Figure 31 requires reliable period-filtered transaction reporting. ERD Payment provides `paid_at`. The implementation itself promises the first successful payment date in Asia/Manila.

Evidence: [owner-reporting.js](../app/owner-reporting.js), `R.build`, uses `o.paidAt` or the successful attempt's **`at`**, ignoring its **`paid_at`**. [checkout-holds.js](../app/checkout-holds.js), line 12, records `attempt.paid_at` when payment is confirmed. Attempt creation and payment success need not occur on the same day.

The actual report builder was executed with a paid standard-order fixture lacking `o.paidAt`, with one confirmed attempt:

| Field/result | Value |
| --- | --- |
| Attempt started | October 8, 2026, 23:59 Asia/Manila |
| Payment succeeded | October 9, 2026, 00:01 Asia/Manila |
| Report's assigned date | **October 8** |
| Receipts returned by October 9 filter | **0**, expected 1 under the stated payment-date policy |

Revision: select the authoritative first successful payment timestamp, using `paid_at` on the successful payment/attempt record and an explicitly compatible legacy order timestamp. Do not silently substitute attempt initiation time. Keep missing timestamps disclosed and excluded.

Acceptance: payments crossing midnight appear on their successful-payment date; failed/retried attempts cannot shift that date; payment-resolution receipts use the same timestamp policy in their separate projection.

### F4 — Marketing review exists, but automatic generation is only a narrow simulation

**Priority: high for paper acceptance. Subphases: 7.6 and 7.10.**

Paper basis: Chapters 1–3 marketing scope; Chapter 4 Figure 32; ERD PostDraft categories. The paper calls for automatic event-based generation of captions and images, grounded in current operations, followed by owner review.

Evidence: [owner-marketing.js](../app/owner-marketing.js), `M.generate` and `M.update`:

- Generation is invoked through the inspector simulation, without a scheduled/event evaluator.
- Only `product_highlight` and `seasonal_occasion` are generated; `new_product_launch` and `subscription_slots_reminder` have no corresponding generation path.
- Selection uses the first visible available product. Caption context is its name/description and optional occasion, without price, subscription capacity, or demand data.
- Occasion selection checks active status and an end date not in the past. It does not check a defined upcoming window, so a distant future occasion can be selected.
- Image regeneration increments the counter and reassigns the source product image. It does not produce a new image result.

The inspector trigger and lack of a live Gemini call are **declared prototype limits**, not undisclosed external-service failures. However, the prototype still cannot demonstrate the full paper workflow, and a counter increment alone does not demonstrate image regeneration.

Revision now: introduce a deterministic mock event evaluator covering all four categories, with explicit inputs and observable context from live catalog, price, subscription-slot, and relevant sales data. Define occasion relevance and event deduplication. Simulated regeneration should produce a distinguishable result or clearly report that only the request was simulated. Preserve caption edits and failure state.

Production follow-up: connect scheduled evaluation and Gemini caption/image generation to the same contract. Keep AI outside inventory, price-setting, and ordering decisions. Continue manual social posting; do not add automatic publishing or engagement analytics beyond the paper's scope.

Acceptance: each category can be demonstrated independently; stale or irrelevant operational context is rejected/refreshed; regeneration success/failure is observable; reviewed drafts retain reviewer/time/edit metadata.

### F5 — Reports omit several explicitly described analytical views

**Priority: medium. Subphase: 7.11.**

Paper basis: Chapter 4 Figure 31 explicitly describes total sales, **number of orders**, time/day-of-week trends, product performance, and product-level production cost and margin.

Evidence: [owner-reporting.js](../app/owner-reporting.js) exposes revenue, fees, covered revenue, estimated margin, date-by-date bars, product units, and receipt rows. It has no explicit filtered order-count metric or weekday aggregation. Per-product cost is calculated internally, but the product comparison table presents coverage rather than an explicit cost/margin breakdown. Existing [pricing-state.js](../app/pricing-state.js) and the Phase 6 recipe views already provide useful unit-cost calculations; the issue is incomplete report presentation, not a total absence of costing.

Revision: add a defined purchase-order count, weekday revenue/quantity views, and per-product cost plus margin amount/percentage for covered activity. Keep delivery fees, unresolved payments, and uncovered costs separate. Count subscription purchases once for sales and label fulfillment quantities separately.

Acceptance: all metrics reconcile to the same selected period and product scope; order counts are distinct from units and weekly fulfillment rows; zero coverage never implies zero cost or full profit.

The current use of **current recipe costs**, with cake/subscription cost excluded and coverage disclosed, is an honest estimate. Historical actual profitability must not be claimed without an agreed historical costing basis. Likewise, “completed business activity” does not unambiguously settle whether revenue belongs to the payment or fulfillment date; see the paper decisions below.

### F6 — Outbox rows do not yet model the final NotificationLog contract

**Priority: medium. Subphase: 7.12; shared notification dependency.**

Paper basis: Chapter 4 Figure 22 and ERD NotificationLog.

Evidence: [owner-notifications.js](../app/owner-notifications.js), `N.outbox`, projects channel summaries and quotation attempts as recipient/channel/status/time/message/detail. Recipient values are customer references, not an explicit `recipient_account_id`. Rows do not expose a canonical notification type, provider, related entity identity, error message, or successful-send timestamp. Account setup and owner verification actions do not create corresponding log records.

Channel summaries are explicitly labeled as summaries, and quotation attempt IDs are preserved. That is useful and avoids inventing unavailable retry history, but it is not a complete delivery log.

Revision: create or adapt canonical NotificationLog records, mapping customer profiles to accounts and email/SMS to the appropriate provider. Preserve source identity, allowed type, related entity, pending/sent/failed state, nullable error, and `sent_at`. Expose those details in the outbox. Simulated providers can supply this contract before real delivery is implemented.

Acceptance: a failed send identifies its recipient account, related record, provider, and error; successful sends have a send time; account setup and verification sends can be traced. Do not invent retry-scheduling columns absent from the final ERD.

### F7 — System notification records and supported events are incomplete

**Priority: medium. Subphase: 7.12; shared operational dependencies.**

Paper basis: ERD SystemNotification and Chapter 4 Figure 22 require a role-scoped event, supported related entity, and shared acknowledgement metadata.

Evidence: [staff-state.js](../app/staff-state.js), `S.emit`, handles new orders, low stock, and subscription deferment. [owner-notifications.js](../app/owner-notifications.js) adds projected draft-ready and quotation-send-failure items. Source search did not identify `payment_received` or `custom_cake_submitted` event implementations. For draft/quotation projections, acknowledgement is stored only in a separate Set, without a source notification's `is_read`/`read_at`. The feed does not filter source records by recipient role. [owner-cake-state.js](../app/owner-cake-state.js) also uses `related_entity_type: 'quotation'`, which is outside the final SystemNotification enum.

Revision: normalize these sources into SystemNotification records, implement the missing supported business triggers, apply recipient-role filtering, and persist the shared read flag/time on the notification. Link quotation delivery failures through a supported notification-log or custom-cake-request reference. This last issue is inherited from the earlier cake workflow but affects Phase 7's integrated output.

Acceptance: each supported event has a valid source identity and role; duplicate event processing does not duplicate alerts; one authorized acknowledgement marks the shared record read with a timestamp. Separate per-user read histories are not required by this ERD.

### F8 — Several definition and feedback objects lack explicit ERD mapping/metadata

**Priority: medium. Subphases: 7.1–7.6 and 7.9.**

Paper basis: ERD Category, Product, ProductVariant, Inventory, CakeOption, CakeAddon, SeasonalOccasion, CustomerFeedback, and FeedbackImage.

Evidence: [catalog-state.js](../app/catalog-state.js) saves categories/products/ingredients/cake definitions without the full creation/update metadata. Cake definitions omit creator identity. [owner-marketing.js](../app/owner-marketing.js), `M.occasion`, retains timestamps but omits `created_by_admin_id`. Product variants use `active/inactive`, whereas the ERD specifies **`available/unavailable`**. [owner-feedback.js](../app/owner-feedback.js) uses an order-plus-item composite key and image strings instead of explicit OrderItem/FeedbackImage records, and does not set initial `updated_at` on submission.

Revision: define an explicit adapter or canonical preview objects. Preserve valid product/variant identities, map status enums deliberately, set creation/update times, and capture creator admin IDs where required. Map feedback keys to unique purchased-item identities and images to feedback-owned entries with metadata.

Acceptance: a representative create/edit operation for each affected entity can be mapped to the final ERD without inventing its owner, identity, status, or timestamps. Editing a record retains its original creator and creation time. Aliases and composite keys are acceptable only with a documented unambiguous mapping; they are not automatically relational-integrity failures.

### F9 — Account setup and owner credential changes lack complete verification/audit state

**Priority: medium. Subphases: 7.7 and 7.12.**

Paper basis: Chapter 4 Figure 23; ERD Account, StaffProfile, AccountVerification, and NotificationLog.

Evidence: [owner-accounts.js](../app/owner-accounts.js) correctly gates staff operations until setup and checks the current password for owner security changes. However, provisioning/setup does not create a linked account-setup verification/log record. Owner profile saves omit `updated_at`; password saves omit `password_changed_at`; successful email verification changes the email then discards temporary verification state without retaining `verified_at` or updating account verification metadata. Temporary verification state is not a canonical AccountVerification record.

Revision: preserve Account/Profile identity mapping, staff creator/setup state, successful account-change timestamps, and verification records with purpose, target, expiry, attempts, and completion time. Record applicable simulated sends through the same outbox contract. Do not invent a new delivery mechanism as a paper requirement; specify how the paper's account-setup records relate to the temporary-password flow.

Acceptance: creating/resetting staff and completing owner email verification leave traceable records; successful password changes update password metadata; expired/incorrect verification never updates the account. Real password hashing, OTP storage, provider delivery, and authorization must ultimately execute server-side.

## Behavior worth preserving

- Shared owner shell, navigation, headings, cards, form helpers, and existing header/footer styling maintain the requested visual consistency. The paper does not prescribe a new owner-only visual system.
- Owner commands check the owner session; customer inspection does not impersonate the selected customer. Financial, pricing, and marketing controls remain distinct from staff operational views at prototype level.
- Recipes remain single-level raw-material mappings. Cost suggestions do not silently overwrite the owner's final selling price. New variant definitions do not inherit unrelated recipes.
- Ingredient definition edits do not directly rewrite stock balances. Existing requirements, reservations, and physical movement records remain separate concepts, consistent with Figure 20 and the final ERD.
- Feedback is tied to completed purchased items, with duplicate prevention and a two-photo limit. Moderation preserves customer content and uses the supplied reason enum.
- Subscription purchase receipts are separated from weekly fulfillment rows, avoiding repeated sales recognition. Delivery fees and unsupported cost coverage are disclosed.
- Marketing approval does not publish to social platforms. Manual moderation, manual cake complexity judgment, and no discount/voucher workflow remain consistent with the declared scope.

## Paper ambiguities and decisions to resolve

These are specification decisions, not proven application defects. Do not silently resolve them by adding unsupported behavior.

| Topic | Difference or uncertainty | Recommended decision |
| --- | --- | --- |
| Revenue timing | Figure 31 refers to completed business activity; the implementation explicitly uses successful payment date. | Confirm paid-date sales versus completed-fulfillment sales, name the metric accordingly, and define treatment of unresolved payments. F3 remains a defect under the currently stated paid-date policy. |
| Notification retries | Chapter 4 notification prose mentions recipient-type/retry information; the final NotificationLog table has account identity and send state but no retry-scheduling fields. | Use the final ERD contract for this review; reconcile the prose before adding retry entities/columns. |
| Cake size scaling | CakeOption has nullable `scale_factor`, without a complete formula establishing how it combines with explicit ingredient quantities. | Document whether quantities are already size-specific. Do not multiply them again without an agreed rule. |
| “Other” moderation reason | Figure 30 prose allows another specified reason; the final ERD supplies `other` but no separate explanation field. | Either clarify that enum selection is sufficient or approve an ERD change for explanatory text. |
| Subscription capacity | Chapter 3's weekly-capacity wording differs from later allocation/four-delivery commitments. | Reconcile the paper; retain the explicit later ERD allocation model rather than treating existing four-cycle commitments as a Phase 7 defect. |
| Figure 29 actor label | The right-side operational actor in the diagram is labeled Admin/Owner terminology, while accompanying prose describes staff stock/recipe access. | Correct or clarify the diagram label; preserve the prose's owner-versus-staff permission distinction. |

## Production gaps tracked separately

The existing [implementation record](phase-7-implementation.md) declares an in-memory browser prototype. It does not implement the paper's production stack, persistent relational constraints, authenticated server authorization, durable file hosting, real notification providers, or scheduled Gemini generation.

Those are required before claiming the deployed system fulfills the paper, but this review does not reclassify every simulated action as a UI defect. Prototype revisions should first establish correct behavior and ERD-compatible contracts. Production work must then enforce those contracts on the server, persist them, connect providers, and verify permissions and failure handling against real services.

## Recommended revision sequence

1. Fix F1–F3: displayed price, real review summaries, and successful-payment date. Add focused checks for the exact counterexamples in this report.
2. Complete F4–F5: all marketing event paths and missing reporting views, using deterministic mock inputs where external services are deferred.
3. Normalize F6–F9: notification entities, role/read state, definition metadata, and account verification/audit records. Preserve existing application state authorities and shared components.
4. Resolve the paper decisions, then update the implementation record to distinguish implemented workflows, remaining prototype limitations, and production work.
5. Re-run the affected browser/regression checks after fixes. Acceptance should demonstrate each paper requirement, not merely that every route opens.

**Review outcome:** retain the integrated design and core owner workflows, revise the identified correctness and contract gaps, and withhold a full paper-alignment sign-off until those revisions and specification decisions are complete.
