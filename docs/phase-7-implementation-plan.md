# Phase 7 — Owner Management Implementation Plan

Date: October 8, 2026  
Status: Implemented in the browser-memory prototype on October 9, 2026. See [implementation handoff](phase-7-implementation.md) for routes, verification, and production limits.  
Coverage: 7.1–7.12 integrated into the existing customer, staff, and Phase 6 owner application.

## 1. Outcome and requirements

Implement Phase 7 inside the current Kitchen406 application using its existing header, footer, hero/page-introduction patterns, cards, typography, controls, and workspace layout. Correct the generator defects through shared components and state services, rather than embedding twelve independent exports.

The user confirmed **Phase 7 integration**, clarifying the initial mention of Phase 6. Phase 6 is already integrated and supplies the operational foundation.

Requirements and detailed corrections come from the [Phase 7 review](phase-7-owner-management-ui-review.md), [revision brief](phase-7-owner-management-ui-revisions.md), [Chapters 1–4](<../Chapters/Chapter 1.md>), and [ERD](../Chapters/ERD.md). Read the remaining chapters through [Chapter 2](<../Chapters/Chapter 2.md>), [Chapter 3](<../Chapters/Chapter 3.md>), and [Chapter 4](<../Chapters/Chapter 4.md>). Preserve the completed [Phase 6 integration](phase-6-implementation.md) and [paper-review fixes](phase-6-paper-revisions.md).

Keep the plain JavaScript `K406` modules, hash routing, and browser-memory prototype architecture. No framework migration is needed. Production database persistence, secure server authentication/authorization, provider integration, and scheduled jobs remain separate work; prototype simulations must not claim those guarantees.

## 2. Current application findings

| Existing source | Current behavior | Integration consequence |
| --- | --- | --- |
| `index.html`, `app/app.js` | Existing owner mount/modal and owner route lifecycle. | Register Phase 7 within the owner workspace; do not create another shell or root application. |
| `app/shell.js` | One header/footer switches customer/staff/owner navigation. | Keep the same brand shell and extend role links/account menu as needed. |
| `app/ui.js` | Shared `pageIntro`, `panel`, `button`, `field`, `badge`, `stat`, `table`, and `workspace`. | Extend existing helpers with compatible defaults instead of introducing a parallel component library. |
| `app/owner-ui.js`, `app/owner.js` | Owner formatting, forms, filters, pagination, selected routes, drafts, dismissal protection, and session-generation checks. | Reuse this lifecycle; split feature handlers into modules so Phase 7 does not become one large controller. |
| `app/styles.css`, `commerce.css`, `workspace.css`, `owner.css` | Shared tokens/cards and operational geometry; legacy `staff-*` classes are reused by owners. | Preserve appearance and selectors. Rename only if necessary; class names alone do not justify a broad refactor. |
| `app/products.js`, `product-data.js`, `catalog.js` | Product fixtures and variant prices already power purchases; categories are embedded in products. | Introduce catalog commands/category records around existing IDs and adapt all catalog consumers. |
| `app/pricing-state.js` | Editable BoMs, overhead inheritance, markup, cost suggestions, explicit final price updates. | 7.2 and 7.4 must use this authority, not maintain separate prices/recipes. |
| `app/inventory-state.js` | Shared ingredient stock, requirements, reservations, movements, and units. | Ingredients is a management view of the same inventory records. Preserve actual units, including gram-based fixtures where present. |
| `app/cake-data.js`, `cake-state.js` | Options/add-ons have prices in centavos, availability, and explicit ingredient quantities. | Add editing safely; do not apply a new size multiplier on top of quantities already sized without a migration rule. |
| `app/staff-state.js`, `session-state.js` | One staff preview account and one owner account, role guards and invalidation. | Add a staff registry and a restricted first-password-change flow; retain actor IDs and existing staff projections. |
| `app/account-state.js`, `operations-state.js` | Customer registry/buckets and cross-customer operational selectors. | Read customer activity without activating another customer's session. |
| `app/product.js`, `orders.js` | Review presentation is largely static; submissions mark a Set keyed to product/order item. Custom cake review is deferred by the current UI. | Introduce actual feedback records and update submission/public display as part of moderation integration. An owner-only review fixture store would be incomplete. |
| `app/notification-state.js`, `staff-state.js`, `owner-cake-state.js` | Customer events, staff/internal events, and owner quotation notification attempts are separate. | Provide normalized role-aware projections/outbox records without duplicating existing events or losing retries. |
| `app/operations-state.js` | Aggregates orders and prepaid purchase parents; existing types/statuses use prototype aliases. | Reports require explicit canonical mapping and deduplication, not a sum of every order/attempt. |

