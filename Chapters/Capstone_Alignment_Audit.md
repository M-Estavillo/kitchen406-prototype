# Kitchen406 Academic Prototype Alignment Audit

Revised: 9 November 2026. This report supersedes the production-oriented assessment. Original issue IDs A01-A27 are preserved. Only this report was updated; website code, paper, ERD and verification scripts were not changed.

## 1. Executive Summary

**Kitchen406 substantially demonstrates the proposed system as an academic functional prototype, but several business rules and documentation details still disagree.** HTML/CSS/JavaScript, in-memory records, mock accounts, simulated services, sample marketing content and local images are acceptable under the clarified scope. They do not reduce functional alignment or require production infrastructure.

The main journeys are recognizable and interconnected: catalog/cart, scheduled checkout, simulated payment confirmation, four-fulfillment subscriptions, cake configuration/versioned quotations, material reservation versus consumption, production transitions, ready-only courier booking, owner pricing/reporting, feedback moderation and owner-reviewed marketing. Combined JavaScript objects are acceptable ERD representations when they preserve intended relationships.

Remaining important issues concern behavior:

- Deferment searches beyond two permitted dates, uses the wrong deadline and incorrectly mentions owner approval (A06-A07).
- Late simulated payment can activate expired purchases after allocations were released (A04).
- Later subscription stock reservations follow the next unprepared order rather than each fulfillment's documented due date (A09).
- Weekly fulfillments are separately reviewable; website/ERD allow two photos instead of three (A10).
- Cancelled paid purchases enter sales analytics; cost/margin and some described report views are absent (A17).
- Owner account management and some marketing event/failure demonstrations remain incomplete (A24, A26).

The ERD broadly supports the system, with genuine gaps in cake images, enrollment feedback semantics, historical quotation/schedule information and marketing event identity. Pickup, cake windows and ambiguous policies need agreement across sources.

**Verdict:** a credible, substantially aligned academic prototype with specific corrections needed before claiming complete functional alignment. Missing backend/database/provider infrastructure is not a critical defect under this scope.

## 2. Prototype Scope and Evaluation Assumptions

The user's clarification governs this reassessment. Provider-named requirements are evaluated through simulated interactions and outcomes, not real connections.

| Accepted simplification | Evaluation rule |
| --- | --- |
| HTML/CSS/JavaScript instead of proposed stack | Evaluate navigation/data/behavior; stack difference informational. |
| Objects/arrays/Maps instead of SQL/Prisma | Check ownership, associations, snapshots, quantities and transitions; one object need not equal one table. |
| Mock login/OTP/demo role selection | Check ordinary customer/staff/owner actions; no real hashing/server-session requirement. |
| Simulated QR confirmation | Accept explicit simulation; confirmation precedes production eligibility and does not skip fulfillment. |
| Sample courier fees/tracking/status | Accept substitute results; preserve paid/ready/type/role gates. |
| Hardcoded marketing captions/images/regeneration | Accept output substitute; preserve drafts, owner review and manual publication. |
| Local previews/sample photos | Storage integration unnecessary; image count, association and review eligibility still matter. |
| Fixed clock/manual scheduled trigger | Accept controlled scenarios applying correct date/event rules; no always-running worker required. |
| No durable/shared multi-client service | Reload loss/absent SQL constraints are limitations, not prototype defects. |

Excluded from scoring: production hosting, real transfers/APIs/webhooks/secrets, adaptive hashing, backend authorization, SQL migrations/indexes/locks, distributed concurrency guarantees, commercial invoices/legal certification, monitoring and uptime. Recommendations do not require these.

A mock is not automatically correct: a confirmation button may replace verification, but a released purchase must still obey its late-payment rule. A time-advance button may replace a worker, but reserving on the wrong date remains a mismatch.

### Method and references

**P** = `Chapters/Kitchen406 - Capstone Paper.md`; **E** = `Chapters/ERD.md`. References use physical lines. SRS UI figure numbers refer to the appendix, not Chapter 4 diagrams. All 27 findings were reconsidered; relevant paper requirements, complete readable ERD and executable paths were rechecked, including wrappers in `phase4-integration.js`, `staff-integration.js` and `checkout-holds.js`. Matrix code paths are relative to `app/` unless otherwise stated.

Statuses: **Aligned** = supports intended prototype behavior; **Partial** = substantial workflow with a specified gap; **Contradiction** = conflicts with an explicit rule; **Clarification** = sources do not give a consistent decision. Positive static findings do not mean every interaction was executed. Historical screenshots/design HTML do not establish current behavior.

### Fresh verification

Checks used Node v24.20.0 and temporary VM memory. No application/test files or records were saved.

| Check | Result | Meaning |
| --- | --- | --- |
| Inline subscription VM | No active enrollment/orders before confirmation; four held allocations; detected remains unpaid; confirmation creates four linked weekly orders; repeat confirmation no duplicates | Positive runtime evidence for simulated model. |
| Inline courier VM | Rejects unpaid/not-ready/non-owner booking; owner books paid ready order with sample ID; transit leaves order ready; delivered completes it | Mock courier progression aligned; no Lalamove required. |
| Inline marketing VM | Pending draft; non-owner approval rejected; owner approval permitted; same event deduplicated after approval | Core owner review works with sample content. |
| Inline edge-case reproductions | Ten-minute session; prohibited later-week deferment; cancelled paid sale included; incomplete draft can be approved | Confirmed discrepancies, not successful requirement tests. Incomplete draft was deliberately supplied through state API, not ordinary UI generation. |
| Separate late-payment VM | Expiry releases allocations; late confirmation with free capacity creates active enrollment | Confirms A04 in isolated logic; integrated wrappers inspected. Not every browser late-event path executed. |
| `node verification/phase4-state.cjs` | All 32 checks passed | Selected account/address/cake state behaviors; also accepts five-day cake lead/no window. Passing tests do not alone establish paper alignment. |
| `node verification/subscription-state.cjs` | Nine checks passed; fails at line 18 on obsolete `reviewRequest(...) === ''` expectation | Test drift; same test expects prohibited later-week search. Later tests not reached. |
| `node verification/phase7-state.cjs` | Cannot start: line 4 references absent `app/owner-reporting.js` | Stale reporting test evidence; active analytics page does exist. |

