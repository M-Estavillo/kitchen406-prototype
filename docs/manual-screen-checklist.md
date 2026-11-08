# Kitchen406 manual screen and state checklist

Based on the implemented routes and controls, reviewed October 29, 2026. These are checks to perform, not a report of passing tests.

## How to use this checklist

Open **Mock Controls**. Use its jump links or append the listed hash route to your current website URL. Replace `<id>` with a reference opened from a list; do not type the placeholder literally.

For every options list below, inspect **each value separately**, then return it to normal before testing the next control. Check off a row only after all its listed values pass. Record failures beside the row. Some controls are shared across a module and only affect relevant screens; an exposed control need not change every page.

Use **Authentication → Signed in** for customer fixtures. Use **Enter staff preview / Enter owner preview** for workspaces and their **Load ... examples/orders** buttons. The initial preview password is `Kitchen406!`; registration verification uses `406892`. A password entered during sign-in can replace the customer demo password.

**Reset screen states** clears simulated modes; **Reset preview** clears demo transactions. Reload also resets in-memory data. Finish a connected journey before resetting. Scheduling uses the prototype clock, so judge dates against the clock shown in controls, not your computer's date.

## Repeat on every screen and dialog

- [ ] Desktop 1440px, tablet 768px, mobile 390px, narrow mobile 320px: no clipped labels, overlapping buttons, unexpected page-wide scrolling, or hidden primary actions.
- [ ] Inspect normal, longest-content, error, empty, and loading layouts where supported; close Mock Controls for the final visual pass.
- [ ] Headings, spacing, card heights, image crops, currency, dates, badges, and button alignment are consistent.
- [ ] Keyboard Tab order and focus are visible; Enter/Space activate controls; disabled controls cannot act.
- [ ] Dialog opens visibly, scrolls at small heights, keeps focus inside, and returns focus on close. Test Cancel, close button, Escape, and backdrop behavior where supported.
- [ ] Errors identify the field/action, preserve valid entries, and clear after correction; retry restores usable content.
- [ ] Loading/submission prevents duplicate actions; success feedback is readable and does not cover important controls.
- [ ] Back/Forward, internal Back links, revisiting the screen, and direct route entry behave coherently.
- [ ] Search/filter changes update counts, selection styling, pagination, and empty results; clear restores the list.
- [ ] Long names, addresses, notes, references, and multi-line errors wrap without breaking layout.

## Shared navigation and access

- [ ] Guest and signed-in header; account menu open/closed; outside click and Escape; bag count after changes.
- [ ] Shop, Subscriptions, Custom Cakes, Orders, account navigation, logo, and footer links reach the expected destination.
- [ ] About, fulfillment information, and policy/placeholder notices open and close correctly.
- [ ] Header search navigates to catalog and agrees with catalog search.
- [ ] Protected customer routes show a sign-in gate; signing in returns to the intended workflow.
- [ ] Staff/owner routes as guest and customer show restricted access; preview role changes update navigation.
- [ ] Unknown top-level route, unknown workspace route, unknown product, and unknown record references show a recovery path.

## 1. Catalog — `#/shop`

- [x] **Catalog:** Default, Loading, Empty, Error; error retry returns to products.
- [x] All, Breads, Pastries, Pantry categories; counts and active tab styling.
- [x] Subscription-only toggle on/off, alone and combined with category/search.
- [x] Search by name, description, category; mixed case, whitespace, no matches; clear search and reset filters.
- [x] First/middle/last pagination pages; previous/next disabled boundaries; filtering from the last page.
- [x] Available/unavailable cards, subscription badges, images, prices, long titles, and product links.
- [x] Empty store and filtered no-results are understandable as different situations.

Catalog: unreported checks passed user review; reported fixes implemented. Visual retest of fixes pending.

## 2. Product and reviews — `#/product/1`, `#/product/1/reviews`

