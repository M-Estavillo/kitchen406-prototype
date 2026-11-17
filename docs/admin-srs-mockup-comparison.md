# Admin SRS mockup comparison

Reviewed November 9, 2026. Scope: Figures 42–76 in [Kitchen406 - Capstone Paper.md](../Chapters/Kitchen406%20-%20Capstone%20Paper.md), SRS §3.1. Compared the embedded PNGs and their accompanying descriptions against this checkout's current `index.html` application.

**Result: the paper's admin mockups do not match the current UI.** All 35 screenshots show the previous application shell/navigation. Beyond that shared visual difference, multiple screens have changed layout, moved into dialogs, merged into another module, or disappeared from the exposed interface. Refreshing images alone will not resolve the discrepancies.

This is a UI/documentation comparison, not approval to remove functional requirements. A missing interface may represent unfinished implementation. Resolve such gaps before deleting the corresponding SRS requirement.

## Evidence and limits

- Extracted and inspected the actual embedded images (`image80`–`image114`), not just their captions. [Extracted images and current screenshots](../verification/admin-paper-audit/) are stored together. `paper-42.png` is Figure 42, and so on. `paper-sheet-0.png` through `paper-sheet-4.png` provide an overview of all paper figures.
- Opened 30 current routes in a local headless Edge browser at a 1440 × 1000 viewport and saved full-page screenshots plus [rendered text, links, buttons, and redirect results](../verification/admin-paper-audit/current-pages.json). Also opened representative detail screens and dialogs.
- Used the repository's existing developer fixtures to populate representative records in an isolated browser session. The fixture scripts were explicitly evaluated in that session after the initial loader was unavailable. No application source or paper content was changed. Audit screenshots contain mock controls and occasional fixture toast messages: use them as evidence, not final publication images.
- Screen values, names, dates, totals, and record counts may differ because of sample data. These differences alone are not counted as design mismatches. The prototype's schedule can use a simulated date distinct from the actual review date.
- Issued quotation details (Figure 53) were checked against their current renderer; this audit did not issue a quotation to obtain a populated screenshot. Several other detail screens retain their core purpose, but this review does not certify every loading, error, validation, or backend behavior stated in the paper.
- No deployed website URL was supplied; conclusions apply to the local prototype in this workspace.

## Shared difference affecting every figure

The embedded mockups use a long sidebar with separate entries for payments, deliveries, recipes/costing, categories, ingredients, cake options, customer accounts, reports, and notification outbox. The current sidebar contains Dashboard, Orders, Inventory, Products, Custom Cake Requests, Subscriptions, Production Calendar, Notifications, Analytics, Accounts, Marketing Drafts, Customer Reviews, and Settings. The header now uses notification/account icons. Consequently, **none of the old screenshots is an exact representation of the current desktop interface**, even when its main function remains available.

## Figure-by-figure revision checklist

“Retained” means the principal screen purpose survives; it does not mean the screenshot is current. “Changed” means its description also needs substantive review. “Merged/dialog” means the figure should be reframed around its new location. “Unavailable” means there is no equivalent exposed screen in the current router/renderers.

