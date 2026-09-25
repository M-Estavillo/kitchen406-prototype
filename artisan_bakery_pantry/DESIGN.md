    ---
name: Artisan Bakery & Pantry
colors:
  surface: '#fbf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#fbf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#eae8e5'
  surface-container-highest: '#e4e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#53443a'
  inverse-surface: '#30312f'
  inverse-on-surface: '#f2f0ed'
  outline: '#867368'
  outline-variant: '#d9c2b5'
  surface-tint: '#904d16'
  primary: '#8d4a14'
  on-primary: '#ffffff'
  primary-container: '#ab622b'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb786'
  secondary: '#635d59'
  on-secondary: '#ffffff'
  secondary-container: '#eae1dc'
  on-secondary-container: '#69635f'
  tertiary: '#625b55'
  on-tertiary: '#ffffff'
  tertiary-container: '#7b736d'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc6'
  primary-fixed-dim: '#ffb786'
  on-primary-fixed: '#311300'
  on-primary-fixed-variant: '#723600'
  secondary-fixed: '#eae1dc'
  secondary-fixed-dim: '#cdc5c0'
  on-secondary-fixed: '#1f1b18'
  on-secondary-fixed-variant: '#4b4642'
  tertiary-fixed: '#ebe0d9'
  tertiary-fixed-dim: '#cfc5bd'
  on-tertiary-fixed: '#201b16'
  on-tertiary-fixed-variant: '#4c4640'
  background: '#fbf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2df'
typography:
  display:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '500'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Playfair Display
    fontSize: 34px
    fontWeight: '500'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 26px
    fontWeight: '500'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  price-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  price-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies the warmth, discipline, and quiet precision of an artisanal neighborhood bakery. The aesthetic draws direct inspiration from modern Japanese bread ateliers and European pantry culture: warm, sunlit mornings, unhurried craft, linen aprons, and golden, baked crusts. 

### Core Ethos
- **Warm & Grounded:** Rich creams, roasted tones, and subtle honey warmth replace sterile digital whites and artificial grays.
- **Restrained & Editorial:** Ample unhurried whitespace, quiet typography, and delicate structural hairlines mirror premium print editorial rather than transactional e-commerce.
- **Authentic & Tactile:** Photography sits front and center, supported by tactile paper tones and subdued pill indicators. Interface elements step back to celebrate crust textures, crumb structures, and artisan techniques.

### Design Movement
**Warm Editorial Minimalism with Tactile Restraint.** The UI relies on gentle surface transitions, whispering structural borders, natural atmospheric depths, and refined serif typography paired with a crystal-clear, modern grotesque sans-serif.

## Colors

The palette is rooted in the natural chemistry of baking: unbleached flour, caramelized crusts, espresso crema, and warm porcelain stoneware.

### Color Tokens & Usage
- **Canvas Base (`#FAF8F5`):** The primary warm cream background, emulating fine linen paper. Never use pure `#FFFFFF`.
- **Canvas Elevated / Muted (`#F5F1EB`):** Secondary warm parchment tone used for alternating structural panels, cart trays, and soft chip fills.
- **Brand Accent — Baked Honey (`#B46931`):** Applied with deliberate restraint to interactive highlights, primary cart actions, subscription badges, and focused UI elements.
- **Ink Primary — Deep Roasted Espresso (`#26221F`):** Deep, organic near-black for headlines, primary product naming, and key prices.
- **Ink Muted — Warm Loam (`#79716B`):** Warm slate for product descriptions, secondary meta attributes, ingredient specs, and breadcrumbs.
- **Border / Hairline (`#E8E2D9`):** Subdued, warm linear demarcation for cards, dividers, and input borders.
- **Semantic Muted Statuses:**
  - *In Stock / Fresh:* `#3D5941` (sage leaf) on `#EBF0EC`.
  - *Temporarily Unavailable:* `#7A7570` (stone) on `#EAE6E1`.
  - *Batch / Subscription:* `#935324` (caramelized sugar) on `#F8EDE3`.

## Typography

Typography strikes an intentional dialogue between classical bakery heritage and contemporary culinary clarity.

- **Editorial Headings (`Playfair Display`):** Reserved for the masthead, collection introductions, story panels, and marquee bread names. It provides elegance and quiet confidence.
- **Operational Interface (`Plus Jakarta Sans`):** Handles all transactional responsibilities: product catalog titles, nutritional/ingredient lists, pricing in Philippine Peso (`₱`), pill labels, form controls, and cart interactions. It ensures rapid scannability without feeling cold or mechanical.
- **Currency Standard:** All prices prefix with the official Peso sign (`₱`) set in medium or semi-bold sans-serif numbers for unambiguous optical clarity across varying device densities.

## Layout & Spacing

The layout is built around an editorial 12-column responsive grid system, anchored by ample outer breathing margins to evoke the calm pacing of a boutique pantry catalogue.