These findings come from source inspection. Fresh browser verification is part of implementation; this plan does not claim the proposed changes have been tested.

## 3. Visual consistency contract

The current application is the visual baseline. Generator screenshots supply information hierarchy and task ideas, not their independent shell, fonts, Tailwind configuration, spacing system, or hardcoded customer identities.

| Element | Implementation decision |
| --- | --- |
| Header | Reuse `shell.js`: Kitchen406 wordmark, sticky behavior, spacing, account menu, and responsive treatment. Preserve existing IDs/listeners. Owner pages use role-appropriate navigation without shopping controls. |
| Footer | Reuse the current brand description, surface, spacing, and copyright. Configure owner links rather than copying a generator footer. |
| Hero/page introduction | Preserve storefront/customer editorial heroes. All owner pages use the compact shared `pageIntro` variant with the same heading family, subtitle, spacing, and action styling as Phase 6. This is the operational hero; avoid twelve oversized decorative banners. |
| Cards/boxes | Reuse `.commerce-card`: white surface, subtle border, 8 px radius, 24 px desktop padding and existing compact padding. Statistics, previews, detail blocks, and form sections compose this surface. |
| Colors | Preserve `--canvas:#fbf9f6`, `--panel:#f5f3f0`, `--ink:#1b1c1a`, `--muted:#53443a`, `--accent:#8d4a14`, `--line:#e8e2d9`. Extend semantic status tones consistently with visible text. |
| Typography | Playfair Display headings and Plus Jakarta Sans body; reuse existing heading/control sizes. |
| Radius/spacing | Keep the intentional 6 px base/control radius and 8 px card radius. Named tokens can replace repeated values without changing appearance. |
| Workspace | Keep the current 1320 px operational width, sidebar/main grid, and mobile navigation treatment. Group Operations, Catalog, and Administration links to accommodate Phase 7. |
| Forms/actions | Shared labels, inputs/selects, validation, primary/secondary buttons, disabled/loading states, and touch targets. |
| Tables/cards | Reuse a table wrapper with contained scrolling; mobile cards, where useful, come from the same data collection. |
| Dialogs/details | Reuse `core.js` modal management and the owner mount. Prefer existing modal/detail-page patterns over copying arbitrary export drawers. Add a drawer variant only if multiple workflows justify it, with the same focus/dismissal behavior. |

### Component work

| Component | Current or proposed location | Work |
| --- | --- | --- |
| Brand shell/workspace navigation | Existing `shell.js`, `ui.workspace` | Extend links and active-section matching; do not duplicate the shell. Preserve access restrictions independently of link visibility. |
| Page intro/card/stat | Existing `ui.js` | Reuse existing API; add optional description/actions only where multiple screens need them. Ensure subtitle CSS matches nested markup. |
| Select/field error/form actions | Extend `ui.js`; owner adapters remain in `owner-ui.js` | Extract repeated select/error presentation with explicit IDs and owner event namespace. Validation stays in commands. |
| Status badge | Extend `ui.badge` | Add optional semantic tone with backward-compatible defaults. Domain callers map statuses; label text must not drive business logic. |
| Filters/table/pager | Existing helpers, selectively generalized | Reuse presentation and accessible labels; keep query state and filtering outside generic components. |
| Empty/loading/error/inline alert | Proposed small helpers in `ui.js` | Share consistent message/action layout across modules. |
| Record detail/confirmation | Existing owner modal/detail composition | Pass selected ID and version; preserve dirty-form dismissal, focus return, stale-session checks, and repeat-submit protection. |
| Shared chart frame | Proposed reporting presentation helper if reused | Use current card/title/legend styles and an accessible data table. No separate dashboard design system. |

