# Phase 6 — Owner Operations Implementation Plan

Date: October 6, 2026  
Status: Proposed implementation; application changes have not started under this plan.  
Coverage: 6.1–6.12, integrated with the existing customer and staff application.

## 1. Outcome and source of truth

Build Owner Operations inside the current application, using the same brand shell, visual language, records, and business workflows. The generated screens provide useful page layouts; they are not independent applications to embed or copy wholesale.

This plan translates the [Phase 6 review](phase-6-owner-operations-ui-review.md) and [revision brief](phase-6-owner-operations-ui-revisions.md) into implementation work. Their detailed findings remain the acceptance baseline, with the integration clarifications below. Requirements come from [Chapter 1](../Chapters/Chapter%201.md), [Chapter 2](../Chapters/Chapter%202.md), [Chapter 3](../Chapters/Chapter%203.md), [Chapter 4](../Chapters/Chapter%204.md), the [ERD](../Chapters/ERD.md), and the [confirmed Phase 5 reservation policy](phase-5-paper-revisions.md).

Keep the existing plain JavaScript, `K406` modules, hash routing, and browser prototype architecture. No framework migration is needed for this phase. Real server authorization, durable transactions, provider integration, and database migrations belong to the production integration work; browser guards and simulated responses must not be described as those guarantees.

Products/categories, account administration, moderation, marketing, and detailed reporting remain Phase 7. Phase 6 includes the recipe and selling-price controls specified in its revision brief.

## 2. Current application findings

| Existing implementation | Integration consequence |
| --- | --- |
| `app/shell.js` renders one header/footer and switches between customer and staff navigation. | Extend this shell with owner mode; do not add a second header/footer in owner pages. |
| `app/ui.js` provides page headings, panels, buttons, fields, badges, and statistics. Buttons currently emit `data-staff`; field IDs start with `staff-`. | Make component event namespaces and ID prefixes configurable while preserving existing callers. |
| `app/app.js` owns route dispatch; `index.html` declares page/dialog mounts and ordered scripts. | Register one owner mount and explicit owner routes within the existing lifecycle. |
| Customer commerce and subscription state can live in `account-state.js` account buckets. Subscription purchases are separate from weekly commerce orders. | Owner queries must aggregate all customers and include purchase parents without changing the active customer. |
| `staff-state.js` owns fulfillment permissions, transition versions/history, and staff-safe projections. | Extract shared fulfillment commands; owner access must not impersonate staff or expose financial data through staff responses. |
| `inventory-state.js` owns stock, requirements, reservations, and hardcoded recipes; stock commands currently authorize staff. | Extend the existing inventory authority, add editable recipes/costs, and authorize owner commands explicitly. |
| `staff-integration.js` wraps commerce, cake, subscription, and inventory operations. | Move touched shared rules into explicit services incrementally; avoid adding another stack of owner wrappers. |
| Capacity is split between standard-order scans, subscription allocations, and cake holds. Some queries use only the active customer's state. | Introduce a shared capacity interface and migrate to one coherent allocation lifecycle before owner capacity controls ship. |
| Cake amounts use centavos while commerce values use pesos. | Add explicit conversion/rounding boundaries; never pass unqualified numeric amounts between these modules. |
| Subscription preparation dates can be derived from mutable schedule settings. | Snapshot existing schedule commitments before allowing settings edits. |

Earlier implementation-plan documents contain proposed filenames that are not necessarily implemented. The file map below distinguishes current files from new proposals.

## 3. Consistent design and reusable components

### Visual baseline

Use the current customer/staff application as the visual reference, rather than the different defaults bundled into each generated export.