Focused harness had 15 assertions plus separate late-payment reproduction; some intentionally confirmed defects. Do not call these 16 requirement passes. No fresh browser/visual/keyboard suite was run; navigation findings are static route/handler traces. Previous syntax checks are historical, not newly executed here. Embedded paper diagram pixels were not checked; model findings use readable E and P explanations.

## 3. Core Feature Alignment Matrix

| Feature | Paper reference | ERD representation | Website implementation | Status | Findings |
| --- | --- | --- | --- | --- | --- |
| Three role workspaces | Scope P:284,298; P:1714-1719 | Account.role/profiles E:5-8 | `session-state.js:4-11`; `staff-state.js:4-16`; `owner.js:16` | Aligned | Normal screen/action gates demonstrate roles; mock context accepted. A01-A02. |
| Registration/login/OTP/recovery | FR-AUTH-01-07 | Account/Verification E:5,9 | `auth.js:126-178`; `account-state.js:12-56` | Aligned simulation | Demo codes/identity activation/reset accepted; no production authentication penalty. |
| Profile/own history/addresses | FR-PROF-01-04; FR-ADDR-01-05 | Customer/Address/transaction links | `account-state.js:8-22,60-81`; `address-state.js:5-23`; `account.js` | Aligned | Buckets, ownership, labels/default/archive and saved snapshots; Phase 4 switching checks pass. |
| Owner accounts | FR-STAFF-01-05; UI P:2145-2157 | Staff creator/setup; CustomerProfile | `owner-accounts.js:9-40,57-88` | Partial | Create/status/creator exist; existing editing blocked, customer route redirects, setup skipped. A26. |
| Service area/fee | FR-DEL-03-07 | Address/Delivery | `delivery-route.js:3-54`; `maps-config.js:4-7`; `product-data.js:9` | Aligned simulation / Clarification | Sample PHP100 quote fine; Liloan origin/10 km vs Banilad display needs agreement. A15. |
| Catalog/variants/eligibility | FR-CAT-01-05 | Category/Product/Variant E:11-13 | `catalog.js`; `product.js`; `owner-products.js:119-200` | Aligned | Local catalog/editor/variant workflow sufficient. |
| Cart/mixed order/shared date | FR-CART-01-05; P:286 | Cart/items/order E:17-21 | `commerce-state.js:25-53`; `checkout.js:9-38`; `scheduling.js:18-31` | Aligned with batch gap | Multiple items/subtotals/shared date/one fee/pickup free; owner batch linkage A16. |
| Order ownership/items/history | FR-ORD-01-06 | Order/items/history | `commerce-state.js:43-65`; `phase4-integration.js:10-12`; `staff-integration.js:14-17` | Aligned | Combined objects preserve relationships. Pending creation before payment sensible; wording A21. |
| Payment confirmation/production | FR-PAY-01-05; FR-FUL-01 | Payment/Hold/Order | `orders.js:63-70`; `commerce-state.js:55-65`; `staff-state.js:11` | Aligned simulation | Waiting/detected unpaid; confirmation enables production, not completion. |
| Session/hold/expiry | FR-PAY-06-08 P:2522-2524 | Payment distinct from Hold | `commerce-state.js:51`; `subscription-state.js:29,34`; `checkout-holds.js:6-13` | Partial / Contradiction | Common 10-minute deadline vs30/32 phases A03; late reactivation after release A04. |
| Four prepaid weekly fulfillments | FR-SUB-01-04; BR-11-12 | Subscription purchase +four delivery/order links | `subscription-state.js:13,27-50`; `staff-integration.js:57-71` | Aligned | Four linked children, repeat-safe confirmation, no auto-renewal; runtime confirmed. |
| Fixed address/prepaid fees/pickup | BR-31-32; P:292,1870,1882 | Subscription.address_id required E:29 | `subscription-state.js:22-25,43-49` | Aligned delivery / Clarification | Snapshots/four sample fees valid; pickup supported by code/some paper UI but not all prose/E. A05. |
| Deferment allowance/history/apply | FR-SUB-05-10 | Deferment/allocation E:31 | `subscription-state.js:79-97`; `capacity-state.js:3-10` | Mostly aligned | One success, four deliveries, original/replacement history, automatic apply; approval text wrong. A07. |
| Deferment dates/deadline | FR-SUB-11-12; OR-POL-12 | Preparation schedule/original-new dates | `subscription-state.js:53-75`; `staff-integration.js:46` | Contradiction | Later-week search and fulfillment cutoff violate policy. A06-A07. |
| Capacity pools/blocks | FR-CAP-01-18; BR-07-10 | Config/Allocation/BlockedDate E:25-27 | `scheduling.js:4,18-40`; `cake-data.js:13`; `capacity-state.js:7-30` | Aligned concept | Separate pools/local aggregates/holds/blocks; derived allocations valid. |
| Cutoffs/lead/batch settings | FR-CAP-19-21 P:2565-2567; P:286 | Config/Schedule E:25,28 | `scheduling.js:4,10-16`; `cake-data.js:13`; `capacity-state.js:19-30` | Contradiction / Clarification | Noon vs4 PM, seven vsfive days, enrollment not preparation-based. Fixed clock accepted. A08,A16. |
| Cake configuration/estimate/images | FR-CAKE-01-04; P:290,718 | Option/add-on joins; single request URL | `cake-state.js:12-16,40-71`; `cake-builder.js:31-35,79-92` | Aligned website / ERD gap | Five options/add-ons/estimate/1-3 local references; E missing collection A11. |
| Quote/revision/acceptance | FR-CAKE-05-09 | Request ->versions ->accepted quote ->item | `owner-cake-state.js:6-26`; `cake-state.js:103-116` | Aligned core | Owner offers, history, accept/decline, pending payment, subjective charge; QA fixtures accepted A23. |
| Historical design/staff copy | FR-CAKE-07; FR-FUL-06; P:2079,2103 | Quote/schedule historical information missing | `owner-cake-state.js:17-24`; `production-reference.js:5-18`; `subscription-state.js:25` | Aligned website / ERD gap | Snapshots valid; E should express retained information A12. |
| Cake time windows | UI P:1929,2073 | Required window E:35,41 | `cake-state.js:69,86`; `owner-cake-state.js:8-24` | Clarification | P/E retain field, current workflow/test omit A13. |
| BoM/materials/movements | FR-INV-01-20; FR-BOM-01-14 | BOM/requirement/reservation/movement | `inventory-state.js:11-99`; `staff-integration.js:17-42`; `fulfillment-state.js:4-17` | Aligned core | Projected/reserved/physical distinction; preparing consumes; restock/adjust/reasons/history. SQL irrelevant. |
| Later subscription reservations | FR-INV-21-23 | Requirement.reserve_at E:32 | `staff-integration.js:47-55,73-75`; `fulfillment-state.js:15` | Contradiction | Next-unprepared rather than own preparation-minus-one due date A09. |
| Low stock/availability | FR-INV-10-12 | Inventory/recipe links | `staff-state.js:9-10`; `staff-integration.js:5-6,76` | Aligned | Stock-minus-reservations, alerts and affected availability connect. |
| Pricing/costing | FR-PRICE-01-16; BR-16-18 | Config/BOM/cost/variant prices | `pricing-state.js:6-28`; `owner-inventory.js` | Aligned calculation / report gap | Materials+packaging+overhead, markup, margin, owner final-price authority; analytics costs A17. |
| Staff production/calendar/recipes | FR-FUL-01-15; BR-24 | Order/material/quote/history | `staff-state.js:11-15`; `staff-ui.js`; `fulfillment-state.js:4-17` | Aligned | Paid queue, permitted transitions, preparation consumption, restricted projections. |
| Courier/manual cake fulfillment | FR-DEL-01,08-16; BR-19-20 | Delivery separate from production | `delivery-state.js:5-18`; `fulfillment-state.js:10` | Aligned simulation | Runtime paid/ready/owner/progression gates; cakes/pickup excluded. A15 API criticism withdrawn. |
| Notifications/reminders/failure | FR-NOTIF-01-15 | Log/SystemNotification E:44-45 | `notification-state.js:4-9`; `phase4-integration.js:10-17`; `owner-cake-state.js:5` | Aligned core / Partial scenarios | Recipient/channel/event and manual failure/retry; timed retry/reminder cases incomplete A14. Shared-read meaning A19. |
| Reviews/moderation | FR-REV-01-14; BR-21-23 | Feedback.item/images E:46-47 | `orders.js:43,75-78`; `product.js:78-115`; `owner-reviews.js:5-60` | Partial / Contradiction | Standard moderation works; enrollment gate absent, two images, cake placeholder A10. Sample photos fine. |
| Analytics | FR-ANL-01-16; P:2187-2193 | Paid purchase/items/cost data | `owner-analytics.js:12-38,50-56`; `owner.js:16` | Partial / Contradiction | Parent once/children excluded; cancelled paid included; cost/weekday/detail views absent A17. |
| Marketing review/publication | FR-AI-01-02,09,11-21 | PostDraft E:42 | `marketing-state.js:5-8,22`; `owner-marketing.js:7-21,29-56` | Aligned simulation | Sample draft/edit/regenerate/owner approval-reject/manual copy-download; no Gemini needed. |
| Marketing triggers/recovery | FR-AI-03-08,10,22 | Draft/Occasion; missing event state | `marketing-state.js:13-23`; `owner-marketing.js:25,44-56` | Partial | Product/slot events/manual highlight; no qualifying seasonal/initial partial recovery; local dedup works A24. |
| Policies/support/print | OR-POL; OR-PRIV-02,05; P:1852 | Order/history; forfeiture unclear | `shell.js:5`; `app.js:101-103`; `orders.js:48,72-73` | Partial | Terms/support placeholders; print-demo fine; explain rules, not prove legal readiness A25. |
| Scope exclusions | P:302-332 | No excluded modules needed | Commerce/subscription/marketing modules | Aligned | No need for vouchers/auto-renewal/auto-post/hardware/nested BoM/live rider/refund processing. |

