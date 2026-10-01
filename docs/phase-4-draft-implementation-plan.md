# Draft implementation plan: Phase 4 — Custom Cakes & Customer Account

**Status:** Implemented in the customer prototype following approval on October 1, 2026.  
**Prepared:** October 1, 2026  
**Proposed target:** Extend the existing HTML/CSS/JavaScript customer prototype. The production architecture described in the chapters remains a later implementation dependency.

### Implementation record

The eight mockups are connected with request list/detail pages, versioned quotations, cake payment/order integration, account management, shared addresses, and notification history. The implementation uses the proposed defaults from this draft. [Implementation notes](phase-4-implementation.md) document the preview steps, chosen fixture values, and remaining production dependencies. [Verification](../verification/README.md) records the state, browser, and regression checks. The sections below retain the original plan and source decisions for traceability.

## 1. Intended outcome

Connect the eight Phase 4 mockups into working customer journeys:

- **Custom cakes:** Request details → Cake options → Reference images and notes → Review and submit → My Cake Requests → Quotation history → Accept → QR Ph payment → Order confirmation and tracking.
- **Account:** Profile → Edit personal details / Verify a new email / Change password → Saved addresses → Notification history.

Reuse the existing storefront, authentication, address/map tools, payment presentation, orders, and subscription features. Keep the standard shopping bag independent of cake requests and purchases.

The prototype will demonstrate owner review through explicit fixtures and inspector actions. The owner request queue and quotation editor belong to Phase 6; cake-option administration belongs to Phase 7. A customer submitting a request must see **Awaiting owner review**, with a quotation appearing only after a simulated owner action.

### Sources reviewed