- [ ] **Product page:** Default, Loading, Error, Not found; recovery links.
- [ ] **Variant model** on product 1: Multiple variants, Single variant.
- [ ] **Availability:** Available, Unavailable; purchase action and explanation agree.
- [ ] Select every variant; quantity minimum/maximum; price and bag item reflect the selection.
- [ ] Buy once as guest/signed in; subscription setup for eligible products; non-subscription product layout.
- [ ] **Review feed:** Populated, Loading, Error, Empty; retry and review anchor positioning.
- [ ] **Review eligibility:** Not eligible, Eligible, Already reviewed, plus guest gate.
- [ ] Eligible composer: missing rating/text, valid submission, cancel, long text.
- [ ] **Review submission:** Success, Error; retry preserves input and success does not duplicate a review.

## 3. Authentication dialogs

For each route, test **Entry context: Header, Protected, Review**, and **Show/Hide Modal**. Check return destination and preserved workflow after success/cancel.

- [ ] Sign-in `#/sign-in`: Default, Validation, Loading, Invalid credentials, Server error, Verification pending, Disabled.
- [ ] Registration `#/register`: Default, Validation, Loading, Account exists, Server error, Disabled.
- [ ] Verification `#/verify`: Waiting, Partial, Complete, Verifying, Incorrect, Expired, Maximum attempts, Resending, Resent, Resend error, Verified.
- [ ] Forgot password `#/forgot`: Default, Validation, Loading, Error, Success, Disabled.
- [ ] Reset password `#/reset`: Default, Validation, Loading, Expired, Invalid, Error, Success, Disabled.
- [ ] Empty/invalid email, required names, invalid Philippine mobile, short password, mismatched confirmation, show/hide passwords.
- [ ] Fill demo details; valid verification code; paste/edit code; resend timing and retry.
- [ ] Forgot/reset links, reset-link preview, resend instructions, successful reset and subsequent sign-in.

## 4. Bag — `#/cart`

- [ ] **Page state:** Normal, Loading, Error, Empty.
- [ ] Load sample bag; **Cart scenario:** Normal, Unavailable, Quantity.
- [ ] Increase/decrease quantities, boundaries, remove item, undo, remove last item.
- [ ] Variant/name/image/line total/subtotal and header badge remain consistent.
- [ ] Invalid items block checkout with a usable correction path; shopping links work.

## 5. Standard checkout

On each step: **Page state Normal/Loading/Error** and **Fulfillment method Unselected/Pickup/Delivery**. Start with a valid sample bag and signed-in account.

### Fulfillment — `#/checkout/fulfillment`

- [ ] **Calendar:** Normal, Loading, Error; retry.
- [ ] **Date availability:** Normal, Before-cutoff, After-cutoff, Mixed-cart, Fully-booked, Blocked, Cutoff, Stock, No-dates.
- [ ] **Revalidation:** Normal, Checking, Conflict, Error.
- [ ] **Missing method / Missing date** buttons; continue stays blocked until corrected.
- [ ] Calendar month navigation, selected day, disabled reasons; pickup versus delivery next step.

### Address — `#/checkout/address`

- [ ] **Courier quote:** Ok, Loading, Failed, Fleet_unavailable; retry and total changes.
- [ ] **No addresses / Add form / Session expired** controls.
- [ ] Select saved/default address; add/edit/cancel; required fields and invalid mobile; optional fields empty.
- [ ] Map search, result selection, pin movement, address text consistency; unavailable map/configuration feedback where encountered.
- [ ] Serviceable versus unserviceable address; quote invalidation after address change; no continuing with stale quote.
- [ ] Pickup layout excludes irrelevant delivery fees/requirements.

### Review — `#/checkout/review`

- [ ] **Stock / schedule verification:** Normal, Stock, Capacity, Checking, Error.
- [ ] **Pricing:** Normal, Updated; automatic price update, exact change message, and matching totals.
- [ ] Edit bag/date/method/address then return; summary reflects changes.
- [ ] Direct entry with incomplete earlier steps offers the correct recovery link.
- [ ] Submit once and rapid double-click: one payable order, correct amount/reference.

## 6. Payment, confirmation, and orders