| Figure and paper title | Assessment | Current location / observed difference | Paper revision |
| --- | --- | --- | --- |
| 42. Owner Dashboard | Changed | `#/owner`. Four operational counters remain. Main sections are Today's fulfillment and Upcoming commitments. The old Payments received, Attention needed, and Cake inquiries panels are absent. | Replace screenshot; revise description so it does not promise those separate panels or recorded-payment summary on this screen. |
| 43. Owner Orders | Changed | `#/owner/orders`. Uses All, Active, Needs attention, Completed status controls and the current compact filters/record presentation. Payments and deliveries are nested within Orders. | Replace screenshot and describe the current status groups, filtering, and nested navigation. |
| 44. Owner Order Details | Retained, refreshed | `#/owner/orders/{id}`. Order/payment/fulfillment inspection and eligible actions remain; current detail composition and shell differ. [Example](../verification/admin-paper-audit/order-detail.png). | Replace screenshot using a representative paid order. Keep supported detail/transition wording after checking the chosen order state. |
| 45. Payments / Payment Issues | Retained, relocated | `#/owner/orders/payments`, titled Orders · Payments & Issues. No separate sidebar entry. | Replace screenshot and refer to the Payments view under Orders. |
| 46. Deliveries / Courier Booking | Retained, relocated | `#/owner/orders/deliveries`, titled Orders · Deliveries. No separate sidebar entry; courier table/actions remain. | Replace screenshot and navigation wording. |
| 47. Owner Inventory | Changed | `#/owner/inventory`. All / Ingredients / Packaging tabs; compact search/stock filters; table exposes Details, Restock, Adjust. The current list does not show the old unit-cost column. | Replace screenshot; distinguish list columns from cost information in ingredient details. |
| 48. Ingredient Stock Details | Retained, refreshed | `#/owner/inventory/{ingredientId}`. Stock position, requirements, movement history and stock/cost actions remain, with a revised composition. | Replace screenshot; illustrate both stock position and related activity. |
| 49. Recipes & Costing | Merged | `#/owner/recipes` redirects to Products. Recipe and estimated-costing panels exist on product/variant details and the redesigned editor; there is no standalone old costing list. | Reframe as Product Recipe and Costing; capture `#/owner/products/{id}/{variant}` or the editor. Explain where recipe, overhead, markup, and final-price controls now reside. |
| 50. Owner Custom Cake Requests | Changed | `#/owner/cake-requests`. Current request listing uses the redesigned request cards rather than the old table. | Replace screenshot and remove the claim that results are presented in a table. |
| 51. Owner Custom Cake Request Details | Changed | `#/owner/cake-requests/{id}`. Selected options, reference images/notes, requested fulfillment, customer details, review, estimate and quotation history are reorganized into separate sections. [Example](../verification/admin-paper-audit/cake-detail.png). | Replace screenshot; update section names and describe Create quotation as opening a dialog. |
| 52. Custom Cake Quotation Builder | Merged/dialog; field mismatch | Create quotation opens a modal on the request. Current form exposes fulfillment date, add-ons charge, complexity charge, owner design notes and a live breakdown. The old full-page builder's editable time window, method, expiry and delivery-fee fields are not exposed in this dialog. [Evidence](../verification/admin-paper-audit/quotation-dialog.png). | Replace with Create Cake Quotation Dialog. Rewrite visible-field description. Treat removed configuration controls as a requirements/implementation decision rather than silently assuming equivalence. |
| 53. Issued Cake Quotation Details | Retained; source checked | `#/owner/cake-requests/{id}/quotation/{quotationId}`. Current renderer retains version/status, quoted design, price/fulfillment, customer notification and production-copy panels. | Refresh screenshot with an issued quotation. Core description remains broadly applicable; populated browser capture remains outstanding. |
| 54. Owner Subscriptions | Changed | `#/owner/subscriptions`. Records are cards showing product image, customer, plan, completion progress, next fulfillment and total. Adds Records, Schedules, Capacity, Deferment history tabs. Old separate unconfirmed-enrollment panel is absent from this renderer. | Replace screenshot; describe cards and section tabs. Recheck the claim about a separate unpaid/unresolved enrollment section. |
| 55. Owner Subscription Details | Changed | `#/owner/subscriptions/{id}`. Enrollment overview, Payment & progress, Four weekly fulfillments, and Deferment history. Timeline is a list rather than the old detailed table; material-reservation conditions are not shown per cycle in this renderer. | Replace screenshot and revise the per-cycle field claims. |
| 56. Capacity Calendar | Changed | `#/owner/capacity`, now Production Calendar. Week and Month controls, redesigned calendar/agenda/capacity panels and allocation cards. The visible view selector no longer offers Day. | Rename to Production Calendar; replace screenshot; describe Week/Month and selected-day details rather than a Day view or allocation table. |
| 57. Blocked Dates / Scheduling | Changed and split | `#/owner/capacity/settings`, now Calendar Settings. Blocked-date calendar and general capacity/timing remain. Subscription schedules/capacity are managed under Subscriptions. | Rename and replace screenshot; move subscription configuration discussion to the corresponding subscription screens. |
| 58. Products | Changed | `#/owner/products`. Image card grid with Edit and individual Active switches; Edit categories and Costing settings actions. No table/card switch, selection checkboxes or bulk activation controls in the current renderer. | Replace screenshot and rewrite the table/card and bulk-action claims. |
| 59. Product Editor | Changed | `#/owner/products/{id}/edit`. Variant picker, per-variant selling prices, Active/Subscription-eligible switches, Recommended Selling Price panel, cover-image selector and inline Recipe material tables. [Evidence](../verification/admin-paper-audit/owner-products-1-edit.png). | Replace screenshot; describe integrated recipe/costing and current variant controls. Do not retain unsupported free-form variant-identifier or image-upload behavior merely because it appeared in the old description. |
| 60. Categories | Merged/dialog | Products → Edit categories opens a category list dialog, then add/edit dialogs. `#/owner/products/categories` redirects to Products. Old searchable paginated category table/product-count interface is absent. | Rename to Category Management Dialog; replace screenshot and remove old search/filter/count/pagination claims. |
| 61. Ingredients | Unavailable as a separate screen | No Ingredients page in current owner routing. Inventory and its detail/cost form cover part of this purpose, but the old ingredient-definition registry/add screen is not exposed. | Reconcile whether ingredient creation/definition management is still required. Merge documentation with Inventory only for functions actually available; do not treat the whole old screen as implemented. |
| 62. Cake Options / Add-ons | Unavailable | No current owner route/renderer exposes this management registry. Customer cake options in data are not an admin editing interface. | Flag as an implementation/scope gap. Retain as a proposed mockup only if clearly labeled, or restore/approve removal before revising it out. |
| 63. Seasonal Occasions | Merged/dialog | Marketing Drafts → Seasonal occasions opens a dialog; Add/Edit occasion opens a form. `#/owner/marketing/occasions` redirects to Marketing Drafts. No old filtered table or linked-draft-count column. | Replace with Seasonal Occasions Dialog and describe list entries, date range, status and add/edit actions. |
| 64. Staff Accounts | Changed | `#/owner/accounts/staff`, titled Accounts. Staff cards with account actions and separate create/edit dialogs replace the registry table. | Replace screenshot, rename to Accounts (Staff), and describe current registry presentation. |
| 65. Customer Accounts | Unavailable | `#/owner/accounts/customers` redirects to staff Accounts. The current Accounts renderer explicitly supports only staff. | Flag as an implementation/scope gap; no current screenshot can truthfully replace the old customer directory. |
| 66. Customer Account Details | Unavailable | No current customer account details branch in the owner Accounts renderer. Customer contact information on an order is not equivalent to this directory/detail screen. | Resolve together with Figure 65. Do not describe staff account details as customer details. |
| 67. Customer Reviews List | Changed | `#/owner/reviews`, now Customer Reviews. Visibility tabs and rating multi-select are present; table shows Customer, Product, Rating, Visibility, Action. Old visible comment column/date-range filter are absent. | Replace screenshot; describe current filters/columns. |
| 68. Review Moderation | Merged/dialog | View details opens Review details modal with feedback, photos, purchase link, visibility switch, conditional reason/notes and moderation history. Detail-style routes redirect to the list. | Rename to Review Details and Moderation Dialog; replace screenshot and describe switch/reason/history behavior. |
| 69. Marketing Drafts | Changed | `#/owner/marketing`. Image-based draft cards replace the caption-preview table. Adds Seasonal occasions action. | Replace screenshot and change table wording to paginated cards. |
| 70. Marketing Draft Details | Changed | `#/owner/marketing/{id}`. Detail panel with image/caption, status/context and action buttons; caption editing is a separate dialog. Pending drafts offer Edit caption, Regenerate image, Approve, Reject; approved drafts offer Copy caption and manual image saving. | Replace screenshot and distinguish pending/approved actions. Avoid claiming a dedicated Download image control where the interface instead offers image opening/manual saving. |
| 71. Reports | Changed; content reduced | `#/owner/analytics`, now Analytics. Recorded sales, Paid purchases, Average purchase, Units sold, Sales trend, Sales by order type donut, Top products. Old receipt tables, explicit cost coverage/margin panels and weekday breakdown are absent from this renderer. | Replace screenshot and rename to Analytics. Reconcile removed reporting content with SRS §4.19 before dropping it from the description. |
| 72. Product Report Details | Unavailable | `#/owner/analytics/1` displays the same Analytics overview. Current renderer does not branch on a product ID, and Top products has no product-detail navigation. | Flag as a missing drill-down, not a refreshed product-report screen. Resolve whether to restore or remove this documented interface. |
| 73. Owner Notifications | Changed | `#/owner/notifications`. Operational update cards, type/unread filter, unread count, Mark all as read, View details. Old search/date controls and notification table are absent. | Replace screenshot and describe current card feed and filters. |
| 74. Notification Outbox | Unavailable | `#/owner/notifications/outbox` still renders the operational Notifications feed. No outgoing-message registry is exposed by the current owner renderer. | Flag as missing UI; quotation notification attempts on an individual quotation do not replace a general outbox. |
| 75. Notification Details | Unavailable as an outbox detail | Current notification View details acknowledges the alert and navigates to its source order, ingredient or cake request. It does not show the old outgoing notification/provider/channel detail page. | Resolve with Figure 74; explain source-record navigation separately from notification-delivery inspection. |
| 76. Owner Settings | Changed | `#/owner/settings`, titled Settings. Read-only Profile Information and Account Security panels launch Edit profile, Change password and Change email dialogs. Old three inline forms and page-level Sign Out action are absent. | Replace screenshot; describe dialogs and the current account menu for session actions. |