| Element | Implementation decision |
| --- | --- |
| Header | Keep the existing Kitchen406 wordmark, height, typography, spacing, sticky behavior, account menu, and responsive treatment. Switch navigation and shopping controls according to the authorized workspace. Preserve existing element IDs and listeners. |
| Footer | Reuse the existing brand description, colors, spacing, and copyright. Supply owner workspace links through shell configuration. |
| Hero/page introduction | Keep existing storefront and custom-cake editorial heroes. Owner pages use one compact `pageIntro` with the same heading family, text colors, spacing, and action styling. Dashboard may add a brief greeting/date, without creating a separate oversized hero system. |
| Colors/fonts | Retain `--canvas: #fbf9f6`, `--panel: #f5f3f0`, `--ink: #1b1c1a`, `--muted: #53443a`, `--accent: #8d4a14`, and `--line: #e8e2d9`; Plus Jakarta Sans body and Playfair Display headings. Reuse established semantic status colors. |
| Boxes/cards | Reuse the white, bordered commerce cards and their spacing. Current cards use 8 px corners while the base radius token is 6 px; retain those intentional card/control values, optionally naming separate tokens. Do not flatten both values into a new radius. |
| Workspace geometry | Share the existing staff workspace grid/sidebar and responsive behavior. Use the staff workspace width for operational pages and existing commerce widths for customer pages. This is a shared layout variant, not a new owner design. |
| Forms/actions | Reuse buttons, labels, input spacing, validation, focus states, and disabled/loading treatment. Use one primary action hierarchy per page/dialog. |
| Tables/details | Shared table wrapper, toolbar, pagination, and detail panels; local horizontal table scrolling where needed. Never make the whole page scroll sideways. |
| Dialogs | Extend the current modal manager for owner content, focus return, Escape/Tab behavior, dirty-form dismissal, and cleanup. Use full-width mobile details where appropriate. |

### Component work

Extend `app/ui.js` with backward-compatible helpers for `workspaceLayout`, `workspaceNav`, `filterToolbar`, `dataTable`, `pagination`, `emptyState`, `inlineAlert`, and `statusTimeline` only when used by multiple screens. Continue using `pageIntro`, `panel`, `stat`, `button`, `field`, and `badge`.

- Add an explicit action namespace and field ID prefix. Staff defaults remain compatible; owner controls emit `data-owner` and unique owner IDs.
- Keep business rules outside markup helpers. For example, a status badge receives a domain-specific label/tone, rather than deciding whether an order is dispatchable.
- Escape record text. HTML slots accept composed application markup only; owner notes, names, and provider messages must not become executable markup.
- Extract shared workspace geometry from `staff.css` into proposed `workspace.css`. Add `ui.css` only for shared styles actually extracted from current files. Leave owner-specific calendar and quotation arrangements in `owner.css`.
- Consolidate existing shared helper delegation in its logical UI initialization instead of relying on `staff-integration.js` to redirect commerce helpers. Preserve existing signatures and output during this move.
- Adopt shared components in staff and owner screens first. Update matching customer primitives where safe; do not combine this phase with a wholesale rewrite of working customer layouts.

Before building all pages, approve the implementation internally against baseline screenshots of the current catalog, customer account/cake page, and staff dashboard: same shell, typography, surfaces, action styling, and card spacing. Check 320, 390, 768, and 1440 px widths. This is an implementation verification gate, not a requirement for a separate user approval round.

## 4. Proposed code organization

Names below are proposed; responsibilities and dependency boundaries are the important contract.

