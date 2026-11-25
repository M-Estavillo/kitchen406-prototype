const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { DatabaseSync } = require('node:sqlite');
const inventory = require('../inventory-server.cjs');
const ordering = require('../ordering-server.cjs');
const { addressBook } = require('../address-server.cjs');
const { checkoutQuote, demoQuotation } = require('../courier-quotation.cjs');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const dir = mkdtempSync(join(tmpdir(), 'k406-subscriptions-'));
const file = join(dir, 'database.sqlite');
const customer = { account_id: 'customer', customer_id: 'customer', role: 'customer' };
const stranger = { account_id: 'stranger', customer_id: 'stranger', role: 'customer' };
const owner = { account_id: 'owner', role: 'admin', status: 'active' };
let db = new DatabaseSync(file);
let endpoints;
let addresses;
const realNow = Date.now;

function transaction(work) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const value = work();
    db.exec('COMMIT');
    return value;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function initialize() {
  const requireRole = (account, role) => {
    if (account?.role !== role) throw new HttpError(403, 'access-denied');
    return account;
  };
  const inventoryEndpoints = inventory(db, transaction, account => account, HttpError);
  const notifications = require('../notification-server.cjs')(db, transaction, account => account, HttpError, dir);
  endpoints = {
    ...inventoryEndpoints,
    ...notifications.endpoints,
    ...ordering(db, transaction, requireRole, account => account, HttpError, notifications)
  };
  addresses = addressBook(db, transaction, requireRole, HttpError);
}

const call = (route, input = {}, account = customer) => endpoints[route](input, account);
const clock = value => { Date.now = () => Date.parse(value + ':00+08:00'); };
const count = table => db.prepare('SELECT count(*) AS count FROM ' + table).get().count;

