# Phase 7 — Owner Management UI Review

Reviewed: October 8, 2026. Scope: all twelve uploaded generator exports, 7.1–7.12.

**The generator covered the expected management modules and many important business rules, but the exports are not ready to integrate as a working Phase 7.** Keep the general layouts and role boundaries. Fix record selection, missing event handlers, misleading saves, inconsistent reporting, and schema mismatches first.

This is a review of the uploaded `phase_7.*_revised` folders, not a review of the existing implemented Phase 6 application. No application or uploaded design files were modified.

## Review basis and limits

Read the chapter text and standalone ERD, then inspected every Phase 7 `code.html` and opened every accompanying `screen.png`. Findings below come from the exported images, HTML, event handlers, embedded scripts, and arithmetic checks. Source line numbers refer to the uploaded HTML, including some long generated lines.

This was a **static source and exported-screen review**. Live browser interactions, responsive viewport measurements, backend authorization, and external integrations were not executed. The repository's existing browser checks require Node, which was not available on this session's PATH. Missing functions and invalid DOM references below are source-confirmed defects; browser exception wording is not claimed as a test result.

| Baseline | Relevant requirements |
| --- | --- |
| [Chapter 1](<../Chapters/Chapter 1.md>), §1.4 | Owner-only customer/financial information; manual review moderation; four-week subscriptions; raw-ingredient inventory; owner-controlled marketing; no automatic social publishing or scheduling. |
| [Chapter 2](<../Chapters/Chapter 2.md>), especially §2.1.7, §2.1.9–10 | Owner-controlled cost-based pricing, straightforward transaction reporting, and automatically generated but human-reviewed marketing drafts. Other systems' features are background, not additional requirements. |
| [Chapter 3](<../Chapters/Chapter 3.md>) | Ingredient/packaging/utility costing; global markup; authentication and role separation; scheduled draft generation; manual Facebook posting. |
| [Chapter 4](<../Chapters/Chapter 4.md>), Figures 16–17, 20–23, 28–32 | Account creation and access, catalog and recipe relationships, material planning, notification records, moderation, reporting, and marketing review workflows. |
| [ERD](../Chapters/ERD.md) | Canonical fields, relationships, statuses, uniqueness rules, and audit metadata. |
| [Phases](../Phases.md) | Detailed Phase 7 list supplies the twelve subphases reviewed here. |

**Classification:** High = wrong record, blocked primary workflow, misleading financial result, or consequential schema/rule conflict. Medium = incomplete interaction, validation, consistency, or presentation. A missing production backend alone is not treated as a generator error. A button that falsely claims a change was saved, or loads the wrong person, is a prototype defect even without a backend.

## Coverage and verdicts

| Subphase | Design alignment | Main correction |
| --- | --- | --- |
| 7.1 Products | Mostly aligned | Make catalog actions real; synchronize table, grid, filters, and selection. |
| 7.2 Product Editor | Mostly aligned | Implement editing, variants, images, validation, and accurate preview/save state. |
| 7.3 Categories | Mostly aligned | Persist changes, validate unique names, and connect product navigation. |
| 7.4 Ingredients | Requires schema correction | Resolve manual active/inactive status; load the correct ingredient and protect units. |
| 7.5 Cake Options / Add-ons | Mostly aligned structure | Load each option's actual materials and units; save and validate mappings. |
| 7.6 Seasonal Occasions | Strong conceptual alignment | Save actual records and combine search/status filtering. |
| 7.7 Staff Accounts | Good access policy; broken wiring | Repair missing functions and stale element references before use. |
| 7.8 Customer Accounts | Good directory concept | Load selected customer details; make mobile filtering consistent. |
| 7.9 Review Moderation | Good moderation policy; broken workflow | Bind actions to the selected review and implement reason validation. |
| 7.10 Marketing Drafts | Correct manual-publication scope | Implement draft selection and durable review/edit/regeneration states. |
| 7.11 Reports | Appropriate report categories | Reconcile figures and implement period filters and contextual drill-downs. |
| 7.12 Notifications / Settings | Appropriate separation of concerns | Fix outbox identity, read counts, account actions, and schema alignment. |

## 7.1 — Products

**Source:** [Products HTML][p71] · [exported screen][s71]. Baseline: Chapter 4 Figure 29; `Product`, `ProductVariant`, `ProductBOM`.

### What it did right

