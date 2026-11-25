const { randomUUID } = require('node:crypto');
const { addressRecord } = require('./address-server.cjs');
const { validCheckoutQuote } = require('./courier-quotation.cjs');
const advanceCourier = require('./courier-booking.cjs');

const dayMs = 86400000;
const minuteMs = 60000;
const manilaOffset = 8 * 60 * minuteMs;
const isoDate = value => new Date(value).toISOString().slice(0, 10);
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && isoDate(Date.parse(value)) === value;
const cents = value => Math.round(value * 100);
const milli = value => Math.round(value * 1000);

function earliestPickupDate(now) {
  const localNow = now + manilaOffset;
  return isoDate(localNow + (new Date(localNow).getUTCHours() < 12 ? 1 : 2) * dayMs);
}

module.exports = function orderingEndpoints(db, transaction, requireRole, signedInAccount, HttpError, notifications) {
  const fail = (message, status = 409) => { throw new HttpError(status, message); };
  const orderById = db.prepare(`SELECT * FROM "Order" WHERE order_id = ? AND customer_id = ? AND type = 'standard_purchase'`);
  const paymentFor = db.prepare(`SELECT p.*, h.expires_at AS hold_expires_at FROM Payment p
    JOIN CheckoutHold h USING (hold_id) WHERE p.order_id = ? ORDER BY p.rowid DESC LIMIT 1`);
  const itemsFor = db.prepare(`SELECT i.*, v.product_id, v.variant_key FROM OrderItem i
    JOIN ProductVariant v USING (variant_id) WHERE order_id = ? ORDER BY i.rowid`);
  const history = db.prepare('INSERT INTO OrderStatusHistory(order_id,status,changed_by_account_id,changed_at) VALUES (?,?,?,?)');
  const limits = db.prepare("SELECT * FROM CapacityConfig WHERE order_type = 'standard'");
  const blocked = db.prepare('SELECT date, reason FROM BlockedDate ORDER BY date');
  const pickupFor = db.prepare('SELECT * FROM PickupFulfillment WHERE order_id = ?');
  const courierFor = db.prepare('SELECT * FROM StandardCourierDelivery WHERE order_id = ?');
  const bookingFor = db.prepare('SELECT * FROM CourierBooking WHERE order_id = ? ORDER BY rowid DESC LIMIT 1');
  const savedAddress = db.prepare('SELECT * FROM SavedDeliveryAddress WHERE customer_id = ? AND address_id = ?');

  function operationalAccount(request) {
    const account = signedInAccount(request);
    if (!account) fail('sign-in-required', 401);
    if (account.role !== 'admin' && !(account.role === 'staff' && account.is_temp_pass_changed)) {
      fail('access-denied', 403);
    }
    return account;
  }

  function changeStatus(orderId, status, actor, now) {
    db.prepare('UPDATE "Order" SET status = ? WHERE order_id = ?').run(status, orderId);
    history.run(orderId, status, actor, now);
  }

  function settle(payment, action, actor, now) {
    const paid = action === 'paid';
    const expired = action === 'expired';
    const holdStatus = paid ? 'confirmed' : expired ? 'expired' : 'released';
    db.prepare('UPDATE Payment SET status = ?, paid_at = ? WHERE payment_id = ?')
      .run(action, paid ? now : null, payment.payment_id);
    db.prepare('UPDATE CheckoutHold SET status = ?, confirmed_at = ?, released_at = ? WHERE hold_id = ?')
      .run(holdStatus, paid ? now : null, paid ? null : now, payment.hold_id);
    for (const table of ['CapacityAllocation', 'InventoryReservation', 'SubscriptionCapacityAllocation']) {
      db.prepare(`UPDATE ${table} SET status = ? WHERE hold_id = ? AND status = 'held'`)
        .run(holdStatus, payment.hold_id);
    }
    changeStatus(payment.order_id, paid ? 'confirmed' : 'cancelled', actor, now);
    if (paid) notifications.paid(payment, now);
  }

  const due = db.prepare(`SELECT p.* FROM CheckoutHold h JOIN Payment p USING (hold_id)
    WHERE h.status = 'active' AND h.expires_at <= ?`);
  function expire(now) {
    for (const payment of due.all(now)) settle(payment, 'expired', null, now);
  }

  function view(order) {
    const payment = paymentFor.get(order.order_id);
    const pickup = pickupFor.get(order.order_id);
    const courier = courierFor.get(order.order_id);
    const booking = courier && bookingFor.get(order.order_id);
    return {
      id: order.order_id, customer_id: order.customer_id, persistedPickup: true, type: 'standard',
      items: itemsFor.all(order.order_id).map(item => ({
        key: item.variant_id, productId: item.product_id, name: item.name_snapshot,
        image: item.image_snapshot, variant: item.size_snapshot, price: item.unit_price_cents / 100,
        quantity: item.quantity, available: true
      })),
      fulfillment: { method: order.fulfillment_method, date: order.fulfillment_date },
      address: courier ? JSON.parse(courier.address_snapshot) : null,
      delivery: booking && { id: booking.booking_id, status: booking.status, outcome: booking.outcome,
        delivered_at: booking.status === 'delivered' ? booking.updated_at : null,
        lalamove_id: ['booked','in_transit','delivered'].includes(booking.status) ? 'DEMO-COURIER-' + booking.booking_id : null,
        history: db.prepare(`SELECT substr(status,9) AS status, changed_at AS at FROM OrderStatusHistory
          WHERE order_id = ? AND substr(status,1,8) = 'courier_' ORDER BY history_id DESC`).all(order.order_id) },
      fee: (courier?.fee_cents || 0) / 100, total: order.total_cents / 100, created: order.created_at, reference: order.ref_number,
      status: pickup?.status || courier?.status || order.status.replaceAll('_', '-'),
      pickupArrivedAt: pickup?.arrived_at ?? null, completedAt: pickup?.completed_at ?? courier?.completed_at ?? null,
      reservationStatus: pickup || courier?.status ? 'consumed' : payment.status === 'paid' ? 'confirmed' : payment.status === 'pending' ? 'held' : payment.status,
      payment: { pending: 'waiting', paid: 'confirmed' }[payment.status] || payment.status,
      paid: payment.status === 'paid', paidAt: payment.paid_at ? new Date(payment.paid_at).toLocaleString() : null,
      deadline: payment.expires_at, holdDeadline: payment.hold_expires_at, checkoutClosed: payment.status === 'expired',
      attempts: [{ state: { pending: 'waiting', paid: 'confirmed' }[payment.status] || payment.status,
        amount: payment.amount_cents / 100, at: new Date(payment.created_at).toLocaleString() }],
      activity: db.prepare('SELECT status, changed_at FROM OrderStatusHistory WHERE order_id = ? ORDER BY history_id DESC')
        .all(order.order_id).map(entry => ({ text: entry.status.replaceAll('_', ' '), at: new Date(entry.changed_at).toLocaleString() }))
    };
  }

  function create(input, customer, now, method = 'pickup') {
    if (!validDate(input.date) || typeof input.key !== 'string' || !/^[\w-]{1,100}$/.test(input.key) ||
        (input.replaceId !== undefined && typeof input.replaceId !== 'string') ||
        !Array.isArray(input.items) || !input.items.length || input.items.length > 24 ||
        !input.items.every(item => typeof item?.variantId === 'string' && item.variantId.length <= 125 &&
          Number.isSafeInteger(item.quantity) && item.quantity > 0 && Number.isSafeInteger(item.unitPriceCents) &&
          item.unitPriceCents > 0)) {
      fail('Enter a valid fulfillment date and cart.', 400);
    }
    const { addressId, feeCents, checkoutQuote } = input;
    if (method === 'delivery' && (typeof addressId !== 'string' || !Number.isSafeInteger(feeCents) || feeCents < 0)) {
      fail('Select a saved address and check the courier fee.', 400);
    }
    const lines = [...input.items].sort((a, b) => a.variantId.localeCompare(b.variantId));
    if (new Set(lines.map(line => line.variantId)).size !== lines.length) fail('Combine duplicate variants.', 400);
    const details = [input.date, lines.map(line => [line.variantId, line.quantity, line.unitPriceCents])];
    const signature = JSON.stringify(method === 'delivery' ? [...details, method, addressId, feeCents] : details);
    const existing = db.prepare('SELECT * FROM "Order" WHERE customer_id = ? AND request_key = ?')
      .get(customer.customer_id, input.key);
    if (existing) {
      if (existing.type !== 'standard_purchase' || existing.request_signature !== signature) fail('This checkout key already belongs to a different cart.');
      return view(existing);
    }
    let address;
    if (method === 'delivery') {
      const row = savedAddress.get(customer.customer_id, addressId);
      if (!row) fail('Select an address from your saved addresses.', 404);
      address = addressRecord(row);
      const route = [address.add_line_1,address.barangay,address.city,address.postal_code,'Philippines'].filter(Boolean).join(', ');
      if (!validCheckoutQuote(checkoutQuote, route, [input.date], [feeCents], now)) {
        fail('Refresh the courier quotation before paying.');
      }
    }
    if (input.replaceId) {
      const previous = orderById.get(input.replaceId, customer.customer_id);
      const payment = previous && paymentFor.get(previous.order_id);
      if (payment?.status === 'pending') {
        if (now >= payment.expires_at) fail('Check the existing payment before starting another checkout.');
        settle(payment, 'cancelled', customer.account_id, now);
      }
    }

    if (input.date < earliestPickupDate(now)) fail('The cutoff for this fulfillment date has passed.');
    if (db.prepare('SELECT 1 FROM BlockedDate WHERE date = ?').get(input.date)) fail('This fulfillment date is blocked.');

    const availableVariant = db.prepare(`SELECT v.variant_id, v.product_id, v.size, v.final_price, p.name, p.img_url
      FROM ProductVariant v JOIN Product p USING (product_id) JOIN Category c USING (category_id)
      WHERE v.variant_id = ? AND v.status = 'available' AND p.status = 'active' AND c.status = 'active'`);
    const recipe = db.prepare('SELECT inventory_id, quantity_required FROM ProductBOM WHERE variant_id = ?');
    const quantities = new Map();
    const requirements = new Map();
    const orderItems = [];
    const config = limits.get();
    let total = method === 'delivery' ? feeCents : 0;
    for (const line of lines) {
      const variant = availableVariant.get(line.variantId);
      if (!variant) fail('A product or variant is no longer available.');
      if (cents(variant.final_price) !== line.unitPriceCents) fail('A selling price changed. Review the updated price.');
      const quantity = (quantities.get(variant.product_id) || 0) + line.quantity;
      if (quantity > config.max_units) fail('This quantity exceeds daily product capacity.');
      quantities.set(variant.product_id, quantity);
      const materials = recipe.all(variant.variant_id);
      if (!materials.length) fail('A variant has no recipe available.');
      for (const material of materials) {
        const id = material.inventory_id;
        requirements.set(id, (requirements.get(id) || 0) + milli(material.quantity_required) * line.quantity);
      }
      total += line.unitPriceCents * line.quantity;
      orderItems.push({ ...variant, ...line });
    }
    if (!Number.isSafeInteger(total)) fail('The order total exceeds the supported amount.', 400);

    const capacity = db.prepare(`SELECT product_id, sum(quantity) AS quantity FROM CapacityAllocation
      WHERE fulfillment_date = ? AND status IN ('held','confirmed') GROUP BY product_id`).all(input.date);
    const used = new Map(capacity.map(row => [row.product_id, row.quantity]));
    for (const [id, quantity] of quantities) used.set(id, (used.get(id) || 0) + quantity);
    if (used.size > config.max_varieties_per_day || [...used.values()].some(quantity => quantity > config.max_units)) {
      fail('Production capacity is full for this fulfillment date.');
    }

    const stock = db.prepare(`SELECT i.stock_on_hand, i.archived_at,
      (SELECT coalesce(sum(r.quantity),0) FROM InventoryReservation r
       JOIN OrderMaterialRequirement m USING (requirement_id)
       WHERE m.inventory_id = i.inventory_id AND r.status IN ('held','confirmed')
         AND NOT EXISTS (SELECT 1 FROM InventoryMovement movement WHERE movement.reservation_id = r.reservation_id)) AS reserved
      FROM Inventory i WHERE i.inventory_id = ?`);
    for (const [id, quantity] of requirements) {
      const material = stock.get(id);
      if (!material || material.archived_at || quantity > milli(material.stock_on_hand) - milli(material.reserved)) {
        fail('There are not enough available ingredients for this order.');
      }
    }

    const orderId = 'K406-' + randomUUID();
    const holdId = randomUUID();
    db.prepare(`INSERT INTO "Order" VALUES (?,?,?,?,?,'standard_purchase',?,?,?,'pending_payment',?)`)
      .run(orderId, customer.customer_id, 'DEMO-' + orderId, input.key, signature, total, input.date, method, now);
    if (address) db.prepare('INSERT INTO StandardCourierDelivery(order_id,address_snapshot,fee_cents) VALUES (?,?,?)')
      .run(orderId, JSON.stringify(address), feeCents);
    history.run(orderId, 'pending_payment', customer.account_id, now);
    db.prepare("INSERT INTO CheckoutHold VALUES (?,?,'active',?,?,NULL,NULL)").run(holdId, orderId, now, now + 32 * minuteMs);
    db.prepare("INSERT INTO Payment VALUES (?,?,?,?,'pending',?,?,NULL)")
      .run(randomUUID(), orderId, holdId, total, now, now + 30 * minuteMs);
    const addItem = db.prepare(`INSERT INTO OrderItem(order_item_id,order_id,variant_id,name_snapshot,size_snapshot,
      image_snapshot,quantity,unit_price_cents) VALUES (?,?,?,?,?,?,?,?)`);
    for (const item of orderItems) {
      addItem.run(randomUUID(), orderId, item.variant_id, item.name, item.size, item.img_url, item.quantity, item.unitPriceCents);
    }
    const allocate = db.prepare(`INSERT INTO CapacityAllocation(order_type,product_id,source_order_id,hold_id,fulfillment_date,quantity,status)
      VALUES ('standard',?,?,?,?,?,'held')`);
    for (const [id, quantity] of quantities) allocate.run(id, orderId, holdId, input.date, quantity);
    const requireMaterial = db.prepare('INSERT INTO OrderMaterialRequirement VALUES (?,?,?,?,?,?)');
    const reserve = db.prepare("INSERT INTO InventoryReservation(requirement_id,hold_id,quantity,status) VALUES (?,?,?,'held')");
    for (const [id, quantity] of requirements) {
      const requirementId = randomUUID();
      requireMaterial.run(requirementId, orderId, id, quantity / 1000, input.date, now);
      reserve.run(requirementId, holdId, quantity / 1000);
    }
    return view(orderById.get(orderId, customer.customer_id));
  }

  const customerEndpoint = work => (input, request) => {
    const customer = requireRole(request, 'customer');
    return transaction(() => {
      const now = Date.now();
      expire(now);
      return work(input, customer, now);
    });
  };

  function consume(order, actor, now) {
    const reservations = db.prepare(`SELECT r.reservation_id, r.quantity, i.*
      FROM OrderMaterialRequirement m JOIN InventoryReservation r USING (requirement_id)
      JOIN Inventory i USING (inventory_id)
      WHERE m.order_id = ? AND r.status = 'confirmed'`).all(order.order_id);
    const requirementCount = db.prepare('SELECT count(*) AS count FROM OrderMaterialRequirement WHERE order_id = ?')
      .get(order.order_id).count;
    if (!requirementCount || reservations.length !== requirementCount) fail('Confirmed ingredient reservations are required.');
    const writeStock = db.prepare('UPDATE Inventory SET stock_on_hand = ?, status = ?, updated_at = ? WHERE inventory_id = ?');
    const movement = db.prepare(`INSERT INTO InventoryMovement
      VALUES (?,?,?,?,?,'consumption',?,?,NULL,'Preparation started',?,?)`);
    for (const item of reservations) {
      const remaining = (milli(item.stock_on_hand) - milli(item.quantity)) / 1000;
      if (item.archived_at || remaining < 0) fail('Physical stock is insufficient for a reserved ingredient.');
      const status = remaining === 0 ? 'unavailable' : remaining <= item.reorder_threshold ? 'low_stock' : 'available';
      const stamp = new Date(Math.max(now, Date.parse(item.updated_at) + 1)).toISOString();
      writeStock.run(remaining, status, stamp, item.inventory_id);
      movement.run(randomUUID(), item.inventory_id, order.order_id, item.reservation_id, actor,
        -item.quantity, item.cost_per_unit, 'pickup-consumption:' + item.reservation_id, stamp);
    }
  }

  function advanceFulfillment(input, actor, now) {
    if (typeof input.id !== 'string' || !['preparing','ready','arrival','completed'].includes(input.action)) {
      fail('Invalid fulfillment update.', 400);
    }
    const order = db.prepare(`SELECT * FROM "Order" WHERE order_id = ? AND type = 'standard_purchase'`).get(input.id);
    if (!order) fail('Order not found.', 404);
    if (order.status !== 'confirmed') fail('Confirm payment before updating fulfillment.');
    const courier = courierFor.get(order.order_id);
    if (courier) {
      if (courier.status === input.action) return view(order);
      if (input.action === 'preparing' && courier.status === null) {
        if (isoDate(now + manilaOffset) < order.fulfillment_date) fail('Preparation is scheduled for ' + order.fulfillment_date + ' (Manila).');
        consume(order, actor, now);
      } else if (input.action !== 'ready' || courier.status !== 'preparing') {
        fail('This delivery update is out of sequence.');
      }
      db.prepare('UPDATE StandardCourierDelivery SET status = ? WHERE order_id = ?').run(input.action, order.order_id);
      history.run(order.order_id, input.action, actor, now);
      notifications.orderProgress(order.order_id, input.action, now, { standardDelivery: order.order_id });
      return view(order);
    }
    const pickup = pickupFor.get(order.order_id);
    const current = pickup?.status || 'confirmed';
    if (current === input.action || input.action === 'arrival' && pickup?.arrived_at) return view(order);
    const today = isoDate(now + manilaOffset);
    if (input.action === 'preparing' && current === 'confirmed') {
      if (today < order.fulfillment_date) fail('Preparation is scheduled for ' + order.fulfillment_date + ' (Manila).');
      consume(order, actor, now);
      db.prepare("INSERT INTO PickupFulfillment(order_id,status) VALUES (?,'preparing')").run(order.order_id);
    } else if (input.action === 'ready' && current === 'preparing') {
      db.prepare("UPDATE PickupFulfillment SET status = 'ready' WHERE order_id = ?").run(order.order_id);
    } else if (input.action === 'arrival' && current === 'ready') {
      const cutoff = Date.parse(order.fulfillment_date + 'T19:00:00+08:00');
      if (today !== order.fulfillment_date || now > cutoff) fail('Record arrival on the scheduled date through 7:00 p.m. Manila time.');
      db.prepare('UPDATE PickupFulfillment SET arrived_at = ?, arrived_by_account_id = ? WHERE order_id = ?')
        .run(now, actor, order.order_id);
      return view(order);
    } else if (input.action === 'completed' && current === 'ready' && pickup.arrived_at) {
      db.prepare("UPDATE PickupFulfillment SET status = 'completed', completed_at = ? WHERE order_id = ?")
        .run(now, order.order_id);
    } else {
      fail('This pickup update is out of sequence. Refresh the order and try again.');
    }
    history.run(order.order_id, input.action, actor, now);
    notifications.orderProgress(order.order_id, input.action, now);
    return view(order);
  }

  return {
    ...require('./subscription-server.cjs')(db, { fail, history, customerEndpoint, operationalAccount, transaction, consume, expire, settle, notifications }),
    'GET ordering/calendar': (input, request) => {
      const now = Date.now();
      const config = limits.get();
      return {
        blocked: blocked.all().map(row => ({ date: row.date })),
        units: config.max_units, varieties: config.max_varieties_per_day,
        capacity: db.prepare(`SELECT a.fulfillment_date, a.product_id, a.quantity,
          CASE WHEN o.customer_id = ? THEN o.order_id END AS order_id,
          CASE WHEN a.status = 'held' THEN h.expires_at END AS expires_at
          FROM CapacityAllocation a JOIN CheckoutHold h USING (hold_id) JOIN "Order" o ON o.order_id = a.source_order_id
          WHERE a.fulfillment_date >= ? AND (a.status = 'confirmed' OR (a.status = 'held' AND h.expires_at > ?))`)
          .all(signedInAccount(request)?.customer_id ?? null, isoDate(now + manilaOffset), now)
      };
    },
    'GET ordering/owner-calendar': (input, request) => {
      requireRole(request, 'admin');
      return { blocked: blocked.all() };
    },
    'GET ordering/orders': customerEndpoint((input, customer) => ({
      orders: db.prepare(`SELECT * FROM "Order" WHERE customer_id = ? AND type = 'standard_purchase' ORDER BY created_at DESC`)
        .all(customer.customer_id).map(view)
    })),
    'GET ordering/operations': (input, request) => {
      const account = operationalAccount(request);
      return transaction(() => {
        expire(Date.now());
        const rows = db.prepare(`SELECT o.*, a.first_name || ' ' || a.last_name AS customer_name
          FROM "Order" o JOIN CustomerProfile c USING (customer_id) JOIN Account a USING (account_id)
          WHERE o.type = 'standard_purchase' AND (? = 'admin' OR o.status = 'confirmed') ORDER BY o.created_at DESC`).all(account.role);
        const materials = db.prepare('SELECT inventory_id, quantity_required FROM OrderMaterialRequirement WHERE order_id = ?');
        const orderHistory = db.prepare(`SELECT h.status, h.changed_at AS at, h.changed_by_account_id,
          coalesce(a.first_name || ' ' || a.last_name, 'System') AS actor
          FROM OrderStatusHistory h LEFT JOIN Account a ON a.account_id = h.changed_by_account_id
          WHERE h.order_id = ? ORDER BY h.history_id DESC`);
        return { orders: rows.map(row => ({
          ...view(row),
          contact: { name: row.customer_name },
          materialRequirements: Object.fromEntries(materials.all(row.order_id)
            .map(material => [material.inventory_id, material.quantity_required])),
          statusHistory: orderHistory.all(row.order_id)
            .map(entry => ({ ...entry, status: entry.status.replaceAll('_', '-') }))
        })) };
      });
    },
    'POST ordering/fulfillment': (input, request) => {
      const account = operationalAccount(request);
      return transaction(() => ({ order: advanceFulfillment(input, account.account_id, Date.now()) }));
    },
    'POST ordering/courier': (input, request) => {
      const account = operationalAccount(request);
      return transaction(() => {
        const id = typeof input.id === 'string' ? input.id : '';
        const courier = courierFor.get(id);
        if (!courier) fail('Delivery not found.',404);
        const now = Date.now();
        advanceCourier(db,fail,history,{input,account,now,id,booking:bookingFor.get(id),ready:courier.status==='ready',
          onProgress: (action, booking) => notifications.orderProgress(id, action, now, { standardDelivery: id, booking }),
          complete:()=>{
            db.prepare("UPDATE StandardCourierDelivery SET status = 'completed', completed_at = ? WHERE order_id = ?").run(now,id);
            history.run(id,'completed',account.account_id,now);
          }});
        return {};
      });
    },
    'POST ordering/pickup': customerEndpoint((input, customer, now) => ({ order: create(input, customer, now) })),
    'POST ordering/delivery': customerEndpoint((input, customer, now) => ({ order: create(input, customer, now, 'delivery') })),
    'POST ordering/payment': customerEndpoint((input, customer, now) => {
      if (!['confirm', 'cancel'].includes(input.action) || typeof input.id !== 'string') fail('Invalid payment action.', 400);
      const action = input.action === 'confirm' ? 'paid' : 'cancelled';
      const order = orderById.get(input.id, customer.customer_id);
      if (!order) fail('Order not found.', 404);
      const payment = paymentFor.get(order.order_id);
      if (payment.status === 'pending' && (action !== 'paid' || now < payment.expires_at)) {
        settle(payment, action, customer.account_id, now);
      }
      return { order: view(orderById.get(input.id, customer.customer_id)) };
    }),
    'POST ordering/capacity': (input, request) => {
      const admin = requireRole(request, 'admin');
      if (![input.units, input.varieties].every(value => Number.isSafeInteger(value) && value > 0)) {
        fail('Enter valid standard capacity limits.', 400);
      }
      const subscription = input.subscription;
      if (subscription !== undefined && (!Number.isSafeInteger(subscription?.units) || subscription.units < 1 ||
          !Number.isFinite(subscription.value) || subscription.value < 0 || !['hours','days'].includes(subscription.unit) ||
          typeof subscription.cutoff !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(subscription.cutoff))) {
        fail('Enter valid subscription capacity and cutoff settings.', 400);
      }
      return transaction(() => {
        db.prepare(`UPDATE CapacityConfig SET max_units = ?, max_varieties_per_day = ?,
          created_by_admin_id = (SELECT admin_id FROM AdminProfile WHERE account_id = ?) WHERE order_type = 'standard'`)
          .run(input.units, input.varieties, admin.account_id);
        if (subscription) db.prepare(`UPDATE SubscriptionCapacityConfig
          SET weekly_units = ?, lead_value = ?, lead_unit = ?, cutoff_time = ? WHERE id = 1`)
          .run(subscription.units,subscription.value,subscription.unit,subscription.cutoff);
        return { units: input.units, varieties: input.varieties };
      });
    },
    'POST ordering/blocked-date': (input, request) => {
      const admin = requireRole(request, 'admin');
      if (!validDate(input.date) || typeof input.remove !== 'boolean' ||
          typeof input.reason !== 'string' || input.reason.length > 500) fail('Enter a valid blocked date.', 400);
      return transaction(() => {
        if (input.remove) db.prepare('DELETE FROM BlockedDate WHERE date = ?').run(input.date);
        else db.prepare(`INSERT INTO BlockedDate VALUES (?,?,(SELECT admin_id FROM AdminProfile WHERE account_id = ?),?)
          ON CONFLICT(date) DO UPDATE SET reason = excluded.reason, created_by_admin_id = excluded.created_by_admin_id,
          created_at = excluded.created_at`).run(input.date, input.reason, admin.account_id, Date.now());
        return { blocked: blocked.all() };
      });
    }
  };
};

module.exports.earliestPickupDate = earliestPickupDate;
