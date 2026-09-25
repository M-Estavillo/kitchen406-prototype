# Kitchen406 — integrated Phase 1 & Phase 2 prototype

Open **index.html** in a browser. No build or installation is required. Alternatively, run `python -m http.server 8080` here and open http://localhost:8080.

The existing vanilla HTML, JavaScript, and Tailwind stack is retained. Tailwind, Google Fonts, and Material Symbols require internet access. Original catalog photography is copied to assets/; source URLs are recorded in assets/SOURCES.json. Expired legacy detail-photo URLs use matching catalog subjects, and the text wordmark is retained.

## Integrated screens
- `#/shop`: original 20-product catalog, categories, search, subscription filter, pagination.
- `#/product/1`: Babka detail, variants, quantity and connected bag action.
- `#/product/1/reviews`: original customer review fixtures and review composer.
- `#/sign-in`, `#/register`, `#/verify`, `#/forgot`, `#/reset`: shared authentication dialog.
- Every catalog product opens its corresponding detail; missing review and variant information is not invented.
- `#/cart`: quantity updates, removal/undo, availability and quantity limits.
- `#/checkout/fulfillment`: pickup/delivery and navigable demo availability calendar.
- `#/checkout/address`: saved addresses, add/edit form, delivery-zone and quotation previews.
- `#/checkout/review`: shared totals, editable selections, stock/schedule/price revalidation.
- `#/payment/<order-id>`: QR Ph preview, expiry, retries, verification and confirmation.
- `#/confirmation/<order-id>`: order confirmation and next steps.
- `#/orders`, `#/orders/<order-id>`: search, type/status filters, sorting, pagination, details, cancellation, payment history, courier previews and completed-purchase reviews.

## Try Phase 2
Sign in with the existing demo form (or select Signed in in Mock Controls), open a product, and add it to your bag. Use the header bag icon to begin checkout. Select **October 16, 2026** in the demo calendar; delivery uses the supplied saved addresses and a **₱95 demo quotation**, while pickup skips the address step and costs nothing. Proceed to payment and select **Simulate successful payment**, then continue to confirmation and Orders.

Mock Controls also offers **Load sample bag** and **Load sample orders**. The latter adds seven explicitly marked sample records, including later-phase subscription/custom-cake previews. Lifecycle controls expose pending, confirmed, preparing, ready, transit, completed, failed, resolution and cancelled states. **Fresh payment preview** creates a separate sample payment session for testing states after a payment has already been confirmed.

## Mock controls
Open **Mock Controls** at the bottom right. Available controls follow the active screen. Authentication state is shared throughout the app. The inspector includes loading, error, empty, eligibility, availability, submission, validation, verification and invalid/expired reset states.

OTP demo code: **406892**, with a 10-minute countdown, five-attempt limit, and resend reset. Verification does not automatically sign in. Password recovery has an explicit **Open demo reset link** handoff. Direct reset navigation previews an invalid link unless a demo link was opened or Default is selected in the inspector.

Authentication, reviews, cart, checkout, payments, order records and courier updates are in-memory simulations. No credentials are stored, no emails are sent, and no requests are submitted to a backend, payment provider or courier. The QR illustration is non-payable. Navigation and sign-out preserve commerce selections in this tab; reloading or Reset preview clears the demo. There is no persistent or account-specific server storage.

Payment uses immutable checkout snapshots. Cart changes invalidate unpaid sessions; payment verification locks further checkout changes. Confirmation consumes purchased quantities only once, cancellation preserves the bag, and retry creates another attempt on the same eligible order. Unknown/deep-linked orders show an empty/not-found message when their in-memory record is unavailable.

## Source decisions
Original folders and screenshots are preserved.
- Phase 1.1 provides the catalog, product fixtures, header/footer and shared Tailwind tokens.
- Phase 1.3 contains both 1.2 product details and 1.3 reviews, including the richer review states and composer.
- Phase 1.4 provides sign-in copy and protected-action context.
- Phase 1.5 provides registration fields and validation direction.
- Phase 1.6 supersedes Phase 1.5's verification-link placeholder with six-digit OTP verification.
- No Phase 1.7 implementation was supplied. Forgot/reset dialogs extend the existing auth design as UI-only prototypes.