Extract incrementally: migrate a representative Phase 6 page and a new Phase 7 page, compare them, then reuse the helper elsewhere. Preserve old call signatures to avoid breaking staff/customer pages. Escape user text with `K406.escape`; composed HTML slots accept trusted application markup only.

Capture fresh baseline screenshots of the storefront hero, account page, staff dashboard, owner dashboard/list/form before editing. Compare desktop and mobile with Mock Controls closed. Preserve customer editorial layouts while checking the shared header/footer and visual tokens across roles.

## 4. Proposed module and route structure

Names below are proposals, not files already implemented. Prefer merging closely related modules if the resulting code remains clear.

| Proposed state/service module | Responsibility |
| --- | --- |
| `catalog-state.js` | Categories; product/variant create/edit/status commands; shared visibility/eligibility selectors; versioning. Wrap existing product records and pricing commands. |
| `cake-config-state.js` | Validate option/add-on edits, mappings, units, availability, and documented size-scaling behavior over existing cake data. |
| `staff-account-state.js` | Staff registry, creation/edit/status/reset/setup commands, actor lookup, and session invalidation. |
| `feedback-state.js` | Feedback by purchased order item, public/owner projections, moderation metadata, and image records. |
| `marketing-state.js` | Seasonal occasions and marketing drafts; simulated generation/regeneration outcomes, review transitions, and edit state. |
| `reporting-state.js` | Read-only transaction normalization, period selectors, cost coverage, product grouping, and reconciled drill-downs. |
| `owner-notification-state.js` | Owner feed/outbox projection over existing events/attempts, shared acknowledgement, and related-record routing. |

Proposed renderer modules: `owner-catalog.js` (7.1–7.4), `owner-cake-config.js` (7.5), `owner-marketing.js` (7.6/7.10), `owner-accounts.js` (7.7/7.8), `owner-feedback.js` (7.9), `owner-reports.js` (7.11), and `owner-settings.js` (7.12).

Extend existing inventory and session commands rather than creating competing ingredient or owner-account stores. Extract shared credential validation only where it can operate on an explicit account; do not temporarily switch the active customer to reuse their settings form.

| Subphase | Proposed route |
| --- | --- |
| 7.1 Products | `#/owner/products` |
| 7.2 Product Editor | `#/owner/products/new`, `#/owner/products/:id/edit` |
| 7.3 Categories | `#/owner/categories` |
| 7.4 Ingredients | `#/owner/ingredients`, optional selected `:id` |
| 7.5 Cake Options / Add-ons | `#/owner/cake-options`, tab/selected ID retained in route or controller state |
| 7.6 Seasonal Occasions | `#/owner/occasions` |
| 7.7 Staff Accounts | `#/owner/staff-accounts`, optional selected `:id` |
| 7.8 Customer Accounts | `#/owner/customers`, optional selected `:id` |
| 7.9 Review Moderation | `#/owner/reviews`, optional selected `:id` |
| 7.10 Marketing Drafts | `#/owner/marketing`, optional selected `:id` |
| 7.11 Reports | `#/owner/reports` |
| 7.12 Notifications / Settings | `#/owner/notifications`, `#/owner/outbox`, `#/owner/settings` |

Register routes in the existing owner dispatcher, retaining current Phase 6 routes. Exact-route matching must distinguish `new` and `:id/edit`. Unknown/invalid IDs show not-found state instead of a default sample. Cache filters and selected records per module, clear stale state on sign-out/reset, and restore list context on Back.

Load new state modules after their existing dependencies, then renderers, then the owner controller/fixtures, with `app.js` remaining the final bootstrap. Update `index.html` deliberately; do not rely on accidental global initialization order.

## 5. Data and command contracts