## 4. Genuine Functional Contradictions

These survive prototype reassessment and can be corrected in local state. High/Medium refer to functional impact; production-only Critical labels are withdrawn.

### A04 - High - Late simulated payment reactivates a released purchase

**Expected:** FR-PAY-07 (P:2523), P:526/804: after expiry/release the purchase remains cancelled; late success is recorded for owner resolution rather than fulfillment.

**Actual:** `app/subscription-state.js:35-49` accepts confirmed after expired, calls `D.reserve` again and creates an active enrollment when capacity is free. `staff-integration.js:57-67` adds no irreversible release gate. Standard/cake confirmation also rechecks availability/reserves (`staff-integration.js:18-24`, `cake-state.js:129-142`). Fresh isolated execution reproduced expired ->zero allocations ->late confirmation ->active subscription.

**Affected:** paper policy, ERD hold/order/allocation meaning, website. **Correction:** distinguish a permitted new retry from a late event for a released attempt. Retain cancellation and show simulated owner-resolution/refund eligibility for late success. No refund integration required. Not every late-event variant was executed through normal UI; the domain transition itself is confirmed.

### A06 - High - Deferment chooses prohibited later dates

**Expected:** FR-SUB-12 (P:2460), scope P:292: affected date+1 day or final scheduled fulfillment+7 days, no further search.

