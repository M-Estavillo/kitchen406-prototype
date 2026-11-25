const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');
const { join } = require('node:path');

module.exports = async function verifyPickupBrowser(chrome, dataDir, url, session, productId, date, adminSession, materialId) {
  const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', '--user-data-dir=' + join(dataDir, 'pickup-chrome'), 'about:blank'], {
    stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true
  });
  let socket;
  try {
    const debugUrl = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error('Chrome did not open its debug port.')), 15000);
      browser.stderr.on('data', chunk => {
        const endpoint = String(chunk).match(/DevTools listening on ws:\/\/([^/]+)/)?.[1];
        if (endpoint) { clearTimeout(timeout); resolve('http://' + endpoint); }
      });
      browser.once('error', error => { clearTimeout(timeout); reject(error); });
    });
    const pages = await (await fetch(debugUrl + '/json')).json();
    socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
    await once(socket, 'open');
    const responses = new Map();
    const errors = [];
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
      responses.get(message.id)?.(message);
    });
    let id = 0;
    async function command(method, params) {
      const requestId = ++id;
      try {
        return await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(Error('CDP timed out: ' + method)), 10000);
          responses.set(requestId, message => {
            clearTimeout(timeout);
            if (message.error) reject(Error(message.error.message));
            else resolve(message.result);
          });
          socket.send(JSON.stringify({ id: requestId, method, params }));
        });
      } finally { responses.delete(requestId); }
    }
    async function evaluate(expression) {
      const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    }
    async function waitFor(expression) {
      for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate(expression)) return;
        await delay(150);
      }
      const screen = await evaluate('({ route: location.hash, subscriptionError: window.K406?.subscriptions?.configReason(), heading: document.querySelector("main:not([hidden]) h1")?.textContent })');
      throw Error('Checkout UI did not reach: ' + expression + '\n' + JSON.stringify(screen));
    }
    await command('Runtime.enable');
    async function setSession(cookie) {
      const split = cookie.indexOf('=');
      await command('Network.setCookie', { name: cookie.slice(0, split), value: cookie.slice(split + 1), url, httpOnly: true });
    }
    await setSession(session);
    await command('Page.navigate', { url: url + '/#/cart' });
    await waitFor('window.K406?.account?.allowed() && K406.route === "cart"');
    await evaluate(`K406.commerce.add(${productId}, 'standard', 1);K406.commerce.render()`);
    const click = async selector => {
      const control = 'document.querySelector(' + JSON.stringify(selector) + ')';
      await waitFor(control + ' && !' + control + '.disabled');
      await evaluate(control + '.click()');
    };
    await click('[data-commerce="checkout"]');
    await click('[data-method="pickup"]');
    await click('[data-date="' + date + '"]');
    await click('[data-commerce="fulfillment-next"]');
    await click('[data-commerce="pay"]');
    await waitFor('K406.commerce.currentOrder()?.persistedPickup && K406.route === "payment"');
    await click('[data-commerce="simulate-payment"]');
    await waitFor('K406.commerce.currentOrder()?.paid');
    const orderId = await evaluate('K406.commerce.currentOrder().id');
    assert.equal(await evaluate('K406.commerce.state.cart.length'), 0);
    await command('Page.reload');
    await waitFor('window.K406?.commerce?.currentOrder()?.paid');
    assert.equal(await evaluate('K406.commerce.currentOrder().id'), orderId);
    await evaluate('location.hash="#/account/notifications"');
    const orderNotice = JSON.stringify('orders/' + orderId);
    await waitFor('K406.notifications.list().some(item => item.path === ' + orderNotice + ')');
    const noticeId = await evaluate('K406.notifications.list().find(item => item.path === ' + orderNotice + ').id');
    await click('[data-p4="notification-read"][data-id="' + noticeId + '"]');
    await waitFor('K406.notifications.list().some(item => item.path === ' + orderNotice + ' && item.read_at)');
    await command('Page.reload');
    await waitFor('window.K406?.notifications?.list().some(item => item.path === ' + orderNotice + ' && item.read_at)');
    console.log('PASS customer notification inbox and persistent read state in Chrome');

    await evaluate('location.hash="#/subscriptions"');
    await click('[data-sub="begin"][data-id="' + productId + '"]');
    await click('[data-sub="address-next"]');
    await click('[data-sub="method"][data-value="pickup"]');
    await click('[data-sub="review-next"]');
    const catalog = await (await fetch(url + '/api/auth/catalog')).json();
    const schedule = catalog.schedules.find(row => row.product_id === productId && row.status === 'active');
    const changed = await fetch(url + '/api/auth/inventory/subscription-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminSession },
      body: JSON.stringify({
        id: schedule.schedule_id, key: 'browser-schedule-edit', product_id: productId,
        inventoryVersion: schedule.updated_at, preparation_day: 3, day: schedule.fulfillment_day
      })
    });
    assert.equal(changed.status, 200);
    await click('[data-sub="pay"]');
    await waitFor('location.hash === "#/subscription/configure" && document.querySelector("#subscription-view").textContent.includes("The bakery changed this schedule")');
    await click('[data-sub="address-next"]');
    await click('[data-sub="review-next"]');
    await click('[data-sub="pay"]');
    await click('[data-sub="simulate-payment"]');
    await waitFor('K406.subscriptions.state.records.some(record => record.persistedSubscription)');
    const subscriptionId = await evaluate('K406.subscriptions.state.records[0].id');
    const purchaseId = await evaluate('K406.subscriptions.state.records[0].purchaseId');
    await evaluate('location.hash=' + JSON.stringify('#/subscriptions/' + subscriptionId));
    await waitFor('document.querySelectorAll(".subscription-order-link").length === 4');
    await command('Page.reload');
    await waitFor('document.querySelectorAll(".subscription-order-link").length === 4');
    const fulfillmentId = await evaluate('K406.subscriptions.state.records[0].deliveries[0].orderId');
    await click('.subscription-order-link');
    await waitFor('K406.commerce.currentOrder()?.id === ' + JSON.stringify(fulfillmentId));
    assert.equal(await evaluate('K406.commerce.currentOrder().prepaid'), true);
    await setSession(adminSession);
    await command('Page.navigate', { url: 'about:blank' });
    await command('Page.navigate', { url: url + '/#/owner/orders/' + orderId });
    await click('[data-owner="transition"][data-target="preparing"]');
    await click('[data-owner="confirm-transition"]');
    await waitFor('document.querySelector("#owner-dialog-body .owner-error")?.textContent.includes("Preparation is scheduled")');
    await evaluate('location.hash=' + JSON.stringify('#/owner/subscriptions/' + subscriptionId));
    await waitFor('document.querySelectorAll(".owner-subscription-schedule li").length === 4');
    assert(await evaluate('document.querySelector("#owner-view").textContent.includes(' + JSON.stringify(purchaseId) + ')'));
    await evaluate('location.hash="#/owner/subscriptions"');
    await waitFor('document.querySelector(".owner-subscription-tabs")');
    assert.equal(await evaluate('document.querySelector(".owner-subscription-tabs").textContent.includes("Offerings")'), false);
    await evaluate('location.hash="#/owner/subscriptions/schedules"');
    await waitFor('location.hash === "#/owner/products" && document.querySelector("#owner-product-type")');
    const filterProducts = value => evaluate(`(() => {
      const filter = document.querySelector("#owner-product-type");
      filter.value = ${JSON.stringify(value)};
      filter.dispatchEvent(new Event("change", { bubbles: true }));
      return Array.from(document.querySelectorAll(".owner-product-card h2 a"), link => Number(link.hash.split("/")[3]));
    })()`);
    assert((await filterProducts('subscription')).includes(productId));
    assert(!(await filterProducts('standard')).includes(productId));
    await evaluate('location.hash="#/owner/orders"');
    await waitFor('document.querySelector(".owner-order-list")?.textContent.includes(' + JSON.stringify(fulfillmentId) + ')');
    assert.equal(await evaluate('document.querySelector(".owner-order-list").textContent.includes(' + JSON.stringify(purchaseId) + ')'), false);
    await command('Page.navigate', { url: 'about:blank' });
    await command('Page.navigate', { url: url + '/#/owner/inventory/' + encodeURIComponent(materialId) });
    const variantPath = '#/owner/products/' + productId + '/edit/standard';
    await click('a[href="' + variantPath + '"]');
    await waitFor('document.querySelector(\'[data-edit-pack="saved:standard"][data-variant-target]\')');
    assert.equal(await evaluate('location.hash'), variantPath);
    await click('[data-owner="product-edit-start"]');
    const selectCover = (filename, size, drop) => evaluate(`(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = ${size};
      const context = canvas.getContext('2d');
      context.fillStyle = '#447755';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const files = new DataTransfer();
      files.items.add(new File([blob], ${JSON.stringify(filename)}));
      if (${drop}) {
        document.querySelector('.owner-product-image-section').dispatchEvent(new DragEvent('drop', {bubbles:true,dataTransfer:files}));
      } else {
        const input = document.querySelector('#owner-cover-upload');
        input.files = files.files;
        input.dispatchEvent(new Event('change', {bubbles:true}));
      }
    })()`);
    await selectCover('replacement.png', 8, true);
    await waitFor('document.querySelector("[data-cover-name]")?.textContent === "replacement.png" && document.querySelector(".owner-cover-preview img").naturalWidth === 8');
    await click('[data-owner-form="product"] button[type=submit]');
    await waitFor('location.hash === "#/owner/products"');
    await evaluate('location.hash=' + JSON.stringify(variantPath));
    await waitFor('document.querySelector(".owner-cover-preview img")?.naturalWidth === 8');
    await evaluate('location.hash=' + JSON.stringify('#/owner/products/' + productId + '/standard'));
    await waitFor('document.querySelector("#owner-view")?.textContent.includes("Product not found")');
    await evaluate('location.hash="#/owner/products/new"');
    await waitFor('document.querySelector("[data-owner-form=product]")');
    await evaluate(`(async () => {
      const form = document.querySelector('[data-owner-form=product]');
      let refreshed = false;
      const refresh = K406.pickup.refreshOperations;
      K406.pickup.refreshOperations = () => { refreshed = true; return refresh(); };
      try {
        window.dispatchEvent(new Event('focus'));
        if (refreshed || !form.isConnected) throw Error('Returning from the file picker refreshed the product editor.');
      } finally { K406.pickup.refreshOperations = refresh; }
    })()`);
    await click('[data-owner="product-add-material"]');
    await evaluate(`(() => {
      const form = document.querySelector('[data-owner-form=product]');
      form.elements.name.value = 'Browser upload product';
      form.elements.description.value = 'Product created with a cover photo';
      form.elements.category.value = 'breads';
      form.querySelector('[name^="price-"]').value = '10';
      const material = form.querySelector('[data-material-field="id"]');
      material.value = ${JSON.stringify(materialId)};
      material.dispatchEvent(new Event('input', {bubbles:true}));
      const quantity = form.querySelector('[data-material-field="quantity"]');
      quantity.value = '1';
      quantity.dispatchEvent(new Event('input', {bubbles:true}));
    })()`);
    await selectCover('new-cover.png', 12, false);
    await waitFor('document.querySelector("[data-cover-name]")?.textContent === "new-cover.png" && document.querySelector(".owner-cover-preview img").naturalWidth === 12');
    await click('[data-owner-form="product"] button[type=submit]');
    await waitFor('location.hash === "#/owner/products" && Array.from(document.querySelectorAll(".owner-product-card")).some(card => card.textContent.includes("Browser upload product") && card.querySelector("img").naturalWidth === 12)');
    assert.deepEqual(errors, []);
    console.log('PASS browser pickup checkout, demo payment, cart settlement and reload');
    console.log('PASS browser subscription checkout, activation, reload and owner visibility');
    console.log('PASS owner pickup fulfillment control calls the saved order endpoint');
    console.log('PASS recipe usage opens the exact variant and the old route is gone');
    console.log('PASS add and edit product cover uploads with no browser MIME type');
  } finally {
    socket?.close();
    if (browser.exitCode === null && browser.pid) {
      const exited = once(browser, 'exit');
      browser.kill();
      await exited;
    }
  }
};