| File/module | Work |
| --- | --- |
| Existing `index.html`, `app/app.js` | Add owner view/dialog mounts, assets, route registration, page titles, heading focus, and leave cleanup. |
| Existing `app/shell.js`, `app/ui.js`, `app/core.js` | Configurable workspace shell/components; extend modal cleanup and stale-session handling. |
| New `app/session-state.js` | Shared current actor, account status, canonical role, session generation, and capability predicates; adapt current customer/staff entry points. |
| New `app/operations-state.js` | Cross-customer record selectors, normalized order/payment projections, ID lookup, and dashboard queries over existing stores. No duplicate owner order database. |
| New `app/fulfillment-state.js` | Shared transition validation, versions, operation keys, history, and effects; staff and owner delegate to it. |
| Existing `app/inventory-state.js`; new `app/pricing-state.js` | Inventory remains stock authority. Add editable variant BoMs, base-unit costs, cost calculations, and explicit price approval. |
| Existing `app/scheduling.js`; new `app/capacity-state.js` | Shared eligibility and allocation lifecycle across all three capacity pools, blocks, and configuration. |
| New `app/delivery-state.js` | Eligible dispatch selector, one-active-booking command, courier states/history, and replaceable demo provider adapter. |
| Existing `app/cake-state.js`, `app/subscription-state.js`, `app/production-reference.js` | Separate owner commands from customer ownership checks; preserve snapshots and customer workflows. |
| New `app/owner.js`, `app/owner-ui.js` | Owner route/controller lifecycle and owner-specific composition; shared primitives remain in `ui.js`. |
| New `app/owner-orders.js` | Dashboard, orders/details, payments, and delivery page renderers/controllers. Split further only if implementation size warrants it. |
| New `app/owner-inventory.js`, `app/owner-cakes.js`, `app/owner-subscriptions.js`, `app/owner-scheduling.js` | Feature controllers/views for the remaining subphases. |
| New `app/workspace.css`, `app/owner.css`; optional extracted `app/ui.css` | Shared operational geometry and limited feature-specific styles. |

Load services after the stores they consume and before owner controllers; register all controllers before final application initialization. Replace touched wrapper dependencies in stages and verify the resulting script order. Existing staff/customer modules retain adapters until their callers are migrated.

## 5. Shared state and command rules

### Access, ownership, and navigation

The owner maps to ERD role `admin`; “Owner” is its UI label. Check signed-in state, account status, setup eligibility, and capability both when opening a route and when executing a command. Use the developer inspector for an owner preview account, following the existing staff-preview pattern.

Do not call customer activation to inspect or mutate another customer's records. Read customer buckets through repository selectors and resolve commands by stable IDs. Preserve customer ownership checks and the staff-safe projection; adding costs to inventory must not automatically add them to staff DTOs.

On sign-out, account switch, or route departure, invalidate pending work with session/view generation checks and clean up dialogs. A delayed save must not mutate a record under a different actor. Unknown IDs show Not Found; unauthorized routes show the existing blocked/access treatment without briefly rendering private data.

### Records, financial values, and histories

- Aggregate standard orders, subscription purchase parents, weekly fulfillments, and cake purchases. Deduplicate by stable order ID, including cake orders mirrored into commerce state.
- Preserve distinct order, payment, hold, courier, request, quotation, and subscription states. Labels such as Needs Attention are derived filters.
- Count subscription payment once at its purchase parent. Weekly fulfillment rows represent prepaid work and must not add duplicate revenue.
- Introduce named money adapters. New financial commands use integer centavos; existing peso-based consumers receive explicit conversions. Round at defined currency boundaries and test against 100-fold errors.
- Keep order price/address snapshots, issued quotation versions, and committed material requirements unchanged by later catalog/recipe edits. Recipe changes apply to new requirements by default; rewriting committed requirements would need an explicit reconciliation workflow.
- Require actor, expected version, and operation key for state-changing commands. Validate all prerequisites before applying linked mutations; failures leave the original state intact. In-memory atomic behavior is a prototype contract, not a database transaction guarantee.
- Use a shared internal event path with entity references and role-aware destination links. Extract or adapt staff-owned events so owner notifications do not navigate to staff-only routes. Keep notification dispatch outcomes separate from the business action.

### Inventory and capacity

Retain the confirmed policy: hold ingredients at checkout; confirm reservations after payment; consume once at preparation. For subscriptions, reserve all four capacity dates, reserve first-delivery ingredients at checkout, then attempt the next chronological unprepared delivery after preparation. Restocking retries eligible shortages without double reservation.

Inventory units come from current inventory records. The generated brief's piece-based Eggs example must not override the actual prototype's gram-based Eggs record. Support explicit compatible conversions, such as kg to g; never infer g-to-pieces conversions. Physical counts below reservations are valid shortage observations, not reasons to erase commitments.