**Actual:** `app/subscription-state.js:53-59` starts at affected date+7, handles collisions then searches up to 26 weeks. Four dates ending 6 November 2026 with permitted 13 November blocked return 20 November. `verification/subscription-state.cjs:18` explicitly expects that prohibited search.

**Affected:** all three sources. **Correction:** calculate exactly two candidates, validate each independently, refuse if neither eligible, preserve schedule/allowance on refusal. Retain four fulfillments and existing original/replacement allocation history.

### A07 - High - Deferment deadline/message conflict with automatic policy

**Expected:** FR-SUB-09/11 (P:2457,2459): before preparation day begins, then automatic apply after customer confirmation; no owner approval.

**Actual:** `app/subscription-state.js:67-75` uses fulfillment-based `D.cutoff`, though saved preparation-date helper exists at `staff-integration.js:46`. `app/subscriptions.js:128` says owner approval required, but `B.defer/applyDefer` applies immediately and `reviewRequest` is read-only.

**Affected:** paper/customer journey/ERD schedule semantics. **Correction:** compare with saved preparation-day midnight in Manila and correct confirmation text; retain automatic apply. Check before/at deadline and rejection without allowance consumption.

### A08 - High for business dates; demo clock acceptable - Lead/cutoff baselines differ

**Expected:** FR-CAP-19-21 (P:2565-2567): standard noon at least day before; enrollment noon before first preparation; cake request at least seven days before fulfillment.

**Actual:** `app/scheduling.js:4,10-16` defaults two days/4 PM; `cake-data.js:13` defaults five days/4 PM. Subscription validation is fulfillment-based. `capacity-state.js:19-27` accepts zero lead/later cutoffs, while paper also calls rules configurable.

**Correction:** use the agreed documented baseline and preparation-based enrollment. Clarify hard minima versus owner-overridable defaults before restricting configuration. A frozen October clock is an acceptable fixture; declare demonstration time and explain differing reporting/payment timestamps. Replacing it with production scheduling infrastructure is unnecessary.

### A09 - High - Later stock reservations follow the wrong date dependency

**Expected:** FR-INV-21-23 (P:2614-2616): each later fulfillment reserves one day before its own preparation; shortages alert/retry after replenishment.

**Actual:** `app/staff-integration.js:47-55` immediately reserves next unprepared/confirmed order, releases other confirmed reservations and derives later reserve dates from the preceding preparation. Triggered by stock/production updates (`:73-75`, `fulfillment-state.js:15`), not each fulfillment's due date.

**Affected:** paper, E OrderMaterialRequirement.reserve_at, stock allocation. **Correction:** calculate each own preparation-minus-one date and process due requirements through simulated clock advance or manual due-processing action. Preserve snapshots/valid reservations. No background service required.

### A10 - High eligibility; Medium image count - Reviews use wrong subscription unit

**Expected:** BR-21 (P:3076), scope P:288, FR-REV-06 (P:2830): standard completed purchased item; one enrollment review only after all four fulfillments; three optional photos.

**Actual:** `app/orders.js:43,75-78` and `owner-reviews.js:5-9` use individual completed order/item without parent all-four gate. `product.js:4,81,97` allows two sample photos; E:47 also says two. Cake review opens later-phase notice (`orders.js:77`).

**Affected:** all three. **Correction:** enrollment completion and one enrollment feedback identity; three slots using samples if desired; clarify cake feedback coverage. Actual file upload/Cloudinary criticism is withdrawn. Wrong eligibility/count is not excused by simulation.

### A16 - Medium - Standard batch dates and owner schedule edits disconnected

**Expected:** scope P:286/Figure 19 prose P:700: one-time batch products obey configured batch/preparation schedule.

**Actual:** `app/scheduling.js:10-16` reads global batches/productRules; owner schedule editor `capacity-state.js:28` changes B.schedules. No traced linkage makes these edits govern standard batches. E:25/28 does not clearly explain separate governing schedules.

**Correction:** agree the source of batch dates, connect local configuration and validator or explicitly expose separate standard batch settings. No production optimizer/new module implied.

### A17 - High totals; Medium missing views - Sales reporting contract incomplete

**Expected:** FR-ANL-05 (P:2864) excludes cancelled/unpaid/failed/refunded sales; FR-ANL-09/12-14 and FR-PRICE-15 include weekday patterns and estimated cost/margin.

**Actual:** `app/owner-analytics.js:12-19` filters paid and non-fulfillment type only; fresh execution included paid cancelled sale. Payment-resolution receipts also pass, requiring separate definition of revenue eligibility. Active page (`:50-56`, route `owner.js:16`) has sales/trend/mix/top products, not cost/margin/coverage/weekday/product-detail reports. Cost calculations already exist in pricing-state.js.

**Correction:** explicitly filter ineligible sales, keep parent purchase once, show available sample estimated cost/margin and explain basis. Weekday/detail views are specific demonstration gaps, not total absence of analytics. External refund outcome is A20 clarification.

### A24 - Medium - Marketing event/failure scenarios incomplete

**Expected:** FR-AI-03-10/22 (P:2903-2910,2922): four qualifying categories, scheduled evaluation, partial-output recovery, no incomplete approval and event deduplication.