- Separates active/inactive catalog status from ingredient-dependent storefront availability.
- Shows variants, selling prices, subscription eligibility, and partial availability when only one variant has enough ingredients.
- Explains that deactivation prevents new purchases while preserving existing records and commitments.
- Provides useful links in the design to recipes, inventory, and subscription schedules.

### What it did wrong or left incomplete

- **High — Status changes report success without changing products.** `bulkUpdateStatus()` (line 1192) clears selection and shows a toast. `confirmDeactivate()` (1240) and `openActivateModal()` also only show messages. Rows, status filters, and storefront availability remain unchanged.
- **Medium — Table and grid disagree.** The table contains eight product rows; the grid has only three cards. `applyFilters()` (1056) filters `.product-row` elements only, so grid cards do not follow the selected criteria. Selecting a category with one table match can still show unrelated grid products.
- **Medium — Selection ignores filtering.** `toggleSelectAll()` selects every `.row-checkbox`, including hidden rows. Before implementing bulk mutations, limit selection to the intended visible set or explicitly disclose selection across results.
- **Medium — Add/edit, sorting, and pagination are unfinished.** Add Product and several edit actions show navigation toasts; page 2 also shows a toast. There is no corresponding record navigation or sorting implementation.
- **Schema alignment — Variant status terminology drifts.** Expanded rows label variant status “Active,” whereas the ERD uses `available`/`unavailable` for `ProductVariant.status`. Keep product activation, variant availability, and derived stock availability distinct.

**Correction target:** Use one product collection for table/grid/counts and selected IDs for actions. A status change must update all representations while preserving historical orders and subscriptions.

## 7.2 — Product Editor

**Source:** [Product Editor HTML][p72] · [exported screen][s72]. Baseline: Chapter 3 Cost-Based Pricing; Chapter 4 Figures 17 and 29.

### What it did right

- Includes product name, category, description, image, variants, final price, and a separate suggested price.
- Leaves recipes and costing in their dedicated module and explains the ingredients/overhead/markup basis.
- Correctly says subscription eligibility adds the separate four-week option while retaining one-time purchasing.
- Treats stock availability as a system state and states that fulfillment capacity/cutoffs are checked at checkout.

### What it did wrong or left incomplete

- **High — Save is only a success animation.** `triggerSaveToast()` (264–275) does not validate or commit any input. It always announces Pandesal was saved, even if its name or prices were changed.
- **Medium — Core editor controls are decorative.** Add/remove variant and image replacement/removal have no working handlers. The “at least one variant” rule is copy rather than implemented validation.
- **Medium — Status/preview/dirty state are inconsistent.** Active/inactive buttons change their appearance only; the explanatory availability text and storefront preview remain fixed. Description input updates only the character counter. The initial unsaved-changes message is hardcoded.
- **Medium — Variant actions are cramped in the exported layout.** The screenshot cuts off the right side of the variant row actions within the narrow editor column. Ensure horizontal scrolling is discoverable or use stacked variant editors at smaller widths.

**Correction target:** Add a real draft model, validated save/cancel behavior, dynamic preview, and variant/image actions. Keep final price under owner control; changing ingredient costs must not silently overwrite it.

## 7.3 — Categories

**Source:** [Categories HTML][p73] · [exported screen][s73]. Baseline: `Category.category_name` UNIQUE and `status` active/inactive; Chapter 4 Figure 29.

### What it did right

- Uses a simple name/status model, shows assigned product counts, and provides add/edit/deactivate interfaces.
- Explains the proposed effect of category visibility without deleting product or order history.
- Search/status filtering handles both desktop rows and mobile cards, with a distinct no-results state.

### What it did wrong or left incomplete

- **High — Add/edit/activate/deactivate do not update the category collection.** Save (559), reactivation (583), and deactivate confirmation (653) only close overlays or display success toasts.
- **Medium — Required uniqueness is not checked.** Save rejects a blank name but accepts an existing category name, contrary to the ERD's unique category name constraint.
- **Medium — View Products does not navigate.** It announces a filter through a toast without opening the matching products.
- **Medium — Shared category fixtures disagree.** This screen lists Bread & Pastries, Cakes, Cookies & Treats, and Seasonal & Specials; the editor offers Custom Layer Cakes, Savory Bakes & Ensaymadas, and Pantry Spreads & Jams instead. Populate both from the same category records.