Introduce a capacity facade first, then migrate standard inferred commitments, subscription allocations, and cake holds into a coherent ID-based ledger. Migrate each commitment once and disable its old counting path in the same step. Preserve held/confirmed/fulfilled/released/expired history and original/replacement allocation IDs. Only active relevant usage reduces availability; paid-resolution orders do not become confirmed production allocations merely because payment succeeded.

All customer checkout and owner calendar queries must use the same global eligible records, bakery-local clock, blocks, lead time, cutoff, stock, and capacity rules. Support configured hours/days and time precision while retaining the no-same-day rule. Preserve current configured defaults until explicitly changed; generated example values and subscription preparation days must not invent standard-fulfillment closures.

Before enabling schedule edits, snapshot preparation/fulfillment commitments for existing subscriptions. Editing settings affects future offerings; an intentional deferment updates the affected commitment through its own validated command.

## 6. Implementation by subphase

Every subsection inherits the shared rules above and the detailed acceptance checks in the revision brief.

### 6.1 — Owner Dashboard

**Route:** `#/owner`  
**Revise:** Conflicting references, hardcoded counters/dates, duplicate sales, inquiry slot claims, and disconnected links.

**Implement:** Build dashboard selectors over `operations-state` and capacity/inventory services. Label fulfillment-date counts separately from payment-date totals. Render shared introduction/stat/cards; derive attention entries with entity links. Cake inquiries remain an inquiry count, not capacity usage. Refresh derived results after successful commands and show distinct load/empty/error states.

**Verify:** One order retains its identity through dashboard links; preparation, pickup completion, booking, and restock update appropriate summaries. One subscription purchase contributes one payment.

### 6.2 — Orders

**Route:** `#/owner/orders`  
**Revise:** Decorative quick filters, inconsistent item totals, missing purchase parents, and mismatched details.

**Implement:** Use one query pipeline: search + type + status + method/date + quick grouping, then sorting and pagination. Preserve query state when returning from details. Cover all four ERD order types, with parent/fulfillment links and separate payment/production badges. Define Active/Needs Attention/Ready/Completed group membership centrally.

**Verify:** Combined filters narrow the same dataset; totals describe the filtered result; subscription purchase parents never expose preparation actions.

### 6.3 — Order Details

**Route:** `#/owner/orders/:orderId`  
**Revise:** Partial transitions, stale badges/history, incorrect fulfillment actions, and mutable purchased details.

**Implement:** Render a normalized owner projection with type-specific sections. Delegate Start Preparation, Mark Ready, pickup handoff, and manual cake handoff to shared fulfillment commands. Keep courier state separate and use the delivery service for courier outcomes. Attribute history to the real actor, replacing staff-only/System fallback logic where touched.

**Verify:** Owner and staff changes update the same record across customers; preparation consumes once; readiness/completion do not consume again. Pending, resolution, cancelled, stale, and missing records receive correct action restrictions.

### 6.4 — Payments / Payment Issues

**Route:** `#/owner/payments` with selected payment/order context  
**Revise:** Unconditional resource-success messaging, overwritten retry history, fake custom ranges, and missing resolution states.

**Implement:** Query payment attempts with their own hold IDs, amounts, references, and timestamps. Display payment, order, and hold states independently. Add real date-range inputs and composed filtering/pagination. Provide read-only resolution inspection and links to affected resources; do not add force-confirm, mark-paid, or refund commands.

**Verify:** Paid with Payment Resolution Required remains blocked from production. Retrying preserves previous attempt/hold history; cancelled payment and expired/released hold distinctions remain visible.

### 6.5 — Deliveries / Courier Booking

**Route:** `#/owner/deliveries` with selected order/booking context  
**Revise:** Copied payment script collisions, blank statuses, pre-ready dispatch, duplicates, and false provider claims.

