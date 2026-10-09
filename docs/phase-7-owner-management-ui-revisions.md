# Phase 7 — Owner Management Revision Brief

Date: October 8, 2026  
Coverage: Subphases 7.1–7.12  
Based on: [Phase 7 UI review](phase-7-owner-management-ui-review.md), the [ERD](../Chapters/ERD.md), and chapter requirements cited in that review.

## Purpose

Use this document to revise the uploaded UI Generator screens into a consistent, functional owner-management prototype. Each subphase identifies what to retain, what to revise, and how to check the result. These are instructions for future changes, not a record of completed fixes.

Preserve the bakery visual style and useful information hierarchy. Integrate with the existing owner, staff, and customer records rather than creating disconnected copies. Source evidence and original defect locations remain in the linked review.

## Rules for all subphases

### Business and data rules

| Area | Required behavior |
| --- | --- |
| Owner access | Customer identities, addresses, financial data, pricing, reports, moderation, marketing, and account administration remain owner-only. Staff receive their predefined operational access. |
| Catalog | Keep product active/inactive status, variant available/unavailable status, and computed ingredient availability distinct. Subscription eligibility does not remove one-time purchasing. |
| Costing | Calculate suggestions from recipe ingredients, direct packaging, utility overhead, and configured markup. The owner controls the final selling price. |
| Ingredients | Ingredients and Inventory refer to the same inventory records. Stock status is system-maintained. Do not silently add a manual ingredient lifecycle. |
| Historical records | Catalog changes and account deactivation preserve existing orders, subscriptions, quotations, price/address snapshots, and operational history. |
| Reviews | Feedback belongs to a purchased order item. Keep ratings/comments read-only for owners; hide or restore inappropriate content through manual moderation. Honest negative criticism remains visible. |
| Marketing | Generate initial drafts automatically from system context. Owners review, edit captions, regenerate images, approve/reject, and manually post to Facebook. No automatic publishing or social-post scheduling. |
| Reporting | Derive results from shared transactions. Count prepaid subscription revenue once; weekly fulfillment orders must not duplicate that revenue. Label margins as estimates. |
| Notifications | Separate internal read state from customer-message send status. Preserve the ERD's shared acknowledgement rule for internal notifications. |
| Payment | Full QR Ph payment through PayMongo remains the confirmation prerequisite. Notification tools must not introduce a manual payment override. |

### Shared interaction requirements

- Bind every drawer, editor, confirmation, and action to a stable record ID. Load all fields for the selected record, not just its heading.
- Use the same collection for tables, cards, filters, counts, sorting, pagination, and related links. Combine filters before sorting and pagination.
- Define whether a count describes all records, filtered results, or the current page. Do not advertise unreachable sample records.
- Save validates and commits the intended local record before showing success. Cancel leaves saved data unchanged. Failed saves preserve entered values. Show unsaved-change indicators only when edits exist.
- Prevent repeated submission while processing. Remove undefined handlers, references to deleted elements, and obsolete functions.
- Replace navigation toasts and placeholder `#` links with working routes that retain the selected ID and relevant filters.
- Use a shared fixture set across Phase 7 and Phase 6. Reconcile category names, account identities, order references, draft IDs, prices, dates, and statuses.
- Provide relevant loading, empty, no-results, invalid-input, failed-load, and retry states. Do not confuse an empty database with a filtered list containing no matches.

### Presentation and prototype boundaries

- Standardize the owner sidebar/header, labels, badges, forms, dialogs, and links to Notifications/Settings.
- Move scenario controls to a separate prototype/testing panel. Keep implementation terminology and simulated “Live Sync” claims out of ordinary owner tasks.
- Support desktop and narrow mobile layouts with accessible controls, visible focus, contained table scrolling or cards, usable drawer scrolling, and reachable primary actions.
- Dialogs need appropriate focus handling, Escape/close behavior, and protection against accidental loss of edits.
- Local prototype state is sufficient for this revision if changes remain consistent while navigating and reopening records. Document reload/reset behavior in developer notes.
- Simulated emails, password changes, AI output, and provider responses must not be described as real external actions. Backend authorization, secure credential storage, transactions, and service integration remain production work.

