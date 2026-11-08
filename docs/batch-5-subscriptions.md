# Batch 5 — Subscriptions

## Organization

- Records and details: `#/owner/subscriptions` and `#/owner/subscriptions/:id`.
- Weekly schedules: `#/owner/subscriptions/schedules`; the legacy `#/owner/scheduling/subscriptions` URL redirects here.
- Weekly product capacity, offering availability, and subscription timing: `#/owner/subscriptions/offerings`.
- Approval queue: `#/owner/subscriptions/requests`.

Schedule editing reuses the existing form and snapshot-preservation service. Standard and cake controls remain in Production Calendar. Existing active/fallback schedule selection behavior is preserved.

## Shared state and rules

Per-product weekly unit limits use `schedule.config.subscriptionLimits`, falling back to the existing global limit until explicitly configured. Enrollment and replacement-date validation use the same limits as the calendar. Offering controls do not mutate product catalog availability. Existing prepaid orders and allocation IDs survive configuration changes.

Customer deferment submission now creates a pending request. Owners confirm approval or rejection. Approval rechecks the original date, cutoff, production state, allowance, replacement date, blocked dates, and capacity before using the existing allocation-transfer operation. Rejection leaves the schedule and allowance unchanged. There remain four fulfillment orders; no new weekly payment or fifth fulfillment is created. Customer detail displays request status. Notifications and inventory reconciliation run on approval, not submission.

All data remains in memory and clears with Reset preview. Use the existing customer sample subscriptions and owner examples to explore active, partial, and completed commitments. Submit requests through the existing customer deferment screen to exercise pending, approved, and rejected states.

## Verification

Passed: owner browser (78), owner integration (32), focused Batch 5 (27), customer subscription browser (72), subscription state (18), and inventory/reservation revisions (32). No browser exceptions in passing runs. Responsive checks include 1440, 768, 390, and 320 pixels across the relevant suites. Changed scripts pass syntax checks.

Regression assertions were updated where the old tests assumed automatic deferment. An outdated customer price test was aligned with the pre-existing informational price notice; pricing behavior was not changed by this batch.