**Already aligned:** `app/marketing-state.js:5-8,22` creates pending records, deduplicates and guards owner finalize. `owner-marketing.js` supports editing/regeneration/review/manual copy/download with no automatic publication. Sample output is valid; Gemini absence is not a defect.

**Remaining:** `marketing-state.js:13-23` implements product/slot events/manual weekly highlight, but leaves seasonal context to scenarios with no qualifying seasonal path. `owner-marketing.js:25,44-56` has regeneration failure but not initial independent caption/image failure recovery. `M.finalize` lacks completeness guard: deliberately clearing image in fresh state test still allowed approval. This is an unguarded failure scenario, not a claim ordinary drafts currently arrive imageless. Availability warning does not cover all changed pricing/context described at P:2181.

**Correction:** retain templates; demonstrate qualifying occasion, partial failure, retained successful component, retry and blocked incomplete approval. Manual time/weekly trigger acceptable. Align current-context approval behavior with the retained paper description. No Gemini/worker/model-quality proof required.

### A26 - High management journey; Medium setup - Owner accounts incomplete

**Expected:** FR-STAFF-02/UI Figures 64-66 (P:2145-2157): edit/deactivate staff, first-password setup before operations, read-only customer views.

**Actual:** `app/owner-accounts.js:31` creates setup=true; `:57-60` redirects customers to staff; existing staff detail exposes status only and edit handler returns for existing IDs (`:77-88`). M.save update branch and M.customerData helper exist but are not usable journeys.

**Correction:** connect local editing/customer views and demonstrate first-password gate if retained. This concerns visible setup, not real credential provisioning/security.

### A25/A27 - Lower-priority presentation gaps

**A25:** OR-POL specifies accessible policies before commitment. `app/shell.js:5` links Terms, but `app/app.js:103` shows placeholder; `orders.js:72-73` has placeholder contact and print-demo summary. Show concise transaction/deferment/manual-resolution policy and simulated owner handoff. Legal compliance, actual communication, breach procedures and commercial invoices are excluded. Clarify forfeiture/history before adding states or dispute systems.

**A27:** UI P:1780,2163,2175 promises review distribution/dates, moderation date filtering and marketing search; `app/owner-reviews.js:11-14,23-28`, `owner-marketing.js:11-15` omit them (search explicitly). Implement agreed controls or revise over-specific UI prose. These do not invalidate core moderation/review.

## 5. ERD and Paper Inconsistencies

The ERD is a logical model, not executable DDL. Existing keys/cardinalities/prose invariants are legitimate design constraints without SQL implementation. Different field names, composite keys, computed totals or combined objects are not automatically mismatches.

### Broad logical correspondence

| ERD domain | Prototype mapping | Assessment |
| --- | --- | --- |
| Accounts/profiles/verification/addresses | account-state, session-state, staff-state, address-state objects | Identity/role/ownership recognizable; mock codes accepted; normalized runtime profile tables unnecessary. |
| Catalog/pricing/inventory/BoM | Product arrays, product+variant composite keys, recipe/cost maps | Conceptually aligned. Standard variant IDs are product-scoped; do not mistake a reused label for broken global identity. Suggested price can be computed. |
| Cart/orders/items/history/payments/holds | Line arrays, embedded attempts, hold/history Maps | Largely aligned. `operations-state.js:11-17` and `staff-integration.js:16` map purchase/fulfillment types. Nested attempts can represent Payment. |
| Delivery/capacity/blocks | order.delivery, arrays/derived allocations, configuration/block Maps | Synthetic tracking and local aggregates valid; active-booking guard demonstrates intended constraint. |
| Subscriptions/deferments | Parent purchase/enrollment, four linked children, allocation history | Strong concept mapping; specific date/eligibility/pickup exceptions remain. |
| Requirements/reservations/movements | Ingredient/order rows and Maps with actor/operation IDs | Planned/reserved/physical distinction preserved. IH-* versus checkout_hold_id versus E hold_id needs a mapping explanation, not identical internal IDs. |
| Cake requests/options/add-ons/quotes | Nested ingredient/selection collections and versioned snapshots | Joins preserved; E multiple-image/history omissions genuine. |
| Marketing/notifications/feedback | Event-keyed drafts, occasion arrays, grouped channels, alerts and item feedback keys | Core concepts represented; review eligibility, event and retry meanings need clarification in E. |

### Retained logical/documentation issues

**A11 - Cake images/entity count:** P:718 explicitly describes 1-3 CakeRequestImage children; P:638 says 44 entities. E has 43 rows (E:5-47) and one request img_url (E:35). Code supports three images (`cake-state.js:6,69`, `cake-builder.js:31-35`). Revise E with child collection (preferably CakeRequestImage) or explicit multi-image attribute; then reconcile count/embedded figures. No Cloudinary needed.

**A10 - Feedback model:** E:47 max two versus P:288/2830/3227 three. E:46 references OrderItem only. It could support enrollment review through a designated subscription-purchase item, but identity/all-four gate is unspecified; adding a Subscription FK is not automatically mandatory. State chosen enrollment identity, eligibility and uniqueness, then align code. P per-order wording versus P:842/3076 per-item/enrollment also needs reconciliation.

**A12 - Historical information:** E:41 quote has financial/version/fulfillment fields but not agreed design/material/instruction snapshot or approved staff copy described at P:2079/FR-FUL-06. E:29 links mutable schedule without saved preparation rules despite P:2103 commitment retention. Code already snapshots these (`owner-cake-state.js:17-24`, `production-reference.js:5-18`, `subscription-state.js:25`). Revise E with snapshot attributes or immutable-version relationships; no physical DB required.