### Standard payment — `#/payment/<id>`

- [ ] **Page state:** Normal, Loading, Error; **Fresh payment preview** creates a usable test session.
- [ ] **Payment simulation:** Waiting, Detected, Delayed, Confirmed, Failed, Expired, Revalidation.
- [ ] QR preview, amount, reference, countdown, status instructions, and relevant action agree.
- [ ] Failed/expired retry; detected/delayed verification locks; no second payment prompt after success.
- [ ] Navigate to bag during verification: edits are locked with a return-to-payment link.

### Confirmation — `#/confirmation/<id>`; detail — `#/orders/<id>`

- [ ] **Page state:** Normal, Loading, Error, Not found.
- [ ] **Order lifecycle:** Pending-payment, Confirmed, Preparing, Ready-delivery, Ready-pickup, In-transit, Completed, Payment-failed, Payment-resolution, Cancelled.
- [ ] **Courier preview:** Prebooking, Booked, Transit, Delivered, Failed, on a delivery order.
- [ ] Pickup and delivery summaries, payment totals, progress/history, and permitted actions.
- [ ] Cancel unpaid order: open, dismiss, confirm; paid/verification-pending orders cannot be cancelled through that action.
- [ ] Revisit confirmation: no duplicate purchase or duplicated totals.
- [ ] Prepaid subscription fulfillment uses its reduced lifecycle and does not request another payment.

### Orders list — `#/orders`

- [ ] **Page state:** Normal, Loading, Error, Empty; Load sample orders.
- [ ] **Order dataset:** All, Standard, Subscription, Cake.
- [ ] Each visible status/type filter, search, no results, clear, pagination boundaries, detail links.

## 7. Subscriptions

Use **Load sample subscriptions** for lifecycle examples. Test page Normal/Loading/Error on each supported view; Empty is exposed on My Subscriptions.

### Offerings — `#/subscriptions`

- [ ] **Subscription offerings:** Normal, Available, Full, Unavailable, Empty, Loading, Error.
- [ ] Category tabs, browse anchor, FAQ expanded/collapsed, Buy Once and Set Up Subscription links.
- [ ] Availability badges and disabled setup actions; four-delivery pricing explanation.

### Configure — `#/subscription/configure`

- [ ] Enter through an offering; **Schedules:** Normal, Loading, Error, Unavailable.
- [ ] Variant, quantity boundaries, each schedule, start date; all four dates and totals update.
- [ ] Missing/invalid configuration blocks progression; unavailable schedule retry.

### Fulfillment — `#/subscription/address`

- [ ] Pickup/delivery choices; address selection/add/edit/cancel and validation.
- [ ] **Courier quotation:** Ok, Loading, Failed; retry.
- [ ] Product subtotal, four fulfillment fees, pickup zero-fee behavior, total.

### Review — `#/subscription/review`

- [ ] **Availability:** Normal, Checking, Capacity, Stock, Error.
- [ ] **Price:** Normal, Updated; accepting price refreshes totals.
- [ ] Edit configuration/fulfillment then return; incomplete-step gate.

### Payment — `#/subscription/payment/<purchase-id>`

- [ ] **Payment simulation:** Waiting, Detected, Delayed, Failed, Expired, Revalidation, Confirmed.
- [ ] Countdown, retries, locked edits during verification, one subscription after confirmation.

### My Subscriptions — `#/my-subscriptions`

- [ ] Normal/Loading/Error/Empty; active and completed sample records.
- [ ] All visible filters, search/no results, sort options, clear filters.
- [ ] Unpaid setup: resume, cancel, failed/expired state; successful payment removes unpaid presentation.
- [ ] Detail and subscribe-again actions.

### Detail — `#/subscriptions/<id>`

- [ ] Four-delivery timeline, progress, upcoming fulfillment, linked order details, original/moved dates.
- [ ] Active/completed record; unavailable reference; prepaid totals and no automatic renewal copy.
- [ ] Defer action eligible versus cutoff/used/completed restrictions.

### Defer — `#/subscriptions/<id>/defer/<delivery-id>`