- **One authority per entity:** use existing product/variant, inventory, customer, order, subscription, and quotation IDs. Category records need stable IDs mapped to current category keys. Staff currently uses a preview account object; migrate it into the registry without losing history attribution.
- **Validated commands:** owner commands check role, target ID, input, session generation, and record version. Return validation/conflict errors before mutation. Update shared state first, then render/toast. A simulated failure leaves saved records unchanged.
- **Snapshots:** price/catalog/recipe/option changes affect future selection and calculations; do not rewrite paid order items, accepted quotations, existing material requirements, or subscription commitments.
- **Units/money:** retain actual inventory base units. Cake prices are centavos; catalog/pricing uses pesos. Use explicit conversions at boundaries and consistent rounding in reporting.
- **Reactivity:** a successful mutation refreshes affected owner pages and customer/staff projections through existing change hooks. Avoid a chain of new monkey-patched wrappers.
- **Reset/fixtures:** extend the central preview reset to restore new catalog metadata, categories, staff records, feedback, occasions/drafts, notifications, and filters. Existing `resetProductData` restores prices/variants only, so it must be expanded for newly editable fields. Seed records idempotently and revoke temporary image URLs on replacement/reset.
- **Authorization:** hiding owner navigation is not a data guard. Owner-only selectors and commands must deny staff/customer callers in the prototype; eventual server authorization remains mandatory.

## 6. Implementation by subphase

### 7.1 — Products

**Revisions:** Replace toast-only status/bulk actions; synchronize table/grid; make filters/sort/pagination real; correct variant status terminology; connect Add/Edit and related links.

**Implementation:** Add catalog selectors over `A.products` with category/status/subscription/availability data. Render table and cards from the same filtered page. Store selection by ID; default Select All to the visible page. Use catalog commands for activation/deactivation and existing pricing/recipe/inventory links for dependencies. Separate catalog state, variant state, and derived stock availability.

**Integration:** Update storefront/product/subscription eligibility consumers and checkout validation so inactive/unavailable items cannot enter new purchases through a stale cart or direct link. Existing paid commitments remain unchanged.

**Acceptance:** List/grid agree; bulk actions affect only selected records; saved status is reflected throughout the app; historical orders remain readable.

### 7.2 — Product Editor

**Revisions:** Real create/edit/save/cancel, variants/images, validation, dynamic preview and dirty state, usable variant actions, owner-controlled pricing.

**Implementation:** Bind a draft copy to product ID/version. Validate required name/category and at least one valid variant; use the existing positive-price policy and pricing command. Referenced variants become unavailable rather than being destructively deleted. Use local file previews for images; reuse common form sections and card preview. Missing BoM/costing must be explicit, not replaced by an invented default recipe.

**Integration:** Derive display price from numeric variants instead of allowing `product.price` and variant prices to diverge. Route to Phase 6 recipes/costing for BoM, markup, and overhead. Ensure newly created products have explicit recipe readiness before ordering.

**Acceptance:** Save/reopen matches entered values; Cancel restores saved state; final price changes only through an owner save; images/variants are manageable at narrow widths.

### 7.3 — Categories

**Revisions:** Persist name/status changes, unique-name validation, correct View Products navigation, consistent category fixtures.

**Implementation:** Initialize categories from current catalog keys/labels; validate normalized unique names; render counts from linked products. Product editors and list filters read the same category collection. Category changes refresh labels without breaking existing product IDs.

**Integration:** Prototype default: inactive categories exclude assigned products from new storefront selection and purchase, including direct links/stale carts, while retaining products/history. This is a proposed policy based on the revision brief, not a rule proven solely by the ERD; record it for production confirmation.

**Acceptance:** Category changes appear in 7.1/7.2; duplicates fail; View Products retains the category filter; reactivation restores eligible items without altering individual statuses.

### 7.4 — Ingredients

**Revisions:** Remove unsupported manual active/inactive stock lifecycle, load the correct ingredient, protect units, implement save and list controls, keep single-level materials.

