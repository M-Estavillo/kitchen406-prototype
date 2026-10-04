# Phase 5 — Staff Integration Implementation Plan

Status: Browser-prototype integration implemented. See [implementation results, verification, and remaining limits](phase-5-implementation.md). The sections below retain the planned scope; unresolved production policies and remaining revisions are recorded in that implementation report.

Date: October 4, 2026

## 1. Outcome and scope

Integrate Phase 5 into the current Kitchen406 application, with working staff journeys and the revisions in [Phase 5 Staff UI Revisions](phase-5-staff-ui-revisions.md). Use the existing application as the visual baseline: the same brand header/footer, typography, colors, page introductions, cards, controls, and dialogs.

The immediate deliverable remains the existing browser-based prototype. It uses plain JavaScript, hash routes, and in-memory data. Build reusable components as rendering functions and shared CSS within that architecture. A Next.js/database migration described in the chapters is a separate production step, not a prerequisite for integrating these screens.

### Confirmed rules

- Staff can move a Ready pickup order to Completed after handoff.
- Confirmation reserves ingredients without reducing physical stock on hand.
- Starting preparation consumes the order's ingredient reservations and deducts physical stock exactly once.
- Marking Ready or Completed does not deduct ingredients again.
- Standard/subscription courier booking belongs to the owner after readiness. Staff see courier status.
- Custom cakes use owner delivery or the accepted quotation's pickup method.
- Staff receive operational data only; customer identity/contact/address and owner financial data remain restricted.

### Planning references

- [Detailed review and evidence](phase-5-staff-ui-review.md)
- [Required revisions for 5.1–5.8](phase-5-staff-ui-revisions.md)
- [ERD](../Chapters/ERD.md), [Chapter 1](../Chapters/Chapter%201.md), [Chapter 3](../Chapters/Chapter%203.md), [Chapter 4](../Chapters/Chapter%204.md)
- [Existing design specification](../artisan_bakery_pantry/DESIGN.md)
- [Phase 4 implementation record](phase-4-implementation.md) and [verification record](../verification/README.md)

## 2. Current code and integration implications

| Existing area | What is present | Required integration |
| --- | --- | --- |
| [index.html](../index.html) | Shared header/footer markup; separate view mounts; ordered script loading. | Extract shell rendering while preserving IDs used by current code. Add a staff view mount and role-aware navigation. |
| [app.js](../app/app.js) | Central hash router, route visibility, account menu handling, development inspector. | Add staff route dispatch, access checks, titles/focus handling, and staff inspector entries. |
| [core.js](../app/core.js) | `K406`, auth flags, escaping, toast, shared modal focus/Escape behavior. | Add a role-aware session boundary and reusable modal cleanup hooks. Avoid introducing another modal system. |
| [commerce-ui.js](../app/commerce-ui.js), [phase4-ui.js](../app/phase4-ui.js) | Repeated button/field/page helpers; cards; customer account layout. | Extract common primitives with compatibility wrappers so customer flows continue to work. |
| [styles.css](../app/styles.css), [tailwind-config.js](../app/tailwind-config.js) | Existing brand tokens, fonts, buttons, fields, overlays, responsive header. | Reuse these values; consolidate genuinely shared card/heading/layout rules instead of adding a Phase 5 theme. |
| [commerce-state.js](../app/commerce-state.js) | Shared orders; mutable status/activity; standard payment flow; demo fixtures. | Add validated fulfillment transitions and material planning hooks; retain customer ownership and payment behavior. |
| [subscription-state.js](../app/subscription-state.js) | Four weekly delivery orders, deferment, subscription synchronization. | Update each weekly fulfillment's preparation/readiness/completion state and preserve original/rescheduled dates. |
| [scheduling.js](../app/scheduling.js) | Manila demo clock, capacity calculations, subscription allocations, product-level stock flags. | Preserve capacity logic; replace stock flags as the production source of truth with shared material availability. |
| [cake-state.js](../app/cake-state.js), [cake-data.js](../app/cake-data.js) | Accepted quotations, material quantities, separate stock and holds. | Adapt cake materials/holds to shared inventory without double reservation or breaking quotation snapshots. |
| [account-state.js](../app/account-state.js) | Customer identity and account buckets; `allowed()` checks sign-in and active state, not staff role. | Separate account/session identity from customer profile assumptions; prevent staff from inheriting customer permissions. |
| [notification-state.js](../app/notification-state.js), [phase4-integration.js](../app/phase4-integration.js) | Customer notification events and wrappers around payment/status actions. | Keep customer history distinct from internal staff notifications; emit both from the authoritative transition once. |