## 7.1 — Products

### Retain

Catalog/availability separation, variant summaries, partial availability, subscription eligibility, and deactivation copy that preserves existing commitments.

### Revise

1. **Use one product dataset.** Generate list and grid views from the same filtered/paginated records. Include every product in both views.
2. **Implement catalog actions.** Activate, deactivate, and bulk status changes must update the selected products, summary counts, badges, filters, and storefront eligibility. Replace toast-only actions.
3. **Make bulk selection predictable.** Default Select All to the visible page. Clear selections when changing filters/pages, or explicitly disclose any retained selection outside the current view. Confirmation must identify the affected count.
4. **Complete browsing controls.** Wire search, category, status, availability, subscription filters, sorting, page size, and pagination. Reset page position when filters change.
5. **Connect navigation.** Add Product opens a blank 7.2 editor; Edit opens that product. Recipe, inventory, schedule, and storefront links retain the selected context.
6. **Correct variant labels.** Replace variant “Active” with the appropriate Available/Unavailable state. Keep ingredient shortage and product activation explanations separate.

### Acceptance checks

- Search for a single product and switch between list/grid: both show the same product and count.
- Deactivate one product and reopen it: status changes consistently; unrelated products and historical commitments remain intact.
- Select a filtered page and perform a bulk action: hidden/unselected products are unaffected.
- Add/edit links reach the appropriate editor; sorting and pagination change the actual records shown.

## 7.2 — Product Editor

### Retain

Core product fields, image panel, final/suggested price distinction, recipe/costing links, four-week subscription explanation, and system-derived availability.

### Revise

1. **Support create and edit modes.** Load by product ID or start a blank draft. Maintain a saved record separately from unsaved form values.
2. **Implement validated save/cancel.** Require product name, valid category, and at least one valid sellable variant. Validate numeric prices and show field-level errors. Success messages use the actual product name.
3. **Complete variant management.** Add/edit variant names, final prices, and availability. Prevent removing the last variant. Referenced variants must remain resolvable by historical orders; use unavailability instead of destructive removal where needed.
4. **Keep pricing authority clear.** Suggested price reflects the configured recipe/overhead/markup; final price changes only through the owner's explicit save. Missing costing must not masquerade as a valid computed suggestion.
5. **Complete image controls.** Support local image selection, replacement, removal, validation, and preview. Simulated upload behavior belongs in prototype notes.
6. **Synchronize preview and dirty state.** Update name, description, category, image, price, subscription badge, and catalog state as the draft changes. Clear dirty indicators after save; discard restores saved values.
7. **Preserve purchasing rules.** Turning subscription eligibility on retains standard purchasing. Turning it off affects new enrollments, not existing subscriptions.
8. **Repair the variant layout.** Make row actions fully reachable on desktop and mobile using adequate column width, contained scrolling, or stacked editors.

### Acceptance checks

- Change a name, price, and image; save and reopen: all values and the Products listing agree.
- Cancel edits: saved product and storefront data remain unchanged.
- Attempt an invalid price or last-variant removal: clear validation prevents an invalid save.
- Change ingredient cost through the linked module: suggested pricing updates without silently replacing final price.

## 7.3 — Categories

### Retain

Simple name/status model, assigned-product counts, add/edit drawer, deactivation confirmation, and desktop/mobile filtering.

### Revise

