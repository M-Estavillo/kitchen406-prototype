---
name: Modern Editorial Bakehouse
colors:
  surface: '#fcf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fcf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ee'
  surface-container: '#f0ede9'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e5e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#53433c'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f3f0eb'
  outline: '#86736b'
  outline-variant: '#d9c2b8'
  surface-tint: '#8f4c29'
  primary: '#6f3312'
  on-primary: '#ffffff'
  primary-container: '#8c4a27'
  on-primary-container: '#ffc9b0'
  inverse-primary: '#ffb693'
  secondary: '#875218'
  on-secondary: '#ffffff'
  secondary-container: '#feb874'
  on-secondary-container: '#78470b'
  tertiary: '#49433f'
  on-tertiary: '#ffffff'
  tertiary-container: '#615a56'
  on-tertiary-container: '#dcd2cd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcb'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#723614'
  secondary-fixed: '#ffdcbf'
  secondary-fixed-dim: '#feb874'
  on-secondary-fixed: '#2d1600'
  on-secondary-fixed-variant: '#6a3b00'
  tertiary-fixed: '#ebe0db'
  tertiary-fixed-dim: '#cec5c0'
  on-tertiary-fixed: '#1f1b18'
  on-tertiary-fixed-variant: '#4c4642'
  background: '#fcf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e5e2dd'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 38px
    fontWeight: '600'
    lineHeight: 46px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '500'
    lineHeight: 48px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  gutter-mobile: 1rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
  space-3xl: 6rem
---

## Brand & Style

This design system blends warm minimalism with restrained editorial craftsmanship tailored for a modern culinary e-commerce experience. The aesthetic balances the comfort of baked goods with clean, contemporary digital interfaces. 

### Brand Personality & Core Mood
- **Warm & Tactile:** Grounded in inviting cream surfaces, soft organic contrast, and sun-warmed caramel accents rather than clinical tech whites.
- **Restrained Editorial:** Intentional typographic hierarchies, measured negative space, and disciplined composition that lets pastry photography and culinary craft lead.
- **Modern & Effortless:** Clean lines, rapid micro-interactions, and frictionless transactional flows devoid of fussy ornamentation or faux-vintage tropes.

### Style Directives
- Rely on spacious, uncluttered layouts with disciplined grid adherence.
- Avoid heavy drop shadows, skeuomorphic textures, or harsh pure blacks.
- Use subtle tone-on-tone separations and quiet borders rather than thick structural dividers.

## Colors

The palette establishes an appetizing, sunlit morning atmosphere centered on toasted caramel, rich dark grain, and soft dairy-cream neutrals.

### Palette Architecture
- **Primary (`#8C4A27` - Deep Terracotta Caramel):** Used for primary calls-to-action, key active states, and focal purchase triggers.
- **Secondary (`#C98A4B` - Warm Amber Toffee):** Used for interactive hovers, secondary highlights, tags, badges, and subtle decorative accents.
- **Tertiary (`#2B2623` - Espresso Charcoal):** The anchor for high-contrast reading text, iconography, and deep navigational frames. Replaces harsh `#000000` with an organic tone.
- **Neutral Base (`#FAF7F2` - Warm Cream Canvas):** The foundational page canvas, avoiding cold stark whites while preserving crisp optical legibility.

### Surface Tones & Functional Neutrals
- **Surface Default:** `#FAF7F2`
- **Surface Raised / Card Background:** `#FFFFFF` (provides crisp, clean elevation against `#FAF7F2`)
- **Surface Inset / Muted Container:** `#F2ECE4`
- **Subtle Border Line:** `#E6DDD2`
- **Muted Text / Secondary Label:** `#6E665F`

## Typography

The type system pairs **Playfair Display** for editorial authority and refined warmth with **Plus Jakarta Sans** for functional precision and effortless legibility in transactional interfaces.

### Application Rules
- **Headlines & Editorial Titles:** Set in Playfair Display. Keep line lengths controlled (max 65 characters) and reserve italic variants solely for occasional accentuation or origin notes.
- **Product Titles, Navigation & UI:** Set in Plus Jakarta Sans. Maintain medium to semi-bold weights for scannability across menus, price tags, and cart line-items.
- **Microcopy & Metadata:** Use `label-md` or `label-sm` with slight uppercase tracking for dietary tags (e.g., "NUT-FREE", "VEGAN", "SOURDOUGH") to provide clear categorical rhythm.