Important compatibility differences: existing orders use labels such as `pending-payment`, `ready-pickup`, `payment-resolution`, and types such as `cake`/`subscription`. Introduce explicit mappings to ERD statuses/types. Do not perform a global rename without updating all customer renderers and tests.

The working tree already contains customer UI edits and the uploaded exports. Implementation must build on those edits and avoid resetting or replacing them with older mockup versions.

## 3. Consistent design through shared components

### 3.1 Visual decisions

| Element | Proposed implementation |
| --- | --- |
| Header | One `SiteHeader` component. Keep the current Kitchen406 branding, surface, border, spacing, and sticky behavior. Use a staff variant with workspace navigation, notifications, and the current staff account; customer routes retain their shopping controls. |
| Footer | One `SiteFooter` component using the current brand copy, background, divider, typography, and copyright. Configure links for the current workspace. Keep it below content; do not add a competing footer in each staff export. |
| Hero / page introduction | One `PageIntro` component with compact and editorial variants. Staff screens use the compact title/subtitle/action pattern matching existing account/commerce pages. Existing storefront and cake landing heroes retain their imagery and larger composition through the editorial variant. |
| Boxes / cards | One `Panel` primitive for headings, body, optional actions, and consistent padding/border/radius. Add `StatCard` for numerical summaries, using the same surface and spacing. |
| Workspace navigation | One `WorkspaceLayout` with navigation configuration and identity slot. Reuse the customer account layout's visual treatment; staff get their eight operational destinations. On small screens use accessible compact navigation. |
| Forms and controls | Shared button, field, select, filter-chip, badge, and alert primitives. Match existing `.btn`, `.field`, and `.alert` behavior, including disabled, pending, invalid, and focus states. |
| Dialogs and drawers | Continue using the central modal manager. Add a drawer presentation variant with the same focus trap, Escape, inert background, scroll lock, and focus return. |
| Tables and calendar | Shared table/toolbar/pagination presentation; staff-specific calendar geometry. Use the same tokens and card styles even when the layout differs. |

**Visual baseline:** Playfair Display headings, Plus Jakarta Sans body/UI, canvas `#fbf9f6`, panel `#f5f3f0`, ink `#1b1c1a`, muted `#53443a`, accent `#8d4a14`, and the current `--radius: 6px`. Reuse the existing 44 px button/input minimum and responsive spacing. Add named success/warning/error tokens from the existing palette rather than scattered new hex values.

Keep page content aligned with the current approximately 1240 px shell and existing 1320 px account layout where applicable. A wide calendar can scroll within its own container; it must not widen the entire page. Header, intro, cards, and footer must share consistent horizontal alignment.

### 3.2 Component implementation

Proposed shared files:

- `app/ui.js`: `K406.ui` render functions for page introductions, panels, buttons/links, fields, badges, alerts, empty/loading/error states, stat cards, and filter toolbars.
- `app/shell.js`: header/footer, workspace navigation configuration, account menu composition, and shell updates on session/route changes.
- `app/ui.css`: common component presentation extracted from current styles where reuse is real. Retain brand variables in `styles.css`; keep Tailwind's palette aligned.
- `app/staff.css`: staff-only grid, production cards, inventory table, calendar, and responsive layouts. Avoid redefining global buttons, fonts, footer, or dialogs here.

Example interface:

```js
K406.ui.pageIntro({ title, subtitle, actionsHtml, variant: 'compact' });
K406.ui.panel({ title, bodyHtml, actionsHtml });
K406.ui.button({ label, action, namespace: 'staff', variant: 'primary' });
K406.shell.render({ workspace: 'staff', session });
```