**A14 - Retry information:** P:730/FR-NOTIF-13,15 describes retry/attempt history; E:44 only status/error/sent_at. If claiming retry behavior, model count/due state or attempt relationship. P:730 mentions recipient_type absent in E: correct prose or justify field rather than add blindly. Grouped logical events/per-channel attempts remain valid prototype structures.

**A16 - Batch source:** E SubscriptionSchedule versus CapacityConfig does not explain how product batches constrain standard purchases (P:286,700). State the governing relationship/rule instead of assuming subscription schedule editing controls both.

**A18 - Conceptual invariants only:** retain useful definitions of matching customer ownership across address/order/subscription/request, compatible role/profile, one active default, appropriate cake option type, accepted quote belonging to request, four cycles, one successful deferment and eligible feedback uniqueness. E already states many constraints: credit them. Withdraw demands for SQL CHECKs/indexes/locks/migrations. Only missing/ambiguous logical rules need documentation; individually valid FKs alone do not describe same-customer ownership.

**A24 - Marketing state:** P:728/FR-AI-22 and `marketing-state.js:5-8` identify category+event uniqueness; E:42 lacks event identifier. FR-AI-10 requires incomplete/failed-component recovery; E review status alone does not describe generation completeness. Add trigger identity and generation state distinct from owner review, with independent caption/image availability. No provider-specific metadata required.

**A21 - Internal paper wording:** P:236 says existing payment after delivery, but P:570/582 before production. P:2409 creates order after payment, while P:2506-2510/E hold need pending purchase first. P:288 differs from P:842/3076 on review unit. Confirm existing practices; distinguish pending purchase/confirmed order; use consistent feedback terminology. Creating pending records before payment is not a website defect.

**A05/A13/A19/A20** remain team decisions below, not automatic code errors.

## 6. Acceptable Prototype Simplifications

The following original criticisms are withdrawn as functional defects:

- **A01:** no Next.js/React/TypeScript, backend, PostgreSQL, Prisma, migrations, durable shared service or hosting. Local modules/stores can demonstrate the system; a short proposed-stack versus prototype note suffices.
- **A02:** demo sign-in, fixed OTP, browser state, owner/staff mock entry, SHA-256 mock credential handling and no server authorization. Do not require production security. Normal role-specific workflows were evaluated separately.
- **A03/A15:** no actual transfer/webhook/live courier ID or quote. Sample PHP100 fee, four prepaid sample fees and manually advanced courier states are valid. Fresh checks show correct booking/progression gates.
- **A11:** local image previews/sample photos instead of Cloudinary. Counts/associations matter, durable upload does not.
- **A14:** local channel status and failed/manual retry records instead of real email/SMS. No always-running service required. Missing scenarios should be described as limited demonstration coverage, not missing real integration.
- **A24:** template captions/product assets/preview SVG instead of Gemini. Core owner review is implemented and deserves credit. No proof of model quality/live AI acceptance rate required for this reassessment.
- **A18:** logical constraints need not be enforced by SQL in this prototype. Local checks and model/prose invariants are acceptable.
- **A23:** explicit Mock Controls may create owner-result fixtures while setting up a customer scenario. `phase4-integration.js` exposes QA actions in its inspector; legacy `K.issue` is a scenario helper. Ordinary `owner-cake-state.js:8-26` checks owner context. Do not equate fixture controls with customer permissions. Explain scenario setup during defense and demonstrate issuance through owner workspace; removing all controls is unnecessary.
- **A25:** legal certification, operational incident processes, tax-compliant invoices and actual support communication are outside scope. Print-demo summary is acceptable as labelled. Basic business policy presentation is assessed separately.

Retain useful supporting features: accidental production-status correction/consumption reversal (`fulfillment-state.js:20-43`), approved staff cake copy, operation/version keys, unsaved-form warnings and grouped customer notifications. They support the intended workflows without requiring a new module/table for each implementation mechanism.

## 7. Issues Requiring Team Clarification

No answer is required to complete this report. These decisions precede future website/document changes, which are not authorized by this reassessment.

| ID | Decision | Evidence and resolution |
| --- | --- | --- |
| A03 | Are ten-minute timers intentionally compressed demonstration time? | FR-PAY-08 specifies 30-minute QR/32-minute hold; code uses common10. Document mapping and distinct phases/expiry, or use stated local timers. Real payment connection unnecessary. |
| A05 | Is subscription pickup intended? | P:292/318-320 and E:29 assume fixed address; P:1870/1882/code allow pickup. Ratify and revise conditional address/zero fee/method, or remove consistently from code and UI prose. Do not assume code wrong. |
| A08 | Are noon/seven-day rules hard minima or overridable defaults? | Explicit FR-CAP-19-21 versus configurable scope. Agree baseline before restricting settings or replacing business rule with fixtures. |
| A13 | Are cake time windows still required? | P:1929/2073 and E:35/41 retain windows; current workflow/test omit. Restore field/display or remove obsolete descriptions. |
| A15 | Which origin/boundary governs demo? | maps-config.js:4-7 temporary Liloan; delivery-route.js:3 10 km; cake-builder.js:19 Banilad pickup and city-list owner coverage. Distinguish courier/owner coverage if intentionally different. Sample fee needs no correction. |
| A19 | Is acknowledgement shared across owner/staff or within one team's event? | E:45 says one user's acknowledgement; P:2001 says staff team. Owner read Set (`owner.js:32-36,122-138`) and staff flags represent different aggregations. Define same event identity before demanding cross-role synchronization. No per-user receipts required. |
| A20 | How do external refunds/late-success receipts appear in sample reports? | FR-ANL-05 excludes refunded sales; E:23 excludes refund handling. Sample reconciliation flag or explicit report limitation may suffice. Do not introduce refund processing. |
| A25 | How does forfeiture affect subscription completion/review eligibility? | OR-POL-08/09 P:3161-3162 describes manual resolution/dispute; E/status lacks detail. Agree history-note/manual exception versus new state; no ticketing system implied. |
| A12/A17 | Cost/overhead granularity and historical versus current estimates? | E/code variant override versus product wording; reports need disclosed estimate basis. Neither should be called actual net profit. |
| A10 | Does generic eligible-item feedback include cakes? | FR-REV-01/BR-21 broad; code has later-phase notice. Agree eligibility boundary instead of silently adding separate cake-rating module. |