1. **Commit category changes.** Add, rename, activate, and deactivate real local category records. Update rows/cards, counters, and category options in 7.1/7.2.
2. **Validate names.** Reject blank and duplicate names consistently with the unique category-name constraint. Establish a consistent whitespace/case normalization policy for UI and eventual backend validation.
3. **Connect View Products.** Open 7.1 with that category selected, rather than displaying a navigation toast.
4. **Unify category fixtures.** Replace conflicting category names across Products, Product Editor, and Categories with one shared collection.
5. **Apply a consistent visibility policy.** Retain the proposed inactive-category storefront exclusion for the prototype, without changing individual product statuses or history. Record direct-link and checkout behavior as a policy decision before production integration.
6. **Keep confirmations accurate.** Display the selected category's name and affected product count, then refresh its actual status after confirmation.

### Acceptance checks

- Create/rename a category and find it in the product editor immediately.
- Duplicate names fail without closing the form or reporting success.
- Deactivate/reactivate a category: related storefront visibility follows the chosen policy while product records and history remain unchanged.

## 7.4 — Ingredients

### Retain

Base units, unit costs, reorder thresholds, dependency visibility, and links to inventory and recipes.

### Revise

1. **Align with Inventory.** Use the same `inventory_id` in Ingredients and Inventory. Remove the manual Ingredient Active toggle and Active/Inactive filter for the current ERD-aligned revision; show system-maintained Available/Unavailable/Low Stock instead. A separate archive lifecycle remains a proposed extension.
2. **Load complete ingredient records.** Every detail/edit action must populate the selected name, unit, cost, threshold, stock snapshot, and dependencies. Remove hardcoded Bread Flour defaults from edit mode.
3. **Protect measurement units.** For this revision, block unit changes on ingredients with stock, recipe/cake references, reservations, or movement history. Do not retain an “Understand & Proceed” path that reinterprets existing quantities. Unit conversion requires a separate coordinated design.
4. **Validate and save definitions.** Require a name and valid unit; reject invalid/negative cost and threshold values. Saving updates the same record used for costing and alerts, without directly changing physical stock.
5. **Complete list controls.** Implement search, usage/status filtering, sorting, pagination, and accurate dependency counts.
6. **Preserve single-level materials.** Use base ingredients and direct packaging. Identify purchased prepared inputs explicitly; expand bakery-made halaya, ganache, or dough into their base ingredients. Remove copy implying nested sponge inventory.
7. **Handle dependencies safely.** Keep deletion unavailable where references/history must remain. Link each dependency to the correct recipe or cake configuration.

### Acceptance checks

- Edit eggs and vanilla: units/costs/thresholds match their records, not flour's.
- Save a threshold/cost: inventory alerts and linked costing use the updated value; physical stock does not change.
- Try changing a referenced unit: the operation is blocked with an explanation of the dependency.
- Compare Ingredients and Inventory: both refer to the same material and stock state.

## 7.5 — Cake Options / Add-ons

### Retain

Five option types, separate quantity-based add-ons, preliminary price contributions, availability controls, ingredient mappings, and size scale-factor presentation.

### Revise

1. **Load mappings by record ID.** Opening a shape, flavor, size, color, icing, or add-on must load its own ingredients and quantities. New records start with an empty mapping list.
2. **Use inventory units.** Ingredient selection supplies its actual unit. Remove the hardcoded kg label from dynamic rows; do not represent eggs or liquid ingredients in kg without an explicit conversion model.
3. **Save actual configuration.** Persist basic fields, availability, scale factor where applicable, and material rows. Recalculate mapping counts after adding/removing ingredients.
4. **Validate mappings.** Prevent duplicate ingredient IDs within one option/add-on, invalid quantities, negative prices, and invalid/nonpositive size factors. Allow an option with no separate materials when that accurately represents the choice.
5. **Document scaling precisely.** Reuse the existing cake-builder/material policy. Explain which ingredients scale with size and which stay per cake/per add-on; do not add an unsupported per-row scaling field silently.
6. **Complete both tabs.** Implement search, filters, sorting, pagination, no-results, and create/edit behavior for options and add-ons independently.
7. **Preserve material scope and history.** Expand internally prepared components into base materials. Availability changes affect new requests without rewriting accepted quotation or order snapshots.
8. **Keep final complexity pricing separate.** These prices contribute to the estimate; owner quotation review remains responsible for case-specific complexity charges.