Escape all data values in components. Only explicitly named internal markup slots such as `bodyHtml` accept composed HTML. Keep event attributes scoped (`data-staff`, existing `data-commerce`, existing `data-p4`) so extracting presentation does not mix action handlers.

### 3.3 Safe extraction sequence

1. Capture current customer desktop/mobile screenshots and run the existing relevant suites before moving shared code.
2. Extract the header/footer into stable mounts. Render the initial shell before scripts that query header IDs or attach the account menu. Preserve `header-auth-user`, `account-menu-toggle`, `account-menu`, `nav-search-input`, and other consumed IDs during migration.
3. Change shell mode through delegated events or stable DOM nodes. Rebuilding the shell must not drop handlers or duplicate menus/listeners.
4. Extract common primitives and keep `commerce.ui` / Phase 4 helper wrappers delegating to them. Preserve existing selectors while tests and pages migrate.
5. Move truly shared card/intro rules into `ui.css`; retain aliases for existing classes. Remove superseded duplicate declarations instead of overriding them repeatedly.
6. Apply the components to all new staff pages. Migrate the shared portions of existing customer pages in small steps, preserving their current composition and behavior.

## 4. Proposed modules and ownership

New paths below are proposed files, not existing implementation.

| Module | Responsibility |
| --- | --- |
| `app/session-state.js` | Current account ID, role, active/setup state; staff/customer access predicates; role changes and session generation. |
| `app/inventory-state.js` | Base stock, variant BoMs, material requirements, reservations, movements, availability, and atomic local mutations. |
| `app/fulfillment-state.js` | Validated prepare/ready/pickup-complete commands; history and subscription synchronization. |
| `app/staff-data.js` | Coherent development fixtures only; no runtime duplicate of customer orders. |
| `app/staff-state.js` | Staff-safe record projections, selectors, filters, and screen state. |
| `app/staff-ui.js` | Staff layout composition and operational rendering helpers using `K406.ui`. |
| `app/staff.js` | Staff route dispatch, event handling, and mount lifecycle. |
| `app/staff-production.js` | 5.1 dashboard, 5.2 queue, 5.3 order detail. Split further if these responsibilities become difficult to maintain. |
| `app/staff-inventory.js` | 5.4 inventory and 5.5 movement ledger/forms. |
| `app/staff-recipes.js` | 5.6 recipe reference and variant selection. |
| `app/staff-calendar.js` | 5.7 date navigation, filtered commitments, agenda, inspector. |
| `app/system-notification-state.js` | Role-targeted internal notifications and shared acknowledgement. |
| `app/staff-account.js` | 5.8 operational feed, staff profile, password form. |

Dependency order: core → session/shared UI/shell → existing domain initialization → inventory/fulfillment adapters → staff selectors/renderers → integration wiring → central router startup. Confirm exact script order while extracting because current modules initialize eagerly. Avoid circular initialization and additional chains of method wrappers; replace affected integration hooks with explicit calls/events where practical.

## 5. Routes and access

| Phase | Route | Notes |
| --- | --- | --- |
| 5.1 | `#/staff` | Dashboard; `#/staff/dashboard` may redirect here. |
| 5.2 | `#/staff/production` | Queue with date/type/status/search state. |
| 5.3 | `#/staff/production/:orderId` | Exact fulfillment order; no fallback to another sample. |
| 5.4 | `#/staff/inventory` | Ingredient drawer selected by stable ingredient ID. |
| 5.5 | `#/staff/movements` | Ledger; ingredient/order filters preserved when entered from another screen. |
| 5.6 | `#/staff/recipes` | Product/variant selection. |
| 5.7 | `#/staff/calendar` | Selected date, view, and filters; optionally encode these in query parameters. |
| 5.8 | `#/staff/notifications`, `#/staff/settings` | One shared workspace, separate addressable tabs. |

Extend the central router rather than embedding standalone HTML exports or introducing another router. Hide/clear inactive mounts, update document titles, close dialogs, and move focus to the new page heading. Back/Forward must restore the chosen record and supported filter context.

Guest deep links preserve the intended destination through sign-in. Customer accounts receive an access-denied view for staff routes. Staff accounts must not pass customer purchase/profile ownership checks simply because `auth === 'signedin'`. An inactive or setup-incomplete staff account cannot enter operations.

