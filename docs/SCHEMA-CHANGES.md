# Schema change log

Source baseline: final table in proposal file (9). All 43 entities and original attributes retained. No entities or attributes removed.

| Change | Reason | Authority |
| --- | --- | --- |
| Subscription.status adds pending_payment | Persist unpaid enrollment without falsely activating it | Explicit user approval during implementation |
| Order.checkout_delivery_fee numeric | Preserve the customer-paid quote separately from courier booking expense | D07 |
| OrderItem.material_cost_snapshot numeric | Historic item cost survives ingredient/recipe changes | D10 |
| OrderItem.overhead_cost_snapshot numeric | Historic overhead survives pricing configuration changes | D10 |
| CustomCakeQuotation.specification_snapshot JSONB | Preserve exact accepted design/options/addons/materials | D08 |
| CustomCakeQuotation.material_cost_snapshot numeric | Preserve quoted material-cost basis | D08/D10 |
| PostDraft.trigger_key unique text | Prevent duplicate business-event drafts | D11 |
| NotificationLog.attempt_count integer | Persist sending attempts | D12 |
| NotificationLog.next_attempt_at timestamp | Schedule retry | D12 |
| NotificationLog.provider_message_id text | Preserve simulated external provider reference | D12 |
| NotificationLog.event_key unique text | Prevent duplicate event/provider messages | D12 |

## Physical types and constraints

- Primary and foreign keys use text UUIDs, retaining original relationships.
- Money/ingredient quantities use NUMERIC(14,4); sellable quantities integer. InventoryReservation.quantity is numeric, since recipes consume fractional ingredients.
- Date-only fulfillment fields use DATE; event/expiry times TIMESTAMPTZ.
- Enums implemented as PostgreSQL CHECK constraints, retaining documented values plus D15.
- Every documented FK and compound UNIQUE constraint is included; deletion restricted to preserve history.
- Added positive-quantity/nonnegative-cost checks and OrderItem exactly-one product/quotation check.
- Partial unique indexes enforce one active hold/order, active reservation/requirement, active courier booking/order, and default active address/customer.
- Singleton PricingConfig index enforces the documented global pricing settings.
- Link-validation triggers enforce role/profile matching, order address ownership, cake option types, accepted quotation/request matching, review eligibility, maximum two feedback images, and deferment subscription/delivery matching.
- Deferred triggers enforce exactly four delivery records per subscription transaction.
- Lookup indexes on allocation dates/status, requirement reservation dates, payments/status, and orders/customer improve workflow queries without changing cardinality.
- Transaction-scoped advisory lock serializes internal writes in this prototype, preventing competing capacity/stock allocations. This is a deliberately simple concurrency implementation, not a replacement for relational constraints.

Infrastructure files under .runtime hold only local database files, uploaded assets, mock outbox payloads, and test-clock/provider controls. They are not business entities and are excluded from source control.

Further changes will be appended here as they occur.