### Acceptance checks

- Open two unrelated options and an add-on: each shows its own materials and units.
- Add/remove a mapping, save, and reopen: quantities and counts agree; duplicates are rejected.
- Select two units of an add-on in the customer flow: its price and materials multiply correctly.
- Change availability: new builder choices update while historical quotations remain intact.

## 7.6 — Seasonal Occasions

### Retain

Name/date/status fields and the clear separation between saving seasonal context, automatic draft preparation, and manual publication.

### Revise

1. **Implement record mutations.** Create/edit/activate/deactivate the selected occasion and update badges, counters, and timestamps.
2. **Validate dates and names.** Require a name and valid start/end dates; prevent end-before-start. Do not invent a no-overlap constraint absent from the requirements. Keep any overlapping eligible occasions available to the eventual generation policy.
3. **Combine filtering.** Apply search and status together; derive result counts and distinguish no matching occasions from no saved occasions.
4. **Clarify Active.** Active means enabled for marketing consideration, not necessarily currently within its date window. If a date-relative label is added, keep it separate from stored status.
5. **Keep generation separate.** Saving must not create or publish a post immediately. Link to Marketing Drafts and preserve existing drafts when the occasion is disabled.

### Acceptance checks

- Save a new occasion and reopen it with correct dates/status.
- Invalid dates prevent save; cancel preserves the original record.
- Apply search and status in either order: results are identical.
- Deactivation updates the record without deleting previously generated drafts.

## 7.7 — Staff Accounts

### Retain

Owner-created staff accounts, locked Staff role, operational permission explanation, creator attribution, temporary-password setup, and history-preserving deactivation.

### Revise

1. **Repair event wiring first.** Implement or replace `selectStaff`, row-menu actions, setup filtering, drawer editing, reset handlers, password visibility, and deactivation/reactivation helpers. Remove references to absent `viewBtn-empty` and `filterTab-pending` controls.
2. **Repair preview states.** Either implement the Mika/reset states or remove obsolete state switches from the testing panel. Every advertised state must open without an exception.
3. **Bind all actions to account ID.** Populate the selected person's name, email, setup status, creator, and dates. Confirmations and actions must use that same ID; remove Andrea-specific behavior.
4. **Implement create/edit validation.** Require names and a valid unique email. Validate temporary password and confirmation against the shared authentication policy. Keep role fixed as Staff.
5. **Implement setup/reset state.** Reset marks that staff account as requiring a password change; completion clears its setup requirement. Keep setup state separate from active/inactive account status. Do not claim an actual invitation was sent by a local-only action.
6. **Implement access-state changes.** Deactivation prevents further staff access in the prototype and preserves operational records. Reactivation restores only the permitted role, without resetting setup requirements accidentally.
7. **Complete directory controls.** Compose search, status, setup filter, sorting, and pagination using one collection.
8. **Correct audit promises.** Display creator and timestamps supported by the model. Remove claims of permanent complete status history unless an audit mechanism is explicitly added.

### Acceptance checks

- Open/edit/reset two different staff accounts: the intended record changes each time.
- Mismatched passwords and duplicate emails fail with usable validation.
- Deactivate a staff account: it cannot continue normal staff access; historical work still identifies its actor.
- Run every menu, filter, and preview state without missing-handler or null-element failures.

## 7.8 — Customer Accounts

### Retain

Read-only owner directory, customer-managed registration/details, separate verification status, saved/archived addresses, and related-activity cards.

### Revise