Use explicitly provisioned staff fixtures in the development inspector until Phase 7 implements owner account management. Do not infer staff privileges from typed email addresses. Keep fixture role switching in the inspector, not normal product navigation.

The existing account buckets require special care: activating a staff identity must not move customer records into a staff bucket or clear the operational store. Keep business records keyed by owner/customer IDs, independently of the active session. Invalidate pending profile/security operations and clear protected DOM on sign-out/role change.

## 6. Shared state and business implementation

### 6.1 Order adapters and staff projections

Retain the shared order store and stable IDs. Add a normalization layer for legacy statuses/types while migrating affected readers. `ready-pickup` maps to order Ready plus method Pickup; courier states remain a separate delivery field. Continue to support old customer fixtures through explicit adapters or revise those fixtures and their assertions together.

A staff projection should include only: order reference/type/status, permitted items/variants/quantities, fulfillment date/method, cycle number, sanitized cake specifications, material requirements, operational history, and courier status. It must not spread a raw order object containing prices, addresses, or contact snapshots into staff templates.

This projection supports prototype discipline; all data in a browser-only demo remains inspectable. Production must return staff-safe server responses and enforce permissions there.

### 6.2 Inventory consolidation

1. Define stable base ingredient IDs, units, stock, thresholds, and variant BoM rows. Flatten prepared components and include tracked packaging.
2. Normalize recipe quantities into each ingredient's base unit. Allow documented g/kg and ml/L conversions; do not infer mass from volume or pieces.
3. Generate per-fulfillment material requirements aggregated by ingredient. Use accepted cake materials and selected subscription variants. Preserve those requirements for a committed order so a later recipe edit cannot silently change its consumption.
4. Introduce held/confirmed/consumed/released/expired reservation records. Wire checkout holds, payment confirmation, failure, expiry, retry, and late-payment resolution into this service without changing capacity-pool rules.
5. Adapt the existing cake holds/stock to this store. Remove parallel subtraction from cake stock; keep cake capacity accounting separate from material reservations.
6. Update standard and subscription availability checks to consult material availability. Existing mock stock flags may remain inspector overrides, not a second real stock balance.
7. Backfill current demo commitments once using stable requirement keys. Seed historical preparing/completed fixtures with consistent already-consumed movements rather than deducting them on render.

Subscription capacity allocation and ingredient reservation timing are different concerns. Preserve the existing four-date capacity behavior until its chapter conflict is resolved. Represent future weekly material requirements separately; do not silently decide that all four deliveries' physical ingredients must be reserved immediately. Expose the reservation timing policy as a documented integration dependency.

### 6.3 Transactional command behavior

`startPreparation(orderId, expectedVersion, operationKey)` should:

1. Verify active staff role, Confirmed status, paid production eligibility, and current record version.
2. Resolve complete requirements and sufficient eligible reservations/physical stock for this fulfillment.
3. Build the entire mutation before committing it. A shortage in one ingredient must leave every ingredient and the order unchanged.
4. Deduct physical quantities, consume reservations, create attributed consumption movements, set Preparing, and append history together.
5. Update the linked subscription-delivery state and emit operational/customer events once.
6. Return the current successful result on a duplicate operation; reject unrelated stale transitions.

The local prototype can stage changes in memory and commit synchronously. The future server requires a database transaction, concurrency checks, and unique operation keys. Do not describe a browser-only command as protection against multiple real staff sessions.

`markReady` and `completePickup` reuse the same command boundary without inventory deduction. Completion requires Ready and Pickup; courier delivery completion remains external/owner-driven. `B.sync` must preserve Preparing/Ready/Fulfilled states rather than collapsing every unfinished subscription delivery to pending. Keep deferment metadata separate from lifecycle status.

Restock/physical-count adjustment commands validate units and quantities, preserve valid zero, and append movements atomically with stock changes. Correct a prior manual entry with a new adjustment and reference, applied to current stock. Consumption reversals represent actual usable stock recovery; cancellation alone does not manufacture ingredients.