| Source | Requirements used in this draft |
| --- | --- |
| [Chapter 1](../Chapters/Chapter%201.md), Scope and Limitations | Registered accounts; preliminary cake estimates; owner judgment for design/complexity; full QR Ph payment; saved addresses; owner-managed cake deliveries; no discounts or same-day processing. |
| [Chapter 2](../Chapters/Chapter%202.md) | Structured custom orders, clear pricing, capacity controls, and owner oversight. This provides design context, rather than additional business policies. |
| [Chapter 3](../Chapters/Chapter%203.md) | Separate capacity pools; default two custom cakes per week on different dates; configurable limits, lead times, and cutoffs; address validation; authentication; image storage; notification services. |
| [Chapter 4](../Chapters/Chapter%204.md), Figures 16, 18, 20–23 and 26–28 | Account verification purposes; address snapshots; cake configuration and ingredient relationships; quotation revisions; acceptance/payment separation; temporary capacity/inventory holds; notifications. Section 4.7 supplies the iterative testing and owner-review approach. |
| [ERD](../Chapters/ERD.md) | Entity names, fields, states, relationships, and constraints. Proposed additions needed by the mockups are listed in Section 5. |
| [Phases](../Phases.md) and [Phase 4 references](#3-screen-and-route-plan) | Screen scope, interactions, visual structure, and edge states. |
| [Previous implementation record](draft-implementation-plan.md) and [verification record](../verification/README.md) | Existing Phases 1–3 behavior and regression coverage. The older plan references README/Revisions files that are currently absent; this draft uses the current app and supplied sources. |

Use the mockups for presentation and the chapters/ERD for business rules. Record disagreements explicitly. Mock dates, contact details, service claims, and prices are fixtures until confirmed. UI phases in `Phases.md` are separate from Chapter 4's development iterations.

## 2. Current application and integration work

| Area | Current behavior | Phase 4 work |
| --- | --- | --- |
| Navigation | Hash routing in [app.js](../app/app.js); Custom Cakes opens a placeholder. Clicking the signed-in header control signs out immediately. | Add cake/account routes and an account menu with an explicit Sign Out action. Reuse the account sidebar across profile, requests, addresses, and notifications. Link existing orders/subscriptions. |
| Authentication | [auth.js](../app/auth.js) simulates registration, verification, sign-in, and recovery. [core.js](../app/core.js) holds auth state. | Introduce a shared demo account/customer identity; preserve protected destination and cake draft through sign-in. Extend verification for email changes without replacing registration/recovery behavior. |
| Addresses | [commerce-state.js](../app/commerce-state.js) owns shared address records. [checkout.js](../app/checkout.js), [address-map.js](../app/address-map.js), and [delivery-route.js](../app/delivery-route.js) support editing and validation; subscriptions reuse them. | Centralize address mutations for all four consumers: account, standard checkout, subscriptions, and cakes. Add archive/default actions and active-record filtering everywhere. |
| Scheduling | [scheduling.js](../app/scheduling.js) handles standard and subscription rules with an injected Manila clock. | Add a separate custom-cake policy and allocation pool. Do not inherit bread batch weekdays or standard-order lead-time defaults automatically. |
| Orders/payment | [orders.js](../app/orders.js) supports standard payment and order detail. A sample cake exists, but has generic courier behavior and no quotation link. | Create actual quotation-linked cake purchases. Add cake-specific validation, payment return routes, summaries, and owner-delivery copy. Successful cake payment must not alter the bread bag. |
| Customer subscriptions | Enrollment, four linked fulfillments, payment states, and one deferment are already connected. | Preserve the existing behavior while sharing account identity, addresses, and notification events. |
| Persistence | App records are held in memory; reload/reset clears them. | Keep that scope explicit. Preserve drafts during navigation within the tab. Add customer ownership keys; hide protected records after sign-out and prevent another demo identity from inheriting them. |

## 3. Screen and route plan

Routes below are proposed. Existing `#/orders`, `#/my-subscriptions`, and payment routes remain entry points.

| Screen | Reference / proposed route | Implementation and acceptance criteria |
| --- | --- | --- |
| **4.1 Request details** | [Mockup][m41] · `#/custom-cakes/request/details` | Calendar with reason-specific unavailable dates; preferred delivery window; shared saved-address selection and editor. Account gate preserves entered preferences. An available date permits a request but reserves nothing. No fee is charged or automatically quoted here. |
| **4.2 Options and add-ons** | [Mockup][m42] · `#/custom-cakes/request/options` | Exactly one available shape, flavor, size, color, and icing. Start with no selections and zero add-on quantities. Show partial subtotals while incomplete; show the preliminary estimate only when all required categories are complete. Positive integer add-on quantities; zero removes a selection. Handle loading, missing categories, and options becoming unavailable. |
| **4.3 References and notes** | [Mockup][m43] · `#/custom-cakes/request/references` | One required primary image plus up to two optional images; JPG/PNG/WebP, maximum 10 MB each; preview, replace, remove, retry, and enlarge. Optional notes capped at 600 characters. Pending/failed uploads block submission. Photos do not override selected options. |
| **4.4 Review and submit** | [Mockup][m44] · `#/custom-cakes/request/review` | Show all five options, add-on quantities, all uploaded images, notes, address/contact snapshot, date/window, and preliminary estimate. Section edit links preserve the draft. Revalidate before submitting; prevent duplicate submission. Success creates a request reference and `pending_review` state, then links to its details and request list. |
| **4.5 Quotation** | [Mockup][m45] · `#/cake-requests/:requestId/quotations/:quotationId` | Show the selected version's agreed design, owner notes, fulfillment, expiry, and complete pricing. Historical versions are view-only. Accept/decline dialogs, accepted/unpaid recovery, expired/superseded/rejected states, payment continuation, and paid-order link. |
| **4.6 Profile** | [Mockup][m46] · `#/account/profile` | View/edit first name, last name, and mobile; save/cancel and load/save errors. Separate email-change verification and current/new/confirm-password dialogs. Shared identity updates navigation and future transactions. |
| **4.7 Saved addresses** | [Mockup][m47] · `#/account/addresses` | List active addresses; add/edit; custom labels; select a default; remove by archiving after confirmation. Reuse autocomplete and map pin editing. Show outside-area addresses without claiming they can be used for every workflow. Empty/loading/error states. |
| **4.8 Notifications** | [Mockup][m48] · `#/account/notifications` | All / Orders / Subscriptions / Custom Cakes / Account & Security filters; newest-first history; delivery-channel outcomes and valid entity links. Empty/category-empty/loading/error states. This screen is notification history; security settings stay in Profile. |
| **Required connecting screens** | `#/custom-cakes`, `#/cake-requests`, `#/cake-requests/:requestId` | A simple entry page with Start Request / My Requests; a request list with reference, date, estimate/current quote, status, and next action; read-only submitted request detail available before quotation. Include empty, loading, retry, and missing/unauthorized-reference states. Match the supplied account layout. |
| **Shared purchase screens** | `#/payment/:orderId`, `#/confirmation/:orderId`, `#/orders/:orderId` | Dispatch behavior by purchase type. Cake review links return to its accepted quotation. Detail links connect the order to its request and exact quotation version. Show owner-managed delivery with no Lalamove panel. |

### Layout and navigation details

- Use the current shared header/footer, typography, spacing, modal behavior, and local assets. Implement screen content in the app rather than loading standalone mockup documents.
- Use the profile sidebar on desktop and a compact account navigation control on mobile. Include My Profile, My Orders, My Subscriptions, Custom Cake Requests, Saved Addresses, Notifications, and Sign Out.
- Direct links to later builder steps must check prerequisites and offer a return to the first incomplete step. Browser Back and edit links preserve valid selections.
- Keep mock inspectors closed by default. Move phase numbers, implementation notes, and simulation controls out of normal customer copy.
- Remove unsupported climate-controlled transport claims, placeholder WhatsApp contacts, and unrelated bakery claims. Keep the existing contact placeholder until an actual channel is supplied.
- Use `Asia/Manila` consistently. Replace ambiguous “PST” labels and inconsistent sample dates/identities with one fixture set.

## 4. Business behavior

### 4.1 Request, quotation, and order are separate records

| Event | Required behavior |
| --- | --- |
| Edit a draft | Keep a local draft; do not create a request or consume capacity. Cancel request discards this draft after a discard prompt when populated. |
| Submit request | Validate account, five selections, add-ons, required primary image, fulfillment, and preliminary estimate. Create exactly one `CustomCakeRequest` with `pending_review`. Capture submitted data so later edits to saved addresses/catalog records do not rewrite it. |
| Owner reviews | Simulated owner actions can reject the request, mark it `negotiating`, or issue a quotation. Customer controls cannot issue quotes or choose their own final price. |
| Issue/revise quotation | Preserve separate versions with unique `(custom_request_id, version_number)`. An older issued version becomes `superseded`; drafts remain owner-only. The request becomes `quoted`. |
| Accept current quotation | Check customer ownership, current version, status, expiry, agreed schedule, capacity, and materials. Create/reuse a single pending purchase and temporary hold; atomically mark quotation/request `accepted` and set `accepted_quotation_id`. A failed precheck leaves the offer unaccepted. |
| Await payment | Display **Accepted — payment pending**. Acceptance is agreement to terms; the order remains `pending_payment`. Do not show it as confirmed or scheduled for production. |
| Decline offer | Set the quotation to `rejected`; display **Declined by you**. Proposed request state: `negotiating`, so the owner can issue a new version. Preserve optional reason and response time. Owner rejection remains a separate request state. |
| Confirm payment | Record full payment once, confirm the resource holds, and advance the order to `confirmed`. Request/quotation stay `accepted`; production/completion status comes from the linked order. |
| Payment fails/expires | Release applicable temporary holds. Retry only after checking the quotation's continued validity and obtaining fresh availability/holds. Keep attempt history and reuse the purchase where valid. |
| Payment is detected but unresolved | Show verification pending; disable retry/cancellation and edits to the purchase terms until reconciled. A late success that cannot be fulfilled enters `payment_resolution_required`; never ask the customer to pay again. |

**Proposed expiry policy:** The quote deadline remains the deadline for starting/retrying unpaid checkout; cap a new hold at the earlier of payment-session expiry and quote expiry. At the deadline, prevent fresh payment attempts. A payment already detected must be reconciled first. Replacement of an accepted but unpaid offer requires closing its payment attempt/hold and preserving its acceptance history before presenting a new version. Paid quotations cannot be superseded. Confirm this policy before implementing the transitions.

The current ERD has no refund handling. This phase must not add automatic refunds or customer cancellation of paid cake orders. Questions about a paid order go to the owner.

### 4.2 Capacity, timing, and delivery

- Use `CapacityConfig.order_type = custom_cake`, default `max_cakes_per_week = 2` and `max_cakes_per_day = 1`. Weekly/day limits count active holds and committed cakes in that pool. Standard orders and subscriptions do not consume cake capacity.
- Proposed week boundary: Monday–Sunday in Manila, matching the current scheduling helper. Make cake lead time, cutoff, blocked dates, and allowed windows explicit fixture configuration; no same-day fulfillment.
- Recheck availability when the requested date changes, at submission, at acceptance, and before a payment retry. Submission checks eligibility without reserving it; two pending requests may therefore compete for the same slot.
- Configure `morning`, `afternoon`, and `evening` window identifiers separately from display labels/time ranges. The mockup promises date-specific owner configuration, which the ERD does not yet represent.
- The proposed Phase 4 customer path is delivery-only, matching 4.1–4.5. The ERD permits pickup; enabling it is an unresolved scope choice, not a reason to copy standard checkout's pickup toggle automatically.
- Reuse Maps/address capture, but give cake serviceability its own policy. An address valid for a courier route is not automatically approved for owner delivery. Do not inherit the current standard/subscription 10 km route limit as bakery policy.
- The owner supplies the delivery fee in the quotation. Cake requests/payments must not request a Lalamove fee or rider booking. Track preparation/readiness/completion through order status; external owner delivery logistics remain outside the system.

### 4.3 Pricing and ingredient requirements

```text
preliminary estimate = sum of five selected option prices
                     + sum of add-on unit price × quantity

quotation total = options_total + addons_total
                + complexity_charge + delivery_fee
```

Use integer centavos for prototype arithmetic and display PHP amounts. Do not charge the preliminary estimate. Complexity remains an owner-entered amount; discounts and vouchers are outside scope.

The supplied example is internally consistent:

| Calculation | Amount |
| --- | ---: |
| Round 100 + Chocolate 380 + 8-inch 400 + Cream 0 + Buttercream 220 | ₱1,100 |
| Chocolate decoration: 2 × 100 | ₱200 |
| Preliminary estimate | **₱1,300** |
| Quotation v2: options 1,350 + add-ons 250 + complexity 400 + delivery 200 | **₱2,200** |

Version 1's ₱2,000 is a separate historical offer. Store each version's own breakdown/design; selecting history must not merely change its badge while retaining version 2's values. If any option or price changes before submission, explain the change and require a fresh review.

Use `CakeOptionIngredient` and `CakeAddonIngredient` to aggregate material requirements by ingredient. Add-on consumption follows quantity. The meaning of `CakeOption.scale_factor` and which ingredient lines it scales need clarification; do not invent a size multiplier or apply it twice. Owner changes to the design must have a corresponding reviewed material requirement snapshot before payment can proceed. Represent unavailable/missing recipe data as a validation failure rather than assuming zero ingredients.

For the prototype, use explicit ingredient fixtures and simulated holds. For production, retain the ERD's distinction between requirements, reservations, and physical inventory movements; agree the actual consumption point before implementing stock deductions.

### 4.4 Account changes

- **Profile:** Validate required names and mobile; normalize the Philippine mobile format used by the mockup. Cancel restores saved values. Only successful saves change the shared account. Historical order/request contact snapshots stay intact.
- **Email:** Keep the current email active while the replacement is pending. Use `AccountVerification.purpose = email_change` and `target_email`; validate format, duplicates, and unchanged values. Provide expiry, attempt limit, resend cooldown, send failure, and cancel states. Resend/replacement invalidates the earlier code. On success, update email and verification timestamp together, preserving the account/customer IDs and owned records.
- **Password:** Require current password, a valid new password, and matching confirmation. Reuse registration/recovery rules; the mockup calls for at least eight characters with letters and numbers. Update `password_changed_at` only on success. Forgot-current-password returns through the existing recovery flow. Clear password/OTP fields on completion or cancellation; never persist them in browser storage.
- **Session behavior:** Proposed production policy is recent reauthentication for credential changes, revocation of other sessions after success, and refreshing the current session. The prototype simulates these states and must not imply it provides real account security.
- **Access:** Guests and pending-verification/inactive/suspended accounts cannot perform protected account or purchase actions. In production, check ownership on every request, quotation, address, order, and notification access; hiding a navigation link is insufficient. Staff must not receive customer identity, contact, address, or owner financial data.

### 4.5 Saved addresses

- A single shared service owns add/edit/default/archive behavior. Consumers select only `status = active` records belonging to the current customer.
- Proposed default rule: exactly one default when active addresses exist. First address becomes default; switching default is one operation; archiving the default promotes the oldest remaining active address. With no addresses, clear selection and show the empty state.
- Permit saving a valid geocoded address outside the current delivery area, as shown in 4.7. Each fulfillment flow checks its own serviceability before use. Avoid presenting one permanent “serviceable” flag as valid for every order type.
- Archive rather than hard-delete referenced addresses. Existing submitted requests, quotations, orders, and prepaid subscription deliveries retain their snapshots.
- Editing/archiving a selected address invalidates only dependent unpaid drafts and their route/fee checks. Do not silently change an accepted quote's destination or an active subscription. During unresolved payment, preserve the purchase snapshot and apply account-address changes only to future selection.
- Late map/route responses must not overwrite a newer selection or a closed editor. Extend the existing editor context so account actions do not accidentally select an address in a different checkout.

### 4.6 Notification history

Use `NotificationLog` as the starting point for customer history. Group email and SMS records for the same business event into one row, with independent channel outcomes. Show a failed/delayed SMS message only when its corresponding event warrants it; notification failure must not roll back a successful order or account change.

Events include order confirmation/status, subscription updates/deferments/reminders, custom request/quotation updates, and email/password changes. Links must target the corresponding record and quotation version, rechecking access and current action availability. Old quotation notifications remain historical; their links cannot re-enable expired offers.

Do not expose OTPs, reset tokens, raw provider errors, or internal owner/staff messages. `SystemNotification` is intended for admin/staff and has shared acknowledgement behavior; it must not serve as the customer inbox. The supplied 4.8 history has no read/unread actions, so use category totals and omit unexplained unread badges. Add per-customer read state only if that behavior is requested later.

## 5. ERD alignment and proposed additions

These are proposed schema changes for review. The source ERD and chapters are not modified by this draft.

| Requirement | Current ERD support / gap | Proposed treatment |
| --- | --- | --- |
| Account/profile/security | `Account`, `CustomerProfile`, and `AccountVerification` cover core fields and email-change purpose. Session invalidation is not specified. | Keep stable IDs. Define verification invalidation/rate limits and session policy in the auth implementation. Add an explicit consumed/invalidated representation if existing fields cannot distinguish those states. |
| Three reference images | `CustomCakeRequest.img_url` stores one nullable URL. | Add `CustomCakeReferenceImage` with image ID, request FK, asset ID/URL, filename, MIME type, byte size, position, and creation time; unique `(request_id, position)`, positions 1–3. Position 1 is mandatory on submission. Use a child record collection, with a compatibility primary URL only if needed. |
| Original request remains unchanged | Request references live option/address records; only aggregate `estimated_price` is retained. | Add request `configuration_snapshot`, `address_snapshot`, and `contact_snapshot`, including submitted option/add-on labels, quantities, and prices. Keep submitted notes/images stable; use new quotation versions for negotiated changes. |
| Revised design and owner assessment | Quotation stores totals and fulfillment/address snapshot, but no per-version options, add-ons, design, or owner notes. | Add quotation `configuration_snapshot`, `owner_notes`, `contact_snapshot`, and reviewed material snapshot or related material lines. Preserve option IDs alongside labels/prices. Choose JSON snapshots or normalized quotation lines before production migration. |
| Decline reason/history | Quote has `rejected`, but no response note/time. Request has `negotiating`, not `declined`. | Add `customer_response_note` and `responded_at`; display the customer-friendly label from the quotation state. Decide accepted-unpaid expiry/replacement transitions explicitly. |
| Dynamic delivery windows | Request/quote enums support three windows; no configuration stores allowed dates/times. | Extend cake scheduling configuration with allowed windows and date overrides. Display exact agreed ranges from a quotation snapshot so later settings do not change an accepted offer. |
| Recipient/phone and barangay | 4.1 has recipient/phone; 4.7 has barangay. `Address` has none of these. | Proposed: default contact from profile and snapshot it for the request; add optional per-request recipient override fields if retained. Add `Address.barangay` if keeping it as a separate form field. Do not accept inputs that are discarded on save. |
| Customer notifications | `NotificationLog` has provider/status/type and entity reference, but lacks event grouping/content snapshots; types omit email-change OTP and email/password change notices. | Add appropriate event types, a stable `event_key`, and safe template/content snapshot data. Group by recipient and event; use provider-specific attempt records without duplicate history rows. Keep sensitive verification payloads out of the customer projection. |
| Delivery method | `Delivery` is described around courier bookings and Lalamove IDs; cakes use owner delivery outside the logistics integration. | Use order fulfillment plus quotation date/window/address/contact/fee snapshots for cakes. Do not create a Lalamove delivery record for them. An owner dispatch tracker would be separate future scope. |
| Accepted quote and purchase | `accepted_quotation_id` is unique; `OrderItem.quotation_id` is nullable and unique; exactly one variant or quotation must be populated. | Enforce that the accepted quotation belongs to the request/customer. One cake item per accepted quotation, quantity 1, variant null. Store cake charges in its price and delivery fee separately so totals are not double-counted. |
| Holds and material allocation | `CheckoutHold`, `Payment`, `CapacityAllocation`, `OrderMaterialRequirement`, and `InventoryReservation` represent the required relationships. | One active hold per order; one payment per hold; fresh hold/payment attempt on retry. Validate and reserve capacity/materials atomically in production; process successful callbacks once. |

Store only image metadata/asset references in application records. The prototype can use local object URLs for selected files and release them on replacement/discard/reset; reload clears them. Production uploads go through the authenticated backend to the image service described in Chapter 3, with content/type/size validation and failed/orphaned-upload cleanup. Upload success must precede request submission.

## 6. Proposed implementation structure

Keep business transitions separate from screen rendering. Exact module splits can follow implementation size, but avoid adding the whole phase to `app.js` or `checkout.js`.

| Proposed module / existing integration | Responsibility |
| --- | --- |
| `app/account-state.js`, `app/account.js`, `app/account.css` | Shared account/customer records, permitted profile changes, email/password dialogs, account navigation, protected-page rendering. |
| `app/address-state.js` | Shared address mutation/default/archive functions and affected-draft invalidation. Adapt the existing editor/map contexts to call these functions. |
| `app/cake-data.js`, `app/cake-state.js` | Option/add-on fixtures, builder draft, estimates, request/quotation records, immutable snapshots, guarded transitions, and ownership. |
| `app/cake-builder.js`, `app/cake-requests.js`, `app/cakes.css` | Four builder steps, uploads, request list/detail, quotation history and response dialogs. |
| `app/notification-state.js`, `app/notifications.js` | Customer event projection, provider outcomes, filter counts, and destination links. |
| Existing `app/scheduling.js` | Separate cake capacity configuration, availability reasons, temporary allocations, expiry/release, and conversion to committed capacity. |
| Existing commerce state/UI/order modules | An explicit purchase-type branch or handler interface for validate/retry/pay/confirm/return actions. Cake confirmation must bypass standard cart settlement and standard cart revision checks. |
| Existing `app/core.js`, `app/app.js`, `index.html` | Mounts, routing, menu, auth refresh hooks, script ordering, and inspector integration. Shared reset also clears Phase 4 records, timers, event fixtures, and image URLs. |

Keep ERD status values as domain values for new records. Map them deliberately to existing prototype display labels such as `pending-payment`; do not use one display string for request, quotation, payment, and order status.

### Production boundary

The draft prepares data and behavior for the chapters' Next.js/TypeScript, Auth.js, Prisma/PostgreSQL, payment, image, Maps, and messaging architecture. It does not select dependency versions or claim those integrations are already implemented. Verify the paper's duplicated tool/version tables separately when setting up production.

Production requires authenticated persistence, server-side validation, transactional resource holds, verified payment callbacks, protected uploads, and a notification outbox with retries. Useful service operations are: save profile; begin/verify email change; change password; list/save/archive/default addresses; validate/submit cake request; list/read request and quotations; accept/decline quote; begin/retry/reconcile payment; list notification history. The customer API never issues an owner quotation.

## 7. Build order and acceptance gates

| Step | Deliverable | Gate before moving on |
| --- | --- | --- |
| **1. Agree contracts and fixtures** | Settle the decisions in Section 8; define cake configuration, state transitions, snapshots, image records, and notification events. | One consistent fixture runs from ₱1,300 estimate through ₱2,200 v2 quotation; all states map to the ERD or a documented proposed addition. |
| **2. Account shell and addresses** | Account menu/sidebar, 4.6 profile/security, 4.7 address management, shared identity/address service. | Save/cancel/recovery work; one default address; archived addresses unavailable for new checkout; existing order and subscription snapshots preserved. |
| **3. Builder and request tracking** | 4.1–4.4 plus entry/list/detail screens. | Guest return preserves draft; exactly five options and primary image required; all images survive navigation; estimates recalculate; repeated submit creates one request; submission reserves nothing. |
| **4. Quotation and purchase** | 4.5, owner fixtures, history, response dialogs, cake payment/order integration. | Old quotes cannot be accepted; accepted is still unpaid; conflicting capacity prevents checkout; payment confirms once; retries revalidate; owner delivery has no courier panel; bread bag unchanged. |
| **5. Notifications** | 4.8 populated by connected order/subscription/cake/account events. | Email/SMS group into one event; failures have accurate channel labels; filters/counts agree; links reach permitted records and correct quote versions. |
| **6. Integrated review** | Responsive polish, inspector states, regression checks, updated verification notes. | Connected journeys and failure recovery pass; existing Phases 1–3 behavior remains intact; owners can review request/quotation terminology and policy assumptions. |

### Verification during implementation

Add focused suites where they validate business behavior:

- Proposed `verification/cake-state.cjs`: empty/partial/full estimates, add-on quantities, unavailable options, two-per-week/one-per-day limits, week/cutoff boundaries, independent capacity pools, hold expiry/retry, quote versions, duplicate acceptance/payment, stock conflict, and late-payment resolution.
- Proposed `verification/account-state.cjs`: email change leaves current identity untouched until verification, old-code invalidation, duplicate email, failed password check, address defaults/archive, ownership, snapshots, and notification grouping.
- Proposed `verification/phase4-browser.cjs`: complete request → owner fixture → quote → payment → order journey; all three images; upload rejection/retry; deep links/Back; profile/email/password recovery; address reuse across workflows; notification links; guest/session-expired/loading/error/empty states.

Key regression risks are shared address mutation, payment dispatch, identity changes, and reset behavior. Reuse the existing suites in [verification/README.md](../verification/README.md): `browser-smoke.cjs`, `browser-edge.cjs`, `phase2-browser.cjs`, `delivery-route.cjs`, `address-map-browser.cjs`, `subscription-state.cjs`, and `subscription-browser.cjs`.

Check 1440, 768, 390, and 320 pixel widths; keyboard access, visible focus, modal focus return/trapping, Escape, screen-reader errors/status, disabled actions, unique IDs, image failures, and horizontal overflow. Use injected clocks and Maps responses for repeatable availability/address tests. Capture and review screenshots with inspectors closed.

These checks verify prototype behavior. Production testing must additionally cover concurrent customers, unauthorized record access, upload ownership, database rollback, repeated/out-of-order payment callbacks, and notification retries. Chapter 4's owner review and formal black-box/UAT activities remain separate from automated prototype checks.

## 8. Decisions to settle during draft review

| Decision | Evidence / issue | Proposed direction |
| --- | --- | --- |
| **Implementation target** | Current application and previous approved work are a customer prototype; chapters describe production architecture. | Continue the prototype first. Scope a production migration separately. |
| **Cake pickup and service area** | Mockups are owner-delivery-only; ERD permits pickup. Chapter 4's generic courier wording conflicts with Chapter 1's explicit cake exception. | Use owner delivery in this phase. Confirm coverage/origin and whether pickup should be exposed. Keep cake delivery outside Lalamove and align generic paper wording later. |
| **Lead time, cutoff, week boundary, windows** | Capacity defaults are supplied; exact cake lead time/cutoff and window configuration are not. | Keep 2/week, 1/day; propose Monday–Sunday/Manila weeks. Obtain actual lead/cutoff/window values and use clearly named fixtures meanwhile. |
| **References and snapshots** | Multi-image and revised-design mockups exceed the current schema. | Retain 1 required + 2 optional images and immutable request/quotation snapshots; adopt the additions in Section 5 before production. Extend 4.4/4.5 to show all images. |
| **Quote expiry and unpaid acceptance** | Quote validity and QR expiry are separate; accepted-but-unpaid replacement policy is unstated. | Use the proposed deadline/reconciliation rules in Section 4.1; preserve prior responses, close unpaid holds before replacement, and never revise a paid quote. |
| **Decline semantics** | Mockup offers decline with optional notes and further negotiation; request enum has no declined state. | Quote `rejected`, UI “Declined by you,” request `negotiating`; owner rejection closes the request separately. |
| **Size scaling and material changes** | `scale_factor` exists but its formula is unspecified; quotes may change the design. | Agree recipe scaling and owner material overrides before connecting inventory checks. Keep complexity pricing manual. |
| **Contact and address fields** | Recipient/phone/notes in 4.1 and barangay in 4.7 exceed current Address fields. | Use profile contact defaults and immutable transaction contact snapshots; explicitly store any retained override/structured field. |
| **Default replacement** | Removal behavior does not state what happens when the default address is removed. | Promote the oldest active address; use no default when none remain. |
| **Notification history versus inbox** | 4.8 has category history; sidebar badges suggest an unspecified unread count. Current schema lacks customer read state and some security events. | Build grouped notification history, add missing event metadata/types, and omit unread semantics. |
| **Credential-change session policy** | Mockups cover forms and OTP, but not recent-auth/session-revocation rules. | Use the production policy proposed in Section 4.4 and explicit simulations in the prototype. |

### Completion definition

Phase 4 is complete when a customer can submit and revisit a cake request, review historical/current quotes, accept and pay the valid offer, and see the linked order; manage profile/security and shared addresses; and follow relevant notification history. Duplicate actions, invalid dates, stale quotations, account gating, and service failures must have working recovery paths. The completed prototype must preserve standard ordering/subscriptions and clearly identify simulated external actions.

[m41]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_4.1_custom_cake_request_fulfillment_delivery_details_aligned/code.html
[m42]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_4.2_cake_options_add_ons_zero_default_aligned_revision/code.html
[m43]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_4.3_reference_images_notes_multi_image_aligned_revision/code.html
[m44]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_4.4_custom_cake_request_summary_final_review_submission_aligned/code.html
[m45]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_4.5_quotation_details_acceptance_aligned_revision/code.html
[m46]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_4.6_customer_profile_consolidated_account_management/code.html
[m47]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_4.7_saved_addresses_consolidated_cleaned/code.html
[m48]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/kitchen406_phase_4.8_customer_notifications_consolidated_cleaned/code.html
