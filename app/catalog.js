
    (function () {
      // 20 Realistic Neutral Bakery Mock Items
      const PRODUCTS_DATA = K406.products;

      // Application State
      let protoState = 'normal'; // 'normal' | 'loading' | 'error' | 'empty'
      let currentCategory = 'all';
      let searchQuery = '';
      let subscriptionOnly = false;
      let currentPage = 1;
      const PAGE_SIZE = 8;

      // DOM Elements
      const grid = document.getElementById('product-grid');
      const loadingEl = document.getElementById('catalog-loading');
      const errorEl = document.getElementById('catalog-error');
      const emptyStoreEl = document.getElementById('catalog-empty-store');
      const noResultsEl = document.getElementById('catalog-no-results');
      const paginationNav = document.getElementById('pagination-container');
      const pageNumbersEl = document.getElementById('page-numbers');
      const prevBtn = document.getElementById('prev-page-btn');
      const nextBtn = document.getElementById('next-page-btn');
      const searchInput = document.getElementById('product-search-input');
      const navSearchInput = document.getElementById('nav-search-input');
      const clearSearchBtn = document.getElementById('clear-search-btn');
      const subToggle = document.getElementById('subscription-toggle');
      const catButtons = document.querySelectorAll('#category-tabs .cat-pill');
      const visibleRangeEl = document.getElementById('visible-range');
      const totalCountEl = document.getElementById('total-count');
      const catalogSummarySection = document.getElementById('catalog-summary-section');
      const resetFiltersBtn = document.getElementById('catalog-reset-filters-btn');
      const errorRetryBtn = document.getElementById('error-retry-btn');

      // Update tab badge counters
      function updateCategoryCounters() {
        const countAll = PRODUCTS_DATA.length;
        const countBreads = PRODUCTS_DATA.filter(p => p.category === 'breads').length;
        const countPastries = PRODUCTS_DATA.filter(p => p.category === 'pastries').length;
        const countPantry = PRODUCTS_DATA.filter(p => p.category === 'pantry').length;

        document.getElementById('count-all').textContent = countAll;
        document.getElementById('count-breads').textContent = countBreads;
        document.getElementById('count-pastries').textContent = countPastries;
        document.getElementById('count-pantry').textContent = countPantry;
      }

      // Filtered items computation
      function getFilteredProducts() {
        if (protoState === 'empty') return [];

        return PRODUCTS_DATA.filter(item => {
          const matchCat = (currentCategory === 'all') || (item.category === currentCategory);
          const matchSub = !subscriptionOnly || item.subscription;
          const query = searchQuery.trim().toLowerCase();
          const matchSearch = !query || 
            item.name.toLowerCase().includes(query) || 
            item.description.toLowerCase().includes(query) || 
            item.categoryLabel.toLowerCase().includes(query);

          return matchCat && matchSub && matchSearch;
        });
      }

      // Render product card HTML
      function createProductCard(item) {
        const isUnavailable = !item.available;
        const availabilityBadge = isUnavailable
          ? `<span class="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded shadow-sm">Temporarily unavailable</span>`
          : `<span class="bg-surface/90 backdrop-blur-sm text-on-surface font-label-sm text-label-sm px-2 py-0.5 rounded border border-surface-container">Available</span>`;

        const subscriptionBadge = item.subscription
          ? `<span class="bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm px-2 py-0.5 rounded shadow-sm">Subscription available</span>`
          : '';

        const cardOpacity = isUnavailable ? 'opacity-85' : '';
        const imgFilter = isUnavailable ? 'filter grayscale-[25%] contrast-90' : 'group-hover:scale-105';
        const titleClass = isUnavailable ? 'text-on-surface' : 'text-on-surface group-hover:text-primary';
        const priceClass = isUnavailable ? 'text-outline' : 'text-on-surface';

        return `
          <article class="product-card group flex flex-col bg-surface border border-surface-container hover:border-outline-variant transition-all duration-300 rounded-lg overflow-hidden ${cardOpacity}">
            <div class="relative w-full aspect-[4/3] bg-surface-container overflow-hidden">
              <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover transition-transform duration-500 ease-out ${imgFilter}" loading="lazy"/>
              
              <!-- Badges -->
              <div class="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                ${isUnavailable ? availabilityBadge : subscriptionBadge}
              </div>

              ${!isUnavailable ? `<div class="absolute bottom-2.5 right-2.5">${availabilityBadge}</div>` : ''}
            </div>

            <div class="p-4 flex flex-col flex-1 justify-between">
              <div>
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="font-label-sm text-label-sm text-outline uppercase tracking-wider">${item.categoryLabel}</span>
                  <span class="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">${item.variant}</span>
                </div>
                <h3 class="font-title-md text-title-md ${titleClass} transition-colors">
                  <a href="#/product/${item.id}">${item.name}</a>
                </h3>
                <p class="mt-1.5 font-body-sm text-body-sm ${isUnavailable ? 'text-outline' : 'text-on-surface-variant'} line-clamp-2 leading-relaxed">
                  ${item.description}
                </p>
              </div>

              <div class="mt-4 pt-3 border-t border-surface-container flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="font-label-sm text-label-sm text-outline">Price</span>
                  <span class="font-price-md text-price-md ${priceClass}">${item.price}</span>
                </div>
                <a href="#/product/${item.id}" class="inline-flex items-center gap-1 font-title-sm text-title-sm text-primary hover:text-primary-container transition-colors group-hover:translate-x-0.5 transform duration-200">
                  <span>View product</span>
                  <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </div>
            </div>
          </article>
        `;
      }

      // Render Pagination Buttons
      function renderPagination(totalPages) {
        if (totalPages <= 1) {
          paginationNav.classList.add('hidden');
          return;
        }

        paginationNav.classList.remove('hidden');
        prevBtn.disabled = (currentPage <= 1);
        nextBtn.disabled = (currentPage >= totalPages);

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
          const isActive = (i === currentPage);
          const activeClass = isActive 
            ? 'bg-primary text-on-primary font-semibold shadow-sm' 
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low';

          html += `
            <button type="button" data-page="${i}" class="pagination-page-btn w-9 h-9 rounded-lg font-title-sm text-title-sm transition-colors ${activeClass}">
              ${i}
            </button>
          `;
        }
        pageNumbersEl.innerHTML = html;

        pageNumbersEl.querySelectorAll('.pagination-page-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            currentPage = parseInt(btn.getAttribute('data-page'), 10);
            renderCatalog();
            scrollToCatalog();
          });
        });
      }

      function scrollToCatalog() {
        const toolbar = document.getElementById('catalog-start');
        if (toolbar) {
          const top = toolbar.getBoundingClientRect().top + window.pageYOffset - 80;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        }
      }

      // Main Render Routine
      function renderCatalog() {
        // Reset container views
        loadingEl.classList.add('hidden');
        loadingEl.classList.remove('grid');
        errorEl.classList.add('hidden');
        errorEl.classList.remove('flex');
        emptyStoreEl.classList.add('hidden');
        emptyStoreEl.classList.remove('flex');
        noResultsEl.classList.add('hidden');
        noResultsEl.classList.remove('flex');
        grid.classList.add('hidden');
        paginationNav.classList.add('hidden');
        catalogSummarySection.classList.remove('hidden');

        // Handle Prototype State Overrides
        if (protoState === 'loading') {
          catalogSummarySection.classList.add('hidden');
          loadingEl.classList.remove('hidden');
          loadingEl.classList.add('grid');
          return;
        }

        if (protoState === 'error') {
          catalogSummarySection.classList.add('hidden');
          errorEl.classList.remove('hidden');
          errorEl.classList.add('flex');
          return;
        }

        if (protoState === 'empty') {
          catalogSummarySection.classList.add('hidden');
          emptyStoreEl.classList.remove('hidden');
          emptyStoreEl.classList.add('flex');
          return;
        }

        // Normal State Logic
        const filtered = getFilteredProducts();
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);

        if (currentPage > totalPages && totalPages > 0) {
          currentPage = 1;
        }

        if (totalItems === 0) {
          catalogSummarySection.classList.add('hidden');
          noResultsEl.classList.remove('hidden');
          noResultsEl.classList.add('flex');
          return;
        }

        // Slice products for current page
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
        const pageItems = filtered.slice(startIndex, endIndex);

        // Update range counters
        visibleRangeEl.textContent = `${startIndex + 1}–${endIndex}`;
        totalCountEl.textContent = `${totalItems}`;

        // Render Cards
        grid.innerHTML = pageItems.map(createProductCard).join('');
        grid.classList.remove('hidden');

        // Render Pagination
        renderPagination(totalPages);
      }

      // Category filter buttons
      catButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          catButtons.forEach(b => {
            b.classList.remove('active', 'bg-primary', 'text-on-primary', 'shadow-sm');
            b.classList.add('text-on-surface-variant', 'hover:bg-surface-container-low');
          });
          btn.classList.add('active', 'bg-primary', 'text-on-primary', 'shadow-sm');
          btn.classList.remove('text-on-surface-variant', 'hover:bg-surface-container-low');

          currentCategory = btn.getAttribute('data-category');
          currentPage = 1;
          renderCatalog();
        });
      });

      // Search filters
      function handleSearchInput(value) {
        searchQuery = value;
        if (searchInput.value !== value) searchInput.value = value;
        if (navSearchInput.value !== value) navSearchInput.value = value;

        if (searchQuery.trim().length > 0) {
          clearSearchBtn.classList.remove('hidden');
        } else {
          clearSearchBtn.classList.add('hidden');
        }
        currentPage = 1;
        renderCatalog();
      }

      searchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
      navSearchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));

      clearSearchBtn.addEventListener('click', () => {
        handleSearchInput('');
        searchInput.focus();
      });

      // Subscription Toggle
      subToggle.addEventListener('change', (e) => {
        subscriptionOnly = e.target.checked;
        currentPage = 1;
        renderCatalog();
      });

      // Pagination Prev/Next buttons
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderCatalog();
          scrollToCatalog();
        }
      });

      nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(getFilteredProducts().length / PAGE_SIZE);
        if (currentPage < totalPages) {
          currentPage++;
          renderCatalog();
          scrollToCatalog();
        }
      });

      // Reset filters button
      resetFiltersBtn.addEventListener('click', () => {
        searchQuery = '';
        searchInput.value = '';
        navSearchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        subscriptionOnly = false;
        subToggle.checked = false;

        const allTab = document.querySelector('button[data-category="all"]');
        if (allTab) allTab.click();
      });

      // Retry button on error state
      errorRetryBtn.addEventListener('click', () => {
        const normalBtn = document.querySelector('.proto-btn[data-state="normal"]');
        if (normalBtn) normalBtn.click();
      });

      K406.catalog = {
        card: createProductCard,
        setState(value) { protoState=value; renderCatalog(); K406.inspector?.(); },
        state() { return protoState; },
        reset() { protoState='normal'; resetFiltersBtn.click(); },
      };
      // Initial execution
      updateCategoryCounters();
      renderCatalog();
    })();
  