### 6.4 Events and notifications

Publish one domain event after a successful mutation. Consumers refresh dashboard/queue/calendar/inventory and emit the relevant notifications without performing the mutation again.

Keep existing customer notification history separate from `SystemNotification` records. Staff acknowledgements update shared `is_read`/`read_at` for allowed records. Customer messages must use the order's actual `customer_id`, never fall back to the active staff identity. Preserve deduplication keys in the current Phase 4 notification integration.

## 7. Implementation by subphase

This table maps every subphase to the revision brief and the concrete integration work. The linked revision document remains the detailed acceptance checklist.

| Phase | Implementation approach | Required result |
| --- | --- | --- |
| **5.1 Dashboard** | Compose `PageIntro`, stat cards, panels, and safe order rows. Derive summaries from the shared fulfillment/date selectors. Link alerts to filtered inventory/production/calendar routes. | Functional date range, valid statuses, consistent methods, accurate alerts and pickup counts; no typed-in totals. |
| **5.2 Queue** | Filter/sort normalized fulfillment records by actual dates and supported windows. Share status commands with details. Use record-aware drawers and actions. | One variant per subscription fulfillment; no early courier booking; Start/Ready/Complete Pickup work; counters and filters agree; failed/stale actions retain context. |
| **5.3 Details** | Resolve exact order ID, render its safe projection and committed requirements, accepted cake specification, and actual history. Use shared dialogs and optional local checklist. | No scenario-switching identity bug; correct cake delivery/pickup; stock consumed once; valid reference images; safe ticket printing only if implemented. |
| **5.4 Inventory** | Render the shared ledger's current quantities; implement full-data search/sort/pagination and ingredient-specific drawer. Restock/adjust forms invoke inventory commands. | Persistent-in-session stock changes and matching movements; valid zero/defaults; base ingredients; accurate reservations, units, and shortage messages. |
| **5.5 Movements** | Query movement records with real date/actor/type/ingredient filters. Reuse adjustment flow for Record Correction and follow order references into staff detail. | Correct movement enum mapping, current-stock corrections, duplicate protection, meaningful page counts, reliable historical balances or omission. |
| **5.6 Recipes** | Read shared variant BoMs and current inventory availability. Use the common table/card components; link ingredient and order contexts. | Base ingredients/packaging, correct per-unit quantities and scaling, no invented yield/shift/revision data, no financial fields or editing. |
| **5.7 Calendar** | One date/view/filter state feeds calendar, selected-day agenda, counters, and inspector. Use scheduling utilities and actual order IDs. | Full month navigation, correct Today, completed filter, consistent order counts, deferment replacement dates, readable scrollable week grid/mobile agenda. |
| **5.8 Notifications/settings** | Internal notification store plus role-aware shared profile/security helpers. Keep staff name editing separate from customer mobile/address fields. | Shared acknowledgement, valid links/counters, Read rather than Archived, consistent identity, real demo password verification/error paths, owner-managed role/email, no invented shifts. |

## 8. Delivery sequence and gates

| Step | Work | Gate before continuing |
| --- | --- | --- |
| 1. Baseline | Record current worktree, customer screenshots, and existing suite results. Finalize token/component mapping. | Existing failures distinguished from new changes; no user edits overwritten. |
| 2. Shared presentation | Extract shell and UI primitives with compatibility wrappers; add empty staff layout using them. | Customer header/footer/hero/cards and navigation still match the baseline; staff shell matches the same brand. |
| 3. Session/routes | Add role/session adapter, staff mount/routes, protected deep links, safe projections, fixture provisioning. | Guest/customer/staff/inactive/setup states behave correctly; customer data ownership survives role switching. |
| 4. Inventory/fulfillment | Consolidate material requirements/reservations; implement idempotent commands and event hooks across standard/subscription/cake flows. | State tests prove no double deduction, no partial mutation, correct availability and ownership. |
| 5. Core operations | Implement 5.2–5.6 against those shared services. | Complete prepare → ready → pickup handoff journey, ledger updates, recipe scaling, and cake/subscription identity preservation. |
| 6. Overview/calendar | Implement 5.1 and 5.7 from the same selectors and events. | Counts, date ranges, selected agenda, filters, and deferment visibility agree. |
| 7. Notifications/settings | Implement 5.8 and finalize sign-out/setup/security handling. | Events target correct users/roles; shared read counts and save failures are correct. |
| 8. Full review | Run applicable regression suites and responsive/accessibility checks; save screenshots and implementation notes. | All confirmed rules and the revision delivery checklist pass, with remaining prototype limits documented. |