**Implement:** Build a scoped delivery controller rather than importing the generated script. The eligible selector requires Ready, prepaid coverage, delivery details, and standard/subscription fulfillment type. Booking checks operation identity and existing active bookings. Unknown provider outcomes require status reconciliation before retry. Use a demo provider adapter whose responses update the shared booking/history; map statuses to ERD values.

**Verify:** Tabs load without exceptions; double submission yields one active booking. Pickup, cakes, purchase parents, and resolution orders are excluded. Booking failure and unknown response are distinct states.

### 6.6 — Inventory

**Route:** `#/owner/inventory` with selected inventory ID  
**Revise:** Butter-specific detail bindings, no-op stock saves, hidden shortages, duplicate forecast deductions, and disconnected costs.

**Implement:** Reuse inventory authority with owner-capable stock commands, selected-record forms, unit conversion, movement previews, and actor attribution. Add owner-only cost editing and missing-cost states. Show physical, reserved, available/deficit, and future unreserved requirements separately. Store movement cost snapshots when available; do not retroactively invent missing historical costs.

**Verify:** Selecting another ingredient updates all details/actions. A 10 kg input adds 10,000 g to a gram-based record exactly once. Counts below reservations preserve commitments and expose deficits; staff output still excludes costs.

### 6.7 — Recipes & Costing

**Route:** `#/owner/recipes` with selected variant ID  
**Revise:** Prepared subassemblies, unsaved quantities, truthiness defaults, hardcoded margins, and automatic/implied price changes.

**Implement:** Replace hardcoded recipe lookup with editable BoM records seeded from the existing recipes while retaining its public lookup adapter. Use one inventory ID per variant row, positive finite normalized quantities, and direct packaging. Existing seed formulations remain demo data, not validated bakery recipes. Implement materials + utility overhead, markup-based suggestion, and selling-price-based margin. Store zero deliberately; missing cost stays unknown. Updating the actual selling price requires its explicit owner action.

**Verify:** Saved quantities affect new requirements/costs but not committed snapshots. The reference calculation produces 91.37 production cost, 118.78 suggestion, and 42.9% margin at 160 selling price. Costs alone never change the selling price.

### 6.8 — Custom Cake Requests

**Route:** `#/owner/cake-requests` with selected request ID  
**Revise:** Copied recipe code, mismatched selection/rejection, deposit wording, and acceptance treated as production confirmation.

**Implement:** Create owner request selectors without weakening customer-owned selectors. Bind the full inspector and reject/create-quotation actions to the selected ID and version. Show original submission, actual request lifecycle, quotation versions, current feasibility reasons, and separate payment context. Connect the approved production-copy workflow to the owner actor while preserving original references.

**Verify:** Switching requests replaces all details and action targets; rejection affects only the selected request. Accepted/unpaid requests never enter paid production.

### 6.9 — Custom Cake Quotation Builder

**Route:** `#/owner/cake-requests/:requestId/quotation`, with optional quotation version context  
**Revise:** Disconnected preview, negative charges, fake issuance, mutable accepted versions, and unsupported verification claims.

**Implement:** Add an owner issue/revise command using explicit options/add-ons snapshots, complexity charge, delivery fee, method, date/window, destination, and expiry. Do not reuse the customer simulator's arbitrary fee/version changes as real quotation logic. Validate before issuing an immutable version; supersede previous offers appropriately. Pickup clears delivery fee/address in preview and snapshot. Adapt customer acceptance, currently delivery-oriented, to honor the quoted method. Keep notification failure separate from issuance.

**Verify:** 1,850 + 650 + 250 totals 2,750; pickup totals 2,500. Invalid charges block issuance; revisions preserve earlier versions. Full QR Ph payment remains necessary for production confirmation.

### 6.10 — Subscriptions

**Route:** `#/owner/subscriptions` with selected subscription/purchase context  
**Revise:** Wrong payment labels, weekly rebilling implications, fake deferments, filter overrides, and unpaid previews counted as active.

