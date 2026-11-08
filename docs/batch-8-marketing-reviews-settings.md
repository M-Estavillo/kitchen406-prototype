# Batch 8 — Marketing Drafts, Customer Reviews, Settings

Added the three owner destinations using the existing owner shell, compact filters, tables, panels, forms and modal manager. Settings is also linked from the owner account menu.

Marketing retains event identity across pending, approved and rejected records. Product activation and qualifying subscription date changes are evaluated through shared operation changes. The State Inspector provides weekly product-highlight evaluation and image-failure simulation. Captions, deterministic replacement images, final review decisions and reviewer identity remain in memory. Approved captions can be copied and images opened for manual publication. Seasonal occasions support creation, editing and activation with date and duplicate validation.

Reviews now have a shared purchase-linked store populated by completed-purchase submissions and explicit owner example loading. Public product review rendering uses visible shared records. Moderation preserves original content and adds moderator history. Existing static storefront review markup is replaced by this shared feed. Example loading adds two historical completed purchases for verified positive and negative feedback.

Settings uses the existing owner identity and mock sign-in hash. Profile validation, password verification and confirmation, and simulated email verification use existing account rules. Changes appear in the shared owner account displays.

## Verification

35 browser assertions passed, with no application browser exceptions. Includes all owner routes, draft editing and image replacement, duplicate and finalized-state guards, hide/unhide history, profile/password flows, email verification, occasion validation and viewport overflow checks at 1440/390/320 pixels. All application JavaScript files passed syntax checking before the final small changes, and the subsequently changed files passed separately. The Settings desktop screenshot was visually inspected. Broader prior-batch interaction suites were not rerun.

## Deferred and limitations

The supplied chapter text does not define an upcoming-holiday eligibility window. Automatic seasonal draft selection is deferred pending that requirement. No arbitrary image regeneration limit was imposed because none was found. Weekly evaluations are explicit State Inspector simulations. Live background jobs and AI integrations remain outside prototype scope.

Browser coverage is targeted rather than exhaustive. Clipboard permission failure has a user-visible fallback, but successful clipboard access was not exercised by the automated checks. Image links open previews for manual saving. Review examples are created only through Load owner examples. Data is in memory.

Main additions are app/marketing-state.js, app/owner-marketing.js, app/owner-reviews.js, app/owner-settings.js and app/owner-batch8-fixtures.js. Wiring changes affect owner.js, owner.css, product.js, shell.js, app.js and index.html. Verification is in verification/owner-batch8.cjs.