**Policy detail:** Hiding every product under an inactive category is a reasonable proposed behavior, but the chapter/ERD do not fully specify direct product-link and checkout behavior. Apply the chosen rule consistently across those entry points; do not claim the database enum alone defines that policy.

## 7.4 — Ingredients

**Source:** [Ingredients HTML][p74] · [exported screen][s74]. Baseline: `Inventory`, `InventoryMovement`, `ProductBOM`, cake ingredient mappings; Chapter 1 §1.4.2(10).

### What it did right

- Shows name, base unit, unit cost, reorder threshold, dependency counts, and inventory cross-links.
- Separates ingredient definitions from stock movements and recipe quantities at the interface level.
- Warns about dependent recipes and unit changes; avoids casually deleting a referenced ingredient.

### What it did wrong or left incomplete

- **High — Introduces an unsupported ingredient lifecycle.** The screen has a manual “Ingredient Active” toggle, Active/Inactive filter, and discontinued ingredient. The ERD has one `Inventory` entity with system-maintained `available`, `unavailable`, and `low_stock` states, not a separate ingredient-master active flag. Either remove this extra lifecycle or explicitly extend the schema; never map the toggle onto system-maintained stock status.
- **High — Editing different ingredients loads Bread Flour values.** `openEditModal(name)` (1076) always uses `g`, `0.0600`, and `2000`. Editing eggs or vanilla would therefore show the wrong unit, cost, and threshold. `openDetailDrawer()` (1053) changes only the title, retaining flour's details and dependencies.
- **High — Unit changes have a warning but no conversion/protection.** The dialog lets the owner proceed with a unit change while telling them to review recipes afterward. A g→kg change requires coordinated conversion of stock, thresholds, recipe quantities, reservations, and cost per unit, or a block on changing units while referenced. A warning alone cannot preserve those meanings.
- **Medium — Save/search/filter/sort/pagination are unfinished.** `handleFormSubmit()` (1113) only closes the modal. Search and list controls have no matching data implementation.
- **Clarify material sourcing.** Ube halaya could be a purchased input, which is compatible with a single-level model. If made internally, it must be represented through its base ingredients rather than treated as a separately manufactured stock item. The drawer's “baked sponge recipes” explanation should not imply a second inventory level.

**Correction target:** Treat Ingredients and Inventory as two views of the same `inventory_id`; use real per-record dependencies and a safe unit policy.

## 7.5 — Cake Options / Add-ons

**Source:** [Cake Options HTML][p75] · [exported screen][s75]. Baseline: `CakeOption`, `CakeAddon`, `CakeOptionIngredient`, `CakeAddonIngredient`, `CakeRequestAddon`.

### What it did right

- Includes all five required option types: shape, flavor, size, color, and icing.
- Separates options from quantity-based add-ons, with prices, availability, and ingredient requirements.
- Includes size scale factor and explains that add-on quantities multiply per-unit material requirements.
- Correctly distinguishes preliminary builder prices from the owner's final complexity charge and preserves historical requests in its copy.

### What it did wrong or left incomplete

- **High — Ingredient mappings do not follow the selected option/add-on.** `openDrawer()` (1177) and `openAddonDrawer()` update basic fields only. The ingredient rows remain the shared example rows, including when adding a new option. This can display flour/butter as the materials for an unrelated shape or color.
- **High — Every dynamically added ingredient is labelled kg.** `addIngredientRow()` creates a fixed kg unit even when selecting eggs or vanilla extract. Units must come from the selected inventory item, with explicit conversion if supported.
- **Medium — Save does not save.** `saveDrawer()` (1272) merely closes drawers. Added/removed material rows are not saved per record; material counts are not recalculated.
- **Medium — Required mapping validation is absent.** Enforce positive quantities, valid scale factors, nonnegative prices, and unique ingredient IDs per option/add-on, matching the ERD's compound uniqueness constraints.
- **Medium — Filtering is only partial.** The option table has search/type/status logic, but sorting, pagination, and add-on filtering are not implemented by the supplied script.
- **Potential scope conflict — Prepared ingredients.** “Extra Macarons” lists ganache as an ingredient (774), and Fondant Flowers uses gumpaste sugar dough. Purchased ready-made inputs may be legitimate; bakery-made intermediate components must be expanded into base ingredients under the documented single-level inventory scope.

**Correction target:** Load/save materials by option/add-on ID. Specify which quantities scale with size and which remain per cake or per add-on so boards, toppers, and decorations are not multiplied accidentally.

