/* Source layouts: Phase 1.1 catalog and Phase 1.3 product/reviews.
   Shared header/footer live in index.html; behavior lives in the adjacent modules. */
const pageTemplates = {
  catalog: `<main class="w-full pt-20 bg-background">
<div class="flex flex-col w-full">
<!-- Editorial Introduction Header -->
<section class="w-full max-w-[1240px] mx-auto px-gutter-mobile lg:px-margin pt-10 pb-8 sm:pt-14 sm:pb-12">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
<div class="lg:col-span-8 flex flex-col">
<div class="flex items-center gap-2 mb-3">
</div>
<h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-tight max-w-2xl">
              Thoughtful breads, pastries, and provisions.
            </h1>
<p class="mt-4 font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
              Browse Kitchen406 breads, pastries, and other made-to-order products. Available fulfillment dates are confirmed during ordering — please note same-day fulfillment is not supported.
            </p>
</div>
<!-- Micro Highlights / Info Panel -->
<div class="lg:col-span-4 flex flex-col justify-end bg-surface-container-low p-5 rounded-lg border border-surface-container-high">
<div class="flex items-start gap-3 mb-3">
<span class="material-symbols-outlined text-primary text-[20px] mt-0.5">calendar_clock</span>
<div>
<p class="font-title-sm text-title-sm text-on-surface">Made to Order</p>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Available fulfillment dates are confirmed when placing your order.</p>
</div>
</div>
<div class="pt-3 border-t border-surface-container flex items-center justify-between text-on-surface-variant">
<a class="font-label-sm text-label-sm text-primary font-semibold hover:underline inline-flex items-center gap-0.5" href="#catalog-start">
                Browse Catalog ↓
              </a>
</div>
</div>
</div>
</section>
<!-- Sticky / Refined Interactive Catalog Toolbar -->
<section class="w-full border-t border-b border-surface-container bg-surface/95 sticky top-20 z-30 backdrop-blur-md" id="catalog-start">
<div class="max-w-[1240px] mx-auto px-gutter-mobile lg:px-margin py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
<!-- Category Tabs -->
<div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-0.5" id="category-tabs">
<button class="cat-pill active px-3.5 py-1.5 rounded-full font-title-sm text-title-sm transition-all bg-primary text-on-primary shadow-sm flex items-center gap-1.5 whitespace-nowrap" data-category="all" type="button">
<span>All Products</span>
<span class="text-[11px] opacity-80 px-1.5 py-0.2 bg-white/20 rounded-full" id="count-all">20</span>
</button>
<button class="cat-pill px-3.5 py-1.5 rounded-full font-title-sm text-title-sm transition-all text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low flex items-center gap-1.5 whitespace-nowrap" data-category="breads" type="button">
<span>Breads</span>
<span class="text-[11px] opacity-70 px-1.5 py-0.2 bg-surface-container rounded-full" id="count-breads">9</span>
</button>
<button class="cat-pill px-3.5 py-1.5 rounded-full font-title-sm text-title-sm transition-all text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low flex items-center gap-1.5 whitespace-nowrap" data-category="pastries" type="button">
<span>Pastries</span>
<span class="text-[11px] opacity-70 px-1.5 py-0.2 bg-surface-container rounded-full" id="count-pastries">8</span>
</button>
<button class="cat-pill px-3.5 py-1.5 rounded-full font-title-sm text-title-sm transition-all text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low flex items-center gap-1.5 whitespace-nowrap" data-category="pantry" type="button">
<span>Pantry</span>
<span class="text-[11px] opacity-70 px-1.5 py-0.2 bg-surface-container rounded-full" id="count-pantry">3</span>
</button>
</div>
<!-- Search & Subscription Filter -->
<div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
<!-- Subscription Filter Pill -->
<label class="flex items-center gap-2 cursor-pointer select-none bg-surface-container-low px-3 py-1.5 rounded-lg border border-surface-container hover:border-outline-variant transition-colors">
<input class="accent-primary w-3.5 h-3.5 rounded cursor-pointer" id="subscription-toggle" type="checkbox">
<span class="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Subscription available</span>
</label>
<!-- Search Input -->
<div class="relative w-full sm:w-60 md:w-64">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">search</span>
<input class="w-full h-9 pl-9 pr-8 bg-surface-container-low border border-surface-container rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all" aria-label="Search breads and pastries" id="product-search-input" placeholder="Search breads, pastries..." type="text">
<button class="hidden absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface" aria-label="Clear search" id="clear-search-btn" type="button">
<span class="material-symbols-outlined text-[16px]">close</span>
</button>
</div>
</div>
</div>
</section>
<!-- Catalog Summary Strip -->
<section class="w-full max-w-[1240px] mx-auto px-gutter-mobile lg:px-margin pt-6 pb-2" id="catalog-summary-section">
<div class="flex items-center justify-between text-on-surface-variant border-b border-surface-container pb-2">
<p class="font-body-sm text-body-sm" aria-live="polite" id="catalog-results-label">
            Showing <span class="font-semibold text-on-surface" id="visible-range">1–8</span> of <span class="font-semibold text-on-surface" id="total-count">20</span> products
          </p>
</div>
</section>
<!-- Product Catalog Container -->
<section class="w-full max-w-[1240px] mx-auto px-gutter-mobile lg:px-margin py-8 min-h-[520px]">
<!-- SKELETON LOADING STATE (hidden by default) -->
<div class="hidden grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="catalog-loading">
<div class="bg-surface border border-surface-container rounded-lg overflow-hidden animate-pulse p-4">
<div class="w-full aspect-[4/3] bg-surface-container-high rounded mb-4"></div>
<div class="h-3 w-1/3 bg-surface-container-high rounded mb-2"></div>
<div class="h-5 w-3/4 bg-surface-container-high rounded mb-2"></div>
<div class="h-3 w-full bg-surface-container-high rounded mb-1"></div>
<div class="h-3 w-2/3 bg-surface-container-high rounded mb-4"></div>
<div class="pt-3 border-t border-surface-container flex justify-between">
<div class="h-4 w-12 bg-surface-container-high rounded"></div>
<div class="h-4 w-20 bg-surface-container-high rounded"></div>
</div>
</div>
<div class="bg-surface border border-surface-container rounded-lg overflow-hidden animate-pulse p-4">
<div class="w-full aspect-[4/3] bg-surface-container-high rounded mb-4"></div>
<div class="h-3 w-1/3 bg-surface-container-high rounded mb-2"></div>
<div class="h-5 w-3/4 bg-surface-container-high rounded mb-2"></div>
<div class="h-3 w-full bg-surface-container-high rounded mb-1"></div>
<div class="h-3 w-2/3 bg-surface-container-high rounded mb-4"></div>
<div class="pt-3 border-t border-surface-container flex justify-between">
<div class="h-4 w-12 bg-surface-container-high rounded"></div>
<div class="h-4 w-20 bg-surface-container-high rounded"></div>
</div>
</div>
<div class="bg-surface border border-surface-container rounded-lg overflow-hidden animate-pulse p-4">
<div class="w-full aspect-[4/3] bg-surface-container-high rounded mb-4"></div>
<div class="h-3 w-1/3 bg-surface-container-high rounded mb-2"></div>
<div class="h-5 w-3/4 bg-surface-container-high rounded mb-2"></div>
<div class="h-3 w-full bg-surface-container-high rounded mb-1"></div>
<div class="h-3 w-2/3 bg-surface-container-high rounded mb-4"></div>
<div class="pt-3 border-t border-surface-container flex justify-between">
<div class="h-4 w-12 bg-surface-container-high rounded"></div>
<div class="h-4 w-20 bg-surface-container-high rounded"></div>
</div>
</div>
<div class="bg-surface border border-surface-container rounded-lg overflow-hidden animate-pulse p-4">
<div class="w-full aspect-[4/3] bg-surface-container-high rounded mb-4"></div>
<div class="h-3 w-1/3 bg-surface-container-high rounded mb-2"></div>
<div class="h-5 w-3/4 bg-surface-container-high rounded mb-2"></div>
<div class="h-3 w-full bg-surface-container-high rounded mb-1"></div>
<div class="h-3 w-2/3 bg-surface-container-high rounded mb-4"></div>
<div class="pt-3 border-t border-surface-container flex justify-between">
<div class="h-4 w-12 bg-surface-container-high rounded"></div>
<div class="h-4 w-20 bg-surface-container-high rounded"></div>
</div>
</div>
</div>
<!-- ERROR STATE (hidden by default) -->
<div class="hidden flex-col items-center justify-center py-16 px-6 text-center bg-surface-container-low rounded-lg border border-outline-variant max-w-md mx-auto my-6" id="catalog-error">
<div class="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mb-3">
<span class="material-symbols-outlined text-[24px]">error_outline</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface">We couldn’t load the products.</h3>
<p class="mt-1 font-body-md text-body-md text-on-surface-variant">Please check your connection and try again.</p>
<button class="mt-5 px-4 py-2 bg-primary text-on-primary font-title-sm text-title-sm rounded-lg hover:bg-primary-container transition-colors inline-flex items-center gap-1.5" id="error-retry-btn" type="button">
<span class="material-symbols-outlined text-[18px]">refresh</span>
<span>Try Again</span>
</button>
</div>
<!-- GLOBAL EMPTY STATE (hidden by default) -->
<div class="hidden flex-col items-center justify-center py-20 px-6 text-center bg-surface-container-low rounded-lg border border-dashed border-outline-variant max-w-lg mx-auto my-6" id="catalog-empty-store">
<div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3 text-outline">
<span class="material-symbols-outlined text-[24px]">storefront</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface">No products are available right now.</h3>
<p class="mt-1 font-body-md text-body-md text-on-surface-variant">Please check again later.</p>
</div>
<!-- FILTER NO RESULTS STATE (hidden by default) -->
<div class="hidden flex-col items-center justify-center py-16 px-6 text-center bg-surface-container-low rounded-lg border border-dashed border-outline-variant max-w-lg mx-auto my-6" id="catalog-no-results">
<div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3 text-outline">
<span class="material-symbols-outlined text-[24px]">search_off</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface">No products match your search.</h3>
<p class="mt-1 font-body-md text-body-md text-on-surface-variant">Try modifying your keywords or resetting filters.</p>
<button class="mt-5 px-4 py-2 bg-primary text-on-primary font-title-sm text-title-sm rounded-lg hover:bg-primary-container transition-colors" id="catalog-reset-filters-btn" type="button">
            Clear Search
          </button>
</div>
<!-- PRODUCT GRID -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="product-grid">
<!-- Cards rendered dynamically via vanilla JS -->
</div>
<!-- PAGINATION BAR -->
<nav aria-label="Product Catalog Pagination" class="mt-12 flex items-center justify-center gap-2 border-t border-surface-container pt-6" id="pagination-container">
<button class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-title-sm text-title-sm disabled:opacity-40 disabled:pointer-events-none transition-colors" id="prev-page-btn" type="button">
<span class="material-symbols-outlined text-[16px]">arrow_back</span>
<span>Previous</span>
</button>
<div class="flex items-center gap-1" id="page-numbers">
<!-- Numeric buttons injected dynamically -->
</div>
<button class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-title-sm text-title-sm disabled:opacity-40 disabled:pointer-events-none transition-colors" id="next-page-btn" type="button">
<span>Next</span>
<span class="material-symbols-outlined text-[16px]">arrow_forward</span>
</button>
</nav>
</section>
<!-- Custom Milestone Cakes Feature Section -->
<section class="w-full border-t border-surface-container-high bg-surface-container-lowest py-16 px-gutter-mobile lg:px-margin" id="custom-celebrations">
<div class="max-w-[1240px] mx-auto">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
<!-- Clean Editorial Photograph -->
<div class="lg:col-span-5 relative">
<div class="aspect-[4/3] rounded-lg overflow-hidden bg-surface-container shadow-sm">
<img alt="Warm editorial photography of an elegant minimalist tiered celebration cake on a ceramic cake pedestal against a clean neutral warm cream linen backdrop" class="w-full h-full object-cover" src="assets/celebration-cake.jpg">
</div>
</div>
<!-- Copy and Invitation -->
<div class="lg:col-span-7 flex flex-col justify-center lg:pl-6">
<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest font-semibold mb-2">Celebrations &amp; Milestones</span>
<h2 class="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-4">
                Celebrating something special?
              </h2>
<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-6 max-w-xl">
                Looking for something made for a special occasion? Custom cakes are arranged through a separate request and quotation workflow rather than standard catalog checkout. Availability and fulfillment details are reviewed with your request.
              </p>
<div class="flex flex-wrap items-center gap-4">
<a class="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-on-primary font-title-sm text-title-sm hover:bg-primary-container transition-colors shadow-sm" data-path="custom-cakes" href="#">
<span>Submit a Custom Cake Request</span>
<span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</a>
</div>
</div>
</div>
</div>
</section>
</div>
</main>`,
  product: `<!-- Top Breadcrumb & Status Navigation -->
<section class="w-full max-w-[1240px] mx-auto px-gutter-mobile lg:px-margin pt-space-lg pb-space-sm">
<nav class="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
<a class="hover:text-primary transition-colors flex items-center gap-1" data-path="shop" href="#">
<span class="material-symbols-outlined text-[16px]">arrow_back</span>
        Shop
      </a>
<span class="text-outline-variant">/</span>
<a class="hover:text-primary transition-colors" href="#" id="product-breadcrumb-category">Breads</a>
<span class="text-outline-variant">/</span>
<span class="text-on-surface font-title-sm" id="product-breadcrumb-name">Braided Chocolate Babka</span>
</nav>
</section>
<!-- Page Root State Container (Handles Normal / Loading / Error / Not Found) -->
<div class="w-full" id="pageContentStateContainer">
<!-- PAGE STATE: LOADING SKELETON (Hidden by default) -->
<div class="hidden w-full max-w-[1240px] mx-auto px-gutter-mobile lg:px-margin py-space-xl animate-pulse" id="pageSkeletonState">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
<div class="lg:col-span-7 space-y-4">
<div class="w-full aspect-[4/3] bg-surface-container-high rounded-lg"></div>
<div class="flex gap-4">
<div class="w-24 h-20 bg-surface-container-high rounded"></div>
<div class="w-24 h-20 bg-surface-container-high rounded"></div>
</div>
</div>
<div class="lg:col-span-5 space-y-4">
<div class="h-4 bg-surface-container-high w-24 rounded"></div>
<div class="h-8 bg-surface-container-high w-3/4 rounded"></div>
<div class="h-6 bg-surface-container-high w-28 rounded"></div>
<div class="h-20 bg-surface-container-high w-full rounded"></div>
<div class="h-12 bg-surface-container-high w-full rounded"></div>
</div>
</div>
</div>
<!-- PAGE STATE: GLOBAL ERROR (Hidden by default) -->
<div class="hidden w-full max-w-[1240px] mx-auto px-gutter-mobile lg:px-margin py-20 text-center" id="pageErrorState">
<div class="max-w-md mx-auto p-space-xl bg-surface-container-low rounded-xl shadow-sm">
<span class="material-symbols-outlined text-[48px] text-error mb-2">cloud_off</span>
<h2 class="font-headline-sm text-headline-sm text-on-surface mb-2">Unable to load product details</h2>
<p class="font-body-md text-body-md text-on-surface-variant mb-space-lg">We are experiencing network difficulties retrieving current batch inventory for this pantry item.</p>
<button class="px-space-lg py-space-sm bg-primary text-on-primary font-title-sm text-title-sm rounded-lg hover:bg-primary-container transition-colors shadow-sm" onclick="setPageState('normal')">
          Retry Connection
        </button>
</div>
</div>
<!-- PAGE STATE: NOT FOUND (Hidden by default) -->
<div class="hidden w-full max-w-[1240px] mx-auto px-gutter-mobile lg:px-margin py-20 text-center" id="pageNotFoundState">
<div class="max-w-md mx-auto p-space-xl bg-surface-container-low rounded-xl shadow-sm">
<span class="material-symbols-outlined text-[48px] text-outline mb-2">bakery_dining</span>
<h2 class="font-headline-sm text-headline-sm text-on-surface mb-2">Artisan bake not found</h2>
<p class="font-body-md text-body-md text-on-surface-variant mb-space-lg">This seasonal bread or requested loaf may have concluded its scheduled baking cycle.</p>
<a class="inline-flex px-space-lg py-space-sm bg-primary text-on-primary font-title-sm text-title-sm rounded-lg hover:bg-primary-container transition-colors shadow-sm" data-path="shop" href="#">
          Browse Pantry Selection
        </a>
</div>
</div>
<!-- MAIN PRODUCT SECTION (Normal state visible) -->
<section class="w-full max-w-[1240px] mx-auto px-gutter-mobile lg:px-margin pb-space-xl" id="mainProductContent">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
<!-- LEFT COLUMN: Image Gallery & Badging -->
<div class="lg:col-span-7 flex flex-col gap-space-md">
<div class="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-surface-container shadow-sm group">
<img alt="Braided Chocolate Babka" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" id="mainProductImg" src="assets/product-14.jpg"/>
<!-- Badging Overlay Area -->
<div class="absolute top-4 left-4 flex flex-col items-start gap-2 z-10 pointer-events-none">
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label-sm uppercase tracking-wider bg-[#EBF0EC] text-[#3D5941] shadow-sm" id="productBadgeAvailability">
<span class="w-1.5 h-1.5 rounded-full bg-[#3D5941]"></span>
                Available
              </span>
<span id="product-subscription-badge" class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-sm font-label-sm uppercase tracking-wider bg-[#F8EDE3] text-[#935324] shadow-sm">
<span class="material-symbols-outlined text-[14px]">calendar_month</span>
                Subscription Available
              </span>
</div>
</div>
<!-- Thumbnails -->
<div id="product-gallery" class="flex items-center gap-space-md">
<button class="thumb-btn active relative w-24 h-20 rounded-lg overflow-hidden bg-surface-container ring-2 ring-primary transition-all" onclick="switchProductThumb('assets/product-14.jpg', 0)">
<img alt="Braided Chocolate Babka loaf view" class="w-full h-full object-cover" src="assets/product-14.jpg"/>
</button>
<button class="thumb-btn relative w-24 h-20 rounded-lg overflow-hidden bg-surface-container opacity-70 hover:opacity-100 transition-all" onclick="switchProductThumb('assets/product-13.jpg', 1)">
<img alt="Sliced bakery bread view" class="w-full h-full object-cover" src="assets/product-13.jpg"/>
</button>
</div>
</div>
<!-- RIGHT COLUMN: Details, Variants, Action & Pricing -->
<div class="lg:col-span-5 flex flex-col">
<div class="mb-space-xs flex items-center justify-between">
<span class="font-label-md text-label-md text-primary uppercase tracking-wider" id="product-category">Breads • Sweet &amp; Enriched</span>
<a id="product-rating-link" href="#/product/1/reviews" class="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[16px] text-primary" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-title-sm text-on-surface">4.6</span>
<span>(18 reviews)</span>
</a>
</div>
<h1 class="font-headline-lg text-headline-lg text-on-surface mb-2">Braided Chocolate Babka</h1>
<div class="flex items-baseline gap-space-sm mb-space-md">
<span class="font-price-lg text-price-lg text-primary" id="productPriceDisplay">₱340</span>
<span class="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded" id="productWeightBadge">650g Standard</span>
</div>
<p class="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-lg">
            Soft, brioche-style braided loaf generously swirled with bittersweet Belgian chocolate ganache and crumbly streusel topping. Prepared fresh to order for your confirmed Metro Cebu fulfillment date.
          </p>
<!-- Variant Selector Container -->
<div class="mb-space-lg" id="variantSection">
<label class="block font-title-sm text-title-sm text-on-surface mb-space-xs">Select Loaf Size</label>
<div class="grid grid-cols-2 gap-space-sm">
<button class="variant-option flex flex-col text-left p-space-sm rounded-lg bg-surface-container-lowest border-2 border-primary shadow-sm transition-all" id="variantBtnStd" onclick="selectVariant('standard')">
<span class="font-title-sm text-title-sm text-on-surface flex justify-between items-center">
                  Standard Loaf
                  <span class="material-symbols-outlined text-primary text-[18px]">check_circle</span>
</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">650g • Serves 4–6</span>
<span class="font-title-sm text-title-sm text-primary mt-1">₱340</span>
</button>
<button class="variant-option flex flex-col text-left p-space-sm rounded-lg bg-surface-container-low border-2 border-transparent hover:bg-surface-container transition-all" id="variantBtnLrg" onclick="selectVariant('large')">
<span class="font-title-sm text-title-sm text-on-surface flex justify-between items-center">
                  Large Sharing
                  <span class="material-symbols-outlined text-outline-variant text-[18px] opacity-40">radio_button_unchecked</span>
</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">950g • Serves 8–10</span>
<span class="font-title-sm text-title-sm text-on-surface mt-1">₱480</span>
</button>
</div>
</div>
<!-- Quantity Stepper & Subtotal Row -->
<div class="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg mb-space-md">
<div class="flex items-center gap-space-xs">
<span class="font-label-md text-label-md text-on-surface-variant uppercase mr-2">Quantity</span>
<button aria-label="Decrease quantity" class="w-8 h-8 rounded bg-surface-container-lowest flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all shadow-sm" onclick="adjustQty(-1)">
<span class="material-symbols-outlined text-[16px]">remove</span>
</button>
<span class="font-title-sm text-title-sm text-on-surface w-8 text-center" id="qtyCounter">1</span>
<button aria-label="Increase quantity" class="w-8 h-8 rounded bg-surface-container-lowest flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all shadow-sm" onclick="adjustQty(1)">
<span class="material-symbols-outlined text-[16px]">add</span>
</button>
</div>
<div class="text-right">
<span class="font-body-sm text-body-sm text-on-surface-variant block">Item Subtotal</span>
<span class="font-price-md text-price-md text-primary font-semibold" id="subtotalDisplay">₱340</span>
</div>
</div>
<!-- Primary Add to Cart Button & Alerts -->
<div class="flex flex-col gap-2 mb-space-lg">
<button class="w-full h-11 bg-primary hover:bg-primary-container text-on-primary font-title-sm text-title-sm rounded-lg flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all" id="addToCartBtn" onclick="handleAddToCart()">
<span class="material-symbols-outlined text-[20px]">shopping_bag</span>
<span>Add to Cart • <span id="btnPriceAmount">₱340</span></span>
</button>
<!-- Inline Alert Feedback Triggers -->
<div class="hidden p-3 bg-[#EBF0EC] text-[#224426] rounded-lg font-body-sm text-body-sm flex items-center justify-between" id="cartFeedbackSuccess">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-[18px]">check_circle</span>
<span>Added to your order bag! Fresh batch reserved.</span>
</div>
<a class="underline font-title-sm text-title-sm ml-2 shrink-0" data-path="cart" href="#">View Bag</a>
</div>
<div class="hidden p-3 bg-secondary-container text-on-secondary-fixed font-body-sm text-body-sm rounded-lg flex items-center justify-between" id="cartFeedbackAuthRequired">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-[18px]">lock</span>
<span>Sign in is required to complete checkout in Metro Cebu.</span>
</div>
<a class="underline font-title-sm text-title-sm ml-2 shrink-0" data-path="sign-in" href="#">Sign In</a>
</div>
<div class="hidden p-3 bg-surface-container-high text-on-surface-variant font-body-sm text-body-sm rounded-lg flex items-center gap-2" id="cartFeedbackSoldOut">
<span class="material-symbols-outlined text-[18px]">schedule</span>
<span>This loaf is currently fully committed for the upcoming scheduled batch.</span>
</div>
</div>
<!-- Subscription Callout Box -->
<div id="product-subscription" class="p-space-md rounded-lg bg-surface-container-lowest border border-outline-variant shadow-sm flex flex-col gap-2">
<div class="flex items-center justify-between">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-[20px]">sync</span>
<span class="font-title-sm text-title-sm text-on-surface">Weekly Bread Subscription</span>
</div>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant">
              Receive a fresh Braided Babka every week with our 4-Week Prepaid Plan. Automatic batch dispatch straight to your table.
            </p>
<a class="font-title-sm text-title-sm text-primary hover:underline self-start flex items-center gap-1 mt-1" data-path="subscriptions" href="#">
              Explore 4-Week Plans
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
</a>
</div>
</div>
</div>
</section>
<!-- SECTION: CUSTOMER REVIEWS -->
<section id="reviews" class="w-full bg-surface-container-low py-space-xl">
<div class="max-w-[1240px] mx-auto px-gutter-mobile lg:px-margin">
<!-- Header -->
<div class="mb-space-xl">
<div class="flex items-center gap-2 text-primary font-label-md text-label-md uppercase tracking-wider mb-1">
<span class="material-symbols-outlined text-[18px]">verified</span>
<span>Community Feedback</span>
</div>
<h2 class="font-headline-lg text-headline-lg text-on-surface">Customer reviews</h2>
<p class="font-body-md text-body-md text-on-surface-variant mt-1">
            Verified feedback from completed Kitchen406 orders.
          </p>
</div>
<!-- Reviews Grid (Two Columns) -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
<!-- LEFT SUB-COLUMN: Rating Overview & Composer Invitation Card -->
<div class="lg:col-span-4 flex flex-col gap-space-lg">
<!-- Rating Breakdown Card -->
<div id="review-summary" class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
<div class="flex items-baseline gap-2 mb-1">
<span class="font-display text-display text-on-surface leading-none">4.6</span>
<span class="font-body-md text-body-md text-outline">/ 5.0</span>
</div>
<div class="flex items-center gap-1 text-primary mb-2">
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 0;">star_half</span>
<span class="font-body-sm text-body-sm text-on-surface-variant ml-2">Based on 18 reviews</span>
</div>
<!-- Star Distribution Bars -->
<div class="space-y-2 mt-space-md pt-space-md border-t border-surface-container">
<!-- 5 Stars -->
<div class="flex items-center gap-2 font-body-sm text-body-sm">
<span class="w-12 text-on-surface-variant">5 stars</span>
<div class="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
<div class="h-full bg-primary rounded-full" style="width: 66%;"></div>
</div>
<span class="w-6 text-right text-outline">12</span>
</div>
<!-- 4 Stars -->
<div class="flex items-center gap-2 font-body-sm text-body-sm">
<span class="w-12 text-on-surface-variant">4 stars</span>
<div class="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
<div class="h-full bg-primary rounded-full" style="width: 22%;"></div>
</div>
<span class="w-6 text-right text-outline">4</span>
</div>
<!-- 3 Stars -->
<div class="flex items-center gap-2 font-body-sm text-body-sm">
<span class="w-12 text-on-surface-variant">3 stars</span>
<div class="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
<div class="h-full bg-primary rounded-full" style="width: 6%;"></div>
</div>
<span class="w-6 text-right text-outline">1</span>
</div>
<!-- 2 Stars -->
<div class="flex items-center gap-2 font-body-sm text-body-sm">
<span class="w-12 text-on-surface-variant">2 stars</span>
<div class="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
<div class="h-full bg-primary rounded-full" style="width: 6%;"></div>
</div>
<span class="w-6 text-right text-outline">1</span>
</div>
<!-- 1 Star -->
<div class="flex items-center gap-2 font-body-sm text-body-sm">
<span class="w-12 text-on-surface-variant">1 star</span>
<div class="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
<div class="h-full bg-primary rounded-full" style="width: 0%;"></div>
</div>
<span class="w-6 text-right text-outline">0</span>
</div>
</div>
</div>
<!-- "Write a Review" Card (Dynamic states based on Auth & Eligibility) -->
<div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
<h3 class="font-headline-sm text-headline-sm text-on-surface mb-2">Share your thoughts</h3>
<!-- State 1: Guest User -->
<div class="space-y-3" id="reviewCardGuest">
<p class="font-body-md text-body-md text-on-surface-variant">
                  Purchased this bake from Kitchen406? Sign in to verify your purchase order and submit your review.
                </p>
<a class="inline-flex items-center justify-center w-full h-10 bg-surface-container text-on-surface font-title-sm text-title-sm rounded-lg hover:bg-surface-container-high transition-colors" data-path="sign-in" href="#">
                  Sign In to Write a Review
                </a>
</div>
<!-- State 2: Eligible User (Signed in & Completed Order) -->
<div class="hidden space-y-3" id="reviewCardEligible">
<div class="flex items-center gap-2 text-[#3D5941] bg-[#EBF0EC] p-2.5 rounded-lg">
<span class="material-symbols-outlined text-[18px]">verified_user</span>
<span class="font-body-sm text-body-sm font-medium">Ready to share your experience? From completed order <strong class="font-semibold">#KC-8921</strong>.</span>
</div>
<button class="w-full h-11 bg-primary text-on-primary font-title-sm text-title-sm rounded-lg hover:bg-primary-container shadow-sm flex items-center justify-center gap-2 transition-all" onclick="openReviewModal()">
<span class="material-symbols-outlined text-[18px]">rate_review</span>
                  Write a Review
                </button>
</div>
<!-- State 3: Not Eligible (No completed order) -->
<div class="hidden space-y-2" id="reviewCardNotEligible">
<div class="p-3 bg-surface-container rounded-lg font-body-sm text-body-sm text-on-surface-variant flex items-start gap-2">
<span class="material-symbols-outlined text-[18px] text-outline mt-0.5">info</span>
<span>Reviews become available after your order is completed and fulfilled.</span>
</div>
</div>
<!-- State 4: Already Reviewed -->
<div class="hidden space-y-2" id="reviewCardAlreadyReviewed">
<div class="p-3 bg-[#EBF0EC] text-[#3D5941] rounded-lg font-body-sm text-body-sm flex items-start gap-2">
<span class="material-symbols-outlined text-[18px] text-[#3D5941] mt-0.5">task_alt</span>
<div>
<p class="font-title-sm text-title-sm">Review submitted</p>
<p class="mt-0.5">You've already reviewed this item from order #KC-8921. Thank you for supporting our small bakery!</p>
</div>
</div>
</div>
</div>
</div>
<!-- RIGHT SUB-COLUMN: Review Listing & Interactive States -->
<div class="lg:col-span-8 flex flex-col gap-space-md">
<!-- STATE: REVIEWS LOADING SKELETON (Hidden by default) -->
<div class="hidden space-y-4 animate-pulse" id="reviewsLoadingState">
<div class="p-space-lg bg-surface-container-lowest rounded-xl h-36"></div>
<div class="p-space-lg bg-surface-container-lowest rounded-xl h-36"></div>
<div class="p-space-lg bg-surface-container-lowest rounded-xl h-36"></div>
</div>
<!-- STATE: REVIEWS ERROR (Hidden by default) -->
<div class="hidden p-space-xl bg-surface-container-lowest rounded-xl text-center shadow-sm" id="reviewsErrorState">
<span class="material-symbols-outlined text-[36px] text-error mb-2">sync_problem</span>
<h4 class="font-headline-sm text-headline-sm text-on-surface mb-1">Failed to load reviews</h4>
<p class="font-body-md text-body-md text-on-surface-variant mb-4">We were unable to load recent order reviews. Please try again shortly.</p>
<button class="px-space-md py-space-xs bg-surface-container text-on-surface font-title-sm text-title-sm rounded-lg hover:bg-surface-container-high transition-colors" onclick="setReviewState('populated')">
                Try Again
              </button>
</div>
<!-- STATE: REVIEWS EMPTY (Hidden by default) -->
<div class="hidden p-space-xl bg-surface-container-lowest rounded-xl text-center shadow-sm" id="reviewsEmptyState">
<span class="material-symbols-outlined text-[40px] text-outline mb-2">rate_review</span>
<h4 class="font-headline-sm text-headline-sm text-on-surface mb-1">No reviews yet</h4>
<p class="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">Be the first to share your thoughts after your completed batch fulfillment.</p>
</div>
<!-- STATE: REVIEWS POPULATED (Default) -->
<div class="flex flex-col gap-space-md" id="reviewsPopulatedState">
<!-- Review Item 1 -->
<article class="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-space-xs">
<div class="flex items-start justify-between">
<div>
<div class="flex items-center gap-1 text-primary mb-1">
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
</div>
<div class="flex items-center gap-2 font-label-sm text-label-sm text-outline">
<span>Anonymous Customer</span>
<span>•</span>
<span class="text-[#3D5941] flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">check_circle</span>
                        From a completed Kitchen406 order
                      </span>
</div>
</div>
<span class="font-body-sm text-body-sm text-outline">Nov 12, 2025</span>
</div>
<div class="inline-block self-start font-body-sm text-body-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                  Purchased: Standard Loaf (650g)
                </div>
<p class="font-body-md text-body-md text-on-surface leading-relaxed mt-1">
                  The chocolate swirl is intensely rich without feeling cloying, and warming a slice in the oven made the whole kitchen smell like heaven. Crumb structure was delightfully soft!
                </p>
<!-- Attached Photos (Clickable Mock) -->
<div class="flex gap-space-sm mt-space-xs">
<div class="w-16 h-16 rounded bg-surface-container overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onclick="previewCustomerPhoto(this)">
<img alt="Customer Babka slice photo" class="w-full h-full object-cover" src="assets/product-14.jpg"/>
</div>
<div class="w-16 h-16 rounded bg-surface-container overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onclick="previewCustomerPhoto(this)">
<img alt="Customer morning coffee pairing photo" class="w-full h-full object-cover" src="assets/product-13.jpg"/>
</div>
</div>
</article>
<!-- Review Item 2 -->
<article class="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-space-xs">
<div class="flex items-start justify-between">
<div>
<div class="flex items-center gap-1 text-primary mb-1">
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
</div>
<div class="flex items-center gap-2 font-label-sm text-label-sm text-outline">
<span>Anonymous Customer</span>
<span>•</span>
<span class="text-[#3D5941] flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">check_circle</span>
                        From a completed Kitchen406 order
                      </span>
</div>
</div>
<span class="font-body-sm text-body-sm text-outline">Nov 04, 2025</span>
</div>
<div class="inline-block self-start font-body-sm text-body-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                  Purchased: Large Sharing Loaf (950g)
                </div>
<p class="font-body-md text-body-md text-on-surface leading-relaxed mt-1">
                  Shared this for our Sunday family brunch in Cebu City. The streusel on top gave it a distinct tactile crisp that pairs so well with pour-over coffee.
                </p>
</article>
<!-- Review Item 3 -->
<article class="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-space-xs">
<div class="flex items-start justify-between">
<div>
<div class="flex items-center gap-1 text-primary mb-1">
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 0;">star</span>
</div>
<div class="flex items-center gap-2 font-label-sm text-label-sm text-outline">
<span>Anonymous Customer</span>
<span>•</span>
<span class="text-[#3D5941] flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">check_circle</span>
                        From a completed Kitchen406 order
                      </span>
</div>
</div>
<span class="font-body-sm text-body-sm text-outline">Oct 28, 2025</span>
</div>
<div class="inline-block self-start font-body-sm text-body-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                  Purchased: Standard Loaf (650g)
                </div>
<p class="font-body-md text-body-md text-on-surface leading-relaxed mt-1">
                  Arrived right on the scheduled delivery window. Very fresh crust, deeply fragrant butter aroma. Will definitely subscribe for the 4-week cycle.
                </p>
</article>
</div>
</div>
</div>
</div>
</section>
</div><section id="related-section" class="max-w-[1240px] mx-auto px-gutter-mobile lg:px-margin py-space-xl"><h2 class="font-headline-md text-headline-md mb-space-lg">More from our pantry</h2><div id="related-products"></div></section>`,
  review: `
<div class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" id="reviewComposerModal" role="dialog" aria-modal="true" aria-label="Review your purchase" hidden>
<!-- Modal Scrim / Backdrop -->
<div class="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity" aria-label="Close review" onclick="closeReviewModal()"></div>
<!-- Modal Box -->
<div class="relative w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden z-10 flex flex-col my-auto max-h-[90vh]">
<!-- Modal Header -->
<div class="p-space-md sm:p-space-lg bg-surface-container-low border-b border-surface-container flex items-start justify-between">
<div>
<span class="font-label-sm text-label-sm text-primary uppercase font-semibold">Verified Order #KC-8921</span>
<h3 class="font-headline-sm text-headline-sm text-on-surface mt-0.5">Review your purchase</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant">Braided Chocolate Babka (Standard Loaf)</p>
</div>
<button class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant transition-colors" aria-label="Close review" onclick="closeReviewModal()">
<span class="material-symbols-outlined text-[20px]">close</span>
</button>
</div>
<!-- Modal Body Form -->
<div class="p-space-md sm:p-space-lg overflow-y-auto space-y-space-md">
<!-- Interactive Star Rating Selection (Required) -->
<div>
<label class="block font-title-sm text-title-sm text-on-surface mb-1">
            Overall Rating <span class="text-primary">*</span>
</label>
<div class="flex items-center gap-2">
<div class="flex items-center gap-1 cursor-pointer" id="modalStarRatingRow">
<button class="star-picker-btn text-outline-variant hover:text-primary transition-colors" onclick="setModalStarRating(1)" type="button">
<span class="material-symbols-outlined text-[32px]">star</span>
</button>
<button class="star-picker-btn text-outline-variant hover:text-primary transition-colors" onclick="setModalStarRating(2)" type="button">
<span class="material-symbols-outlined text-[32px]">star</span>
</button>
<button class="star-picker-btn text-outline-variant hover:text-primary transition-colors" onclick="setModalStarRating(3)" type="button">
<span class="material-symbols-outlined text-[32px]">star</span>
</button>
<button class="star-picker-btn text-outline-variant hover:text-primary transition-colors" onclick="setModalStarRating(4)" type="button">
<span class="material-symbols-outlined text-[32px]">star</span>
</button>
<button class="star-picker-btn text-outline-variant hover:text-primary transition-colors" onclick="setModalStarRating(5)" type="button">
<span class="material-symbols-outlined text-[32px]">star</span>
</button>
</div>
<span class="font-body-sm text-body-sm text-outline ml-2" id="modalRatingText">Click to rate</span>
</div>
</div>
<!-- Written Review Comment (Optional) -->
<div>
<label class="block font-title-sm text-title-sm text-on-surface mb-1" for="reviewCommentInput">
            Your Experience &amp; Notes <span class="text-outline font-normal">(Optional)</span>
</label>
<textarea class="w-full p-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline border border-outline-variant/40 focus:outline-none focus:border-primary transition-colors resize-none" id="reviewCommentInput" placeholder="How was the texture, flavor, and delivery condition?" rows="4"></textarea>
</div>
<!-- Photo Upload Slots (Up to 2 max) -->
<div>
<div class="flex items-center justify-between mb-1">
<label class="font-title-sm text-title-sm text-on-surface">Add Photos <span class="text-outline font-normal">(Up to 2 photos)</span></label>
<span class="font-body-sm text-body-sm text-outline" id="photoCountLabel">0 / 2 selected</span>
</div>
<div class="grid grid-cols-2 gap-space-sm">
<!-- Upload Slot 1 -->
<div class="h-24 rounded-lg bg-surface-container-low border border-dashed border-outline hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group" id="slotPhoto1" onclick="toggleMockPhoto(1)">
<span class="material-symbols-outlined text-[24px] text-outline group-hover:text-primary">add_a_photo</span>
<span class="font-label-sm text-label-sm text-on-surface-variant mt-1">Select Photo</span>
</div>
<!-- Upload Slot 2 -->
<div class="h-24 rounded-lg bg-surface-container-low border border-dashed border-outline hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group" id="slotPhoto2" onclick="toggleMockPhoto(2)">
<span class="material-symbols-outlined text-[24px] text-outline group-hover:text-primary">add_a_photo</span>
<span class="font-label-sm text-label-sm text-on-surface-variant mt-1">Select Photo</span>
</div>
</div>
</div>
<!-- Inline Submission Error Banner -->
<div class="hidden p-3 bg-error-container text-on-error-container rounded-lg font-body-sm text-body-sm flex items-center gap-2" id="modalSubmitError">
<span class="material-symbols-outlined text-[18px]">error</span>
<span>Simulation error: Submission timed out. Please try clicking submit again.</span>
</div>
<!-- Inline Submission Success Banner -->
<div class="hidden p-4 bg-[#EBF0EC] text-[#224426] rounded-lg font-body-sm text-body-sm flex flex-col items-center text-center" id="modalSubmitSuccess">
<span class="material-symbols-outlined text-[36px] text-[#3D5941] mb-1">check_circle</span>
<h4 class="font-title-md text-title-md font-bold">Thanks for your review!</h4>
<p class="mt-1">Your honest feedback helps our Cebu bakery maintain unhurried craft standards.</p>
</div>
</div>
<!-- Modal Footer Action Bar -->
<div class="p-space-md sm:p-space-lg bg-surface-container-low border-t border-surface-container flex items-center justify-end gap-space-sm" id="modalFooterActions">
<button class="px-space-md py-space-xs font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors" aria-label="Close review" onclick="closeReviewModal()" type="button">
          Cancel
        </button>
<button class="px-space-lg py-space-xs bg-primary text-on-primary font-title-sm text-title-sm rounded-lg opacity-50 cursor-not-allowed transition-all shadow-sm" disabled="" id="modalSubmitBtn" onclick="handleReviewSubmit()" type="button">
          Submit Review
        </button>
</div>
</div>
</div>
`
};
K406.$("catalog-view").innerHTML=pageTemplates.catalog;
K406.$("product-view").innerHTML=pageTemplates.product;
K406.$("review-mount").innerHTML=pageTemplates.review;