1. **Populate by customer ID.** Selecting Marco, Camille, or Julian must load their identity, account status, addresses, and activity rather than Angela's fixture.
2. **Generate mobile and desktop from one collection.** Display the same records and apply the same filters, ordering, pagination, and counts at either layout size.
3. **Honor mobile-number search.** Search normalized phone numbers as well as names/emails, or remove that promise from the placeholder. Supporting all three is preferred.
4. **Reconcile summary counts.** Derive active/pending/inactive/suspended totals from the full dataset; label filtered totals separately. Correct the one inactive/suspended account claim when both statuses appear.
5. **Connect related activity.** Orders, subscriptions, cake requests, and reviews open records filtered to that customer. Preserve address snapshots on historical orders.
6. **Complete loading/retry/pagination.** Do not substitute Angela's data when another customer's load fails. Show a contextual error with retry.
7. **Keep customer powers within scope.** Do not add owner profile editing, password access, or suspension controls as part of this correction. Administrative customer-status changes remain a separate policy decision.

### Acceptance checks

- Select active, pending, and suspended customers: each drawer matches its row.
- Search by phone and combine verification/status filters: desktop/mobile agree.
- Follow an activity link: only the selected customer's applicable records appear.
- A failed detail load shows an error rather than another person's information.

## 7.9 — Review Moderation

### Retain

Visible-by-default policy, honest-negative-review guidance, purchased-item context, read-only customer content, photo inspection, and hide/restore confirmations.

### Revise

1. **Replace fixture-switching with selected feedback state.** Load reviewer, rating, comment, images, order item, dates, and visibility using `feedback_id`. Remove the fallback that makes every reviewer Maria and the mismatched spammer identity.
2. **Moderate the same record.** Hide and restore update the selected feedback, its list row, counts, detail view, and storefront visibility while preserving original content and photos.
3. **Implement reason validation.** Wire reason selection and Other input. Enable Hide only when required inputs are valid. Map friendly labels to the ERD reason enum.
4. **Keep explanation storage explicit.** The current ERD has no free-text explanation field. Either remove the persistent explanation promise for an ERD-only revision, or document a proposed field/audit extension and simulate it explicitly. Do not collect an explanation and silently lose it.
5. **Record supported moderation metadata.** Hiding records the acting owner, reason, and time. Define restore behavior for the current metadata; a complete history of repeated hide/restore actions requires a separate audit design.
6. **Repair state controls.** Replace the missing `empty-state-section` reference with actual state containers and align toolbar values with implemented branches. Keep scenario controls in the testing panel.
7. **Complete browsing and media.** Implement search, visibility/rating/media filters, sorting, pagination, lightbox navigation, and contextual empty states. Enforce the maximum two-photo presentation from the underlying feedback records.

### Acceptance checks

- Open Carlo's and Paolo's reviews: each retains its real reviewer, rating, content, and order item.
- Hide one review with a valid reason, then restore it: no unrelated feedback changes.
- Missing reason keeps confirmation disabled; choosing a valid reason enables it without errors.
- Honest negative feedback remains visible unless the owner explicitly moderates prohibited content.

## 7.10 — Marketing Drafts

### Retain

Automatic initial generation, owner review, four categories, caption editing, image-only regeneration, context visibility, and manual copy/download posting.

### Revise

1. **Implement draft selection.** Queue selection loads the actual draft ID, product/occasion, caption, image, category, status, and review metadata.
2. **Complete queue controls.** Search, category/status filters, sort order, counts, and empty states must use the same draft collection.
3. **Save captions as draft data.** Update `caption` and `was_edited` only on a successful save. Preserve unsaved edits during regeneration; resolve unsaved edits before approval so the approved content is unambiguous.
4. **Implement image-regeneration outcomes.** A local simulation must replace the image on success and update `regenerate_count`; failure retains the previous image and caption. Prevent duplicate regeneration while processing.
5. **Implement approval/rejection transitions.** Set the chosen draft to approved or rejected, record reviewer/time, and refresh queues/counts. Rejection must not return the record to pending. Subsequent controls must respect the resulting review state.
6. **Make manual-posting tools honest.** Copy reports success only when the clipboard write succeeds. Download exports the selected image. Failure offers a useful fallback instead of a false success message.
7. **Reconcile linked identities.** Use one meaning for `MKT-2610-04` across Marketing Drafts and Notifications. Linked alerts open that draft.
8. **Preserve scope.** Do not introduce initial free-form generation as the normal owner workflow, automatic Facebook publishing, or external post scheduling. Retain generation context so owners can spot outdated facts before approval.