## 7.6 — Seasonal Occasions

**Source:** [Seasonal Occasions HTML][p76] · [exported screen][s76]. Baseline: `SeasonalOccasion`; Chapter 4 Figure 32.

### What it did right

- Matches the required name, start date, end date, and active/inactive fields.
- Clearly explains that saving an occasion does not immediately generate or publish a post.
- Routes the concept of generated-content review to Marketing Drafts and retains inactive occasions as records.

### What it did wrong or left incomplete

- **Medium — Save and deactivation only dismiss overlays.** `saveOccasion()` (485) and `confirmDeactivate()` (499) do not update data. Activation changes just the action button, leaving the status badge and counts stale.
- **Medium — Search and status overwrite each other.** `handleSearch()` (510) and `handleFilter()` (528) independently reset row visibility. Applying a status after a search can restore rows that do not match the query.
- **Medium — Date validation is missing.** Save does not require a name/dates or prevent an end date before the start date. Define behavior for overlapping periods rather than silently choosing one.
- **Medium — Display metadata is fixed.** Every edited occasion receives the same last-updated text; result counts and empty-search handling do not reflect filters.

**Correction target:** Keep the concept; implement record storage and combined filtering. Active should mean enabled for consideration, not necessarily that today's date falls inside the occasion window.

## 7.7 — Staff Accounts

**Source:** [Staff Accounts HTML][p77] · [exported screen][s77]. Baseline: Chapter 4 Figure 23; `Account`, `StaffProfile`, `AccountVerification`.

### What it did right

- Owner-created staff accounts, fixed staff role, creator attribution, and separate setup/password-change status match the intended model.
- Lists operational permissions and explicitly excludes customer identities/addresses, revenue, costing, reports, and administrative tools.
- Temporary-password creation/reset and first-login password change are consistent with `is_temp_pass_changed`.
- Deactivation copy preserves production and stock-movement history.

### What it did wrong or left incomplete

- **High — Primary controls call nonexistent functions.** Rows call `selectStaff()` (for example 169), but the script defines only `selectStaffRow()` (1053). Other missing functions include `toggleRowMenu`, `filterSetup`, `setDrawerEditMode`, `saveDrawerEdit`, `handleResetPassword`, `togglePwdVisibility`, and several reset/deactivation helpers. These controls cannot execute their advertised actions.
- **High — State/status switches dereference removed controls.** `setViewState()` (994) includes missing `viewBtn-empty` and unconditionally sets its `className`. `filterStatus()` (1057) expects `filterTab-pending`, which is absent. Both paths fail before completing their work. The newer `drawer-mika` and `reset` states also have no corresponding branches.
- **High — Actions are not tied to records.** `selectStaffRow()` ignores its ID; the drawer remains Andrea's. `confirmDeactivate()` (1103) always announces Andrea was deactivated and does not change the account.
- **Medium — Account creation claims an email was sent without creating staff.** `handleCreateStaff()` only closes the modal and toasts an activation invite. It does not compare password confirmation or establish the setup state. Sorting is also toast-only.
- **Schema gap — Full audit history is promised but not represented.** “Staff creations and status alterations are permanently logged” is stronger than `created_by_admin_id` plus timestamps. Full status history requires an audit mechanism beyond the supplied ERD.

**Correction target:** Repair event wiring first, then implement per-account create/edit/reset/deactivate state. Keep setup status separate from `Account.status`; enforce first-login password change and owner-only access in the eventual backend.

## 7.8 — Customer Accounts

**Source:** [Customer Accounts HTML][p78] · [exported screen][s78]. Baseline: Chapter 4 Figure 23; `Account`, `CustomerProfile`, `Address`, related orders/subscriptions/feedback.

### What it did right

- Provides an owner directory while leaving registration and personal account maintenance with the customer.
- Shows account status separately from email verification and includes active, pending, inactive, and suspended states.
- Includes saved/default/archived addresses and correctly explains historical checkout address snapshots.
- Provides related-activity cards, loading/error/empty-state designs, and keyboard row activation.

### What it did wrong or left incomplete

