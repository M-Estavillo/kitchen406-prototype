# Batch 7 — Analytics and Accounts

The integrated owner workspace had no Analytics or Accounts pages. Both now use its existing layout, UI helpers, modal manager, PHP formatting and mock role gates. Earlier owner routes, operational screens and shared records remain in use.

## Routes and data

- `#/owner/analytics`: reporting period, recorded-payment totals, paid purchase count, sales trend, sortable product performance, and a separate current estimated cost/margin table. Dashboard links to Analytics.
- `#/owner/accounts` and `#/owner/accounts/staff`: staff directory, search/status filters, sorting, pagination and creation.
- `#/owner/accounts/staff/:id`: details, editing and confirmed activation/deactivation, retaining history.
- `#/owner/accounts/customers` and `#/owner/accounts/customers/:id`: read-only directory and shared addresses, orders, subscription history and cake requests, with links to their existing owner views.

Analytics reads `operations.list()` and original item/purchase snapshots. Accounts uses the existing customer records and account buckets. `staff.accounts` contains the existing staff object and newly provisioned accounts; the selected `staff.account` references that same registry. Sign-in resolves any provisioned staff account, checks its active status and retains the predefined role. No individual permissions, customer editing or backend services were added.

Staff creation requires names, unique email and an initial password under the existing password rule. Only its hash is retained. Forms preserve values on errors, guard repeat/stale submissions, support discard confirmation, and reject cancelled or changed sessions. Creator identity and timestamps are recorded. Historical activity is not deleted on deactivation. The original preview account has no creation audit metadata; the UI displays that as unavailable.

## Reporting basis

The chapter text describes sales activity without precisely defining recognition by payment versus fulfillment. This implementation explicitly labels its basis as recorded full payments, using the existing paid flag and payment timestamp. It does not claim fulfilled revenue, net profit, or formal accounting.

- Each paid standard/custom-cake purchase or prepaid subscription parent contributes once. Unpaid, failed and expired attempts add nothing. Weekly subscription fulfillment children never add revenue or purchase counts.
- A paid cancelled purchase or unresolved payment remains in recorded receipts; no external refund is inferred. Historical totals include the recorded delivery charges. Product sales exclude these charges and the difference is shown separately.
- Subscription quantities cover the four prepaid weeks, using the original product identity, quantity and unit price. Cake values come from the paid order's accepted-quotation snapshot.
- Date bounds are inclusive in Asia/Manila. This week/month are based on the current reporting date, independent of the scheduling simulator's clock. Custom dates affect every historical metric. Grouping is daily up to 31 days, weekly through 120 days, and monthly for longer ranges. Partial bucket labels are clipped to the selected range.
- A paid record without a usable payment date is excluded from dated reports with an explicit notice; a purchase-creation date is not invented as its payment date.
- Current estimated costs/margins use `pricing.cost()` and current final prices, including recipe ingredients, packaging and configured utility overhead. They are independent of the report period. Missing costs remain unavailable and changing costs/prices does not rewrite historical sales.

## Fixtures and limits

The existing **Load owner examples** action also supplies one inactive staff account and one customer without transactions. Existing orders, prepaid subscriptions, cake requests and incomplete inventory costing cover the other examples. No records are added by simply navigating to the new screens. Reset preview resets managed staff accounts and report filters. Accounts, credentials and business records remain in memory.

The chapter files and ERD were consulted; no standalone SRS or `Owner_Interface_Revision_Guide.md` was present. Owner profile/security settings and Batch 8 modules remain outside this change.

## Verification

`verification/owner-batch7.cjs`: **62 passing checks**, no browser exceptions. Covers date boundaries, empty/invalid ranges, shared totals/chart values, failed/unpaid/paid-cancelled records, payment deduplication, prepaid quantities, cake snapshots, current margin changes, missing costs, product links/sorting, staff creation/edit/status and sign-in, owner-only access, customer searches/shared histories/read-only views, cancellation, reset, responsive staff forms and widths of 1440/768/390/320 px. Desktop/mobile Analytics and desktop Accounts screenshots were visually reviewed; account timestamp formatting was corrected during that review.

Run using the existing Chrome CDP setup: `node verification/owner-batch7.cjs`. Set `K406_CDP_PORT` for an isolated browser port. Browser suites must run sequentially.

Passing regression suites: owner browser (78), owner integration (32), Batches 3/4/5/6 (12/18/27/27), customer subscriptions (72), staff paper revisions (32), authentication edges (15), subscription state (18), and Phase 4 state (32). All 58 application scripts passed Node syntax checks.

Two older browser suites stop at assertions inconsistent with the existing workspace implementation, outside this batch:

- `phase5-browser.cjs`: expects an `h1` on `staff/production/STAFF-DEMO-1`; the current production-details layout has no such heading.
- `phase2-browser.cjs`: expects the bag count to equal total units; the current `commerce.sync()` counts distinct products.

Their full passes are not claimed. Existing whitespace warnings at the ends of `owner-orders.js` and `subscription-checkout.js` were left unchanged. Regression screenshots were not overwritten.
