# Batch 6 — Products, variants, recipes and costing

## Routes and ownership

- `#/owner/products`: searchable, filterable, sortable, paginated product listing.
- `#/owner/products/:id/:variant?`: product overview, variants, selected recipe and costing.
- `#/owner/products/categories`: flat category names and active/inactive status.
- Old `#/owner/recipes` links redirect into Products; no separate Recipes & Costing sidebar entry remains.

Products, variants, categories, activation, catalog availability and subscription eligibility use the existing shared catalog. Categories preserve their stable identity and existing product relationships. Inactive categories cannot be assigned to new products. Deactivation never deletes a product or variant. New variants need their own recipe before they can be purchased.

The existing recipe, inventory-cost, default/custom utility overhead, markup and final-price editors remain in use. Packaging from the BoM is counted once. Missing or invalid material costs leave the estimate unavailable. Suggested prices and estimated margins recalculate without changing the final selling price. Historical order items and committed material requirements remain snapshots.

The customer catalog reflects names, category labels, images, final prices and available variants. Its variant selector supports more than two variants using the existing styling. Shared availability checks continue to enforce ingredients and scheduling. Subscription schedules and weekly capacities remain in Subscriptions.

## Prototype limits

Image selection uses existing local assets and a neutral placeholder, without an upload service. Records remain in memory; Reset preview restores the original catalog and category data. No deletion workflow, nested BoM, recurring billing, or backend was introduced.

## Verification

Passed: focused Batch 6 browser checks (27), owner browser (78), owner integration (32), customer subscription browser (72), and subscription state (18). Passing browser runs reported no uncaught exceptions. Focused layout checks cover 1440, 390 and 320 pixels; existing browser suites also cover 768 pixels. Changed scripts passed Node syntax checks.