- **High — Every customer selection opens Angela Reyes's data.** `selectCustomer(id)` (1005) changes row highlighting but does not populate the drawer. Selecting Marco, Camille, or Julian still shows Angela's identity, addresses, and activity.
- **Medium — Mobile directory is incomplete and bypasses filters.** The mobile list (535) contains only two sample cards. `filterRows()` (1087) only targets desktop `.customer-row` elements, so the mobile cards do not follow matching desktop results.
- **Medium — Mobile-number search is advertised but not implemented.** The placeholder (132) promises name/email/mobile; the predicate searches only `data-name` and `data-email`.
- **Medium — Counts and navigation are placeholders.** Filtering resets the total to the number of rendered sample rows instead of the claimed 24 accounts. Pagination and related-activity links do not deliver a selected customer's real records.
- **Medium — Summary contradicts the list.** “Inactive / Suspended: 1 account” conflicts with both Teresa (inactive) and Julian (suspended) being present.

**Correction target:** Use customer ID throughout selection, address lookup, and related navigation. Generate table and mobile cards from the same filtered collection. The absence of owner suspension/editing controls is not classified as a defect: the documents do not clearly require those powers for customers.

## 7.9 — Review Moderation

**Source:** [Review Moderation HTML][p79] · [exported screen][s79]. Baseline: Chapter 1 review scope/limitations; Chapter 4 Figure 30; `CustomerFeedback`, `FeedbackImage`.

### What it did right

- Preserves visible-by-default feedback and explicitly says honest negative criticism should remain visible.
- Restricts moderation to hide/restore rather than rewriting ratings/comments or introducing sentiment automation.
- Shows purchased item/order context, read-only rating, up to two photos, and moderator/reason/time details.
- Includes the documented moderation reason categories and confirmation designs.

### What it did wrong or left incomplete

- **High — Review identity is replaced by unrelated fixtures.** All row keys except literal `spammer` fall through to Maria in `openDetailDrawer()` (346). The Carlo row passes `carlo`, so even that hidden review loads Maria. The hidden fixture calls the reviewer “CryptoPromoBot / Spammer” instead of the listed Carlo Mendoza.
- **High — Hide/restore targets the wrong content.** `confirmHideReview()` (408) opens the spammer fixture; `confirmRestoreReview()` (421) opens Maria's fixture. Neither changes the selected feedback's status, table row, counts, or audit metadata.
- **High — Reason validation is missing and confirmation stays disabled.** The radio buttons and Other textarea call undefined `handleReasonChange()` and `handleOtherInput()`; `confirm-hide-btn` is initially disabled (241). No implementation enables it after a valid reason.
- **High — Preview/retry states reference a missing element.** `setPrototypeState()` (277) dereferences `empty-state-section`, but that ID is absent. Toolbar values such as `hide-modal-initial`, `hide-modal-other`, and `empty-filters` also do not match the implemented switch cases.
- **Medium — Filtering, sorting, pagination, and photo navigation are incomplete.** Visible controls do not have corresponding record logic. The drawer's stars and submitted/completed metadata are not consistently repopulated for the selected review.
- **Schema gap — Free-text explanation has nowhere to persist.** The ERD includes the `hidden_reason` enum but no explanation field. Supporting the Other explanation and its administrative display needs a documented field or moderation-audit record.

**Correction target:** Carry `feedback_id` and its `order_item_id` through all actions. Hide must retain the original content/photos and record the actual owner, reason, and time; restore must restore that same feedback.

## 7.10 — Marketing Drafts

**Source:** [Marketing Drafts HTML][p710] · [exported screen][s710]. Baseline: Chapters 1–3 marketing scope; Chapter 4 Figure 32; `PostDraft`.

### What it did right

- Correctly presents automatic draft generation followed by owner review, with manual Facebook posting.
- Covers all four draft categories and the pending/approved/rejected review lifecycle.
- Separates caption editing from image-only regeneration and shows edit/regeneration metadata.
- Shows source context, an approval confirmation, and copy/download affordances without introducing automatic posting or a social publishing schedule.

### What it did wrong or left incomplete

- **High — Draft selection is not implemented.** Queue cards do not load their own records; the details remain Artisan Milk Loaf. Search/category/status/sort controls do not filter a backing collection.
- **High — Rejection returns to pending.** `confirmRejection()` (562) says the draft moved to archives, then explicitly calls `setPrototypeState('pending')`. No rejected record or updated queue exists.
- **Medium — Approval changes presentation only.** `confirmApproval()` (557) changes the banner/pill without recording reviewer/time or moving the selected draft between queues. Counters and action availability are not reconciled.
- **Medium — Regeneration only shows a timer overlay.** `triggerRegenerateImage()` (568) never changes the image or regeneration count. A prototype can simulate an alternative image, but it should represent success/failure and preserve caption edits accurately.
- **Medium — Save/copy/download feedback is misleading.** Caption save (586) changes status labels only. Clipboard failure (604) still announces “Caption copied!” Download Image (254–256) has no download behavior.
- **Medium — Cross-screen draft ID conflicts.** This screen identifies `MKT-2610-04` as Artisan Milk Loaf; Notifications identifies the same ID as a seasonal All Souls' Day draft.