**Implement:** Aggregate subscriptions and purchases across account buckets. Show one QR Ph purchase, four linked fulfillment orders, snapshot totals, actual progress, and chronological reservation state. Refactor current-account deferment/sync lookups to use record IDs. Preserve next-day/next-week customer semantics and one successful allowance. Replace capacity allocation atomically, retain history, and reevaluate next ingredient reservation. Default to existing automatic customer deferment with owner visibility; do not silently introduce an approval queue or new owner date-override power.

**Verify:** Failed replacements leave original dates/allocations and allowance unchanged; success preserves exactly four deliveries. Cross-customer records update correctly without activating that customer.

### 6.11 — Capacity Calendar

**Route:** `#/owner/capacity`  
**Revise:** Static date inspector, double-counted holds, invented closures, incorrect cake day/week totals, and broken commitment links.

**Implement:** Render real day/week/month selection through shared capacity selectors. Show held and confirmed amounts separately, standard product-variety/unit limits, subscription product/week usage, and cake day/week usage. Expose all four subscription allocations and deferment replacements. Lowered limits preserve commitments and display over-limit usage while blocking additional bookings.

**Verify:** Each date shows its own data; 20 limit minus 8 confirmed and 1 separate held leaves 11. Expired/released allocations stop consuming availability. Existing-variety capacity differs from a new-variety limit.

### 6.12 — Blocked Dates / Scheduling

**Route:** `#/owner/scheduling`  
**Revise:** Hardcoded dates/counts, Save equal to Discard, unsaved schedule edits, and settings that erase/move commitments.

**Implement:** Maintain independent saved configuration and form drafts. Add real date picker/month navigation, unique blocked dates, reasons and actor metadata. Validate per-type lead/cutoff rules and product-specific/fallback schedules with active status. Preview affected commitments before saving blocks/limits. Commitments remain independently queryable after unblocking; schedule changes apply to future enrollment.

**Verify:** Discard restores saved values; failure retains edits; cancelled dialogs mutate nothing. Blocking/unblocking preserves orders. Saved configuration affects customer eligibility and owner summaries through the same services.

## 7. Delivery sequence and gates

| Stage | Work and dependency | Completion gate |
| --- | --- | --- |
| 0. Baseline | Record current routes, role behavior, fixture/reset behavior, and responsive screenshots. Run relevant existing checks and document pre-existing failures. | A reproducible customer/staff baseline and known limitations list. |
| 1. Shell and access | Shared component extensions, workspace styles, session/owner guard, owner routing and mount. | Owner dashboard shell looks consistent at target widths; customer/staff navigation and access remain intact. |
| 2. Shared domain foundation | Cross-customer repository, money adapters, fulfillment/history extraction, global capacity interface/ledger migration, schedule/material snapshots, notification routing. | Multi-customer and repeat/stale-operation tests pass before operational buttons are exposed. |
| 3. Orders and dispatch | Implement 6.1–6.5, beginning with read views, then transitions and demo booking. | Customer purchase → owner inspection → staff preparation → owner dispatch/pickup works on one record. |
| 4. Inventory and costing | Implement 6.6–6.7 using existing inventory authority. | Stock/cost/recipe changes propagate correctly; old snapshots and staff privacy remain intact. |
| 5. Cakes | Implement 6.8–6.9 and move production-copy controls into owner access. | Request → owner version → customer acceptance/payment → safe staff production details → handoff works. |
| 6. Subscriptions and settings | Implement 6.10–6.12 on the shared allocation foundation. | Four commitments, deferment, shortage/restock, blocks, and future schedule changes stay consistent across roles. |
| 7. Integration finish | Full regression, responsive/accessibility review, reset/scenario integration, documentation and remaining-policy notes. | All 12 subphases meet their checks; no misleading success or provider claims remain. |

Complete and verify each extraction before stacking the next feature on it. Keep generated exports unchanged as reference material; copied unrelated scripts never enter the integrated application.

## 8. Verification plan