- [ ] **Deferment availability:** Normal, Day, Week, Both, Used, Loading, Error. Inspect each option's actual enabled/disabled result.
- [ ] Next Day/Next Week selection, proposed date and explanation.
- [ ] Confirmation dialog: Go Back, close, confirm; one successful change only.
- [ ] Updated detail/order/calendar and deferment history; subsequent defer blocked.

## 8. Custom cakes

Use **Fill request fixture** to populate a request; **Load quotation example** to reach quotation details. On protected screens test Page state Normal/Loading/Error; Empty applies to lists where implemented. The public landing renders independently of this page-state control.

### Introduction — `#/custom-cakes`

- [ ] Guest/signed-in introduction, request CTA, process and pricing explanation, return links.

### Details — `#/custom-cakes/request/details`

- [ ] **Cake availability:** Normal, Loading, Error, Capacity, Blocked.
- [ ] Calendar months, date/window selection, past/lead-time/cutoff/full/blocked explanations.
- [ ] Address selection/add/edit/cancel; missing and outside-area address; cancel request.

### Options — `#/custom-cakes/request/options`

- [ ] **Cake options:** Normal, Loading, Error.
- [ ] Every shape/flavor/size/color/icing selection; unavailable options; missing required selection.
- [ ] Add-ons start at zero; increment/decrement/boundaries; estimate updates.

### References — `#/custom-cakes/request/references`

- [ ] **Image validation:** Normal, Error.
- [ ] Required primary image missing/present; each optional slot; upload checking, replace, remove, enlarge/close.
- [ ] Accepted JPEG/PNG/WebP and rejected unsupported/oversized file; error and correction.
- [ ] Notes empty/long; Back/Continue preserve selections and images.

### Review — `#/custom-cakes/request/review`

- [ ] Complete configuration, reference images, notes, fulfillment, estimate, and edit links.
- [ ] Revised estimate acknowledgement where shown; incomplete earlier-step gate.
- [ ] **Request submission:** Normal, Error; busy state, retry, duplicate-click protection.

### Requests — `#/cake-requests`; detail — `#/cake-requests/<id>`

- [ ] Empty/populated list, visible filters/search, request detail, unknown reference.
- [ ] Submitted request with no quotation; **Owner: issue quotation**, **Owner: revise quotation**, **Owner: reject request**.
- [ ] Status, original submission, version links, image preview, and customer actions match each state.

### Quotation — `#/cake-requests/<id>/quotations/<quotation-id>`

- [ ] Current versus superseded version; **Expire current quotation**; rejected request; unknown/mismatched quotation.
- [ ] Final amount breakdown, owner changes, expiration, delivery fee, acceptance explanation.
- [ ] Accept and proceed to payment; locked/expired offer cannot be reused.
- [ ] Cake payment uses shared payment route: Waiting/Detected/Delayed/Confirmed/Failed/Expired/Revalidation; retry respects quote validity.
- [ ] Paid cake detail: **Cake preparation Confirmed/Preparing/Ready-delivery/Completed**; payment-resolution feedback if encountered.

## 9. Customer account

Each account view: Page state Normal/Loading/Error. Empty is meaningful for addresses/notifications; profile still has account data. **Save result Normal/Error** and **Verification delivery Normal/Error** affect relevant actions.

### Profile — `#/account/profile`

- [ ] View/edit/cancel/save; names/mobile validation; failed save retains entries.
- [ ] Change email: empty/invalid/same/in-use email, incorrect password, delivery failure, valid code request.
- [ ] Verification dialog: incomplete/wrong code, **Expire code**, **Enable resend**, resend failure/success, change target email, cancel, successful update.
- [ ] Change password: wrong current, weak new, mismatch, show passwords, save failure/success, forgot-password link.
- [ ] Updated identity appears in account header/navigation; sign out and sign in again.

### Saved addresses — `#/account/addresses`

