
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
      const selectedDates = new Set();
      const schedule = K406.schedule;
      let calendarMonth;

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
      const categoryTabs = document.getElementById('category-tabs');
      const categoryTemplate = document.getElementById('category-tab-template');
      const dateFilter = document.getElementById('catalog-date-filter');
      const dateCalendar = dateFilter.querySelector('[data-date-calendar]');
      const catalogSummarySection = document.getElementById('catalog-summary-section');
      const resetFiltersBtn = document.getElementById('catalog-reset-filters-btn');
      const errorRetryBtn = document.getElementById('error-retry-btn');

      function renderCategoryTabs() {
        const categories = (K406.productCategories || []).filter(category => category.status === 'active');
        const activeIds = new Set(categories.map(category => category.id));
        if (currentCategory !== 'all' && !activeIds.has(currentCategory)) {
          currentCategory = 'all';
          currentPage = 1;
        }

        const buttons = new Map();
        for (const button of categoryTabs.querySelectorAll('[data-category]')) {
          const id = button.dataset.category;
          if (id === 'all' || activeIds.has(id)) buttons.set(id, button);
          else button.remove();
        }
        const products = protoState === 'empty' ? [] : PRODUCTS_DATA.filter(product => product.active !== false);
        for (const {id, name} of [{id:'all', name:'All Products'}, ...categories]) {
          let button = buttons.get(id);
          if (!button) {
            button = categoryTemplate.content.firstElementChild.cloneNode(true);
            button.dataset.category = id;
            button.lastElementChild.id = 'count-' + id;
            categoryTabs.append(button);
          }
          const selected = id === currentCategory;
          button.setAttribute('aria-pressed', selected);
          for (const className of ['active', 'bg-primary', 'text-on-primary', 'shadow-sm']) {
            button.classList.toggle(className, selected);
          }
          button.classList.toggle('text-on-surface-variant', !selected);
          button.classList.toggle('hover:bg-surface-container-low', !selected);
          button.firstElementChild.textContent = name;
          button.lastElementChild.textContent = id === 'all' ? products.length : products.filter(product => product.category === id).length;
        }
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

          const matchDate = !selectedDates.size || [...selectedDates].some(date =>
            !schedule.standard(date,[{productId:item.id,quantity:1,available:item.available}],'normal',null));
          return item.active!==false && matchCat && matchSub && matchSearch && matchDate;
        });
      }

      // Render product card HTML
      function createProductCard(item) {
        const escape = K406.escape;
        const isUnavailable = !item.available;
        const badge = isUnavailable
          ? `<span class="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded shadow-sm">Temporarily unavailable</span>`
          : item.subscription
            ? `<span class="bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm px-2 py-0.5 rounded shadow-sm">Available for subscription</span>`
            : '';

        const cardOpacity = isUnavailable ? 'opacity-85' : '';
        const imgFilter = isUnavailable ? 'filter grayscale-[25%] contrast-90' : 'group-hover:scale-105';
        const titleClass = isUnavailable ? 'text-on-surface' : 'text-on-surface group-hover:text-primary';
        const priceClass = isUnavailable ? 'text-outline' : 'text-on-surface';

        return `
          <article class="product-card group flex flex-col bg-surface border border-surface-container hover:border-outline-variant transition-all duration-300 rounded-lg overflow-hidden ${cardOpacity}">
            <div class="relative w-full aspect-[4/3] bg-surface-container overflow-hidden">
              <img src="${escape(item.image)}" alt="${escape(item.name)}" class="w-full h-full object-cover transition-transform duration-500 ease-out ${imgFilter}" loading="lazy"/>

              ${badge ? `<div class="absolute top-2.5 left-2.5">${badge}</div>` : ''}
            </div>

            <div class="p-4 flex flex-col flex-1 justify-between">
              <div>
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="font-label-sm text-label-sm text-outline uppercase tracking-wider">${escape(item.categoryLabel)}</span>
                </div>
                <h3 class="font-title-md text-title-md ${titleClass} transition-colors">
                  <a href="#/product/${item.id}">${escape(item.name)}</a>
                </h3>
                <p class="mt-1.5 font-body-sm text-body-sm ${isUnavailable ? 'text-outline' : 'text-on-surface-variant'} line-clamp-2 leading-relaxed">
                  ${escape(item.description)}
                </p>
              </div>

              <div class="mt-4 pt-3 border-t border-surface-container flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="font-price-md text-price-md ${priceClass}">${item.price.replace(/^From\s+/i, '')}</span>
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
        renderCategoryTabs();
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

        // Render Cards
        grid.innerHTML = pageItems.map(createProductCard).join('');
        grid.classList.remove('hidden');

        // Render Pagination
        renderPagination(totalPages);
      }

      // Category filter buttons
      categoryTabs.addEventListener('click',e=>{
        const btn=e.target.closest('[data-category]');if(!btn)return;
        currentCategory=btn.dataset.category;currentPage=1;renderCatalog();
      });

      // Search filters
      function handleSearchInput(value) {
        searchQuery = value;
        if (searchInput && searchInput.value !== value) searchInput.value = value;
        if (navSearchInput && navSearchInput.value !== value) navSearchInput.value = value;

        if (searchQuery.trim().length > 0) {
          clearSearchBtn?.classList.remove('hidden');
        } else {
          clearSearchBtn?.classList.add('hidden');
        }
        currentPage = 1;
        renderCatalog();
      }

      searchInput?.addEventListener('input', (e) => handleSearchInput(e.target.value));
      navSearchInput?.addEventListener('input', (e) => handleSearchInput(e.target.value));

      clearSearchBtn?.addEventListener('click', () => {
        handleSearchInput('');
        searchInput?.focus();
      });

      // Subscription Toggle
      subToggle?.addEventListener('change', (e) => {
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
      function renderDateCalendar(focus) {
        calendarMonth ??= schedule.today().slice(0,7);
        const first = new Date(calendarMonth+'-01T00:00:00Z');
        const format = (date,options) => new Intl.DateTimeFormat('en-PH',{timeZone:'UTC',...options}).format(date);
        const days = new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
        dateFilter.querySelector('[data-date-label]').textContent = selectedDates.size
          ? selectedDates.size + (selectedDates.size===1?' date selected':' dates selected') : 'Filter by date';
        dateCalendar.innerHTML = `<div class="catalog-date-heading">
          <button type="button" data-calendar-action="prev" aria-label="Previous month" ${calendarMonth<=schedule.today().slice(0,7)?'disabled':''}>‹</button>
          <strong aria-live="polite">${format(first,{month:'long',year:'numeric'})}</strong>
          <button type="button" data-calendar-action="next" aria-label="Next month">›</button>
          </div><div class="catalog-date-grid">${['Su','Mo','Tu','We','Th','Fr','Sa'].map(day=>`<span>${day}</span>`).join('')}
          ${'<span></span>'.repeat(first.getUTCDay())}${Array.from({length:days},(_,i)=>{
            const date = schedule.add(calendarMonth+'-01',i);
            const unavailable = schedule.base(date,0);
            return `<button type="button" data-shop-date="${date}" aria-label="${format(new Date(date+'T00:00:00Z'),{dateStyle:'full'})}"
              aria-pressed="${selectedDates.has(date)}" ${unavailable&&!selectedDates.has(date)?'disabled':''}>${i+1}</button>`;
          }).join('')}</div><div class="catalog-date-footer"><button type="button" data-calendar-action="clear" ${selectedDates.size?'':'disabled'}>Clear dates</button>
          <button type="button" data-calendar-action="done">Done</button></div>`;
        if(focus)dateCalendar.querySelector(focus)?.focus();
      }
      dateFilter.addEventListener('toggle',()=>{
        if(!dateFilter.open)return;
        renderDateCalendar();
        K406.pickup?.calendar().then(()=>{
          if(dateFilter.open&&!dateCalendar.contains(document.activeElement))renderDateCalendar();
          if(selectedDates.size)renderCatalog();
        }).catch(()=>{});
      });
      dateCalendar.addEventListener('click',e=>{
        const button=e.target.closest('button');
        if(!button)return;
        const {shopDate,calendarAction}=button.dataset;
        if(shopDate){
          if(selectedDates.has(shopDate))selectedDates.delete(shopDate);else selectedDates.add(shopDate);
          renderDateCalendar(`[data-shop-date="${shopDate}"]`);
        }else if(calendarAction==='done'){
          dateFilter.open=false;
          dateFilter.querySelector('summary').focus();
          return;
        }else if(calendarAction==='clear'){
          selectedDates.clear();
          renderDateCalendar('[data-calendar-action="done"]');
        }else{
          const date=new Date(calendarMonth+'-01T00:00:00Z');
          date.setUTCMonth(date.getUTCMonth()+(calendarAction==='prev'?-1:1));
          calendarMonth=date.toISOString().slice(0,7);
          renderDateCalendar(`[data-calendar-action="${calendarAction}"]:not(:disabled)`);
          return;
        }
        currentPage=1;
        renderCatalog();
      });
      document.addEventListener('click',e=>{if(dateFilter.open&&!dateFilter.contains(e.target))dateFilter.open=false;});
      dateFilter.addEventListener('keydown',e=>{
        if(e.key!=='Escape'||!dateFilter.open)return;
        dateFilter.open=false;
        dateFilter.querySelector('summary').focus();
      });
      resetFiltersBtn.addEventListener('click', () => {
        selectedDates.clear();
        renderDateCalendar();
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (navSearchInput) navSearchInput.value = '';
        clearSearchBtn?.classList.add('hidden');
        subscriptionOnly = false;
        if (subToggle) subToggle.checked = false;

        const allTab = document.querySelector('button[data-category="all"]');
        if (allTab) allTab.click();
      });

      // Retry button on error state
      errorRetryBtn.addEventListener('click', () => {
        const normalBtn = document.querySelector('.proto-btn[data-state="normal"]');
        if (normalBtn) normalBtn.click();
      });

      K406.catalog = {
        refresh() { renderCatalog(); },
        card: createProductCard,
        setState(value) { protoState=value; renderCatalog();  },
        state() { return protoState; },
        reset() { protoState='normal'; resetFiltersBtn.click(); },
      };
      // Initial execution
      renderCatalog();
    })();