### Acceptance checks

- Select different queue items: their own content and context appear.
- Edit a caption, regenerate its image, and save: the caption survives; successful regeneration changes the image/count.
- Approve one draft and reject another: statuses, reviewer metadata, and counts agree after reopening.
- Simulate clipboard/download failure: the interface reports failure accurately; no content is published externally.

## 7.11 — Reports

### Retain

Period filters, transaction totals, historical sales trends, workflow breakdowns, product performance, cost basis, incomplete-cost notices, and estimated-margin labels.

### Revise

1. **Compute every view from one dataset.** Cards, charts, tables, comparisons, and drill-downs must share the same period and inclusion rules.
2. **Fix the sample inconsistencies.** Align product-chart quantities with table quantities. Resolve the September 12 header of seven orders/₱4,680 versus its six displayed transactions totaling ₱4,880. If retaining those six rows, show six/₱4,880.
3. **Make costing coverage visible.** Preserve full product revenue separately from revenue with complete costing. Do not deduct partial cost from full revenue and label the result a covered margin.
4. **Use correct percentages.** With the existing complete-cost rows, covered revenue is ₱79,760, estimated cost ₱41,420, and estimated margin ₱38,340. Show 48.1% covered margin and 51.9% covered cost to one decimal. Full revenue remains ₱84,560, including ₱4,800 excluded from margin coverage.
5. **Explain the selected product's basis.** View Basis must open that product/variant, not the same Ensaymada fixture for every row. Label current catalog cost separately from historical period costs where they differ.
6. **Implement period/metric controls.** Presets, custom dates, previous-period comparison, and Sales/Units switches must recompute results. Reject invalid ranges and show accurate no-data/loading/error states.
7. **Define reporting policy before integration.** Specify qualifying payment/order statuses, the date field used, delivery-fee treatment, and current-versus-historical costing. Label those choices in accessible report help. The chapter/ERD do not settle every accounting policy.
8. **Separate subscription money and fulfillment.** Count enrollment revenue once. Define whether Units Sold represents purchased commitment quantities or fulfilled quantities, and label it consistently. Weekly operational orders must not duplicate paid enrollment revenue.
9. **Use historical price snapshots.** Catalog price changes must not rewrite previous sales. Product-level order counts may overlap across multi-item orders; do not force their sum to equal distinct transactions.
10. **Connect drill-downs and authorization.** Selected dates/products lead to matching transactions and order details. Owner-only presentation must eventually be backed by server-side authorization.

### Acceptance checks

- Recalculate all sample totals from their displayed rows and reconcile chart/table values.
- Change periods and metrics: every affected view updates consistently.
- Open cost basis for multiple products: context and calculations match each selection.
- Include a prepaid subscription with four fulfillments: revenue is counted once under the documented policy.
- Include an incomplete-cost product: its revenue is disclosed separately and does not inflate covered margin.

## 7.12 — Owner Notifications / Settings

### Retain

Separate internal feed, customer outbox, and account/security tabs; provider/channel distinctions; masked recipients; related-record links; failed-payment/hold separation.

### Revise