**Implementation:** Extend existing inventory definition commands for name/unit/cost/threshold with owner checks and versioning. Read stock status from inventory availability rules. Block unit changes once stock, recipe/cake references, reservations, or history would be reinterpreted; do not implement implicit conversion through a warning dialog. New ingredients begin with zero physical stock; restock remains Phase 6 Inventory work.

**Integration:** Cost changes feed Phase 6 pricing suggestions, threshold changes feed alerts, and dependencies link to the actual recipes/options. Keep physical movements separate. Use existing seed units rather than copying the generator's eggs/vanilla examples blindly.

**Acceptance:** Each editor shows the selected material; no definition save silently changes stock; costs update suggestions without overriding selling prices; referenced units cannot be corrupted.

### 7.5 — Cake Options / Add-ons

**Revisions:** Correct per-record ingredient mapping, unit labels, actual saves/counts, duplicate/quantity validation, tab filtering, and scaling explanation.

**Implementation:** Add commands over `A.cakeData.options/addons`. New records start without inherited example materials. Validate option type, nonnegative price, unique ingredient IDs and positive quantities. Resolve units from inventory. Before exposing editable scale factors, establish how existing explicitly sized quantities migrate: preserve current calculations with a neutral factor initially, then introduce an explicit baseline/scaling rule without double multiplication. Keep packaging and per-addon quantities distinct.

**Integration:** Update builder choices/estimates and future material requirements; preserve submitted/issued/accepted snapshots. Expand in-house prepared intermediates into base ingredients; purchased direct inputs require clear sourcing.

**Acceptance:** Different options load different mappings; units follow ingredients; customer add-on quantities multiply correctly; changed options do not rewrite historical quotations.

### 7.6 — Seasonal Occasions

**Revisions:** Save actual name/date/status records, validate dates, compose filters, derive counts/timestamps, retain automatic-generation boundaries.

**Implementation:** Add occasion records/commands in `marketing-state.js`; validate required dates and end ≥ start. Active means enabled for consideration, not necessarily happening today. Support overlaps without inventing a unique-date constraint. Link occasions to their generated drafts.

**Integration:** Expose eligible context to the draft-generation simulator. Saving an occasion must not immediately generate or publish a post. Deactivation preserves existing drafts.

**Acceptance:** Save/reopen and filtering work; invalid dates fail; disabling an occasion does not delete drafts or publish anything.

### 7.7 — Staff Accounts

**Revisions:** Replace missing handlers, remove stale IDs, bind actions to the selected account, implement create/edit/reset/status, validate credentials and setup state, correct audit promises.

**Implementation:** Create a staff registry containing the existing preview account. Keep `A.staff.account` resolving the signed-in registry record; preserve its ID for historical actors. Reuse credential validation/hash helpers for local simulation with explicit target accounts. Add unique-email checks across customer/staff/owner records, temporary-password confirmation, and first-login setup state.

**Critical dependency:** Existing `S.allowed()` requires setup completion, so a new setup-required account cannot use ordinary staff password settings. Provide a restricted first-password-change route/form reachable after valid temporary credentials but before operational access; it must not grant access to production/customer/financial data. Reset/deactivation invalidates applicable sessions and stale forms.

**Integration:** Adapt `auth.js`, `staff-state.js`, and `session-state.js` to authenticate the selected staff registry account. Retain fixed Staff permissions. Do not claim permanent complete audit history unless explicitly modeled.

**Acceptance:** Two accounts can be managed independently; mismatch/duplicate validation works; setup must complete before operations; deactivation blocks access while historical work retains its actor.

### 7.8 — Customer Accounts

**Revisions:** Load selected customer data, synchronize mobile/desktop, implement phone search and actual totals, connect activity, handle detail errors without fallback identities.

**Implementation:** Read `A.account.records`, account/address buckets, and cross-customer operational selectors without switching `A.account.current`. Build a read-only customer projection keyed by customer ID. Search normalized phone/name/email; combine verification/status filters; derive mobile/table from the same page.