## 9. Verification plan

### State tests — proposed `verification/phase5-state.cjs`

Use the repository's existing Node `vm` test pattern for:

- Role checks, ownership preservation, and sanitized staff projections.
- Standard, weekly subscription, and accepted cake requirement generation.
- Reservation versus consumption arithmetic; duplicate/retried preparation; insufficient-stock rollback; stale transitions.
- Restock, zero physical count, signed corrections, movement attribution, and unit precision.
- Ready/pickup completion without repeated deduction; subscription lifecycle synchronization.
- Checkout expiry/retry/late-payment interactions with shared inventory.
- Notification deduplication and role-scoped shared acknowledgement.

### Browser tests — proposed `verification/phase5-browser.cjs`

Reuse the existing Chrome debugging harness and run suites sequentially because they share a page target. Cover all routes, deep links, Back/Forward, record identity, queue filters, inventory forms, calendar selection/date changes, notifications/settings, and failed operations. Capture uncaught exceptions and duplicate DOM IDs.

Exercise one customer-to-staff-to-customer journey: a customer pays for a pickup order; staff prepare, mark Ready, and complete it; the original customer sees the same updated order and notifications. Repeat core preparation coverage for a subscription fulfillment and accepted cake without changing their type or identity.

### Visual consistency and accessibility

Compare existing customer and new staff views at 1440, 768, 390, and 320 px. Check the actual rendered pages, not only supplied exports.

- Header/footer alignment and typography; editorial versus compact page-intro variants.
- Card padding/radius/borders, buttons, fields, alerts, badges, and empty states.
- No whole-page horizontal overflow; deliberate table/calendar scrolling stays within its container.
- Keyboard navigation, labels, focus-visible, modal/drawer focus trap and return, Escape, and route heading focus.
- Long product names, order references, large counts, and empty/loading/error layouts.

Save representative dashboard, queue/detail, inventory dialog, calendar, and staff settings screenshots. Compare a storefront and customer account screenshot after extraction to catch style regressions.

### Existing regression coverage

Run JavaScript syntax checks and affected suites: `browser-smoke.cjs`, `browser-edge.cjs`, `phase2-browser.cjs`, `subscription-state.cjs`, `subscription-browser.cjs`, `phase4-state.cjs`, and `phase4-browser.cjs`. Include `address-map-browser.cjs` and `delivery-route.cjs` when changes affect shared checkout/session lifecycle or those modules. Update harness script lists when shared state dependencies are introduced; retain their existing behavioral assertions.

Record results and limitations in `verification/README.md` and a new `docs/phase-5-implementation.md` after implementation. The plan itself makes no claim that these tests have run.

## 10. Decisions still required before production integration

| Topic | Plan treatment |
| --- | --- |
| Subscription capacity versus future ingredient reservation timing | Preserve current capacity behavior during UI integration; reconcile the chapters and explicitly choose `reserve_at` timing before treating future-week availability as authoritative. |
| Staff quantity restocks and owner costing | Keep costs out of staff forms. Define owner cost entry and interim cost basis before financial reporting consumes these movements. |
| Additional internal notification event types | Map supported events; document proposed enum additions for readiness/delivery/specification updates rather than silently inventing schema values. |
| Unsupported metadata | Omit shifts, stations, storage-bin fields, recipe revisions, and per-item audit claims until a supported source is agreed. |
| Production security/persistence | The demo provides role-aware behavior, not confidential browser storage or real server authorization. Implement Auth.js/server permissions, database transactions, and API projections in the production architecture. |

No further clarification is needed to begin component extraction, role-aware routing, and the confirmed Phase 5 revisions. Keep unresolved allocation/costing policies isolated so those decisions do not force a visual redesign.