## Organization
- `app/templates.js`: extracted storefront/product/review markup, mounted once.
- `app/catalog.js`: retained catalog filtering, card and pagination logic.
- `app/product.js`: shared product/variant/review interactions.
- `app/auth.js`: reusable fields and all authentication states.
- `app/core.js`: app state, modal focus/keyboard handling and notices.
- `app/app.js`: hash routing, shared navigation, centralized inspector.
- `app/styles.css`, `app/tailwind-config.js`: shared visual foundation.
- `app/products.js`: original catalog fixtures.
- `app/commerce-state.js`: shared cart, checkout drafts, order snapshots, payment transitions and sample records.
- `app/commerce-ui.js`: reusable item rows, totals, progress, addresses, cards and status badges.
- `app/checkout.js`: bag, fulfillment calendar, address forms and order review.
- `app/orders.js`: payment, confirmation, order list/details and customer actions.
- `app/commerce.js`: Phase 2 route rendering, authentication gates and inspector integration.
- `app/commerce.css`: responsive Phase 2 layouts using Phase 1 colors, fonts and shared controls.

Babka's 18-review aggregate is preserved as a source fixture; only three source review examples exist, so the feed identifies these as samples instead of suggesting a working 18-review database. Other products have no fabricated reviews. Subscription and custom-cake management remain explicit later-phase placeholders.

## Phase 2 source decisions
All eight `kitchen406_phase_2.*` reference folders remain untouched. Their header/footer, global handlers and inspectors were consolidated into the existing shell rather than mounted as standalone pages. Phase 1 catalog prices and local product photography take precedence over conflicting Phase 2 sample prices. The source calendar uses a fixed October 14, 2026 demo clock, retained and labeled here. The source pickup locations conflict, so the UI uses Banilad, Metro Cebu with an explicit bakery-confirmation note for the exact address. The cart reference `screen.png` contains an image-error message instead of PNG data; its HTML was used. No dependencies were added.

Address search uses local landmark suggestions, serviceability checks a small demo city list, and courier quotation is a fixed sample fee. Payment and courier controls never imply live provider integration. Print produces a demo order summary, not an official receipt.

## Manual checks
Check catalog search/filter/page boundaries; product identity and variant subtotal; disabled sold-out action; guest/protected sign-in; register → verify → sign-in; incorrect code five times, resend, expiry, full-code paste; forgot → demo link → reset; review eligibility and success/error submission; Escape, tab focus, dialog close, browser Back; desktop, tablet, and mobile layouts.


## Google Maps delivery addresses
The address form and delivery check use Maps JavaScript, Places API (New), Geocoding API, and Routes API. Enable these in one Google Cloud project with billing, then set `apiKey` and a JavaScript `mapId` in `app/maps-config.js`. Restrict the browser key to the site's HTTP referrers (including the local development URL) and the required APIs. Serve the app over HTTP/HTTPS. No key is bundled; without configuration, the map reports that it is unavailable and new addresses cannot be saved without coordinates.

Search for a place or click the map, then drag the marker to the delivery entrance. Place selection and reverse geocoding suggest address line 1, city, and postal code. Users can correct these and supply missing values. Unit/building details and landmarks are optional. Saving requires a label, address line 1, city, postal code, and selected coordinates. Moving the pin clears the previous location's suggested fields, and stale lookup responses are ignored. If reverse geocoding fails, the selected coordinates remain usable with manually entered address details.

Address records now follow the proposed ERD (`postal_code` is used for postal code): address_id, customer_id, label, add_line_1, add_line_2, city, postal_code, landmark, latitude, longitude, is_default, created_at, updated_at, status. Only one saved address can be marked default. Records remain in memory; `preview-customer` and the preloaded addresses/coordinates are fixtures. Production must assign ownership, IDs, timestamps, and status on the server. Recipient contact details belong in the customer or delivery-contact model and are not collected by this address form.

Delivery eligibility uses the Routes library's `Route.computeRoutes` with driving mode, traffic-unaware routing, no alternative routes, and the `distanceMeters` field. The returned primary route must be at most 10,000 meters (inclusive). This replaces the city-name serviceability check. Checkout and order creation remain blocked during checking, on failure/no route, or over the limit. Changing the selected address, coordinates, or origin invalidates the previous result; late responses cannot approve another destination. Pickup bypasses the distance check. Addresses can still be saved outside the delivery area.

`bakeryOrigin` in `app/maps-config.js` is temporarily `Liloan, Cebu, Philippines`, as requested. Google resolves that address; it is not an exact bakery pickup point. Replace it with the exact pickup address or `{ lat, lng }` for the final boundary. Missing Google credentials prevent delivery verification. The existing delivery fee remains simulated, and Lalamove quotations/bookings are not implemented. A production backend must independently enforce the same route-distance limit when accepting orders; this application currently only provides frontend checks.

Route references: [Get a route](https://developers.google.com/maps/documentation/javascript/routes/get-a-route). Run `node verification/delivery-route.cjs` for distance boundary, missing/failed route, stale-response, changed-origin, and pickup checks.

Google references: [Place Autocomplete](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new), [draggable markers](https://developers.google.com/maps/documentation/javascript/examples/advanced-markers-draggable), [Geocoding service](https://developers.google.com/maps/documentation/javascript/geocoding).
