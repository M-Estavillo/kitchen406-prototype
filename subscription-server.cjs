const advanceCourier = require('./courier-booking.cjs');
const { randomUUID } = require('node:crypto');
const { validCheckoutQuote } = require('./courier-quotation.cjs');

const day = 86400000;
const minute = 60000;
const dateAt = time => new Date(time).toISOString().slice(0, 10);
const add = (date, days) => dateAt(Date.parse(date) + days * day);
const weekday = date => new Date(date).getUTCDay();
const week = date => add(date, -((weekday(date) + 6) % 7));
const todayAt = now => dateAt(now + 8 * 60 * minute);
const stamp = time => time ? new Date(time).toLocaleString() : null;
const cents = amount => Math.round(Number(amount) * 100);

module.exports = function subscriptions(db, { fail, history, customerEndpoint, operationalAccount, transaction, consume, expire, settle, notifications }) {
  const purchaseQuery = `SELECT o.*, c.*, i.*, v.product_id, v.variant_key,
    p.payment_id, p.status AS payment_status, p.paid_at, p.expires_at, p.hold_id, h.expires_at AS hold_deadline,
    e.subscription_id, e.status AS subscription_status
    FROM SubscriptionCheckout c JOIN "Order" o ON o.order_id = c.purchase_order_id
    JOIN OrderItem i USING (order_id)
    JOIN ProductVariant v USING (variant_id) JOIN Payment p USING (order_id)
    JOIN CheckoutHold h USING (hold_id) LEFT JOIN Subscription e USING (purchase_order_id)`;
  const purchases = db.prepare(purchaseQuery + ' WHERE (? IS NULL OR o.customer_id = ?) ORDER BY o.created_at DESC');
  const owned = db.prepare(purchaseQuery + ' WHERE o.order_id = ? AND o.customer_id = ?');
  const cycles = db.prepare(`SELECT d.*, o.total_cents, a.arrived_at
    FROM SubscriptionDelivery d JOIN "Order" o ON o.order_id = d.fulfillment_order_id
    LEFT JOIN PickupFulfillment a ON a.order_id = o.order_id WHERE d.subscription_id = ? ORDER BY d.cycle_number`);
  const order = db.prepare(`SELECT d.*, s.purchase_order_id,s.customer_id,c.method
    FROM SubscriptionDelivery d JOIN Subscription s USING (subscription_id)
    JOIN SubscriptionCheckout c USING (purchase_order_id) WHERE d.fulfillment_order_id = ?`);
  const bookingFor = db.prepare('SELECT * FROM CourierBooking WHERE order_id = ? ORDER BY rowid DESC LIMIT 1');
  const allocation = db.prepare(`INSERT INTO SubscriptionCapacityAllocation
    (purchase_order_id,hold_id,cycle_number,scheduled_date,status) VALUES (?,?,?,?,?)`);
  const settings = db.prepare('SELECT 1 FROM BlockedDate WHERE date = ?');
  const config = db.prepare('SELECT * FROM SubscriptionCapacityConfig WHERE id = 1');
  const quantityInWeek = db.prepare(`SELECT coalesce(sum(i.quantity),0) AS used FROM SubscriptionCapacityAllocation a
    JOIN OrderItem i ON i.order_id = a.purchase_order_id
    JOIN ProductVariant v USING (variant_id)
    WHERE v.product_id = ? AND a.scheduled_date BETWEEN ? AND ? AND a.allocation_id <> ?
      AND a.status IN ('held','confirmed')`);
  const materials = db.prepare(`SELECT inventory_id,quantity_required FROM ProductBOM WHERE variant_id = ?`);
  const requirements = db.prepare('SELECT * FROM OrderMaterialRequirement WHERE order_id = ?');
  const inventory = db.prepare(`SELECT i.*, coalesce((SELECT sum(r.quantity) FROM InventoryReservation r
    JOIN OrderMaterialRequirement m USING (requirement_id) WHERE m.inventory_id = i.inventory_id
    AND r.status IN ('held','confirmed') AND NOT EXISTS
      (SELECT 1 FROM InventoryMovement x WHERE x.reservation_id = r.reservation_id)),0) AS reserved
    FROM Inventory i WHERE inventory_id = ?`);
  const showPayment = status => ({pending:'waiting',paid:'confirmed'})[status] || status;
  const orderStatus = status => ({scheduled:'confirmed',fulfilled:'completed'})[status] || status;
  const prep = (date, schedule) => add(date, -((weekday(date) - schedule.preparation_day + 7) % 7));

  function capacity(product, date, quantity, skip = -1) {
    if (settings.get(date)) fail('This fulfillment date is blocked.');
    const start = week(date);
    if (quantityInWeek.get(product, start, add(start, 6), skip).used + quantity > config.get().weekly_units) {
      fail('Subscription capacity reached for ' + date + '.');
    }
  }

  function canReserve(rows) {
    for (const row of rows) {
      const stock = inventory.get(row.inventory_id);
      if (!stock || stock.archived_at || Math.round((stock.stock_on_hand - stock.reserved) * 1000) < Math.round(row.quantity_required * 1000)) {
        return false;
      }
    }
    return true;
  }

  function reserve(rows, hold, status) {
    if (!canReserve(rows)) fail('There are not enough available ingredients for this fulfillment.');
    const insert = db.prepare('INSERT INTO InventoryReservation(requirement_id,hold_id,quantity,status) VALUES (?,?,?,?)');
    for (const row of rows) {
      insert.run(row.requirement_id, hold, row.quantity_required, status);
    }
  }

  const unreserved = db.prepare(`SELECT m.* FROM OrderMaterialRequirement m WHERE order_id = ?
    AND NOT EXISTS (SELECT 1 FROM InventoryReservation r WHERE r.requirement_id = m.requirement_id AND r.status = 'confirmed')`);
  const dueOrders = db.prepare(`SELECT d.fulfillment_order_id, p.hold_id FROM SubscriptionDelivery d
    JOIN Subscription s USING (subscription_id) JOIN Payment p ON p.order_id = s.purchase_order_id
    JOIN OrderMaterialRequirement m ON m.order_id = d.fulfillment_order_id
    WHERE d.status = 'scheduled' AND m.reserve_at <= ?
    GROUP BY d.fulfillment_order_id ORDER BY min(m.reserve_at), d.created_at, d.fulfillment_order_id`);

  function maintain(now) {
    for (const row of dueOrders.all(now)) {
      const pending = unreserved.all(row.fulfillment_order_id);
      if (pending.length && canReserve(pending)) reserve(pending,row.hold_id,'confirmed');
    }
    const missed = db.prepare(`SELECT d.* FROM SubscriptionDelivery d JOIN PickupFulfillment p
      ON p.order_id = d.fulfillment_order_id WHERE d.status = 'ready' AND p.arrived_at IS NULL
      AND d.scheduled_date <= ?`).all(todayAt(now));
    for (const d of missed) {
      if (now <= Date.parse(d.scheduled_date + 'T19:00:00+08:00')) continue;
      db.prepare("UPDATE SubscriptionDelivery SET status = 'cancelled', updated_at = ? WHERE fulfillment_order_id = ?").run(now,d.fulfillment_order_id);
      db.prepare("UPDATE \"Order\" SET status = 'cancelled' WHERE order_id = ?").run(d.fulfillment_order_id);
      db.prepare("UPDATE SubscriptionCapacityAllocation SET status = 'released' WHERE allocation_id = ?").run(d.allocation_id);
      history.run(d.fulfillment_order_id,'cancelled',null,now);
      notifications.orderProgress(d.fulfillment_order_id, 'cancelled', now, { cycle: d.subscription_delivery_id });
    }
  }

  function create(input, customer, now) {
    const { key, variantId, quantity, unitPriceCents, start, method, replaceId, scheduleId, preparationDay, fulfillmentDay } = input;
    const fees = method === 'pickup' ? [0,0,0,0] : input.fees;
    const address = method === 'delivery' ? input.address : null;
    if (typeof key !== 'string' || !/^[\w-]{1,100}$/.test(key) || typeof variantId !== 'string' ||
        !Number.isSafeInteger(quantity) || quantity < 1 ||
        !Number.isSafeInteger(unitPriceCents) || unitPriceCents < 1 ||
        typeof start !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
        !Number.isFinite(Date.parse(start)) || add(start, 0) !== start || typeof scheduleId !== 'string' ||
        ![preparationDay,fulfillmentDay].every(value => Number.isInteger(value) && value >= 0 && value <= 6) ||
        !['pickup','delivery'].includes(method) || !Array.isArray(fees) || fees.length !== 4 ||
        !fees.every(fee => Number.isSafeInteger(fee) && fee >= 0 && fee <= 1000000) ||
        method === 'delivery' && (!address || Array.isArray(address) || typeof address !== 'object' ||
          !['label','add_line_1','city','postal_code'].every(field => typeof address[field] === 'string' && address[field].trim()) ||
          JSON.stringify(address).length > 4000)) fail('Enter valid subscription checkout details.', 400);
    const signature = JSON.stringify([variantId,quantity,unitPriceCents,start,method,fees,address,scheduleId,preparationDay,fulfillmentDay]);
    const previous = db.prepare('SELECT order_id,request_signature,type FROM "Order" WHERE customer_id = ? AND request_key = ?')
      .get(customer.customer_id,key);
    if (previous) {
      if (previous.type !== 'subscription_purchase' || previous.request_signature !== signature) fail('This checkout key belongs to a different order.');
      return previous.order_id;
    }
    if (typeof replaceId === 'string') {
      const previous = owned.get(replaceId, customer.customer_id);
      if (previous?.payment_status === 'pending') {
        if (now >= previous.expires_at) fail('Check the existing payment before starting a new checkout.');
        settle(previous,'cancelled',customer.account_id,now);
      }
    }
    const variant = db.prepare(`SELECT v.*,p.name,p.img_url FROM ProductVariant v JOIN Product p USING (product_id)
      JOIN Category c USING (category_id)
      WHERE v.variant_id = ? AND p.subscription_eligible = 1 AND p.status = 'active' AND c.status = 'active'
        AND v.status = 'available'`).get(variantId);
    if (!variant) fail('The subscription variant is no longer available.');
    if (cents(variant.final_price) !== unitPriceCents) fail('The selling price changed. Review the updated price.');
    const schedules = db.prepare('SELECT * FROM SubscriptionSchedule WHERE product_id = ?').all(variant.product_id);
    const schedule = schedules.find(row => row.schedule_id === scheduleId && row.status === 'active') ||
      (!schedules.length && scheduleId === 'friday-' + variant.product_id ?
        {schedule_id:null,fulfillment_day:5,preparation_day:4} : null);
    if (!schedule || weekday(start) !== schedule.fulfillment_day ||
        schedule.preparation_day !== preparationDay || schedule.fulfillment_day !== fulfillmentDay) {
      fail('This subscription schedule has changed.');
    }
    if (preparationDay === fulfillmentDay) fail('This subscription schedule is unavailable. Choose a different offering.');
    const cutoff = Math.min(Date.parse(add(prep(start,schedule),-1) + 'T12:00:00+08:00'), configuredCutoff(start));
    if (now >= cutoff) fail('Enrollment for this cycle has closed.');
    const dates = Array.from({length:4}, (_, index) => add(start, index * 7));
    if (address) {
      const route = [address.add_line_1,address.barangay,address.city,address.postal_code,'Philippines'].filter(Boolean).join(', ');
      if (!validCheckoutQuote(input.checkoutQuote,route,dates,fees,now)) fail('Refresh the courier quotation before paying.');
    }
    for (const date of dates) capacity(variant.product_id, date, quantity);
    const recipe = materials.all(variantId);
    if (!recipe.length) fail('This variant has no recipe available.');
    const total = unitPriceCents * quantity * 4 + fees.reduce((sum, fee) => sum + fee, 0);
    if (!Number.isSafeInteger(total)) fail('The subscription total exceeds the supported amount.',400);

    const id = 'SUB-PAY-' + randomUUID(), hold = randomUUID();
    db.prepare(`INSERT INTO "Order" VALUES (?,?,?,?,?,'subscription_purchase',?,NULL,NULL,'pending_payment',?)`)
      .run(id,customer.customer_id,id,key,signature,total,now);
    history.run(id,'pending_payment',customer.account_id,now);
    db.prepare('INSERT INTO SubscriptionCheckout VALUES (?,?,?,?,?,?,?,?)')
      .run(id,schedule.schedule_id,schedule.fulfillment_day,schedule.preparation_day,start,method,
        address ? JSON.stringify(address) : null,JSON.stringify(fees));
    db.prepare('INSERT INTO OrderItem VALUES (?,?,?,?,?,?,?,?,?)')
      .run(randomUUID(),id,variantId,variant.name,variant.size,variant.img_url,quantity * 4,unitPriceCents,unitPriceCents * quantity * 4);
    db.prepare("INSERT INTO CheckoutHold VALUES (?,?,'active',?,?,NULL,NULL)").run(hold,id,now,now + 32 * minute);
    db.prepare("INSERT INTO Payment VALUES (?,?,?,?,'pending',?,?,NULL)").run(randomUUID(),id,hold,total,now,now + 30 * minute);
    for (const [index,date] of dates.entries()) allocation.run(id,hold,index + 1,date,'held');
    const insert = db.prepare('INSERT INTO OrderMaterialRequirement VALUES (?,?,?,?,?,?)');
    for (const row of recipe) insert.run(randomUUID(),id,row.inventory_id,Math.round(row.quantity_required * 1000) * quantity / 1000,start,now);
    reserve(requirements.all(id),hold,'held');
    return id;
  }

  function configuredCutoff(date) {
    const rule = config.get();
    return Date.parse(date + 'T' + rule.cutoff_time + ':00+08:00') -
      rule.lead_value * (rule.lead_unit === 'hours' ? 60 * minute : day);
  }

  function activate(row, now, actor) {
    const id = 'SUB-' + randomUUID();
    const purchase = row.purchase_order_id, fees = JSON.parse(row.fee_snapshot), recipe = requirements.all(purchase);
    const addOrder = db.prepare(`INSERT INTO "Order" VALUES (?,?,?,?,?,'subscription_fulfillment',?,?,?,'confirmed',?)`);
    const addItem = db.prepare('INSERT INTO OrderItem VALUES (?,?,?,?,?,?,?,?,?)');
    const addCycle = db.prepare(`INSERT INTO SubscriptionDelivery VALUES (?,?,?,?,?,?,?,?,'scheduled',NULL,?,?)`);
    const productAmount = row.unit_price_cents * row.quantity / 4;
    db.prepare("INSERT INTO Subscription VALUES (?,?,?,?,?,?,'active',?,?)")
      .run(id,row.customer_id,row.variant_id,purchase,productAmount * 4,row.total_cents - productAmount * 4,now,now);
    const held = db.prepare(`SELECT * FROM SubscriptionCapacityAllocation
      WHERE purchase_order_id = ? AND status = 'held' ORDER BY cycle_number`).all(purchase);
    if (held.length !== 4) fail('The four fulfillment dates could not be verified.');
    for (const cycle of held) {
      const number = cycle.cycle_number, date = cycle.scheduled_date, orderId = 'K406-' + randomUUID();
      const preparation = prep(date,row);
      addOrder.run(orderId,row.customer_id,orderId,orderId,purchase,productAmount + fees[number - 1],date,row.method,now);
      addItem.run(randomUUID(),orderId,row.variant_id,row.name_snapshot,row.size_snapshot,row.image_snapshot,
        row.quantity / 4,row.unit_price_cents,productAmount);
      addCycle.run(id + '-D' + number,id,orderId,cycle.allocation_id,number,date,date,preparation,now,now);
      history.run(orderId,'confirmed',actor,now);
      if (number === 1) db.prepare('UPDATE OrderMaterialRequirement SET order_id = ? WHERE order_id = ?').run(orderId,purchase);
      else for (const material of recipe) {
        db.prepare('INSERT INTO OrderMaterialRequirement VALUES (?,?,?,?,?,?)').run(randomUUID(),orderId,material.inventory_id,
          material.quantity_required,date,Date.parse(add(preparation,-1) + 'T00:00:00+08:00'));
      }
    }
    db.prepare("UPDATE SubscriptionCapacityAllocation SET status = 'confirmed' WHERE purchase_order_id = ? AND status = 'held'").run(purchase);
    db.prepare("UPDATE InventoryReservation SET status = 'confirmed' WHERE hold_id = ? AND status = 'held'").run(row.hold_id);
    db.prepare("UPDATE CheckoutHold SET status = 'confirmed', confirmed_at = ? WHERE hold_id = ?").run(now,row.hold_id);
    db.prepare("UPDATE Payment SET status = 'paid', paid_at = ? WHERE order_id = ?").run(now,purchase);
    db.prepare("UPDATE \"Order\" SET status = 'confirmed' WHERE order_id = ?").run(purchase);
    history.run(purchase,'confirmed',actor,now);
    notifications.paid(db.prepare('SELECT payment_id, order_id FROM Payment WHERE order_id = ? AND status = ?')
      .get(purchase, 'paid'), now);
    notifications.activated(id, now);
  }

  function snapshot(row) {
    const fees = JSON.parse(row.fee_snapshot).map(fee => fee / 100);
    const products = row.unit_price_cents * row.quantity / 100, total = row.total_cents / 100;
    const scheduleId = row.schedule_id || 'friday-' + row.product_id;
    const weekdayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][row.fulfillment_day];
    return {productId:row.product_id,variantId:row.variant_key,name:row.name_snapshot,image:row.image_snapshot,
      variant:row.size_snapshot,quantity:row.quantity / 4,unit:row.unit_price_cents / 100,
      scheduleId,schedule:'Weekly ' + weekdayName,scheduleSnapshot:{id:scheduleId,day:row.fulfillment_day,
        fulfillment_day:row.fulfillment_day,preparation_day:row.preparation_day},
      dates:Array.from({length:4}, (_,index) => add(row.start_date,index * 7)),method:row.method,
      address:JSON.parse(row.address_snapshot),fees,fee:fees[0],products,delivery:fees.reduce((sum,fee)=>sum+fee,0),total};
  }

  function read(customerId, role = 'customer') {
    const rule = config.get();
    const result = {purchases:[],records:[],orders:[],requests:[],allocations:[],
      settings:{units:rule.weekly_units,value:rule.lead_value,unit:rule.lead_unit,cutoff:rule.cutoff_time},
      blocked:db.prepare('SELECT date FROM BlockedDate').all().map(row => row.date)};
    if (customerId !== null) {
      const shared = db.prepare(`SELECT a.scheduled_date, v.product_id,
        sum(i.quantity / 4) AS quantity, a.status, h.expires_at
        FROM SubscriptionCapacityAllocation a JOIN "Order" o ON o.order_id = a.purchase_order_id
        JOIN OrderItem i USING (order_id) JOIN ProductVariant v USING (variant_id) JOIN CheckoutHold h USING (hold_id)
        WHERE o.customer_id <> ? AND a.scheduled_date >= ? AND a.status IN ('held','confirmed')
        GROUP BY a.scheduled_date,v.product_id,a.status,CASE WHEN a.status = 'held' THEN h.expires_at END`);
      result.allocations.push(...shared.all(customerId,todayAt(Date.now())).map((a,index) => ({
        id:'SUB-ALLOC-shared-' + index,owner:'shared-subscription-capacity',productId:a.product_id,date:a.scheduled_date,quantity:a.quantity,
        confirmed:a.status === 'confirmed',deadline:a.expires_at
      })));
    }
    for (const row of purchases.all(customerId,customerId)) {
      const snap = snapshot(row), id = row.purchase_order_id, payment = showPayment(row.payment_status);
      if (role !== 'staff') result.purchases.push({id,customer_id:row.customer_id,snapshot:snap,created:row.created_at,
        paid:row.payment_status === 'paid',paidAt:stamp(row.paid_at),payment,subscriptionId:row.subscription_id,
        persistedSubscription:true,deadline:row.expires_at,holdDeadline:row.hold_deadline,
        attempts:[{state:payment,amount:snap.total,at:stamp(row.created_at)}]});
      if (!row.subscription_id) {
        if (row.payment_status === 'pending') {
          for (const a of db.prepare("SELECT * FROM SubscriptionCapacityAllocation WHERE purchase_order_id = ? AND status = 'held'").all(id)) {
            result.allocations.push({id:'SUB-ALLOC-'+a.allocation_id,owner:id,productId:row.product_id,cycle:a.cycle_number,
              date:a.scheduled_date,confirmed:false,deadline:row.hold_deadline});
          }
        }
        continue;
      }
      const record = {id:row.subscription_id,purchaseId:id,customer_id:row.customer_id,snapshot:snap,
        persistedSubscription:true,status:row.subscription_status,created:row.created_at,deferments:[],deliveries:[]};
      const deferred = db.prepare('SELECT * FROM SubscriptionDeferment WHERE subscription_id = ?').get(record.id);
      if (deferred) {
        const option = deferred.deferment_option === 'next_day' ? 'day' : 'week';
        record.deferments.push({deliveryId:deferred.subscription_delivery_id,originalDate:deferred.original_scheduled_date,
          newDate:deferred.new_scheduled_date,option,at:stamp(deferred.created_at)});
        result.requests.push({id:record.id,subscriptionId:record.id,deliveryId:deferred.subscription_delivery_id,
          originalDate:deferred.original_scheduled_date,target:deferred.new_scheduled_date,option,status:'applied',created:deferred.created_at});
      }
      for (const d of cycles.all(record.id)) {
        const allocationId = 'SUB-ALLOC-' + d.allocation_id;
        record.deliveries.push({id:d.subscription_delivery_id,cycle:d.cycle_number,orderId:d.fulfillment_order_id,
          date:d.scheduled_date,originalDate:d.original_scheduled_date,preparationDate:d.preparation_date,
          status:d.status,fulfilled_at:d.fulfilled_at,capacityAllocationId:allocationId});
        const orderId = d.fulfillment_order_id;
        const booking = bookingFor.get(orderId);
        const status = booking?.status === 'in_transit' ? 'in-transit' : orderStatus(d.status);
        const statusHistory = db.prepare(`SELECT h.status,h.changed_at AS at,h.changed_by_account_id,
          coalesce(a.first_name || ' ' || a.last_name,'System') AS actor FROM OrderStatusHistory h
          LEFT JOIN Account a ON a.account_id = h.changed_by_account_id WHERE order_id = ? ORDER BY history_id DESC`).all(orderId);
        const delivery = booking && {id:booking.booking_id,status:booking.status,outcome:booking.outcome,
          lalamove_id:['booked','in_transit','delivered'].includes(booking.status)?'DEMO-' + booking.booking_id:null,
          created_at:booking.created_at,delivered_at:d.fulfilled_at,fee:snap.fees[d.cycle_number - 1],address:snap.address,
          history:statusHistory.filter(entry => entry.status.startsWith('courier_'))
            .map(entry => ({...entry,status:entry.status.slice('courier_'.length)}))};
        const contact = db.prepare(`SELECT a.first_name || ' ' || a.last_name AS name FROM CustomerProfile c
          JOIN Account a USING (account_id) WHERE customer_id = ?`).get(row.customer_id);
        result.orders.push({id:orderId,type:'subscription',persistedSubscription:true,prepaid:true,paid:true,
          payment:'confirmed',paidAt:stamp(row.paid_at),attempts:[],subscriptionId:record.id,deliveryId:d.subscription_delivery_id,
          reference:id,status,created:row.created_at,customer_id:row.customer_id,contact,
          items:[{key:row.variant_id,productId:snap.productId,name:snap.name,image:snap.image,variant:snap.variant,
            quantity:snap.quantity,price:snap.unit,productAmount:snap.products / 4}],
          fulfillment:{method:snap.method,date:d.scheduled_date,preparationDate:d.preparation_date},
          address:snap.address,delivery,fee:snap.fees[d.cycle_number - 1],total:d.total_cents / 100,
          completedAt:d.fulfilled_at,pickupArrivedAt:d.arrived_at,statusHistory,
          materialRequirements:Object.fromEntries(requirements.all(orderId).map(r => [r.inventory_id,r.quantity_required])),
          activity:statusHistory.map(entry => ({text:entry.status.replaceAll('_',' '),at:stamp(entry.at)}))});
        if (d.status !== 'cancelled') result.allocations.push({id:allocationId,owner:id,productId:row.product_id,cycle:d.cycle_number,
          date:d.scheduled_date,confirmed:true});
      }
      record.completedCount = record.deliveries.filter(d => d.status === 'fulfilled').length;
      record.remainingCount = 4 - record.completedCount;
      result.records.push(record);
    }
    return result;
  }

  function defer(input, customer, now) {
    const d = order.get(typeof input.id === 'string' ? input.id : '');
    if (!d || d.customer_id !== customer.customer_id) fail('Fulfillment not found.',404);
    if (!['day','week'].includes(input.option)) fail('Choose a replacement date.',400);
    const previous = db.prepare('SELECT * FROM SubscriptionDeferment WHERE subscription_id = ?').get(d.subscription_id);
    const option = input.option === 'day' ? 'next_day' : 'next_week';
    if (previous?.subscription_delivery_id === d.subscription_delivery_id && previous.deferment_option === option &&
        previous.original_scheduled_date === input.originalDate) return;
    if (previous) fail('Your one deferment has already been used.');
    if (d.status !== 'scheduled' || todayAt(now) >= d.preparation_date || d.scheduled_date !== input.originalDate) {
      fail('This fulfillment can no longer be deferred.');
    }
    const row = owned.get(d.purchase_order_id, customer.customer_id);
    const last = cycles.all(d.subscription_id).map(cycle => cycle.scheduled_date).sort().at(-1);
    const date = input.option === 'day' ? add(d.scheduled_date,1) : add(last,7);
    if (now >= configuredCutoff(date)) fail('The cutoff for this replacement date has passed.');
    capacity(row.product_id,date,row.quantity / 4,d.allocation_id);
    const preparation = prep(date,row);
    db.prepare("UPDATE SubscriptionCapacityAllocation SET status = 'released' WHERE allocation_id = ?").run(d.allocation_id);
    const replacement = allocation.run(d.purchase_order_id,row.hold_id,d.cycle_number,date,'confirmed').lastInsertRowid;
    db.prepare('INSERT INTO SubscriptionDeferment VALUES (?,?,?,?,?,?,?,?)')
      .run(d.subscription_id,d.subscription_delivery_id,d.allocation_id,replacement,d.scheduled_date,date,option,now);
    db.prepare(`UPDATE SubscriptionDelivery SET allocation_id = ?, scheduled_date = ?, preparation_date = ?, updated_at = ?
      WHERE subscription_delivery_id = ?`).run(replacement,date,preparation,now,d.subscription_delivery_id);
    db.prepare('UPDATE "Order" SET fulfillment_date = ? WHERE order_id = ?').run(date,d.fulfillment_order_id);
    db.prepare('UPDATE OrderMaterialRequirement SET fulfillment_date = ? WHERE order_id = ?').run(date,d.fulfillment_order_id);
    if (d.cycle_number > 1) db.prepare('UPDATE OrderMaterialRequirement SET reserve_at = ? WHERE order_id = ?')
      .run(Date.parse(add(preparation,-1) + 'T00:00:00+08:00'),d.fulfillment_order_id);
    history.run(d.fulfillment_order_id,'deferred',customer.account_id,now);
    notifications.deferred(d.subscription_id, date, now);
  }

  function fulfill(input, account, now) {
    const d = order.get(typeof input.id === 'string' ? input.id : '');
    if (!d) fail('Fulfillment not found.',404);
    const id = d.fulfillment_order_id, action = input.action, today = todayAt(now);
    const pickup = db.prepare('SELECT * FROM PickupFulfillment WHERE order_id = ?').get(id);
    const next = action === 'completed' ? 'fulfilled' : action;
    if (d.status === next || action === 'arrival' && pickup?.arrived_at) return;
    if (action === 'preparing' && d.status === 'scheduled') {
      if (today < d.preparation_date) fail('Preparation is scheduled for ' + d.preparation_date + ' (Manila).');
      const purchase = owned.get(d.purchase_order_id,d.customer_id);
      reserve(unreserved.all(id),purchase.hold_id,'confirmed');
      consume({order_id:id},account.account_id,now);
      if (d.method === 'pickup') db.prepare("INSERT INTO PickupFulfillment(order_id,status) VALUES (?,'preparing')").run(id);
    } else if (action === 'ready' && d.status === 'preparing') {
      if (pickup) db.prepare("UPDATE PickupFulfillment SET status = 'ready' WHERE order_id = ?").run(id);
    } else if (action === 'arrival' && d.status === 'ready' && pickup) {
      if (today !== d.scheduled_date || now > Date.parse(d.scheduled_date + 'T19:00:00+08:00')) {
        fail('Record arrival on the scheduled date through 7:00 p.m. Manila time.');
      }
      db.prepare('UPDATE PickupFulfillment SET arrived_at = ?, arrived_by_account_id = ? WHERE order_id = ?')
        .run(now,account.account_id,id);
      return;
    } else if (action === 'completed' && d.status === 'ready' &&
        (pickup?.arrived_at || d.method === 'delivery' && bookingFor.get(id)?.status === 'delivered')) {
      if (pickup) db.prepare("UPDATE PickupFulfillment SET status = 'completed', completed_at = ? WHERE order_id = ?").run(now,id);
    } else fail('This fulfillment update is out of sequence.');
    db.prepare('UPDATE SubscriptionDelivery SET status = ?, fulfilled_at = ?, updated_at = ? WHERE fulfillment_order_id = ?')
      .run(next,next === 'fulfilled' ? now : null,now,id);
    db.prepare(`UPDATE Subscription SET status = CASE WHEN NOT EXISTS
      (SELECT 1 FROM SubscriptionDelivery WHERE subscription_id = ? AND status <> 'fulfilled') THEN 'completed'
      ELSE 'active' END, updated_at = ? WHERE subscription_id = ?`).run(d.subscription_id,now,d.subscription_id);
    history.run(id,action,account.account_id,now);
    if (d.method === 'pickup' || next !== 'fulfilled') {
      notifications.orderProgress(id, next, now, { cycle: d.subscription_delivery_id });
    }
    if (next === 'fulfilled' && db.prepare('SELECT status FROM Subscription WHERE subscription_id = ?')
      .get(d.subscription_id).status === 'completed') notifications.subscriptionStatus(d.subscription_id, 'completed', now);
  }

  function courier(input, account, now) {
    const d = order.get(typeof input.id === 'string' ? input.id : '');
    if (!d || d.method !== 'delivery') fail('Delivery not found.',404);
    const id = d.fulfillment_order_id, booking = bookingFor.get(id);
    advanceCourier(db,fail,history,{input,account,now,id,booking,ready:d.status==='ready',
      onProgress: (action, bookingId) => notifications.orderProgress(id, action, now, { cycle: d.subscription_delivery_id, booking: bookingId }),
      complete:()=>fulfill({id,action:'completed'},account,now)});
  }

  const customer = work => customerEndpoint((input, account, now) => {
    maintain(now);
    const extra = work(input,account,now);
    return {...read(account.customer_id),...extra};
  });
  const operational = work => (input, request) => {
    const account = operationalAccount(request);
    return transaction(() => {
      const now = Date.now();
      expire(now);
      maintain(now);
      work(input,account,now);
      return read(null,account.role);
    });
  };
  return {
    'GET subscriptions': customer(() => {}),
    'POST subscriptions/checkout': customer((input, account, now) => ({id:create(input,account,now)})),
    'POST subscriptions/payment': customer((input, account, now) => {
      const row = owned.get(typeof input.id === 'string' ? input.id : '',account.customer_id);
      if (!row) fail('Subscription checkout not found.',404);
      if (!['confirm','cancel'].includes(input.action)) fail('Invalid payment action.',400);
      if (row.payment_status !== 'pending') return;
      if (input.action === 'cancel') settle(row,'cancelled',account.account_id,now);
      else if (now < row.expires_at) activate(row,now,account.account_id);
    }),
    'POST subscriptions/defer': customer(defer),
    'GET subscriptions/operations': operational(() => {}),
    'POST subscriptions/fulfillment': operational(fulfill),
    'POST subscriptions/courier': operational(courier)
  };
};