## 8. Prioritized Recommendations

### Must Fix

If the current explicit rules remain agreed scope:

1. **A06-A07:** exactly two deferment candidates, saved preparation-day deadline and automatic-confirmation text. `subscription-state.js:53-97`, `subscriptions.js:126-134`, helper `staff-integration.js:46`.
2. **A04:** late success for released attempt must not restore fulfillment; distinguish new retry. Payment functions in commerce/subscription/cake state, wrappers `staff-integration.js:18-24,57-67` and checkout-holds.js.
3. **A09:** derive each reserve_at from its own preparation date; evaluate due requirements through demo clock/manual action. `staff-integration.js:47-55,73-75`.
4. **A10:** one completed-enrollment review; no weekly-child reviews. `orders.js:43,75-78`, `owner-reviews.js:5-9`, selected enrollment identity.
5. **A17:** exclude cancelled paid transactions from sales and define payment-resolution treatment. `owner-analytics.js:12-19`.
6. **A08:** agreed noon/lead baseline, especially preparation-based enrollment and seven-day cake requests if retained. scheduling.js, cake-data.js:13, capacity-state.js:19-27. Resolve override policy before imposing new restrictions.

### Should Fix

- **A26:** connect local staff editing/customer views and demonstrate initial setup if retained (`owner-accounts.js:31,57-88`). Helpers alone are not pages.
- **A17:** show available local estimated cost/margin; add described weekday/product reports or identify deferred demonstration coverage.
- **A10:** three image slots using samples if preferred; consistent eligibility/duplicate messages; resolve cake-feedback dead end.
- **A24:** qualifying seasonal event and partial-output recovery/blocked approval with sample output/manual scheduled trigger.
- **A14:** simulated notification attempts, due reminders and retry outcomes via manual time/trigger. No worker/provider needed.
- **A16:** one agreed governing batch/preparation rule across editor and standard validator.
- **A25:** brief policy explanation and clearly simulated owner-support handoff; no legal/commercial system needed.
- **A22:** repair stale test assumptions/references before claiming results. Do not restore obsolete owner deferment approval just to pass a test.

### Documentation Update

- **A11:** multi-image CakeRequestImage and43/44 entity count.
- **A10:** max three feedback images and explicit enrollment eligibility/identity; purchased-item wording.
- **A12:** ERD retained design/staff copy/saved schedule semantics already demonstrated through snapshots.
- **A24:** category/event identity and generation completeness distinct from review.
- **A14/A18:** necessary retry/ownership/cardinality invariants, not SQL details.
- **A05/A13/A19/A20/A21:** pickup/windows/read/refund-reporting/internal-payment terminology after decisions.
- **A01:** short academic-prototype stack/mocks note alongside intended architecture; no framework rewrite.
- **A27:** implement agreed detailed UI controls or align over-specific descriptions.

### Optional Enhancement

- Defense scenario guide distinguishing fixture controls, ordinary actor actions and simulated time/provider events (A23).
- Additional local boundary scenarios around rejected deferment, due reservations, late payments, status reversal and notification failure. No new testing platform necessary.
- Review/date/search visual refinements if detailed descriptions are intentionally simplified; lower priority than core rules.

### No Action Required

Framework/language migration, real backend/database, provider integration, production sessions/hashing, durable queues, hosting, SQL locks, eliminating sample images/mocks and proving live API success are not prerequisites for this assessment. No recommendation treats them as required for academic alignment.

## 9. Previous Audit Reclassification

Every original ID is mapped. Mixed findings are split deliberately: an accepted service substitute may coexist with a genuine business-rule defect under the same historical issue.