try {
  for (const file of ['auth.sql', 'inventory.sql', 'ordering-v3.sql', 'pickup-fulfillment-v4.sql']) {
    db.exec(readFileSync(join(__dirname, '..', 'database', file), 'utf8'));
  }
  db.exec(`
    PRAGMA user_version = 4;
    INSERT INTO Account(account_id,email,password_hash,first_name,last_name,role,status,created_at,updated_at)
    VALUES ('customer','test@example.com','x','Test','Customer','customer','active','2026-01-01','2026-01-01'),
      ('stranger','stranger@example.com','x','Test','Stranger','customer','active','2026-01-01','2026-01-01'),
      ('owner','owner@example.com','x','Test','Owner','admin','active','2026-01-01','2026-01-01');
    INSERT INTO CustomerProfile VALUES
      ('customer','customer','09123456789','2026-01-01','2026-01-01'),
      ('stranger','stranger','09123456780','2026-01-01','2026-01-01');
    INSERT INTO AdminProfile VALUES ('owner','owner',1);
    INSERT INTO Category VALUES ('breads','Breads','active','2026-01-01','2026-01-01');
    INSERT INTO Product VALUES (1,'breads','Bread','','',1,'active','2026-01-01','2026-01-01');
    INSERT INTO ProductVariant VALUES ('1:standard',1,'standard','6-pack',150,NULL,'available','2026-01-01','2026-01-01');
    INSERT INTO Inventory VALUES ('flour','Flour','ingredient','g',1000,10,1,'available','2026-01-01','2026-01-01',NULL);
    INSERT INTO ProductBOM VALUES ('recipe','1:standard','flour',10);
    INSERT INTO "Order" VALUES ('old','customer','old','old','old','standard_purchase',15000,'2026-11-25','pickup','confirmed',1);
    INSERT INTO OrderItem VALUES ('old-line','old','1:standard','Bread','6-pack','',1,15000);
    INSERT INTO CheckoutHold VALUES ('old-hold','old','confirmed',1,2,1,NULL);
    INSERT INTO Payment VALUES ('old-payment','old','old-hold',15000,'paid',1,2,1);
    INSERT INTO PickupFulfillment VALUES ('old','completed',1,'owner',1);
  `);
  initialize();
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 7);
  assert.equal(call('GET ordering/orders').orders[0].status, 'completed');
  assert.equal(count('OrderItem'), 1);

  clock('2026-11-25T00:00');
  const checkout = {
    key: 'pickup', variantId: '1:standard', quantity: 2, unitPriceCents: 15000,
    start: '2026-11-27', method: 'pickup', scheduleId: 'friday-1', preparationDay: 4, fulfillmentDay: 5
  };
  const { id } = call('POST subscriptions/checkout', checkout);
  assert.equal(call('POST subscriptions/checkout', checkout).id, id);
  assert.equal(call('GET subscriptions', {}, stranger).purchases.length, 0);
  assert.throws(() => call('POST subscriptions/payment', { action: 'confirm', id }, stranger), { status: 404 });
  assert.throws(() => call('POST subscriptions/checkout', { ...checkout, key: 'capacity', quantity: 9 }), /capacity/);
  const saveSchedule = input => call('POST inventory/subscription-schedule', {
    product_id: 1, inventoryVersion: null, ...input
  }, owner);
  assert.throws(() => saveSchedule({ key: 'same-day', id: 'friday-1', preparation_day: 5, day: 5 }), /different weekdays/);
  saveSchedule({ key: 'wrap-around', id: 'thursday', preparation_day: 5, day: 4 });
  saveSchedule({ key: 'prep-edit', id: 'friday-1', preparation_day: 3, day: 5 });
  assert.throws(() => call('POST subscriptions/checkout', { ...checkout, key: 'stale-draft' }), /schedule has changed/);
  const pay = () => call('POST subscriptions/payment', { action: 'confirm', id });
  const active = pay();
  assert.equal(active.records.length, 1);
  assert.equal(active.orders.length, 4);
  assert.equal(active.orders[0].fulfillment.preparationDate, '2026-11-26');
  assert.equal(active.orders.reduce((total, order) => total + order.total, 0), 1200);
  assert.equal(pay().orders.length, 4);
  assert.equal(call('GET notifications').notifications.filter(row => row.title === 'Subscription confirmed').length, 1);
  assert.deepEqual(call('GET notifications', {}, stranger).notifications, []);
  assert.equal(count('Payment'), 2);
  assert.equal(db.prepare('SELECT sum(amount_payable_cents) AS total FROM "Order" WHERE type = ?')
    .get('subscription_fulfillment').total, 0);

  const first = active.orders[0];
  const move = { id: first.id, option: 'day', originalDate: '2026-11-27' };
  assert.equal(call('POST subscriptions/defer', move).orders[0].fulfillment.date, '2026-11-28');
  assert.equal(call('POST subscriptions/defer', move).requests.length, 1);
  assert.equal(call('GET notifications').notifications.filter(row => row.title === 'Fulfillment rescheduled').length, 1);
  assert.throws(() => call('POST subscriptions/defer', {
    id: active.orders[1].id, option: 'day', originalDate: '2026-12-04'
  }), /one deferment/);

  for (const [index, order] of active.orders.entries()) {
    clock((index === 0 ? '2026-11-28' : order.fulfillment.date) + 'T11:00');
    for (const action of ['preparing', 'ready', 'arrival', 'completed']) {
      call('POST subscriptions/fulfillment', { id: order.id, action }, owner);
    }
  }
  assert.equal(call('GET subscriptions').records[0].status, 'completed');
  assert.equal(db.prepare('SELECT stock_on_hand FROM Inventory').get().stock_on_hand, 920);
  assert.equal(count('InventoryMovement'), 4);
  db.close();
  db = new DatabaseSync(file);
  initialize();
  assert.equal(call('GET subscriptions').records[0].completedCount, 4);
  assert.equal(call('GET subscriptions').orders[0].fulfillment.date, '2026-11-28');
  assert.equal(call('GET subscriptions/operations', {}, owner).orders.length, 4);

  clock('2027-01-04T08:00');
  saveSchedule({ key: 'tuesday-offering', id: 'tuesday', preparation_day: 1, day: 2 });
  const dates = ['2027-01-12', '2027-01-19', '2027-01-26', '2027-02-02'];
  const fees = [2500, 2600, 2700, 2800];
  const address = { label: 'Home', add_line_1: 'Banilad', city: 'Cebu', postal_code: '6000' };
  const token = checkoutQuote('Banilad, Cebu, 6000, Philippines', dates.map((date, index) => ({
    date, fee: fees[index] / 100, expiresAt: '2027-01-04T09:00:00+08:00'
  })));
  const delivery = { ...checkout, key: 'delivery', start: dates[0], scheduleId: 'tuesday', preparationDay: 1,
    fulfillmentDay: 2, method: 'delivery', fees, address, checkoutQuote: token };
  assert.throws(() => call('POST subscriptions/checkout', { ...delivery, fees: [0, 0, 0, 0] }), /quotation/);
  const paid = call('POST subscriptions/payment', {
    id: call('POST subscriptions/checkout', delivery).id, action: 'confirm'
  });
  const dispatched = paid.orders.find(order => order.fulfillment.method === 'delivery');
  assert.equal(dispatched.fee, 25);
  assert.equal(dispatched.fulfillment.preparationDate, '2027-01-11');
  clock('2027-01-11T08:00');
  for (const action of ['preparing', 'ready']) {
    call('POST subscriptions/fulfillment', { id: dispatched.id, action }, owner);
  }
  const courier = input => call('POST subscriptions/courier', { id: dispatched.id, ...input }, owner);
  const booking = { action: 'book', key: 'booking', outcome: 'success' };
  courier(booking);
  courier(booking);
  courier({ action: 'track', expectedStatus: 'booked' });
  courier({ action: 'track', expectedStatus: 'booked' });
  courier({ action: 'track', expectedStatus: 'in_transit' });
  assert.equal(call('GET subscriptions').orders.find(order => order.id === dispatched.id).delivery.status, 'delivered');
  assert.equal(count('CourierBooking'), 1);

  const unpaid = { ...checkout, key: 'expires', start: '2027-02-09', scheduleId: 'tuesday', preparationDay: 1, fulfillmentDay: 2 };
  const expiringId = call('POST subscriptions/checkout', unpaid).id;
  clock('2027-01-11T08:33');
  const expired = call('POST subscriptions/payment', { id: expiringId, action: 'confirm' });
  assert.equal(expired.purchases.find(purchase => purchase.id === expiringId).payment, 'expired');
  assert.equal(expired.records.length, 2);
  assert.equal(db.prepare(`SELECT count(*) AS count FROM SubscriptionCapacityAllocation
    WHERE purchase_order_id = ? AND status = 'expired'`).get(expiringId).count, 4);
  const cancelledId = call('POST subscriptions/checkout', { ...unpaid, key: 'cancelled' }).id;
  assert.equal(call('POST subscriptions/payment', { id: cancelledId, action: 'cancel' })
    .purchases.find(purchase => purchase.id === cancelledId).payment, 'cancelled');

  const demoAddress = { label: 'Home', add_line_1: '1 Demo Bakery Lane', barangay: 'Poblacion',
    city: 'Liloan', postal_code: '6002', latitude: 10.4002, longitude: 123.9958 };
  const { record } = addresses.update({ action: 'save', data: demoAddress }, customer);
  const addressId = record.address_id;
  assert.equal(record.is_default, true);
  assert.throws(() => addresses.update({ action: 'archive', id: addressId }, stranger), { status: 404 });
  const date = '2027-01-14';
  const route = '1 Demo Bakery Lane, Poblacion, Liloan, 6002, Philippines';
  const quote = demoQuotation({ address: route, dates: [date] });
  const standard = { key: 'standard-delivery', addressId, date, feeCents: 8500, checkoutQuote: checkoutQuote(route, quote.quotations),
    items: [{ variantId: '1:standard', quantity: 1, unitPriceCents: 15000 }] };
  assert.throws(() => call('POST ordering/delivery', { ...standard, feeCents: 0 }), /quotation/);
  assert.throws(() => call('POST ordering/delivery', standard, stranger), { status: 404 });
  const { order } = call('POST ordering/delivery', standard);
  assert.equal(call('POST ordering/delivery', standard).order.id, order.id);
  assert.equal(order.total, 235);
  call('POST ordering/payment', { id: order.id, action: 'confirm' });
  addresses.update({ action: 'save', id: addressId, data: { ...demoAddress, label: 'Edited' } }, customer);
  db.close();
  db = new DatabaseSync(file);
  initialize();
  assert.equal(addresses.addresses(customer.customer_id)[0].label, 'Edited');
  assert.equal(addresses.addresses(stranger.customer_id).length, 0);
  addresses.update({ action: 'archive', id: addressId }, customer);
  const savedOrder = () => call('GET ordering/orders').orders.find(row => row.id === order.id);
  assert.equal(savedOrder().address.label, 'Home');
  assert.equal(savedOrder().fulfillment.method, 'delivery');
  assert.equal(savedOrder().paid, true);
  assert.equal(call('GET ordering/orders', {}, stranger).orders.length, 0);
  clock(date + 'T09:00');
  for (const action of ['preparing', 'ready']) call('POST ordering/fulfillment', { id: order.id, action }, owner);
  for (const command of [
    { action: 'book', key: 'standard-booking', outcome: 'success' },
    { action: 'track', expectedStatus: 'booked' },
    { action: 'track', expectedStatus: 'in_transit' }
  ]) call('POST ordering/courier', { id: order.id, ...command }, owner);
  assert.equal(savedOrder().status, 'completed');
  assert.equal(savedOrder().delivery.status, 'delivered');
  assert.equal(addresses.addresses(customer.customer_id).length, 0);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  console.log('PASS v4–v7 migrations, saved addresses, standard courier checkout, subscription checkout, restart and fulfillment');
} finally {
  Date.now = realNow;
  db.close();
  rmSync(dir, { recursive: true, force: true });
}
