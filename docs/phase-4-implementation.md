# Phase 4 implementation

Custom Cakes and Customer Account are connected in the existing customer prototype.

## Try the flows

Open [index.html](../index.html) in Chrome.

1. Choose **Custom Cakes → Request a custom cake**. Sign in using the existing demo form; **Mock Controls → Fill demo details** supplies sample credentials.
2. Choose a date, delivery window, and saved address. Select all five cake options and any add-ons.
3. Choose a primary image and up to two additional images from your device. Review and submit the request.
4. On the request page, use **Mock Controls → Owner: issue quotation**. **Owner: revise quotation** preserves the previous version. These controls simulate the future owner workspace.
5. Review the quotation, accept it, and use **Simulate successful payment** on the QR Ph preview. The confirmed cake order links back to the accepted quotation and keeps the standard shopping bag unchanged.
6. Open **My Account** to edit your profile, change your email/password, manage saved addresses, or view notification history.

For a quick quotation walkthrough, choose **Mock Controls → Load quotation example** on a cake screen. It creates the supplied ₱1,300 request estimate, a ₱2,000 first quotation, and a ₱2,200 revised quotation.

Email changes require the current demo password and a verification code. The current simulated code appears in Mock Controls while the verification dialog is open. Resending creates a different code. The initial inspector-only account password is `Kitchen406!`; signing in through the form uses the password entered there. Password changes apply to subsequent sign-ins during the same preview session.

## Implemented behavior

- Four connected builder steps with no default cake selections, live centavo-based estimates, required primary reference, three-image review, edit links, duplicate-submit prevention, and request list/detail pages.
- Separate request, quotation, payment, order, capacity hold, and ingredient hold records. Requests reserve nothing. Acceptance creates a pending purchase; successful full payment confirms it once.
- Quotation history, decline notes, revised designs, explicit expiry, temporary holds, payment retries, verification locks, and late-payment resolution. Paid offers cannot be replaced.
- Owner-managed cake delivery with a fee supplied by the quotation. Cake orders have no Lalamove booking/tracking panel.
- Profile save/cancel, verified email changes, current-password checks, password recovery integration, and customer isolation when changing demo identities.
- Shared address editing, map selection, barangay and delivery instructions, one default address, archive/removal, and active-address selection across standard checkout, subscriptions, and cakes.
- Immutable submitted/paid address and contact snapshots. Account/address edits affect future selections while existing transactions retain their details.
- Notification history grouped by customer and business event, with independent email/SMS outcomes and links to orders, subscriptions, requests, and quotation versions.
- Responsive layouts, accessible dialogs, keyboard focus preservation, protected routes, loading/error/empty states, and an account menu with a separate Sign Out action.

## Prototype defaults

| Setting | Current fixture |
| --- | --- |
| Cake capacity | 2 per Monday–Sunday week; 1 per fulfillment date; independent of bread/subscription capacity |
| Cake lead time / cutoff | 5 calendar days; 4 PM Manila cutoff on the lead-time date |
| Delivery windows | Morning 9 AM–12 PM, afternoon 1–4 PM, early evening 4:30–6:30 PM; supports date overrides |
| Owner delivery area | Example city list: Cebu City, Mandaue City, Lapu-Lapu City, Talisay City, Consolacion; final feasibility is reviewed by the owner |
| Quote validity / QR hold | 48 hours / up to 10 minutes, capped by quotation expiry |
| Add-on input limit | 0–20 units in the demo; zero removes the add-on |
| Image inputs | JPG/PNG/WebP; up to 10 MiB each; one required primary plus two optional references |
| Notes | Optional, up to 600 characters |
| Address removal | Archive; promote the oldest remaining active address when removing the default |
| Notification history | Category totals; no customer unread/read state |

Cake fixtures and configuration live in [cake-data.js](../app/cake-data.js). Ingredient quantities are explicit examples; no undocumented `scale_factor` calculation was introduced. The availability calendar uses the existing injected October 14, 2026 clock. OTP, quotation, and QR expiry use elapsed real time.

Owner coverage, operating windows, actual lead times, ingredient quantities, and prices still need the bakery's production values. These settings are prototype defaults, not claims about current bakery policy.

## Runtime and production boundary

Data remains in memory and resets on reload or **Reset preview**. Selected images are locally validated and previewed with object URLs. Orders, quotations, payment callbacks, credential changes, and notification delivery are simulated; the existing map editor can use its configured Maps service.

The implementation adds snapshot/image/event fields in the frontend model as proposed in [the plan](phase-4-draft-implementation-plan.md). It does not migrate the ERD or create a database. Production still needs server authentication and ownership enforcement, durable storage, transactional capacity/inventory handling, real upload and payment services, notification delivery, and the owner workspace. Credential generation counters cancel pending browser operations; they do not implement production session revocation.

See [verification/README.md](../verification/README.md) for checks and screenshot artifacts.