**Correction target:** Use a selected `draft_id`, real local draft state, `was_edited`, `regenerate_count`, reviewer, and reviewed time. Guard approval against unsaved/stale changes. Preserve manual publication and show genuine copy/download failures.

## 7.11 — Reports

**Source:** [Reports HTML][p711] · [exported screen][s711]. Baseline: Chapter 4 Figure 31; Chapter 3 costing; transaction and material entities in the ERD.

### What it did right

- Covers period selection, sales, transaction counts, product performance, historical trends, and estimated margins.
- Clearly identifies estimates as something other than complete accounting profit and flags incomplete costing.
- Explains that a subscription purchase counts once and weekly fulfillments are operational, avoiding duplicate enrollment revenue in the intended design.
- Includes ingredient, packaging, and utility-overhead cost explanation; QR Ph transaction examples; owner-only and empty/error-state designs.

### What it did wrong or left incomplete

- **High — Product quantities disagree and margin coverage is unclear.** Source lines 369–424 show different quantities in the chart and table, and present full revenue beside costs/margins covering only some products; see the calculation table below.
- **High — Transaction drill-down contradicts its header.** Line 429 claims seven transactions totaling ₱4,680, but shows six amounts totaling ₱4,880. No missing-record/pagination explanation is shown for this drill-down.
- **High — Cost basis does not explain the displayed margin.** Classic Ensaymada's breakdown (447) shows ₱150 price, ₱100 cost, and 33.3% margin. The period table reports ₱18,900 sales, ₱10,080 cost, and 46.7%. If current catalog estimates differ from historical transaction costs, label the dates and basis; otherwise these should reconcile. Other “View basis” links point to the same costdrawer scenario rather than a selected product.
- **Medium — Period and metric controls are not implemented.** The only application function is `switchState()` (625), which swaps static scenarios. Date ranges, previous-period comparison, product metric switching, and contextual drill-downs do not recompute data.
- **Medium — Incomplete-cost warning is misleading.** It says excluding the incomplete product's cost makes the margin look higher, while the footnote claims the product is excluded. Exclude both that product's revenue and cost from covered-margin calculations, and separately show total revenue and costing coverage.

| Check | Displayed values | Result from displayed rows |
| --- | --- | --- |
| Units by product | Headline 412 | Table sums to 412; this part reconciles. |
| Ensaymada / sourdough / ube units | Chart 126 / 74 / 98 | Table 110 / 64 / 86. |
| Product revenue | Headline ₱84,560 | Table sums to ₱84,560; this part reconciles. |
| Covered production cost | Summary ₱41,420 | Six complete-cost rows sum to ₱41,420; this part reconciles. |
| Covered estimated margin | Summary ₱38,340 | Complete rows sum to **₱38,340**; this part reconciles. |
| Covered margin percentage | Summary 48.0% | ₱38,340 / (₱84,560 − ₱4,800) = **48.07%, or 48.1%** to one decimal. Covered cost is 51.9%, not 52.0%, to one decimal. |
| Revenue labelled alongside covered costs | ₱84,560 “100% of sales” | Cost + margin = **₱79,760**. Show this covered revenue explicitly, alongside the ₱4,800 excluded revenue. |
| September 12 drill-down | 7 orders / ₱4,680 | **6 orders / ₱4,880**. |

The row margins themselves add correctly; the main issues are chart/table quantity disagreement, the drill-down, ambiguous coverage, rounding, and inconsistent cost-basis context. Product-level order counts can overlap for multi-item orders, so their sum is **not** expected to equal the headline transaction count.

**Correction target:** Compute all views from one transaction dataset. Document qualifying statuses/date basis, delivery-fee treatment, subscription units, and current-versus-historical costs. Use order price snapshots for historical sales; do not recalculate historical sales from today's catalog price.

## 7.12 — Owner Notifications / Settings