## New screen coverage to consider

The current UI separates several functions that the old figures bundle together. Add or split mockups if these interactions need to be demonstrated:

- Subscription Schedules (`#/owner/subscriptions/schedules`) and Add/Edit Schedule dialog.
- Subscription Capacity & Offerings (`#/owner/subscriptions/offerings`) and its capacity/lead-time dialogs.
- Deferment History (`#/owner/subscriptions/requests`) and its detail dialog.
- Product/variant detail showing recipe and estimated costing, replacing the old standalone Recipes & Costing list.
- Category list/editor dialogs, Seasonal Occasions dialogs, Review Details dialog, and account security dialogs.

## Suggested editing order

1. Resolve the unavailable interfaces first: Figures **61, 62, 65, 66, 72, 74, 75**. Decide whether these are unfinished UI or approved scope changes. Keep functional requirements separate from screenshot refreshes.
2. Rewrite the structurally changed descriptions, especially **42, 49, 52, 55–60, 63, 67–73, 76**. Use the checklist above to avoid preserving old controls accidentally.
3. Capture publication screenshots of the retained/current screens with consistent viewport, representative records, closed mock controls, and no toast messages. Capture the actual dialogs where a full page no longer exists.
4. Update embedded images, captions, cross-references and figure numbering together. The paper's List of Figures currently ends at Figure 36 even though SRS mockups continue through Figure 76; regenerate that list after revisions.

## Source references

- [Owner navigation and routing](../app/owner.js): sidebar, route redirects, Notifications renderer and source navigation.
- [Dashboard, orders, payments and deliveries](../app/owner-orders.js).
- [Inventory and ingredient details/forms](../app/owner-inventory.js).
- [Products, editor, recipes/costing and category dialogs](../app/owner-products.js).
- [Cake requests and issued quotation renderer](../app/owner-cakes.js); [quotation modal](../app/owner-cake-state.js).
- [Subscriptions](../app/owner-subscriptions.js); [Production Calendar and Calendar Settings](../app/owner-scheduling.js).
- [Staff-only Accounts](../app/owner-accounts.js).
- [Reviews and moderation dialog](../app/owner-reviews.js).
- [Marketing drafts and occasions dialogs](../app/owner-marketing.js).
- [Analytics overview](../app/owner-analytics.js).
- [Settings overview and dialogs](../app/owner-settings.js).

The paper and application source were left unchanged. The deliverables are this review and the evidence files.