**Integration:** Related orders/subscriptions/cakes/reviews open filtered owner views. Add optional customer filtering to existing Phase 6 lists where required, preserving their current defaults. Read archived/default addresses separately from order address snapshots.

**Acceptance:** Each drawer matches its row and activities; customer session remains unchanged; staff cannot query these owner projections. No new customer suspension/editing power is introduced by default.

### 7.9 — Review Moderation

**Revisions:** Replace fixture swapping, implement valid reason selection, hide/restore the same feedback, preserve content/media/purchase identity, repair filters/lightbox/states.

**Implementation:** Introduce feedback keyed to a stable purchased order-item identity, with customer ID, rating, optional comment, up to two images, visible/hidden status, and supported moderation metadata. Existing order/item keys may serve as an adapter, but define one stable identity rather than relying on product ID. Replace Set-only submission and static public reviews with shared feedback selectors. Public projection excludes hidden reviews; owner projection includes them.

**Integration:** Connect the existing review composer and completed-order review links, including quotation-backed custom cake items supported by the ERD. Product ratings/counts and reviewed indicators derive from real records. Retain purchase eligibility and one review per order item. Remove unsupported free-text persistence promises unless a documented schema extension is selected.

**Acceptance:** Submit as a customer, hide as owner, inspect public feed, restore the same record. Review text/rating/photos never change during moderation; honest criticism is not auto-hidden.

### 7.10 — Marketing Drafts

**Revisions:** Actual draft selection, saved captions, image regeneration outcomes/counts, correct approval/rejection, honest copy/download feedback, consistent draft IDs.

**Implementation:** Add explicit draft records with canonical categories/statuses, product/occasion references, caption/image, edit/regeneration metadata, reviewer/time, and version. Commands reject stale review actions and preserve unsaved captions during image regeneration. Approval resolves unsaved edits explicitly; rejection persists rejected state and updates the queue. Copy/download use real browser outcomes.

**Generation boundary:** Implement deterministic mock generation/regeneration in Mock Controls to demonstrate the automatic-event workflow without external calls. A production scheduler/Gemini adapter will supply context and output later. Do not add an owner-facing initial manual-generation workflow, social publishing, or scheduled posting.

**Integration:** Read current catalog/availability/subscription/occasion context and emit a supported owner draft-ready event. Each notification links to that same draft ID. Mark approval as ready for manual use, never as posted to Facebook.

**Acceptance:** Independent drafts retain their edits/statuses; regeneration preserves caption and reports failure correctly; clipboard/download failures do not claim success; nothing publishes externally.

### 7.11 — Reports

**Revisions:** Reconcile chart/table quantities and drill-downs, expose cost coverage, implement periods/metrics, use selected-product basis, eliminate duplicate subscription revenue.

**Implementation:** Build a pure reporting projection over shared transactions and paid purchase parents. Map current prototype aliases to canonical order types, deduplicate transactions and successful attempts, and aggregate by one Manila date basis. Renderer receives a complete computed report so cards/charts/tables/drill-downs cannot use unrelated fixtures.

**Proposed prototype basis, to confirm before production:** use first successful payment date for sales activity; include eligible paid purchases, show paid-resolution receipts separately, and exclude unpaid/cancelled and weekly fulfillment records from sale counts. Exclude delivery fees from product revenue/margin and show them separately. Subscription units represent the purchased four-delivery commitment, clearly labelled. Completed/fulfilled activity is a separate operational measure. Do not call this a settled accounting policy from the paper.

**Cost basis:** Use historical price snapshots for revenue. Label current recipe/overhead estimates explicitly when historical complete cost snapshots are unavailable; do not present them as actual historical profit. Include both revenue and cost only for items with a complete comparable basis. For unsupported cake/subscription costing, show incomplete coverage rather than inventing cost. Every drill-down uses the same basis as its parent total.

**Fixture correction:** If retaining the generator's rows, its September 12 drill-down is six transactions/₱4,880. Complete-cost coverage is ₱79,760 revenue, ₱41,420 cost, ₱38,340 margin, or 48.1%; total revenue is ₱84,560 with ₱4,800 excluded from margin coverage. Prefer deriving equivalent cases from actual shared fixtures rather than hardcoding these totals.