**Source:** [Notifications / Settings HTML][p712] · [exported screen][s712]. Baseline: `SystemNotification`, `NotificationLog`, `AccountVerification`; Chapter 4 Figures 22–23 and 28.

### What it did right

- Separates internal operational alerts, outgoing customer-message logs, and owner account/security controls.
- Correctly identifies Brevo email and Semaphore SMS and includes masked recipients, related records, and send outcomes.
- Payment drawer correctly distinguishes a failed QR Ph attempt from its checkout hold and does not visibly offer manual payment confirmation.
- Provides read/unread concepts, notification context, and profile/email/password interfaces.

### What it did wrong or left incomplete

- **High — Every outbox row opens the same failed SMS.** `openOutboxDrawer(reference)` ignores the reference and reveals the fixed Rafael David / K406-1049 failure drawer. Sent email and pending reminder rows therefore show unrelated delivery details.
- **High — Security actions only claim success.** Profile save, email verification dispatch, password update, and sign out call `showToastNotification()` without changing account/session state or validating credentials and confirmation. “Signing out...” does not end access even in local state.
- **Medium — Read counts and filters disagree.** Six cards include four unread and two read, but the header says six unread. `markAllNotificationsAsRead()` (647) updates cards, not summary counts or the active filter. `setFeedReadFilter()` and `filterNotificationFeed()` (688) independently replace visibility, so applying one can undo the other; search has no matching predicate.
- **Medium — Payment preview uses an unhandled state.** Toolbar calls `drawer-payment-failed` (35), while the controller recognizes `drawer-notification-detail`. The ordinary View payment button has a valid direct drawer call; the defect is specifically the preview state.
- **Schema conflict — Email-change method differs from the ERD.** Copy promises a secure confirmation link; `AccountVerification` models an OTP hash, expiry, attempt count, and `email_change` purpose. Use the documented OTP flow or explicitly revise the verification model.
- **Schema gaps — Notification types and retries exceed the model.** New-review, failed-payment, and batch-committed alerts are not literal `SystemNotification.notification_type` values in the supplied ERD. Define a supported mapping or add types deliberately. Outbox attempt count, last/next attempt, and automatic retry scheduling also require a model/job policy; they are not stored by the final `NotificationLog` fields shown in ERD.md. “Failed / Retry Pending” should distinguish send outcome from retry scheduling, not become an undocumented status value.
- **Medium — Incorrect shared records.** `MKT-2610-04` conflicts with Marketing Drafts. K406-1048 is a completed October 5 purchase in Review Moderation but is presented as a current failed-payment checkout here, without explanation of why a completed order has another checkout attempt.
- **Maintenance finding — Obsolete payment/retry helpers remain.** `verifyPaymentAction()` (725) claims a payment was verified and baking queued; it has no visible calling control. Remove it before integration rather than accidentally reconnecting an owner payment override. `triggerImmediateRetry()` references a missing button. These are stale code, not demonstrated live UI actions.

**Correction target:** Resolve each alert/log by its own ID and linked entity. Use one combined filter and derived counts. Preserve the ERD's shared acknowledgement semantics: one user's acknowledgement can mark a system notification read. Implement validated account changes and an actual local sign-out transition.

## Cross-phase corrections and decisions

1. **Fix wrong-record actions before styling polish.** Ingredients, cake materials, customers, reviews, marketing drafts, and outbox details all need selected-record binding. Staff additionally needs missing handlers repaired.
2. **Replace false success with reviewable state changes.** A local in-memory prototype is sufficient for this stage, provided saved edits, status changes, lists, counts, and detail views agree. Real backend integrations remain later work.
3. **Connect navigation using stable IDs.** Most sidebar and cross-module links remain `href="#"`, sometimes with inert `data-path` attributes. The uploaded files have no shared router. Link products to their editor/recipes, customers to their own activity, notifications to the right records, and reports to their selected transactions.
4. **Use shared fixtures across Phase 7 and existing owner operations.** Category names, draft IDs, order identity, customer identity, prices, and dates must remain consistent across linked screens.
5. **Keep schema decisions explicit.** Ingredient activation, free-text moderation explanations, staff audit history, new notification types, retry metadata, and email-link verification need documented model decisions. Their absence from the ERD is not proof that every proposed extension is undesirable.
6. **Keep prototype controls separate from owner work.** Several screens expose List/Empty/Loading/Error scenario controls in the primary interface. They are useful for review but should live in the prototype/testing lab. The top-level Phase 7 summary mentions a lab, while the detailed list has no separate lab subphase; treat this as a coverage/documentation decision, not an invented thirteenth requirement.
7. **Unify the owner shell and accessibility behavior.** Exports vary in navigation labels, branding, sidebar widths, and whether Notifications/Settings are available. Several use a fixed sidebar and unqualified content padding. Check actual narrow viewports, drawer scrolling, keyboard focus, Escape, accessible icon names, and modal focus return before integration. No measured mobile pass/fail is claimed here.