### Grid & Form Factors
- **Desktop (≥ 1024px):** 12-column grid, centered max-width of `1240px`, with `margin: 3rem` and `gutter: 1.5rem`. Showcase catalog cards in 3-column or 4-column balanced rhythms.
- **Tablet (768px – 1023px):** 8-column grid with `margin: 2rem` and `gutter: 1.25rem`. Cards flow naturally into a 2-column arrangement.
- **Mobile (≤ 767px):** 4-column fluid structure with `margin-mobile: 1.25rem` and `gutter-mobile: 1rem`. Hero sections collapse vertically; product grids render either as single stacked focal cards or a tight 2-column gallery.

### Vertical Rhythm
A consistent 4px/8px incremental rhythm is maintained. Generous section paddings (`space-xl` scaled to `4rem` on desktop) prevent information clutter and sustain the quiet artisan atmosphere.

## Elevation & Depth

This system intentionally rejects heavy, synthetic drop shadows in favor of architectural, paper-like planes and delicate light diffusion.

- **Level 0 (Flat Surface):** Default state for cards, tables, and standard lists. Renders flush against `#FAF8F5` or `#F5F1EB` relying on `#E8E2D9` 1px hairlines for separation.
- **Level 1 (Quiet Lift / Hover State):** Used for interactive card states, soft popovers, and sticky sub-navigation.
  - Box Shadow: `0 4px 16px -2px rgba(38, 34, 31, 0.05), 0 1px 3px 0 rgba(38, 34, 31, 0.03)`
- **Level 2 (Pantry Overlays & Sliding Trays):** Used for slide-out cart drawers, mobile navigation sheets, and modal preorder calendars.
  - Box Shadow: `0 12px 32px -4px rgba(38, 34, 31, 0.08), 0 4px 8px -2px rgba(38, 34, 31, 0.04)`
  - Backing Scrim: `rgba(38, 34, 31, 0.35)` with an ultra-subtle `backdrop-filter: blur(4px)`.

## Shapes

The design system employs a soft, humanized architectural geometry (`roundedness: 1`). Containers, buttons, images, and cards use gentle 4px to 8px corner radii, maintaining structure without clinical severity. 

Pill shapes are strictly reserved for meta status badges, micro-tags, and category toggle switches to indicate instant interactability or fleeting status.

## Components

### Storefront Header
- **Structure:** Clean, single-tier sticky navigation with a baseline `#E8E2D9` hairline. 
- **Elements:** Wordmark centered or left-aligned in `Playfair Display`, horizontal text navigation links with subtle underline transitions, a minimal search trigger, and an understated Bag/Cart counter.
- **Cart Counter Indicator:** Minimal pill or circle in `#B46931` with crisp `#FAF8F5` text, displaying current items.

### Product Cards
- **Photography:** Aspect ratio locked to `4:3` (warm landscape) or `1:1` (focused loaf view) with gentle `4px` corner radii. Photography features natural morning light, flour dusted surfaces, and minimal styling props.
- **Card Framing:** Background in `#FAF8F5`, surrounded by a crisp `1px solid #E8E2D9` border. No default box shadow.
- **Badging Area:** Floated over top-left of image with 8px offset:
  - *Freshly Baked / Available:* Soft sage background `#EBF0EC` with `#3D5941` text.
  - *Subscription Available:* Warm honey background `#F8EDE3` with `#935324` text.
  - *Sold Out / Next Batch:* Muted stone background `#EAE6E1` with `#7A7570` text.
- **Content Block:** Product title in `Plus Jakarta Sans` Semibold, 1-line description in muted neutral, price formatted explicitly as `₱380` or `From ₱320` accompanied by unobtrusive variant pills (`2 sizes`, `Sliced / Whole`).

### Buttons & CTAs
- **Primary CTA:** Solid `#26221F` or `#B46931` fill, crisp white/cream text, `4px` corner radius, `height: 44px`, padding `0 20px`. Hover transitions to a rich roasted tone with zero jarring movement.
- **Secondary / Outline:** Transparent background, `1px solid #E8E2D9`, text `#26221F`. Hover fills with `#F5F1EB`.
- **Tertiary / Link:** Minimal inline text with an understated underline offset by `4px`.

### Search & Form Inputs
- **Field Anatomy:** `height: 42px`, background `#FAF8F5`, border `1px solid #E8E2D9`, placeholder text `#79716B`.
- **Focus State:** Clean transition to border `#B46931` without harsh focus glows; a quiet `0 0 0 1px #B46931` ring keeps accessibility intact.

### Order / Pre-Order Selector
- **Batch Schedule Picker:** Segmented pill controls for delivery/pickup days (e.g., *Wednesday Batch*, *Saturday Batch*) utilizing muted fills and quiet borders to communicate artisanal small-batch availability.