**Acceptance:** Period changes update all views; cost coverage reconciles; one enrollment plus four fulfillments yields one paid sale; catalog edits do not alter historical sales; owner-only reports expose no data to staff.

### 7.12 — Owner Notifications / Settings

**Revisions:** Correct outbox identity, combined filters/counts, shared read acknowledgement, working profile/password/email/signout, supported notification types, and removal of stale payment overrides.

**Implementation:** Build normalized owner feed/outbox selectors over existing staff/internal events, customer channel events, and quotation attempts. Preserve source IDs and send outcomes; do not invent retry history from grouped channel summaries. Record new per-channel attempts where required and label legacy events whose attempt detail is unavailable. Shared acknowledgement writes back to the same internal event; retain staff-safe messages/links and owner-only alerts.

**Settings:** Operate on `A.session.owner`, not `A.account.current`. Reuse validation and generation-cancellation patterns through explicit-account helpers. Implement local owner password/profile updates, OTP-based email change, and existing session signout. Current email remains until verification succeeds. Abort stale asynchronous work after sign-out or role change.

**Integration:** Use supported SystemNotification types; additional failed-payment/review/batch events require explicit mapping or schema decisions. Keep pending/sent/failed send status separate from retry scheduling. Preserve Phase 6 quotation failure/retry behavior without adding a false automatic retry promise. Add notifications/settings to shell and owner navigation.

**Acceptance:** Different outbox rows open their own details; filters/counts agree; read state is shared where intended; invalid credentials/OTP cannot change account data; signout closes owner access; no notification action can mark an order paid.

## 7. Delivery sequence and dependencies

| Batch | Work | Completion gate |
| --- | --- | --- |
| 1. Baseline and contracts | Fresh screenshots/current-suite baseline; identify data IDs, money/units, schema defaults, route/nav registration, reset boundaries. | Record current behavior and known pre-existing failures before editing. |
| 2. Shared presentation | Extend only needed components; standardize owner intro/cards/forms/statuses; pilot one Phase 6 page and one Phase 7 list/form. | Visual parity and backward-compatible existing callers. |
| 3. Catalog/material configuration | 7.3 → 7.4 → 7.1/7.2 → 7.5; adapt storefront, checkout, recipe and cake consumers. | Saved configuration affects future purchases correctly without changing historical commitments. |
| 4. Accounts | 7.7 registry/setup/auth integration; 7.8 read-only customer/activity views; owner credential helpers. | Correct selected identities, permission boundaries, setup and deactivation behavior. |
| 5. Feedback | Shared feedback records, customer submission/public feed, then 7.9 moderation. | End-to-end submit/hide/restore across roles. |
| 6. Marketing | 7.6 occasion state, 7.10 draft lifecycle and simulated generation. | Record-correct editing/regeneration/review/manual export. |
| 7. Notifications/settings | 7.12 projections, source acknowledgement, per-channel traceability, owner settings. | Correct links/statuses/counts and preserved Phase 6 retry behavior. |
| 8. Reports | 7.11 over shared settled records and explicit basis; reconciled examples. | Totals/coverage/drill-downs reconcile without duplicate enrollment revenue. |
| 9. Integration and documentation | Cross-role regressions, responsive/keyboard review, fixture/reset checks, actual verification record. | All twelve subphase acceptance checks pass or remaining blockers are explicitly recorded. |

Each batch should be independently reviewable. Do not wait until all screens are rendered to connect customer and staff consumers. Avoid broad rewrites unrelated to an identified integration need.

## 8. Verification strategy

### New targeted coverage

- Proposed `verification/phase7-state.cjs`: catalog/category invariants, referenced-unit protection, cake mappings/scaling, account setup/status commands, review uniqueness/moderation, draft transitions, reporting arithmetic/deduplication, and notification identity/read state.
- Proposed `verification/phase7-browser.cjs`: all new routes, selected-record loading, validated save/cancel, filter/pagination context, modal/focus behavior, errors, role denial, and end-to-end scenarios.
- Add focused cases to existing suites only where Phase 7 changes a shared workflow. Do not duplicate implementation details as tests.