### Decisions to settle before implementation

These do not block the review; they identify ambiguity in the baseline rather than automatically blaming the generator.

| Decision | Suggested default |
| --- | --- |
| Should ingredients have a manual inactive/discontinued lifecycle? | Keep the current system-maintained stock states unless a separate archival field and dependency behavior are approved. |
| Are halaya, gumpaste, and ganache purchased materials or made in-house? | Purchased materials can remain direct inputs; expand internally prepared components into base ingredients. |
| Should owners suspend/reactivate customer accounts? | Retain the read-only directory until administrative customer-status powers are explicitly specified. |
| What is the reporting revenue and costing basis? | Define paid/eligible transaction rules, date basis, delivery-fee handling, and costing coverage explicitly; label current estimates separately from historical snapshots. |
| Should Other moderation explanations and complete action history be retained? | Add appropriate fields/audit records if these UI promises are retained. |
| Should owner email changes use OTP or links? | Follow the supplied OTP model unless the authentication design is deliberately revised. |

### Acceptance checks for the corrected Phase 7

- Change a product/category/occasion and reopen it; saved values, counts, filters, and linked screens agree. Cancel leaves the original unchanged.
- Edit eggs and vanilla; their units, costs, thresholds, and dependencies belong to those exact ingredients. Referenced-unit changes cannot corrupt quantities.
- Edit two different cake options; each loads and retains its own unique materials and units. Add-on requirements multiply by customer quantity.
- Create/edit/deactivate/reactivate/reset two different staff accounts without undefined-handler failures or changing the wrong person.
- Select multiple customers on desktop/mobile; identity, addresses, activities, and combined filters match.
- Hide a selected review with a valid reason, then restore that same review; preserve content, purchase linkage, and moderation metadata. Honest negative reviews stay visible.
- Select, edit, regenerate, approve, and reject different marketing drafts; image regeneration preserves the caption, statuses/counters agree, and publication remains manual.
- Change the report period; cards, chart, rows, and drill-down reconcile. Subscription fulfillment does not duplicate purchase revenue; incomplete-cost coverage is explicit.
- Open sent, pending, and failed outbox entries; each shows its own recipient/provider/status. Combined feed filters and read counts stay consistent.
- Validate owner profile/email/password changes and sign-out behavior. Later backend checks must independently enforce owner-only data access.

[p71]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.1_products_management_revised/code.html
[s71]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.1_products_management_revised/screen.png
[p72]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.2_product_editor_revised/code.html
[s72]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.2_product_editor_revised/screen.png
[p73]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.3_categories_revised/code.html
[s73]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.3_categories_revised/screen.png
[p74]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.4_ingredients_revised/code.html
[s74]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.4_ingredients_revised/screen.png
[p75]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.5_cake_options_add_ons_revised/code.html
[s75]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.5_cake_options_add_ons_revised/screen.png
[p76]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.6_seasonal_occasions_revised/code.html
[s76]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.6_seasonal_occasions_revised/screen.png
[p77]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.7_staff_accounts_revised/code.html
[s77]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.7_staff_accounts_revised/screen.png
[p78]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.8_customer_accounts_revised/code.html
[s78]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.8_customer_accounts_revised/screen.png
[p79]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.9_review_moderation_revised/code.html
[s79]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.9_review_moderation_revised/screen.png
[p710]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.10_marketing_drafts_revised/code.html
[s710]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.10_marketing_drafts_revised/screen.png
[p711]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.11_owner_reports_analytics_revised/code.html
[s711]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.11_owner_reports_analytics_revised/screen.png
[p712]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.12_owner_notifications_settings_revised/code.html
[s712]: ../stitch_kitchen406_bakery_storefront/stitch_kitchen406_bakery_storefront/phase_7.12_owner_notifications_settings_revised/screen.png