- [ ] Empty/one/multiple addresses, default badge; add/edit/cancel; validation and failed save.
- [ ] Set default, remove non-default/default/last address; inspect subsequent default selection.
- [ ] Map and optional fields; long address; coverage message; checkout uses updated address.

### Notifications — `#/account/notifications`

- [ ] **Load notification examples**; empty/populated and empty category.
- [ ] All, Orders, Subscriptions, Custom Cakes, Account & Security filters and counts.
- [ ] Email/SMS sent/failed feedback; saved transaction remains accessible; destination links.

## 10. Staff workspace

On **every route below**, repeat **Staff page state Normal/Loading/Empty/Error**, including Retry. Use **Load staff orders**. For every saving action, repeat **Staff save result Normal/Error** and verify retry retains appropriate input.

- [ ] `#/staff` Dashboard: Today/Next 7 Days; counts, stock alerts, scheduled/upcoming work, destination links, no-work range.
- [ ] `#/staff/production` Queue: search, each type/status/date filter, combined no-results, card/detail links.
- [ ] `#/staff/production/<id>` Detail: standard/subscription/cake, missing reference, requirements/reserved/available/shortage table, approved cake copy versus awaiting review, optional checklist.
- [ ] Detail transitions: Confirmed → Preparing → Ready; pickup → Completed. Confirmation/cancel/error; history attribution; duplicate clicks do not consume ingredients twice.
- [ ] Delivery-ready orders describe courier/owner handoff correctly and do not expose inappropriate pickup completion.
- [ ] `#/staff/inventory`: search; Available/Low stock/Out of stock; name/availability sort; ingredient detail; no results.
- [ ] Inventory Restock/Adjust dialogs: units, valid/zero/negative/invalid quantities, reasons, cancel, failure, success; on-hand/reserved/available values and badges update.
- [ ] `#/staff/movements`: ingredient/type/actor/date filters, empty range, pagination, movement dialog and source-order links; restock/adjustment/consumption/reversal rows where available.
- [ ] `#/staff/recipes`: product search, each product/variant, no results, units and quantities, inventory link; read-only presentation.
- [ ] `#/staff/calendar`: Day/Week/Month, Previous/Today/Next, select day, type/status/search, Show Completed, Fulfillment versus Subscription preparation basis; blocked and empty days, agenda counts, order links.
- [ ] `#/staff/notifications`: All/Unread/Orders/Inventory; acknowledge one/all; unread count and empty filter; detail links.
- [ ] `#/staff/account`: profile validation/save/error; read-only login email; current/new/confirm password validation and success/error.

## 11. Owner workspace

On **every route below**, repeat **Owner page state Normal/Loading/Empty/Error**, including Retry/Restore records. Use **Load owner examples**. Repeat every mutation with **Owner save result Normal/Error**.

For owner list filters: search, each offered type/status, date range including reversed dates, Newest/Oldest, Apply/Clear, no results, pagination boundaries, navigate away/back. For editable forms: cancel, save, retained failed draft, unsaved dismissal, discard, and reopen.