### Existing regression coverage

| Shared change | Existing suites to run |
| --- | --- |
| Owner UI and operational links | `owner-browser.cjs`, `owner-integration.cjs`, `phase6-revisions.cjs` |
| Catalog/prices/checkout/reviews | `phase2-browser.cjs`, relevant `browser-smoke.cjs` and `browser-edge.cjs` cases |
| Staff registry, inventory, actor access | `phase5-browser.cjs`, `phase5-revisions.cjs` |
| Product eligibility and commitment preservation | `subscription-state.cjs`, `subscription-browser.cjs` |
| Cake options/quotation and account/modal behavior | `phase4-state.cjs`, relevant `phase4-browser.cjs` cases |

Run JavaScript syntax checks on touched scripts. Locate/restore the local Node runtime before implementation testing if unavailable on PATH. Browser suites that share the Chrome debugging page must run sequentially. Inspect existing documented selector drift before attributing old failures to new changes. Record new results; historical passing counts are not a fresh pass.

### Visual and interaction checks

Check 1440, 768, 390, and 320 px layouts with the inspector closed. Verify a single header/footer, consistent headings and cards, active workspace navigation, no whole-page horizontal overflow, readable tables/cards, and accessible form actions. Test keyboard selection, Tab/Shift+Tab, Escape, focus restoration, invalid inputs, dirty dismissal, failed saves, and missing IDs.

Critical journeys: owner edits product → customer sees it; owner changes material cost → Phase 6 suggestion updates; new staff completes setup → production works → deactivation blocks access; customer submits review → owner hides/restores → public feed changes; draft approval/rejection → owner feed follows the same ID; paid subscription with four fulfillments → report counts one purchase; reset restores all baseline state without orphan records.

## 9. Decisions, defaults, and risks

| Area | Plan default / unresolved choice |
| --- | --- |
| Ingredient lifecycle | Keep ERD stock states and omit manual archival status. Separate archival design is future schema work. |
| Units | Block destructive reinterpretation of referenced units; coordinated conversion is not silently introduced. |
| Cake scaling | Preserve existing explicit quantities while defining baseline/scaling semantics; no double-scaling migration. |
| Category inactivity | Proposed exclusion from new purchase paths; retain data/history and document the policy. |
| Customer administration | Read-only owner directory; suspension/editing authority is not added by implication. |
| Moderation explanation/audit | Use current enum and supported metadata; a free-text explanation or full action history requires an explicit model extension. |
| Staff audit | Preserve actor references/creator/timestamps; do not promise complete permanent logs without storage. |
| Reporting policy | Prototype basis is proposed in 7.11; confirm recognition/date/fees/units and cost history before production. |
| Notifications | Preserve existing retry evidence; unsupported event types/retry metadata require deliberate model changes. |
| Credentials | Use local simulation only; existing browser hashing is not a production credential-storage design. Owner email change follows OTP. |
| Automatic generation | Mock Controls simulate events; a durable scheduler and Gemini integration are later production services. |

Highest integration risks are duplicate data stores, stale product/recipe snapshots, new staff bypassing setup, reviews disconnected from completed purchases, double-counted subscription reporting, and leaking owner information through shared staff components. Address these through explicit services and cross-role tests, not just visual fixes.

## 10. Completion and handoff

Deliver all twelve integrated subphases, shared components/styles used by their renderers, connected customer/staff/Phase 6 behavior, idempotent fixtures/reset, and actual verification evidence. Create `docs/phase-7-implementation.md` describing implemented routes, preview entry, state/reset limits, resolved revisions, and remaining production/policy work; update `verification/README.md` with executed checks and representative screenshots.

Completion requires correct record-specific actions, truthful save/error feedback, reconciled reports, preserved role boundaries, and visual consistency with the current app. Static screenshot similarity alone does not satisfy the integration.
