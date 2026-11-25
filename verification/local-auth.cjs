const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdir, mkdtemp, readFile, readdir, rm, rmdir } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { once } = require('node:events');
const { DatabaseSync } = require('node:sqlite');
const { randomBytes, randomUUID, scryptSync } = require('node:crypto');

const root = resolve(__dirname, '..');

async function start(dataDir) {
  const child = spawn(process.execPath, ['serve.cjs'], {
    cwd: root,
    env: { ...process.env, K406_DATA_DIR: dataDir, K406_PORT: '0', BREVO_API_KEY: '', K406_STAFF_EMAIL_FROM: '' },
    stdio: ['ignore', 'pipe', 'inherit'],
    windowsHide: true
  });
  const url = await new Promise((resolve, reject) => {
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      const match = chunk.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) resolve(match[0]);
    });
    child.once('error', reject);
    child.once('exit', code => reject(Error('Server exited with code ' + code)));
  });
  return {
    url,
    async stop() {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
  };
}

async function run() {
  const data = await mkdtemp(join(tmpdir(), 'k406-auth-'));
  let server;
  try {
    server = await start(data);
    async function request(action, input, options = {}) {
      const headers = { ...options.headers };
      if (options.session) headers.Cookie = options.session;
      if (input !== undefined) headers['Content-Type'] = 'application/json';
      const response = await fetch(server.url + '/api/auth/' + action, {
        method: input === undefined ? 'GET' : 'POST', headers, body: JSON.stringify(input)
      });
      return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie') };
    }
    const getCode = async id => (await readFile(join(data, 'outbox', id + '.txt'), 'utf8')).match(/Code: (\d{6})/)[1];

    const account = { email: 'Customer@example.test', firstName: 'Local', lastName: 'Customer', mobile: '09171234567', password: 'Example123!' };
    assert.equal((await request('session')).data.account, null);
    const created = await request('register', { ...account, role: 'admin' });
    assert.equal(created.status, 200);
    assert.deepEqual(Object.keys(created.data).sort(), ['challengeId', 'expiresAt', 'resendAt']);
    assert.equal((await request('register', { ...account, email: account.email.toLowerCase() })).status, 409);
    assert.equal((await request('sign-in', account)).data.error, 'verification-required');
    assert(created.data.resendAt > Date.now());
    assert.deepEqual((await request('verification-code', { email: account.email })).data, created.data);
    const verifyId = created.data.challengeId, code = await getCode(verifyId);
    const wrong = code === '000000' ? '111111' : '000000';
    assert.equal((await request('verify', { challengeId: verifyId, code: wrong })).status, 400);
    assert.equal((await request('verify', { challengeId: verifyId, code })).status, 200);
    assert.equal((await request('verify', { challengeId: verifyId, code })).status, 400);

    const signedIn = await request('sign-in', account);
    assert.equal(signedIn.status, 200);
    assert.match(signedIn.cookie, /HttpOnly; SameSite=Strict/);
    const session = signedIn.cookie.split(';')[0];
    assert.equal(signedIn.data.account.role, 'customer');
    assert.equal(signedIn.data.account.mobile_number, '+639171234567');
    assert.equal(signedIn.data.account.password_hash, undefined);
    assert.equal((await request('profile', { first_name: 'Updated', last_name: 'Customer', mobile_number: '+639171234567' }, { session })).status, 200);

    await server.stop();
    server = null;
    server = await start(data);
    assert.equal((await request('session', undefined, { session })).data.account.first_name, 'Updated');
    const email = account.email;
    const outboxBefore = await readdir(join(data, 'outbox'));
    const unknown = await request('forgot', { email: 'missing@example.test' });
    assert.equal(unknown.status, 404);
    assert.deepEqual(unknown.data, { error: 'recovery-account-not-found' });
    assert.deepEqual(await readdir(join(data, 'outbox')), outboxBefore);
    assert.equal((await request('forgot', {})).status, 400);
    const recovery = await request('forgot', { email });
    assert.equal(recovery.status, 200);
    assert.deepEqual((await request('forgot', { email })).data, recovery.data);
    const reset = { challengeId: recovery.data.challengeId, code: await getCode(recovery.data.challengeId), password: 'Changed123!' };
    const wrongReset = reset.code === '111111' ? '222222' : '111111';
    assert.equal((await request('reset', { ...reset, code: wrongReset })).status, 400);
    const resets = await Promise.all([request('reset', reset, { session }), request('reset', reset, { session })]);
    assert.deepEqual(resets.map(result => result.status).sort(), [200, 400]);
    assert.match(resets.find(result => result.status === 200).cookie, /Max-Age=0/);
    assert.equal((await request('session', undefined, { session })).data.account, null);
    assert.equal((await request('sign-in', account)).status, 401);
    const newSignIn = await request('sign-in', { email, password: reset.password });
    assert.equal(newSignIn.status, 200);
    assert(newSignIn.data.account.password_changed_at);
    const newSession = newSignIn.cookie.split(';')[0];
    const newEmail = 'updated@example.test';
    const changeInput = { email: newEmail, password: reset.password };
    assert.equal((await request('email-change', changeInput)).status, 401);
    assert.equal((await request('email-change', { ...changeInput, password: 'Wrong123!' }, { session: newSession })).status, 403);
    const change = await request('email-change', changeInput, { session: newSession });
    assert.equal(change.status, 200);
    const changeId = change.data.challengeId;
    assert.equal(change.data.verificationEmail, newEmail);
    assert((await readFile(join(data, 'outbox', changeId + '.txt'), 'utf8')).startsWith('To: ' + newEmail + '\n'));
    assert.deepEqual((await request('email-change', changeInput, { session: newSession })).data, change.data);
    assert.equal((await request('session', undefined, { session: newSession })).data.account.email, email.toLowerCase());
    const verifyChange = { challengeId: changeId, code: await getCode(changeId) };
    assert.equal((await request('email-change/verify', verifyChange)).status, 401);
    assert.equal((await request('email-change/verify', { ...verifyChange, code: '000000' }, { session: newSession })).status, 400);
    const changed = await request('email-change/verify', verifyChange, { session: newSession });
    assert.equal(changed.status, 200);
    assert.equal(changed.data.account.email, newEmail);
    assert.equal(changed.data.account.account_id, newSignIn.data.account.account_id);
    assert.equal(changed.data.account.customer_id, newSignIn.data.account.customer_id);
    assert.equal((await request('email-change/verify', verifyChange, { session: newSession })).status, 400);
    assert.equal((await request('session', undefined, { session: newSession })).data.account.email, newEmail);
    assert.equal((await request('sign-in', { email, password: reset.password })).status, 401);
    const nextLogin = await request('sign-in', { email: newEmail, password: reset.password });
    assert.equal(nextLogin.status, 200);
    const nextCookie = nextLogin.cookie.split(';')[0];
    await request('sign-out', {}, { session: nextCookie });
    assert.equal((await request('sign-out', {}, { session: newSession, headers: { Origin: 'http://example.test' } })).status, 403);
    assert.equal((await request('sign-out', {}, { session: newSession })).status, 200);
    assert.equal((await request('session', undefined, { session: newSession })).data.account, null);

    const db = new DatabaseSync(join(data, 'kitchen406.sqlite'), { readOnly: true });
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM Account').get().count, 1);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM CustomerProfile').get().count, 1);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM AccountVerification WHERE verified_at IS NOT NULL').get().count, 3);
    assert.match(db.prepare('SELECT password_hash FROM Account').get().password_hash, /^[a-f0-9]{32}:[a-f0-9]{128}$/);
    db.close();

    const admin = { email: 'admin@example.test', password: 'TestAdmin123!' };
    const setupDb = new DatabaseSync(join(data, 'kitchen406.sqlite'));
    const salt = randomBytes(16).toString('hex'), stamp = new Date().toISOString();
    const hash = salt + ':' + scryptSync(admin.password, salt, 64).toString('hex');
    setupDb.prepare(`
      INSERT INTO Account (account_id, email, password_hash, first_name, last_name, role, status, created_at, updated_at)
      VALUES ('test-admin-account', ?, ?, 'Test', 'Admin', 'admin', 'active', ?, ?)
    `).run(admin.email, hash, stamp, stamp);
    setupDb.prepare("INSERT INTO AdminProfile (admin_id, account_id) VALUES ('test-admin', 'test-admin-account')").run();
    setupDb.close();
    const sessionOf = result => ({ session: result.cookie.split(';')[0] });
    const adminSession = sessionOf(await request('sign-in', admin));
    const customerSession = sessionOf(await request('sign-in', { email: newEmail, password: reset.password }));
    const defaults = (await request('catalog')).data.categories;
    assert.deepEqual(defaults.map(category => category.category_id).sort(), ['breads', 'pantry', 'pastries']);
    const category = { id: 'category-' + randomUUID(), name: 'Seasonal', status: 'active', version: null, key: randomUUID() };
    assert.equal((await request('inventory/category', category, customerSession)).status, 403);
    assert.equal((await request('inventory/category', { ...category, name: 'bReAdS' }, adminSession)).status, 409);
    assert.equal((await request('inventory/category', category, adminSession)).status, 200);
    const readCategory = async id => (await request('catalog')).data.categories.find(row => row.category_id === id);
    const createdCategory = await readCategory(category.id);
    assert.equal(createdCategory.category_name, 'Seasonal');
    assert.equal((await request('inventory/category', {
      ...category, name: 'Limited bakes', version: createdCategory.updated_at, key: randomUUID()
    }, adminSession)).status, 200);
    const breads = defaults.find(row => row.category_id === 'breads');
    const hideBreads = { id: 'breads', name: 'Breads', status: 'inactive', version: breads.updated_at, key: randomUUID() };
    assert.equal((await request('inventory/category', hideBreads, adminSession)).status, 200);
    assert.equal((await request('inventory/category', { ...hideBreads, status: 'active', key: randomUUID() }, adminSession)).status, 409);
    const initial = { email: 'staff@example.test', password: 'Temporary123!' };
    const staffForm = { ...initial, first_name: 'Test', last_name: 'Staff' };
    assert.equal((await request('staff', staffForm)).status, 401);
    assert.equal((await request('staff', staffForm, customerSession)).status, 403);
    assert.equal((await request('staff', undefined, customerSession)).status, 403);
    assert.equal((await request('staff', { ...staffForm, email: newEmail }, adminSession)).status, 409);
    const createdStaff = await request('staff', staffForm, adminSession);
    assert.equal(createdStaff.status, 200);
    const staff = createdStaff.data.staff;
    assert.equal(staff.created_by_admin_id, 'test-admin');
    assert.equal(staff.status, 'active');
    assert.equal(staff.is_temp_pass_changed, 0);
    assert.equal(staff.can_reveal_password, 1);
    assert(!Object.hasOwn(staff, 'password_hash'));
    assert.deepEqual(createdStaff.data.emailDelivery, { status: 'outbox', filename: 'staff-welcome-' + staff.id + '.txt' });
    assert(!JSON.stringify(createdStaff.data).includes(initial.password));
    const welcome = await readFile(join(data, 'outbox', createdStaff.data.emailDelivery.filename), 'utf8');
    assert(welcome.includes('To: ' + initial.email));
    assert(welcome.includes('Temporary password: ' + initial.password));
    assert.equal((await request('staff', { ...staffForm, email: initial.email.toUpperCase() }, adminSession)).status, 409);
    assert.equal((await readdir(join(data, 'outbox'))).filter(name => name.startsWith('staff-welcome-')).length, 1);

    await server.stop();
    server = await start(data);
    assert.equal((await readCategory(category.id)).category_name, 'Limited bakes');
    const hiddenBreads = await readCategory('breads');
    assert.equal(hiddenBreads.status, 'inactive');
    assert.equal((await request('inventory/category', {
      ...hideBreads, status: 'active', version: hiddenBreads.updated_at, key: randomUUID()
    }, adminSession)).status, 200);
    assert.equal((await readCategory('breads')).status, 'active');
    console.log('PASS owner category changes persist and are available to the public Shop');
    const product = {
      id: 123, name: 'Test loaf', description: 'Test product', image: 'assets/product-placeholder.svg',
      category: { id: category.id, name: 'Limited bakes', status: 'active' }, subscription: false, active: false
    };
    const recipe = {
      product, key: randomUUID(), recipeVersion: 0,
      recipes: [{ variant: 'standard', variantName: '6-pack', price: 10, active: true, overhead: null, rows: null }]
    };
    const emptyRecipe = await request('inventory/recipe', {
      ...recipe, recipes: recipe.recipes.map(variant => ({ ...variant, rows: [] }))
    }, adminSession);
    assert.equal(emptyRecipe.status, 400);
    assert.match(emptyRecipe.data.error, /at least one recipe material/);
    assert.equal((await request('inventory/recipe', recipe, adminSession)).status, 400);
    assert(!(await request('catalog')).data.products.some(row => row.product_id === product.id));
    const material = await request('inventory/add', {
      key: randomUUID(), name: 'Test flour', category: 'ingredient', unit: 'g', stock: 100, totalCost: 10, threshold: 5
    }, adminSession);
    assert.equal(material.status, 200);
    const flour = material.data.items.find(item => item.name === 'Test flour');
    recipe.recipes[0].rows = [{ id: flour.inventory_id, quantity: 20 }];
    const otherSize = await request('inventory/recipe', {
      ...recipe, recipes: recipe.recipes.map(variant => ({ ...variant, variantName: '24-pack' }))
    }, adminSession);
    assert.equal(otherSize.status, 400);
    assert.match(otherSize.data.error, /6-pack or 12-pack/);
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/mF8AAAAASUVORK5CYII=';
    const upload = { ...recipe, coverUpload: 'data:image/png;base64,' + png };
    assert.equal((await request('inventory/recipe/cover', upload, customerSession)).status, 403);
    assert.equal((await request('inventory/recipe/cover', { ...upload, coverUpload: 'data:image/png;base64,SGVsbG8=' }, adminSession)).status, 400);
    const saved = await request('inventory/recipe/cover', upload, adminSession);
    assert.equal(saved.status, 200);
    const coverPath = saved.data.products.find(row => row.product_id === product.id).img_url;
    assert.match(coverPath, /^\/api\/auth\/product-image\/[a-f0-9]{64}$/);
    const availability = (await request('catalog')).data.availability;
    assert.deepEqual(availability.stock, [{ inventory_id: flour.inventory_id, stock_on_hand: 100, archived: 0 }]);
    assert.deepEqual(availability.requirements, [{ variant_id: product.id + ':standard', inventory_id: flour.inventory_id, quantity_required: 20 }]);
    assert.equal((await request('inventory/recipe/cover', upload, adminSession)).status, 200);
    const removeRecipe = await request('inventory/recipe', {
      ...recipe, product: { ...product, image: coverPath }, key: randomUUID(), recipeVersion: 1,
      recipes: recipe.recipes.map(variant => ({ ...variant, rows: [] }))
    }, adminSession);
    assert.equal(removeRecipe.status, 400);
    assert.match(removeRecipe.data.error, /at least one recipe material/);
    console.log('PASS product creation and editing require recipe materials');
    const remove = async (id, session) => {
      const { updated_at: version } = await readCategory(id);
      return request('inventory/category/remove', { id, version, key: randomUUID() }, session);
    };
    assert.equal((await remove(category.id, adminSession)).status, 409);
    assert.equal((await remove('pantry', customerSession)).status, 403);
    assert.equal((await remove('pantry', adminSession)).status, 200);
    assert.equal(await readCategory('pantry'), undefined);
    assert.equal((await request('inventory/recipe', {
      ...recipe, key: randomUUID(), recipeVersion: 1,
      product: { ...product, category: { id: 'pantry', name: 'Pantry', status: 'active' } }
    }, adminSession)).status, 409);
    await server.stop();
    server = null;
    const legacyDb = new DatabaseSync(join(data, 'kitchen406.sqlite'));
    try {
      legacyDb.exec('DROP TRIGGER IF EXISTS NotifyInventoryLowAfterUpdate; DROP TRIGGER IF EXISTS NotifyInventoryLowAfterInsert;');
      for (const table of ['SystemNotificationRead','SystemNotification','NotificationLog','CustomerNotification',
        'CourierBooking','StandardCourierDelivery','SavedDeliveryAddress','SubscriptionCourierBooking',
        'SubscriptionDeferment','SubscriptionDelivery','SubscriptionCapacityAllocation','Subscription',
        'SubscriptionCheckout','SubscriptionCapacityConfig','PickupFulfillment','InventoryReservation',
        'OrderMaterialRequirement','CapacityAllocation','Payment','CheckoutHold','CapacityConfig','BlockedDate',
        'OrderStatusHistory','OrderItem','Order']) {
        legacyDb.exec(`DROP TABLE IF EXISTS "${table}"`);
      }
      legacyDb.prepare("UPDATE ProductVariant SET size = 'Standard' WHERE variant_id = ?").run(product.id + ':standard');
      legacyDb.exec('PRAGMA user_version = 1');
    } finally {
      legacyDb.close();
    }
    server = await start(data);
    assert.equal(await readCategory('pantry'), undefined);
    const migrated = (await request('catalog')).data;
    assert.deepEqual(migrated.variants.find(variant => variant.product_id === product.id), {
      product_id: product.id, variant_key: 'standard', size: '6-pack', final_price: 10, status: 'available'
    });
    assert.deepEqual(migrated.availability.requirements, availability.requirements);
    console.log('PASS Standard migrates to 6-pack with the same variant key, price and recipe');
    const photo = await fetch(server.url + coverPath);
    assert.equal(photo.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await photo.arrayBuffer()), Buffer.from(png, 'base64'));
    const approvedPrice = 12.75;
    assert.equal((await request('inventory/recipe', {
      ...recipe, product: { ...product, image: coverPath, active: true }, key: randomUUID(), recipeVersion: 1,
      recipes: recipe.recipes.map(variant => ({ ...variant, price: approvedPrice }))
    }, adminSession)).status, 200);
    const priceDb = new DatabaseSync(join(data, 'kitchen406.sqlite'), { readOnly: true });
    try {
      const variant = priceDb.prepare('SELECT final_price FROM ProductVariant WHERE variant_id = ?')
        .get(product.id + ':standard');
      assert.equal(variant.final_price, approvedPrice);
    } finally {
      priceDb.close();
    }
    const updatedCatalog = (await request('catalog')).data;
    assert.equal(updatedCatalog.variants.find(variant => variant.product_id === product.id &&
      variant.variant_key === 'standard').final_price, approvedPrice);
    console.log('PASS edited selling price persists in SQLite and is returned by the catalog API');
    const { earliestPickupDate } = require('../ordering-server.cjs');
    assert.equal(earliestPickupDate(Date.parse('2026-12-31T11:59:59.999+08:00')), '2027-01-01');
    assert.equal(earliestPickupDate(Date.parse('2026-12-31T12:00:00.000+08:00')), '2027-01-02');
    const manilaNow = Date.now() + 8 * 3600000;
    const pickupDate = new Date(manilaNow + 3 * 86400000).toISOString().slice(0, 10);
    const nextPickupDate = new Date(manilaNow + 4 * 86400000).toISOString().slice(0, 10);
    const today = new Date(manilaNow).toISOString().slice(0, 10);
    const pickup = {
      date: pickupDate, key: randomUUID(),
      items: [{ variantId: product.id + ':standard', quantity: 5, unitPriceCents: 1275 }]
    };
    const place = (input, options = customerSession) => request('ordering/pickup', input, options);
    const setBlock = remove => request('ordering/blocked-date', { date: pickupDate, reason: 'Closed', remove }, adminSession);
    assert.equal((await place(pickup, {})).status, 401);
    assert.match((await place({ ...pickup, date: today })).data.error, /cutoff/);
    assert.match((await place({ ...pickup, items: [{ ...pickup.items[0], unitPriceCents: 1000 }] })).data.error, /price changed/);
    assert.equal((await setBlock(false)).status, 200);
    assert.match((await place(pickup)).data.error, /blocked/);
    assert.equal((await setBlock(true)).status, 200);
    assert.equal((await request('ordering/capacity', { units: 5, varieties: 4 }, adminSession)).status, 200);
    const stockResults = await Promise.all([place({ ...pickup, key: randomUUID() }),
      place({ ...pickup, date: nextPickupDate, key: randomUUID() })]);
    assert.deepEqual(stockResults.map(result => result.status).sort(), [200, 409]);
    assert.match(stockResults.find(result => result.status === 409).data.error, /ingredients/);
    const stockWinner = stockResults.find(result => result.status === 200).data.order;
    const cancelled = await request('ordering/payment', { id: stockWinner.id, action: 'cancel' }, customerSession);
    assert.equal(cancelled.data.order.status, 'cancelled');
    const competing = { ...pickup, key: randomUUID() };
    const results = await Promise.all([place(pickup), place(competing)]);
    assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
    assert.match(results.find(result => result.status === 409).data.error, /capacity/);
    const winner = results[0].status === 200 ? pickup : competing;
    const held = results.find(result => result.status === 200).data.order;
    assert.equal(held.total, 63.75);
    assert.equal((await place(winner)).data.order.id, held.id);
    assert.equal((await place({ ...winner, date: nextPickupDate })).status, 409);
    assert.match((await place({ ...competing, key: randomUUID(), date: nextPickupDate })).data.error, /ingredients/);
    assert.equal((await request('ordering/payment', { id: held.id, action: 'confirm' }, adminSession)).status, 403);
    const expiryDb = new DatabaseSync(join(data, 'kitchen406.sqlite'));
    expiryDb.prepare('UPDATE CheckoutHold SET expires_at = 0 WHERE order_id = ?').run(held.id);
    expiryDb.close();
    const expired = (await request('ordering/orders', undefined, customerSession)).data.orders.find(order => order.id === held.id);
    assert.equal(expired.payment, 'expired');
    assert.equal((await request('ordering/payment', { id: held.id, action: 'confirm' }, customerSession)).data.order.paid, false);
    const secondHold = (await place({ ...pickup, key: randomUUID() })).data.order;
    const confirm = () => request('ordering/payment', { id: secondHold.id, action: 'confirm' }, customerSession);
    assert.equal((await confirm()).data.order.paid, true);
    assert.equal((await confirm()).data.order.status, 'confirmed');
    const feed = options => request('notifications', undefined, options);
    assert.equal((await feed()).status, 401);
    const orderNotice = (await feed(customerSession)).data.notifications.find(row => row.path === 'orders/' + secondHold.id);
    assert(orderNotice);
    assert.equal(orderNotice.read_at, null);
    assert.equal((await feed(customerSession)).data.notifications.filter(row => row.path === orderNotice.path).length, 1);
    assert.equal((await request('notifications/read', { id: orderNotice.id }, adminSession)).status, 200);
    assert.equal((await feed(customerSession)).data.notifications.find(row => row.id === orderNotice.id).read_at, null);
    assert((await request('notifications/read', { id: orderNotice.id }, customerSession)).data.notifications
      .find(row => row.id === orderNotice.id).read_at);
    await server.stop();
    server = await start(data);
    const restored = (await request('ordering/orders', undefined, customerSession)).data.orders.find(order => order.id === secondHold.id);
    assert.equal(restored.total, 63.75);
    assert.equal(restored.paid, true);
    assert((await feed(customerSession)).data.notifications.find(row => row.id === orderNotice.id).read_at);
    for (let attempt = 0; attempt < 40; attempt++) {
      if ((await feed(customerSession)).data.notifications.find(row => row.id === orderNotice.id).outbox_status === 'sent') break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const notificationDb = new DatabaseSync(join(data, 'kitchen406.sqlite'), { readOnly: true });
    let logged;
    try {
      logged = notificationDb.prepare('SELECT * FROM NotificationLog WHERE customer_notification_id = ?').get(orderNotice.id);
      assert.equal(logged.status, 'sent');
      assert.equal(JSON.parse(logged.attempt_history).length, 1);
      assert.equal(notificationDb.prepare('PRAGMA foreign_key_check').get(), undefined);
    } finally { notificationDb.close(); }
    assert.match(await readFile(join(data, 'outbox', logged.provider_message_id), 'utf8'), /Subject: Order confirmed/);
    console.log('PASS customer inbox isolation, duplicate prevention, read persistence, and transactional outbox');
    assert.equal((await request('ordering/calendar')).data.units, 5);
    assert.match((await place({ ...pickup, key: randomUUID(), date: nextPickupDate })).data.error, /ingredients/);
    console.log('PASS pickup migration, server price, blocked date, cutoff, competing checkouts, expiry and payment persistence');
    if (process.env.K406_TEST_CHROME) {
      const browserDb = new DatabaseSync(join(data, 'kitchen406.sqlite'));
      try {
        browserDb.prepare('UPDATE Inventory SET stock_on_hand = 160 WHERE inventory_id = ?').run(flour.inventory_id);
        browserDb.prepare('UPDATE Product SET subscription_eligible = 1 WHERE product_id = ?').run(product.id);
        browserDb.prepare(`INSERT INTO SubscriptionSchedule
          SELECT 'test-friday', ?, 4, 5, 'active', admin_id, ?, ? FROM AdminProfile WHERE admin_id = 'test-admin'`)
          .run(product.id, new Date().toISOString(), new Date().toISOString());
      } finally { browserDb.close(); }
      await require('./pickup-browser.cjs')(process.env.K406_TEST_CHROME, data, server.url,
        customerSession.session, product.id, nextPickupDate, adminSession.session, flour.inventory_id);
    }
    console.log('PASS owner cover upload, invalid-file rejection, retry, persistence and ordinary editing');
    console.log('PASS empty category removal persists and categories with inactive products are protected');
    assert.deepEqual((await request('staff', undefined, adminSession)).data.staff, [staff]);
    const reveal = { id: staff.id };
    assert.equal((await request('staff/temporary-password', reveal)).status, 401);
    assert.equal((await request('staff/temporary-password', reveal, customerSession)).status, 403);
    assert.deepEqual((await request('staff/temporary-password', reveal, adminSession)).data, { password: initial.password });
    assert.equal((await request('staff/temporary-password/replace', reveal, adminSession)).status, 409);
    const firstLogin = await request('sign-in', initial);
    assert.equal(firstLogin.status, 200);
    assert.equal(firstLogin.data.account.role, 'staff');
    assert.equal(firstLogin.data.account.is_temp_pass_changed, 0);
    const staffSession = sessionOf(firstLogin);
    const operations = options => request('ordering/operations', undefined, options);
    assert.equal((await operations({})).status, 401);
    assert.equal((await operations(customerSession)).status, 403);
    assert.equal((await operations(staffSession)).status, 403);
    assert.equal((await feed(staffSession)).status, 401);
    const adminOrders = (await operations(adminSession)).data.orders;
    assert(adminOrders.some(order => order.id === held.id && order.payment === 'expired'));
    assert.deepEqual(adminOrders.find(order => order.id === secondHold.id).materialRequirements,
      { [flour.inventory_id]: 100 });
    const otherTemporarySession = sessionOf(await request('sign-in', initial));
    assert.equal((await request('staff', undefined, staffSession)).status, 403);
    assert.equal((await request('staff/temporary-password', reveal, staffSession)).status, 403);
    assert.equal((await request('staff/setup', { password: initial.password }, staffSession)).data.error, 'same-password');
    const password = 'StaffPermanent456!';
    assert.equal((await request('staff/setup', { password }, adminSession)).status, 403);
    const setup = await request('staff/setup', { password }, staffSession);
    assert.equal(setup.status, 200);
    assert.equal(setup.data.account.is_temp_pass_changed, 1);
    assert(setup.data.account.password_changed_at);
    assert.equal((await request('staff/temporary-password', reveal, adminSession)).data.error, 'staff-setup-complete');
    assert.equal((await request('staff/temporary-password/replace', reveal, adminSession)).status, 409);
    const [finishedStaff] = (await request('staff', undefined, adminSession)).data.staff;
    assert.equal(finishedStaff.is_temp_pass_changed, 1);
    assert.equal(finishedStaff.can_reveal_password, 0);
    assert(!(await readdir(join(data, 'outbox'))).includes(createdStaff.data.emailDelivery.filename));
    assert.equal((await request('sign-in', initial)).status, 401);
    assert.equal((await request('session', undefined, otherTemporarySession)).data.account, null);
    assert.equal((await request('staff/setup', { password }, staffSession)).status, 409);
    const newStaffLogin = await request('sign-in', { email: initial.email, password });
    assert.equal(newStaffLogin.status, 200);
    const staffOrders = (await operations(sessionOf(newStaffLogin))).data.orders;
    assert(staffOrders.some(order => order.id === secondHold.id && order.paid));
    assert(staffOrders.every(order => order.status === 'confirmed'));
    const staffFeed = await feed(sessionOf(newStaffLogin));
    const sharedNotice = staffFeed.data.notifications.find(row => row.path === 'staff/production/' + secondHold.id);
    assert(sharedNotice);
    assert.equal(sharedNotice.read, false);
    assert(!staffFeed.data.notifications.some(row => row.type === 'payments'));
    const ownerFeed = await feed(adminSession);
    assert(ownerFeed.data.notifications.some(row => row.type === 'payments'));
    assert((await request('notifications/read', { id: sharedNotice.id }, adminSession)).data.notifications
      .find(row => row.id === sharedNotice.id).read);
    assert.equal((await feed(sessionOf(newStaffLogin))).data.notifications.find(row => row.id === sharedNotice.id).read, false);
    assert((await request('notifications/read', { all: true }, sessionOf(newStaffLogin))).data.notifications
      .every(row => row.read));
    console.log('PASS role-scoped operational notifications and per-account read acknowledgments');
    console.log('PASS saved pickup visibility for owners and eligible staff');
    const updatePickup = (action, options = sessionOf(newStaffLogin)) =>
      request('ordering/fulfillment', { id: secondHold.id, action }, options);
    assert.equal((await updatePickup('preparing', customerSession)).status, 403);
    assert.match((await updatePickup('preparing')).data.error, /Preparation is scheduled/);
    assert.equal((await updatePickup('ready')).status, 409);
    const fulfillmentDb = new DatabaseSync(join(data, 'kitchen406.sqlite'));
    try {
      fulfillmentDb.prepare('UPDATE "Order" SET fulfillment_date = ? WHERE order_id = ?').run(today, secondHold.id);
      const stock = fulfillmentDb.prepare('SELECT stock_on_hand FROM Inventory WHERE inventory_id = ?');
      const before = stock.get(flour.inventory_id).stock_on_hand;
      assert.equal((await updatePickup('preparing')).data.order.status, 'preparing');
      assert.equal((await updatePickup('preparing', adminSession)).data.order.reservationStatus, 'consumed');
      assert.equal(stock.get(flour.inventory_id).stock_on_hand, before - 100);
      const movements = fulfillmentDb.prepare('SELECT movement_type, quantity_change FROM InventoryMovement WHERE order_id = ?')
        .all(secondHold.id).map(row => ({ ...row }));
      assert.deepEqual(movements, [{ movement_type: 'consumption', quantity_change: -100 }]);
      assert.equal((await updatePickup('ready', adminSession)).data.order.status, 'ready');
      assert.equal((await updatePickup('completed')).status, 409);
      const arrival = await updatePickup('arrival');
      if (Date.now() <= Date.parse(today + 'T19:00:00+08:00')) {
        assert.ok(arrival.data.order.pickupArrivedAt);
      } else {
        assert.equal(arrival.status, 409);
        fulfillmentDb.prepare('UPDATE PickupFulfillment SET arrived_at = ? WHERE order_id = ?')
          .run(Date.parse(today + 'T18:59:00+08:00'), secondHold.id);
      }
      assert.equal((await updatePickup('completed')).data.order.status, 'completed');
      const customerOrders = (await request('ordering/orders', undefined, customerSession)).data.orders;
      assert.equal(customerOrders.find(order => order.id === secondHold.id).status, 'completed');
      const movementSnapshot = (await request('inventory', undefined, adminSession)).data.movements;
      assert(movementSnapshot.some(move => move.order_id === secondHold.id && move.quantity_change === -100));
    } finally { fulfillmentDb.close(); }
    console.log('PASS pickup fulfillment permissions, sequencing, one-time consumption, arrival and completion');
    const statusInput = { id: staff.id, version: staff.version, status: 'inactive' };
    assert.equal((await request('staff/status', statusInput, staffSession)).status, 403);
    const inactive = await request('staff/status', statusInput, adminSession);
    assert.equal(inactive.status, 200);
    assert.equal(inactive.data.staff.history[0].actor.id, 'test-admin');
    assert.equal((await request('session', undefined, sessionOf(newStaffLogin))).data.account, null);
    assert.equal((await request('sign-in', { email: initial.email, password })).status, 401);
    assert.equal((await request('staff/status', { ...statusInput, status: 'active' }, adminSession)).status, 409);
    assert.equal((await request('staff/status', { ...statusInput, version: inactive.data.staff.version, status: 'active' }, adminSession)).status, 200);
    assert.equal((await request('sign-in', { email: initial.email, password })).status, 200);

    const legacy = { ...staffForm, email: 'legacy-staff@example.test' };
    const legacyResult = await request('staff', legacy, adminSession);
    const legacyId = { id: legacyResult.data.staff.id };
    const migrationDb = new DatabaseSync(join(data, 'kitchen406.sqlite'));
    try { migrationDb.prepare('DELETE FROM StaffTemporaryPassword WHERE staff_id = ?').run(legacyId.id); }
    finally { migrationDb.close(); }
    assert.equal((await request('staff/temporary-password', legacyId, adminSession)).data.error, 'temporary-password-unavailable');
    const legacySession = sessionOf(await request('sign-in', legacy));
    const replacement = await request('staff/temporary-password/replace', legacyId, adminSession);
    assert.equal(replacement.status, 200);
    assert.notEqual(replacement.data.password, legacy.password);
    assert.equal((await request('session', undefined, legacySession)).data.account, null);
    assert.equal((await request('sign-in', legacy)).status, 401);
    assert.equal((await request('sign-in', { ...legacy, password: replacement.data.password })).status, 200);

    const roster = (await request('staff', undefined, adminSession)).data.staff;
    const oldPending = roster.find(row => row.id === legacyId.id);
    const rename = { id: oldPending.id, version: oldPending.version, first_name: 'Renamed', last_name: 'Staff' };
    const renamed = await request('staff/name', rename, adminSession);
    assert.equal(renamed.data.staff.first_name, 'Renamed');
    assert.equal((await request('staff/name', rename, adminSession)).status, 409);
    const changedPendingEmail = 'corrected-staff@example.test';
    const edit = { id: oldPending.id, version: renamed.data.staff.version, email: changedPendingEmail };
    assert.equal((await request('staff/email', { ...edit, email: newEmail }, adminSession)).status, 409);
    assert.equal((await request('staff/email', edit, customerSession)).status, 403);
    const corrected = await request('staff/email', edit, adminSession);
    assert.equal(corrected.status, 200);
    assert.equal(corrected.data.emailDelivery.status, 'outbox');
    const correctedMail = await readFile(join(data, 'outbox', corrected.data.emailDelivery.filename), 'utf8');
    const correctedPassword = (await request('staff/temporary-password', legacyId, adminSession)).data.password;
    assert(correctedMail.includes('To: ' + changedPendingEmail));
    assert(correctedMail.includes('Temporary password: ' + correctedPassword));
    assert.equal((await request('sign-in', { ...legacy, password: replacement.data.password })).status, 401);
    const correctedLogin = await request('sign-in', { email: changedPendingEmail, password: correctedPassword });
    assert.equal(correctedLogin.data.account.is_temp_pass_changed, 0);
    assert.equal(correctedLogin.data.account.first_name, 'Renamed');
    const pendingSession = sessionOf(correctedLogin);
    assert.equal((await request('profile', { first_name: 'Test', last_name: 'Staff' }, pendingSession)).status, 401);
    assert.equal((await request('email-change', { email: 'pending-new@example.test', password: correctedPassword }, pendingSession)).status, 401);
    assert.equal((await request('change-password', {}, pendingSession)).status, 401);

    const completed = roster.find(row => row.id === staff.id);
    const completedEdit = { ...rename, id: completed.id, version: completed.version, email: 'locked@example.test' };
    assert.equal((await request('staff/name', completedEdit, adminSession)).data.error, 'staff-not-pending');
    assert.equal((await request('staff/email', completedEdit, adminSession)).data.error, 'staff-not-pending');
    assert.equal((await request('sign-in', { email: initial.email, password })).data.account.first_name, 'Test');

    const editedPending = (await request('staff', undefined, adminSession)).data.staff.find(row => row.id === oldPending.id);
    const disabledPending = await request('staff/status', { id: editedPending.id, version: editedPending.version, status: 'inactive' }, adminSession);
    assert.equal(disabledPending.status, 200);
    const inactiveEdit = { ...edit, version: disabledPending.data.staff.version, email: 'inactive@example.test' };
    assert.equal((await request('staff/name', { ...rename, version: inactiveEdit.version }, adminSession)).data.error, 'staff-not-pending');
    assert.equal((await request('staff/email', inactiveEdit, adminSession)).data.error, 'staff-not-pending');

    async function checkPasswordChange(email, currentPassword, role, session) {
      const password = 'PersonalNew456!';
      const input = { currentPassword, password, confirm: password };
      const authFiles = async () => (await readdir(join(data, 'outbox'))).filter(name => !name.startsWith('notification-'));
      const files = await authFiles();
      assert.equal((await request('change-password', input)).status, 401);
      assert.equal((await request('change-password', { ...input, currentPassword: 'Wrong123!' }, session)).status, 403);
      assert.equal((await request('change-password', { ...input, confirm: 'Mismatch123!' }, session)).data.error, 'password-mismatch');
      assert.equal((await request('change-password', { currentPassword, password: currentPassword, confirm: currentPassword }, session)).data.error, 'same-password');
      const second = sessionOf(await request('sign-in', { email, password: currentPassword }));
      const updated = await request('change-password', input, session);
      assert.equal(updated.status, 200);
      assert.deepEqual(updated.data, { email });
      assert.match(updated.cookie, /Max-Age=0/);
      for (const active of [session, second]) assert.equal((await request('session', undefined, active)).data.account, null);
      assert.equal((await request('sign-in', { email, password: currentPassword })).status, 401);
      const login = await request('sign-in', { email, password });
      assert.equal(login.status, 200);
      assert.equal(login.data.account.role, role);
      assert(login.data.account.password_changed_at);
      assert.deepEqual(await authFiles(), files);
    }

    const retryDb = new DatabaseSync(join(data, 'kitchen406.sqlite'));
    try {
      retryDb.exec('PRAGMA busy_timeout = 5000');
      const logId = logged.notification_log_id;
      const target = join(data, 'outbox', logged.provider_message_id);
      const obstruction = target + '.tmp';
      const log = retryDb.prepare('SELECT * FROM NotificationLog WHERE notification_log_id = ?');
      const due = retryDb.prepare('UPDATE NotificationLog SET next_retry_at = 0 WHERE notification_log_id = ?');
      const waitForAttempts = async count => {
        for (let attempt = 0; attempt < 40; attempt++) {
          const row = log.get(logId);
          if (JSON.parse(row.attempt_history).length >= count) return row;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        assert.fail('Did not record outbox attempt ' + count);
      };
      await rm(target);
      await mkdir(obstruction);
      retryDb.prepare(`UPDATE NotificationLog SET status = 'pending', next_retry_at = 0, sent_at = NULL,
        attempt_history = '[]' WHERE notification_log_id = ?`).run(logId);
      for (const [index, delay] of [5, 15, 30, null].entries()) {
        const failed = await waitForAttempts(index + 1);
        assert.equal(failed.status, 'failed');
        assert.equal(failed.retry_count, index);
        assert.equal(failed.next_retry_at, delay === null ? null : JSON.parse(failed.attempt_history).at(-1).at + delay * 60_000);
        if (delay !== null) due.run(logId);
      }
      assert((await feed(adminSession)).data.notifications.some(row => row.retry_id === logId));
      assert.equal((await request('notifications/retry', { id: logId }, customerSession)).status, 403);
      await rmdir(obstruction);
      assert.equal((await request('notifications/retry', { id: logId }, adminSession)).status, 200);
      const recovered = await waitForAttempts(5);
      assert.equal(recovered.status, 'sent');
      assert.equal(JSON.parse(recovered.attempt_history).filter(attempt => attempt.status === 'failed').length, 4);
      assert.match(await readFile(target, 'utf8'), /Subject: Order confirmed/);
    } finally { retryDb.close(); }
    console.log('PASS notification backoff, final owner alert, manual retry, and retained attempt history');

    const staffSelfSession = sessionOf(await request('sign-in', { email: initial.email, password }));
    for (const member of [
      { role: 'staff', email: initial.email, password, session: staffSelfSession, otherSession: adminSession },
      { role: 'admin', ...admin, session: adminSession, otherSession: customerSession }
    ]) {
      const profile = await request('profile', { first_name: 'Updated', last_name: member.role }, member.session);
      assert.equal(profile.status, 200);
      assert.equal(profile.data.account.role, member.role);
      assert.equal(profile.data.account.first_name, 'Updated');

      const target = member.role + '-new@example.test';
      assert.equal((await request('email-change', { email: target, password: 'Wrong123!' }, member.session)).status, 403);
      const emailRequest = await request('email-change', { email: target, password: member.password }, member.session);
      assert.equal(emailRequest.status, 200);
      const changeId = emailRequest.data.challengeId;
      assert.equal(emailRequest.data.verificationEmail, member.email);
      assert((await readFile(join(data, 'outbox', changeId + '.txt'), 'utf8')).startsWith('To: ' + member.email + '\n'));
      assert.deepEqual((await request('email-change', { email: target, password: member.password }, member.session)).data, emailRequest.data);
      const proof = { challengeId: changeId, code: await getCode(changeId) };
      assert.equal((await request('email-change/verify', proof, member.otherSession)).status, 400);
      const verifiedEmail = await request('email-change/verify', proof, member.session);
      assert.equal(verifiedEmail.data.account.email, target);
      assert.equal(verifiedEmail.data.account.email_verified_at, null);
      assert.equal((await request('sign-in', { email: member.email, password: member.password })).status, 401);
      assert.equal((await request('forgot', { email: target })).status, 404);
      await checkPasswordChange(target, member.password, member.role, member.session);
    }

    await checkPasswordChange(newEmail, reset.password, 'customer', customerSession);
    console.log('PASS current-password changes for customers, staff, and admins without verification codes');
    console.log('PASS account creation, verification, sign-in, server restart, profile persistence, one-time password reset, session revocation, verified email change and sign-out');
    console.log('PASS admin staff provisioning, roster persistence, temporary password replacement, deactivation and reactivation');
    console.log('PASS Pending staff edits and rejection of Active or Inactive staff edits');
    console.log('PASS admin and staff self-service profile, email verification, and password changes');
  } catch (error) {
    console.error('Local verification failed:', error);
    throw error;
  } finally {
    await server?.stop();
    await rm(data, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