1. **Load outbox records by ID.** Sent email, pending reminders, and failed SMS must open their own recipient, provider, related entity, timestamps, error, and status. Remove the shared failed-SMS drawer data.
2. **Derive unread state/counts.** Correct the six-unread claim when only four cards are unread. Mark All updates records, badges, counts, and the current filtered view. Preserve shared acknowledgement semantics.
3. **Combine feed and outbox controls.** Search/read/module filters must compose rather than undo one another. Implement outbox channel/status/date filters and pagination on the same records.
4. **Repair payment preview wiring.** Align `drawer-payment-failed` with the controller's implemented state. Keep the ordinary View Payment action linked to the selected attempt/order.
5. **Align notification types with the model.** Use supported `SystemNotification` types or explicitly propose additions for failed payment, new review, and batch commitment. Do not assign an unrelated existing enum just to fit the fixture.
6. **Separate send status from retry scheduling.** Use pending/sent/failed for the send outcome. Attempt counts, next-attempt timestamps, and automated retries need an explicit model/job policy; omit unsupported claims until that design exists. Surface provider errors without promising a retry that is not scheduled.
7. **Implement profile and password actions.** Validate inputs and credential confirmation, commit the current owner's changes, and report success afterward. Reuse the existing authentication policy and form behavior.
8. **Use the documented email-verification model.** Replace confirmation-link copy with the `email_change` OTP flow unless the verification model is deliberately revised. Retain the existing email until successful verification; provide invalid/expired-code and resend states.
9. **Implement sign out.** End the prototype owner session and leave protected screens. A “Signing out...” toast is insufficient.
10. **Reconcile linked records.** Correct draft identity across 7.10/7.12 and remove the unexplained completed-order/current-checkout contradiction for K406-1048.
11. **Remove obsolete helpers.** Delete the unused manual payment-verification behavior and missing-button retry helper. A notification action must never make an order paid or queue production by itself.

### Acceptance checks

- Open sent, pending, and failed messages: each drawer matches its row.
- Apply unread plus module plus search, then mark all read: results and counts update together.
- Open the payment scenario and related order without an unhandled state.
- Invalid credentials, mismatched passwords, or failed OTP verification do not change the account or show success.
- Sign out and attempt to return to owner screens: the local access gate requires a valid owner session.

## Decisions and recommended defaults

These are unresolved design choices, not additional features automatically authorized by this brief. Keep schema-aligned defaults while documenting any proposed extension.

| Decision | Default for this revision | If extended later |
| --- | --- | --- |
| Ingredient archival lifecycle | Remove manual active/inactive control; retain system stock status. | Add a separate archival field and define dependency/availability behavior. |
| Referenced ingredient units | Block changes when existing quantities/references/history would be reinterpreted. | Design coordinated conversion with historical-unit treatment. |
| Prepared materials | Use base ingredients unless a material is explicitly purchased as a direct input. | Confirm actual sourcing with the bakery. |
| Category visibility | Preserve the proposed inactive-category exclusion in the prototype. | Document direct-link and checkout rules before production integration. |
| Customer administrative powers | Keep the directory read-only. | Specify owner suspension/reactivation permissions and history first. |
| Moderation explanation/history | Retain enum reason and supported current metadata; remove unsupported persistence promises. | Add explanation/audit storage if required. |
| Staff action history | Show supported creator/timestamps. | Add an audit mechanism before promising complete permanent logs. |
| Report recognition/cost basis | Label a consistent chosen prototype basis; disclose coverage. | Confirm statuses/date basis, fees, subscription units, and historical costing before production. |
| Notification types/retries | Use documented types/statuses and implemented behavior only. | Specify enum additions, attempt records, and retry scheduling. |
| Owner email verification | Use the existing OTP model. | Revise the schema and authentication design if switching to links. |

## Suggested revision order

1. Establish shared records, navigation, owner shell, and common save/filter behavior.
2. Repair record selection and broken handlers in Staff Accounts, Review Moderation, Ingredients, Customer Accounts, and Outbox.
3. Complete catalog, category, material, cake-option, and occasion editing with validation and historical-record preservation.
4. Complete marketing review transitions and account/security behavior.
5. Rebuild reporting from consistent transaction/cost data and settle its stated calculation basis.
6. Run each subphase's acceptance checks, followed by cross-module navigation, mobile, keyboard, and owner/staff boundary checks. Record actual results separately; this brief does not claim those checks have passed.