## Layout & Spacing

The layout is built upon an airy, fluid-responsive 12-column grid designed to let food imagery breathe while maintaining structural clarity.

### Responsive Breakpoints & Container Logic
- **Desktop (1200px+):** 12 columns, 24px (`1.5rem`) gutters, maximum container width `1320px` centered with variable margins.
- **Tablet (768px - 1199px):** 8 columns, 20px gutters, 32px (`2rem`) side margins.
- **Mobile (320px - 767px):** 4 columns, 16px (`1rem`) gutters, 20px (`1.25rem`) side margins.

### Spacing Principles
- **Generous Canvas:** Section-to-section transitions leverage `space-2xl` and `space-3xl` to preserve editorial cadence and prevent visual congestion.
- **Micro Density:** E-commerce utility modules (quantity steppers, order summaries, filter bars) utilize tight, consistent multiples of `space-xs` (4px) and `space-sm` (8px).

## Elevation & Depth

Visual hierarchy is primarily communicated through subtle tonal layering and warm, low-contrast outlines rather than heavy shadow casting.

### Layering Hierarchy
- **Canvas Base:** `#FAF7F2` establishes the grounded, warm baseline.
- **Cards & Surface Modules:** `#FFFFFF` cards resting on `#FAF7F2` create intrinsic, natural separation without requiring deep drop shadows.
- **Borders & Inset Dividers:** Single-pixel rules using `#E6DDD2` delineate structural edges cleanly.

### Ambient Shadow Scale
When floating elements require elevation (e.g., sticky navigation bars, quick-add flyouts, active modals), use ultra-diffused, caramel-tinted ambient shadows:
- **Low (Interactive Cards, Dropdowns):** `0 2px 8px -2px rgba(43, 38, 35, 0.04), 0 1px 4px -1px rgba(140, 74, 39, 0.03)`
- **Medium (Cart Drawer, Modals):** `0 12px 32px -4px rgba(43, 38, 35, 0.07), 0 4px 12px -2px rgba(140, 74, 39, 0.04)`
- **Hover State:** Transform elements with a subtle `translateY(-2px)` coupled with an expanded soft ambient blur.

## Shapes

The design system adopts a soft, restrained corner radius (`0.25rem` base) to project architectural precision with a gentle touch.

### Corner Radius Standards
- **Standard Controls & Badges (`rounded-sm` / 4px):** Buttons, inputs, filter pills, and small thumbnail containers.
- **Card Containers & Panels (`rounded-lg` / 8px):** Product cards, checkout modules, order panels, and banner images.
- **Modals & Drawers (`rounded-xl` / 12px):** Top corners of mobile bottom sheets and dialog overlays.
- **Complete Pills (`rounded-full`):** Reserved strictly for compact status indicators, dietary chips, and quantity increment steppers.

## Components

### Buttons
- **Primary:** Solid `#8C4A27` background, `#FFFFFF` text, 4px border radius. Hover state transitions to `#723A1D`. Active state tightens slightly (`scale(0.99)`).
- **Secondary / Outline:** 1px border in `#8C4A27`, background transparent, text `#8C4A27`. Hover fills with `#F2ECE4`.
- **Tertiary / Ghost:** No border, text `#2B2623`. Underline animates from left to right on hover.

### Product Cards
- Built on a clean `#FFFFFF` surface bordered by `#E6DDD2` (1px solid).
- Aspect ratio 4:5 or 1:1 for product imagery with a neutral warm backdrop tint.
- Includes product title in `headline-sm`, subtitle/weight in `body-sm` muted text, price in semi-bold Plus Jakarta Sans, and an integrated quick-add control.

### Chips & Dietary Badges
- Lightweight compact capsules with subtle `#F2ECE4` fill and `#2B2623` label text.
- Selected state shifts to `#8C4A27` fill with white text.

### Form Inputs & Steppers
- **Inputs:** Crisp `#FFFFFF` surface with `#E6DDD2` outline. Focused state invokes a crisp `#8C4A27` ring (1px solid, 2px offset in `#FAF7F2`). Label placed cleanly above in `label-md`.
- **Quantity Selector:** Unified pill component containing minus/plus buttons flanking center-aligned numeral; separated by subtle hairline dividers.

### Order Summary & Drawer Cart
- Slides in from the right edge with a soft ambient shadow.
- Clear line-item hierarchy separating product details, allergen notes, item totals, and a prominent checkout action fixed to the lower viewport.