- [ ] `#/owner` Dashboard: metrics, attention states, links and empty summaries agree with records.
- [ ] `#/owner/orders`: All/Active/Needs attention/Ready/Completed tabs; order type, fulfillment, state, search/date/sort/pagination.
- [ ] `#/owner/orders/<id>`: standard, subscription purchase, subscription fulfillment, cake, unknown reference; payment/history/materials/customer/fulfillment information and permitted transitions.
- [ ] Start preparation/Mark Ready/Confirm handoff: confirmation, cancel, save error/success; no duplicate stock consumption; courier link eligibility.
- [ ] `#/owner/payments`: every offered payment filter, attempt history, amount/reference, held/released/consumed resource display, unresolved payment, order links.
- [ ] `#/owner/deliveries` and `#/owner/deliveries/<id>`: eligible/pending/booked/in-transit/delivered/failed/cancelled filters; destination, fee, courier reference/history.
- [ ] **Simulated courier response Success/Failure/Unknown**: book eligible Ready order, refresh, retry after failure; uncertain response avoids duplicate booking; terminal-state action disabling.
- [ ] `#/owner/inventory`: filters, ingredient details, stock actions, cost/threshold editing, invalid numbers, save failure/retry; totals and alerts update.
- [ ] `#/owner/recipes`: product/variant selection, recipe/cost breakdown, missing recipe where encountered; edit ingredients, add/remove row, duplicate/invalid quantities, default/custom overhead.
- [ ] Selling price and costing settings: valid/invalid price, markup, overhead, cancel/error/success; new purchase price changes while existing snapshots remain consistent.
- [ ] `#/owner/cake-requests`: filters, empty results, request link; `/<id>` original design, feasibility, versions, reject confirmation/cancel/error/success.
- [ ] Create quotation modal on `#/owner/cake-requests/<id>`: date, complexity charge, notes validation; live selections/add-ons/complexity/total breakdown; automatic two-day expiry; original fulfillment method retained and no delivery fee control or raw address summary; draft retention, issue/error/retry, unsaved dismissal/discard, focus and responsive layout. Legacy `/<id>/quotation` opens this modal over request details.
- [ ] `#/owner/cake-requests/<id>/quotation/<quotation-id>`: issued snapshot, version/state, amounts, invalid reference; accepted/payment-active request locks inappropriate changes.
- [ ] **Simulated notification delivery Success/Failure**: issue quotation, inspect delivery attempts, retry failed notification without issuing another quotation.
- [ ] Review production copy: approved notes/images, save/error/cancel; staff sees approved production content.
- [ ] `#/owner/subscriptions`: filters/product/status/progress, unpaid-enrollment link; `/<id>` four deliveries, original/current dates, resources, purchase/order links, deferment history.
- [ ] `#/owner/capacity`: Week/Month, calendar-cell date selection, Previous/Next, standard/subscription/cake pools, active holds, empty/full/over-limit values, allocation links.
- [ ] `#/owner/capacity/settings`: Week/Month blocked-date calendar, selected-date block/unblock actions, red blocked dates; block confirmation with required reason category/details, cancel, validation/save failure/retry; existing commitments remain scheduled.
- [ ] Capacity/timing settings: all limits, days/hours lead time, cutoff, invalid input, save/discard; new customer availability reflects changes.
- [ ] Subscription schedule add/edit: label, product/fallback scope, preparation/fulfillment weekdays, active/inactive, invalid input, failed save/retry; existing subscription dates stay consistent.

## 12. Connected journeys and state combinations

- [ ] Guest product → sign-in → bag → pickup → payment → confirmation → customer order → staff preparation → pickup completion.
- [ ] Delivery purchase → staff Ready → owner booking → courier progress → customer completed view.
- [ ] Subscription setup → payment → four-cycle detail → defer → customer order/staff calendar/owner capacity all show the same replacement date.
- [ ] Cake request → owner quote/revision → customer acceptance/payment → owner production copy → staff production → owner handoff.
- [ ] Failed payment → retry; expired payment → changed availability; delayed verification → locked checkout; paid resolution → help/status instead of pay-again action.
- [ ] Owner stock/price/schedule change while a customer draft exists: customer revalidation and actionable recovery.
- [ ] Failed save with a long form; error with active filters; no-results on final pagination page; modal on narrow mobile; loading after navigation away.
- [ ] Switch customer accounts: orders, addresses, notifications, subscriptions, and cake requests belong to the current customer.
- [ ] Role/session change with an open editable form: stale submission cannot silently apply under the new session.

## Issue log template

Copy for each problem:

```text
Checklist section / item:
Route and record:
Viewport / browser:
Role and starting fixture:
Mock Controls values:
Steps:
Expected:
Observed:
Screenshot:
Severity (blocks flow / incorrect behavior / visual):
Fix / retest result:
```

Some difficult states (resource conflicts, stale forms, payment resolution, missing recipes) depend on data changes rather than a dedicated inspector option. Record a blocked check with its missing setup instead of marking it passed. This checklist covers prototype UI behavior; real emails, payments, courier bookings, and backend persistence are simulated.
