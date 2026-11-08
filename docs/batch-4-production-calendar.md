# Batch 4 — Production Calendar

- `#/owner/capacity` retains the existing calendar route and now presents Production Calendar.
- `#/owner/capacity/settings` contains general capacity, standard/cake timing, and single-date blocks. The old `#/owner/scheduling` route redirects here.
- Calendar commitments come from shared paid order records; allocation details use the existing capacity facade. Temporary holds remain separate from confirmed commitments. Capacity totals remain unfiltered even when commitment filters are applied.
- Limits show zero remaining plus an explicit excess when over capacity. Blocking and lowering limits preserve existing orders. Removing a block requires confirmation.
- General settings preserve subscription capacity and timing. Existing subscription configuration remains at `#/owner/scheduling/subscriptions`, linked from Subscriptions, pending Batch 5. Its underlying implementation is retained.
- Blocks remain single-date records, as in the original implementation. Saving the same date edits its reason without duplication; no date-range policy was introduced.

Verification: `node verification/owner-batch4.cjs` (18 checks), `node verification/owner-browser.cjs` (78 checks), and `node verification/owner-integration.cjs` (32 checks) passed through local Chrome port 9222, with no browser exceptions. Calendar overflow checks cover 1440, 390, and 320 pixels. Changed JavaScript passes Node syntax checks.