Implementation should add focused state and browser checks, grouped as proposed `verification/owner-state.cjs`, `owner-browser.cjs`, and `owner-integration.cjs`, following existing test conventions. Avoid tests that merely mirror rendered markup.

- **State:** role/capability enforcement, cross-bucket records, currency conversions, stock/price snapshots, allocation migration, idempotency, stale versions, failed mutations, immutable quotation versions, and schedule preservation.
- **Browser:** every owner route and selection, combined filters, pagination, form validation, Save/Discard, error recovery, keyboard/focus, route changes during saves, and no uncaught exceptions.
- **Role privacy:** owner can access necessary financial/customer details; staff DTOs, rendered content, and dialogs omit restricted data; customer ownership checks still hold. Browser memory is not a production confidentiality boundary.
- **Integration:** use customer A, customer B, staff, and owner. Verify standard purchase/fulfillment/dispatch; cake request/version/payment/manual handoff; subscription purchase/four deliveries/deferment/rolling shortage/restock; and configuration changes before a new checkout.
- **Visual:** compare shared header/footer, introduction, cards, tables, fields, and dialogs at 320/390/768/1440 px. Check no document-wide overflow, usable mobile navigation, local table scrolling, and visible primary actions.
- **Regression:** run applicable existing `phase5-revisions.cjs`, `phase5-browser.cjs`, `phase2-browser.cjs`, `subscription-browser.cjs`, `phase4-state.cjs`, and `subscription-state.cjs`; add map/delivery-route checks when those paths change. Establish baseline results rather than assuming earlier reported counts still pass.

Some older browser checks reference obsolete selectors, including `#product-search-input` and `[data-p4=cake-addon]`. Confirm these against current markup at baseline and repair obsolete selectors without weakening the behavioral assertions. Browser suites sharing the same CDP page must run sequentially. No application tests are required to validate this planning-only document, and none are claimed as newly passed here.

## 9. Decisions, defaults, and production follow-up

| Topic | Planned behavior now | Remaining decision/work |
| --- | --- | --- |
| Deferment approval | Preserve existing automatic validated customer deferment; owner inspects its result/history. | If manual approval is chosen, define separate pending/rejected request storage, authority, and customer changes before adding the queue. |
| Paid resolution | Accurate read-only diagnosis; production stays blocked. | Define supported recovery commands. No unchecked confirmation, manual paid override, or refund feature is implied. |
| Production references | Retain original request and separate approved production copy; use actual owner actor. | Align multiple-reference/production-copy storage with final ERD and negotiated customer approval workflow. |
| Recipe/cost history | New requirements use saved BoM; committed requirements remain fixed. Missing historical costs remain unknown. | Agree any future repricing/replanning or historical costing methodology separately. |
| Chapter inconsistencies | Use confirmed four-date capacity and rolling ingredient policy. | Correct older prose separately without reversing established behavior. |
| Persistence/providers | Shared in-memory prototype, documented reset limits, replaceable simulated provider adapters. | Server-side roles, transactions/unique constraints, durable audit, verified payment/courier callbacks, notification delivery, and production migration. |

## 10. Definition of done

- [ ] All 12 owner subphases are integrated into the current router and single brand shell.
- [ ] Header, footer, page introductions, cards, forms, tables, and dialogs use the shared design rules.
- [ ] Owner/customer/staff views use the same underlying records, with role-appropriate projections.
- [ ] Commands update linked state consistently and reject duplicate, stale, unauthorized, or invalid actions.
- [ ] Payments, production, resources, courier state, and quotations remain distinct and truthful.
- [ ] Existing orders, quotations, material requirements, and subscription commitments survive later settings/catalog changes.
- [ ] Relevant existing regressions and new owner checks pass, or remaining pre-existing limitations are explicitly documented.
- [ ] Developer scenarios/reset cover the new stores and remain outside normal owner flows.
- [ ] Unresolved policy and production integration items are documented without being presented as implemented features.