| ID | Original concern | Revised classification | Reason/disposition |
| --- | --- | --- | --- |
| A01 | Production architecture/data absent; Critical | **Reclassified as an Acceptable Simplification** | Local JS/modules/stores authorized. Remove stack/hosting/durability/physical DB from scoring; informational note only. |
| A02 | Production authentication/security; Critical | **Reclassified as an Acceptable Simplification**; production subclaims **Removed as Not Applicable** | Mock identities/OTP/roles/hashing accepted. Normal owner approval/booking gates checked; no ordinary bypass established. |
| A03 | No PayMongo/timing; Critical | Provider **Acceptable Simplification**; timing **Marked for Clarification**, retained functional gap | Confirmation substitute valid. Common10 deadline does not explain30/32 distinction; document compression or align local phases. Not Critical. |
| A04 | Late payment restores released resources | **Retained as a Functional Contradiction** | Expired purchase can activate when capacity free. Preserve cancellation in simulation. Must Fix. |
| A05 | Subscription pickup mismatch | **Marked for Clarification** / **Retained as an ERD/Paper Inconsistency** | Paper UI/code support pickup, other scope/E assume address. Ratify/reconcile, not automatic code error. |
| A06 | Later-week deferment search | **Retained as a Functional Contradiction** | Explicit two-candidate rule violated independent of provider/storage. Must Fix. |
| A07 | Deferment cutoff/approval wording | **Retained as a Functional Contradiction** | Preparation deadline/automatic apply central to journey. Must Fix. |
| A08 | Schedule defaults/frozen clock | Rules **Functional Contradiction**; override **Clarification**; clock **Acceptable Simplification** | Noon/seven-day/preparation dates substantive; fixed demo date not inherently wrong. |
| A09 | Rolling reservations/no worker | Date logic **Functional Contradiction**; no worker **Acceptable Simplification** | Correct due-based local evaluation; do not build infrastructure. |
| A10 | Feedback eligibility/two images/no upload | Eligibility/count **Functional Contradiction** and **ERD/Paper Inconsistency**; samples **Acceptable Simplification** | Wrong review unit/count genuine; real upload unnecessary. Cake scope clarify. |
| A11 | Missing cake image entity/storage | **Retained as an ERD/Paper Inconsistency**; cloud storage **Acceptable Simplification** | Website already demonstrates1-3 references; E single URL/count inconsistent. |
| A12 | Historical snapshot model missing | **Retained as an ERD/Paper Inconsistency** | Code snapshots valid; E should express retained information, no physical tables required. |
| A13 | Cake windows absent | **Marked for Clarification** | P/E retain, code/test omit. Decide obsolete requirement versus missing field. |
| A14 | Real notifications/timed retries | Provider **Acceptable Simplification**; full automation **Downgraded to a Prototype Limitation**; retry model **ERD/Paper Inconsistency** | Local sent/fail/manual retry valid. Demonstrate retry/reminder scenarios with local trigger, not worker. |
| A15 | Courier simulated/temporary origin | Courier/fees **Acceptable Simplification**; location **Marked for Clarification** | Paid/ready/owner/status progression verified. Origin/boundary should be coherent. |
| A16 | Batch setting/validator disconnect | **Retained as a Functional Contradiction** / **ERD/Paper Inconsistency** | Different sources with no established connection; define governing rule then align. |
| A17 | Cancelled sales/missing reports | **Retained as a Functional Contradiction** and missing demonstration | Mock transactions still need correct totals. Existing analytics credited; cost/weekday/detail gaps specific. |
| A18 | Physical DB constraints absent | Physical enforcement **Removed as Not Applicable**; ambiguous logical rules **ERD/Paper Inconsistency** | No SQL/index/lock requirement; clarify ownership/eligibility/cardinality only where needed. |
| A19 | Shared acknowledgement mismatch | **Marked for Clarification** | Owner/staff aggregate different records; define same-event/team read semantics first. |
| A20 | Refund exclusion/no refund state | **Marked for Clarification** | Processing excluded; sample outcome flag or explicit limitation may suffice. No refund API. |
| A21 | Internal paper terminology | **Retained as an ERD/Paper Inconsistency** | Existing payment practice, pending/confirmed creation and review unit conflict independently of technology. |
| A22 | Stale/missing verification modules | **Retained inconsistency in verification evidence**, not application workflow defect | Current test claims not reproducible. Repair/relabel evidence; obsolete assertions not requirements. Should Fix. |
| A23 | Customer-accessible QA quotation | **Reclassified as an Acceptable Simplification** | Explicit inspector fixture setup; ordinary owner issue command checks role. Label/explain distinction, no security hardening demand. |
| A24 | No AI/worker; event/recovery/model gaps | Outputs/triggers **Acceptable Simplification**; event/recovery **Retained demonstration gaps**; event state **ERD/Paper Inconsistency** | Core owner review works. No Gemini defect; seasonal/partial-completeness scenarios still missing. |
| A25 | Policy/legal/support/invoice readiness | Commercial compliance **Removed as Not Applicable**; operational procedures **Prototype Limitation**; policy/forfeiture **demonstration gap/Clarification** | No legal certification/invoice/support system; explain demonstrated business rules. |
| A26 | Missing owner views/edit/setup | **Retained as a Functional Contradiction / missing journey** | Helpers exist but UI redirects/blocks and skips setup. Visible omission, not production identity requirement. |
| A27 | Detailed review/marketing UI | **Retained documentation inconsistency and minor interface gap** | Search/date/distribution promises differ. Implement agreed controls or revise prose; lower priority. |

For A22, retained inconsistency concerns verification claims, not a newly broken customer flow. For A14/A24/A25, missing edge demonstrations are distinguished from wrong ordinary transitions. No finding is retained solely because its earlier severity was High/Critical.

## 10. Final Prototype Alignment Verdict

| Comparison | Revised verdict | Basis |
| --- | --- | --- |
| Paper vs website | **Substantially aligned academic prototype; partial detailed-rule coverage** | Purchasing/operational/owner journeys interact. Mocks count as implementations of concepts. Specific expiry/scheduling/review/reporting rules differ. |
| Paper vs ERD | **Broad logical alignment with identifiable omissions** | Main entities support intended processes; correct images/enrollment/history/event semantics and reconcile pickup/windows/read decisions. |
| ERD vs website | **Generally aligned conceptually** | Ownership, multiple items, four linked orders, material/order associations, quotation/request versions and owner review exist in local structures. Physical schema equivalence irrelevant. |
| All three | **Adequate to demonstrate intended overall system, not fully consistent in detailed rules yet** | Fix specified core issues and describe limitations accurately; no backend/framework/provider rewrite required. |

Most defense-relevant corrections: **two-date/preparation-based deferment, no late reactivation after release, due stock reservations, one completed-enrollment review and eligible sales totals**. Agree cutoff baseline, complete missing owner/cost-report demonstrations, and reconcile ERD/paper images/history/pickup/marketing state. Show marketing as sample generation plus owner review; no live Gemini requirement.

Remaining evidence limits: no fresh full browser/visual/accessibility execution; some VM tests isolate modules rather than whole browser stack; integrated expiry/notification/marketing edge cases and enrollment feedback need targeted scenarios; embedded diagram pixels unverified; team decisions open. Real services, database deployment, production security and commercial readiness are excluded and **not unresolved prerequisites for academic prototype alignment**.
