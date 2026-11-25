const { randomUUID } = require('node:crypto');
const { statSync, readFileSync, renameSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

module.exports = function notifications(db, transaction, requireAccount, HttpError, outbox) {
  transaction(() => {
    if (db.prepare('PRAGMA user_version').get().user_version >= 7) return;
    db.exec(readFileSync(join(__dirname, 'database', 'notifications-v7.sql'), 'utf8'));
    if (db.prepare('PRAGMA foreign_key_check').get()) throw Error('Notification migration violated a foreign key');
    db.exec('PRAGMA user_version = 7');
  });

  const orderAccount = db.prepare(`SELECT c.account_id FROM "Order" o
    JOIN CustomerProfile c USING (customer_id) WHERE o.order_id = ?`);
  const orderReference = db.prepare('SELECT ref_number, type FROM "Order" WHERE order_id = ?');
  const subscriptionAccount = db.prepare(`SELECT c.account_id FROM Subscription s
    JOIN CustomerProfile c USING (customer_id) WHERE s.subscription_id = ?`);
  const putCustomer = db.prepare(`INSERT INTO CustomerNotification
    (customer_notification_id, recipient_account_id, event_key, category, title, message,
     order_id, payment_id, standard_delivery_order_id, subscription_id, subscription_delivery_id,
     deferment_subscription_id, verification_id, source_account_id, created_at)
    VALUES ($id, $account, $key, $category, $title, $message, $order, $payment, $standardDelivery,
      $subscription, $cycle, $deferment, $verification, $sourceAccount, $now)
    ON CONFLICT(recipient_account_id, event_key) DO NOTHING`);
  const putSystem = db.prepare(`INSERT INTO SystemNotification
    (system_notification_id, event_key, recipient_role, notification_type, message,
     order_id, payment_id, inventory_id, deferment_subscription_id, notification_log_id, created_at)
    VALUES ($id, $key, $role, $type, $message, $order, $payment, $inventory, $deferment, $log, $now)
    ON CONFLICT(event_key) DO NOTHING`);
  const enqueue = db.prepare(`INSERT INTO NotificationLog
    (notification_log_id, recipient_account_id, customer_notification_id, event_key,
     type, provider, status, next_retry_at, created_at)
    VALUES (?,?,?,?,?,'local_outbox','pending',?,?)`);
  const recordCode = db.prepare(`INSERT INTO NotificationLog
    (notification_log_id, recipient_account_id, verification_id, event_key, type, provider,
     status, provider_message_id, attempt_history, sent_at, created_at)
    VALUES (?,?,?,?,?,'local_outbox','sent',?,?,?,?)`);

  function customer({ account, key, category, title, message, type, now, ...source }) {
    const id = randomUUID();
    const { changes } = putCustomer.run({ id, account, key, category, title, message, now,
      order: null, payment: null, standardDelivery: null, subscription: null, cycle: null,
      deferment: null, verification: null, sourceAccount: null, ...source });
    if (changes && type) enqueue.run(randomUUID(), account, id, key, type, now, now);
  }

  function system({ key, type, message, now, role = 'all', ...source }) {
    putSystem.run({ id: randomUUID(), key, role, type, message, now,
      order: null, payment: null, inventory: null, deferment: null, log: null, ...source });
  }

  function paid(payment, now) {
    const order = payment.order_id, { ref_number: ref, type } = orderReference.get(order);
    system({ key: 'payment:' + payment.payment_id, role: 'admin', type: 'payment_received',
      message: 'Payment recorded for ' + ref + '.', payment: payment.payment_id, now });
    if (type !== 'standard_purchase') return;
    system({ key: 'new-order:' + order, type: 'new_order', message: 'New paid order ' + ref + '.', order, now });
    customer({ account: orderAccount.get(order).account_id, key: 'confirmed:' + order,
      category: 'orders', title: 'Order confirmed', message: 'Your order ' + ref + ' is confirmed.',
      order, type: 'order_confirmed', now });
  }

  const progress = {
    preparing: 'is being prepared', ready: 'is ready', completed: 'is complete',
    booked: 'has a courier booking', in_transit: 'is on the way', delivered: 'has been delivered',
    fulfilled: 'is complete', cancelled: 'was cancelled'
  };

  function orderProgress(order, action, now, { standardDelivery = null, cycle = null, booking = null } = {}) {
    const { ref_number: ref } = orderReference.get(order);
    const source = standardDelivery ? { standardDelivery } : cycle ? { cycle } : { order };
    customer({ account: orderAccount.get(order).account_id,
      key: 'progress:' + (booking || order) + ':' + action, category: cycle ? 'subscriptions' : 'orders',
      title: booking ? 'Courier update' : cycle ? 'Subscription fulfillment update' : 'Order update',
      message: 'Your order ' + ref + ' ' + progress[action] + '.',
      type: booking ? 'delivery_status_update' : 'order_status_update', now, ...source });
  }

  function activated(subscription, now) {
    const { fulfillment_order_id: order } = db.prepare(
      'SELECT fulfillment_order_id FROM SubscriptionDelivery WHERE subscription_id = ? AND cycle_number = 1').get(subscription);
    system({ key: 'new-order:' + order, type: 'new_order', message: 'A prepaid subscription has been activated.', order, now });
    customer({ account: subscriptionAccount.get(subscription).account_id, key: 'activated:' + subscription,
      category: 'subscriptions', title: 'Subscription confirmed',
      message: 'Your four prepaid fulfillments are now scheduled.', subscription, type: 'subscription_status_update', now });
  }

  function subscriptionStatus(subscription, status, now) {
    customer({ account: subscriptionAccount.get(subscription).account_id, key: 'subscription:' + subscription + ':' + status,
      category: 'subscriptions', title: 'Subscription update',
      message: status === 'completed' ? 'Your subscription cycle is complete.' : 'Your subscription was cancelled.',
      subscription, type: 'subscription_status_update', now });
  }

  function deferred(subscription, date, now) {
    const key = 'deferred:' + subscription;
    customer({ account: subscriptionAccount.get(subscription).account_id, key,
      category: 'subscriptions', title: 'Fulfillment rescheduled', message: 'Your fulfillment was moved to ' + date + '.',
      deferment: subscription, type: 'subscription_delivery_deferred', now });
    system({ key, type: 'subscription_deferment_completed', message: 'Subscription fulfillment moved to ' + date + '.',
      deferment: subscription, now });
  }

  function codeOutboxed(account, id, purpose, now) {
    const filename = id + '.txt';
    recordCode.run(randomUUID(), account, id, 'verification:' + id, purpose + '_otp', filename,
      JSON.stringify([{ status: 'sent', at: now, provider_message_id: filename }]), now, now);
  }

  const customerFeed = db.prepare(`SELECT n.*, p.order_id AS payment_order, d.fulfillment_order_id AS cycle_order,
      l.status AS outbox_status
    FROM CustomerNotification n
    LEFT JOIN Payment p USING (payment_id)
    LEFT JOIN SubscriptionDelivery d USING (subscription_delivery_id)
    LEFT JOIN NotificationLog l ON l.customer_notification_id = n.customer_notification_id AND l.provider = 'local_outbox'
    WHERE n.recipient_account_id = ? ORDER BY n.created_at DESC, n.rowid DESC`);
  const systemFeed = db.prepare(`SELECT n.*, r.read_at, p.order_id AS payment_order,
      d.fulfillment_order_id AS deferred_order, l.status AS delivery_status, l.next_retry_at
    FROM SystemNotification n
    LEFT JOIN SystemNotificationRead r ON r.system_notification_id = n.system_notification_id AND r.account_id = ?
    LEFT JOIN Payment p USING (payment_id)
    LEFT JOIN SubscriptionDeferment f ON f.subscription_id = n.deferment_subscription_id
    LEFT JOIN SubscriptionDelivery d USING (subscription_delivery_id)
    LEFT JOIN NotificationLog l USING (notification_log_id)
    WHERE n.recipient_role IN ('all', ?) ORDER BY n.created_at DESC, n.rowid DESC`);

  function feed(account) {
    if (account.role === 'customer') return customerFeed.all(account.account_id).map(row => {
      const order = row.order_id ?? row.payment_order ?? row.standard_delivery_order_id ?? row.cycle_order;
      const subscription = row.subscription_id ?? row.deferment_subscription_id;
      return { id: row.customer_notification_id, category: row.category, title: row.title, message: row.message,
        created_at: row.created_at, read_at: row.read_at, outbox_status: row.outbox_status,
        path: order ? 'orders/' + encodeURIComponent(order) : subscription ? 'subscriptions/' + encodeURIComponent(subscription) : 'account/profile' };
    });
    return systemFeed.all(account.account_id, account.role).map(row => {
      const admin = account.role === 'admin', order = row.order_id ?? row.payment_order ?? row.deferred_order;
      return { id: row.system_notification_id, message: row.message, at: row.created_at,
        read: row.read_at !== null, read_at: row.read_at,
        type: row.inventory_id ? 'inventory' : row.payment_id ? 'payments' : row.notification_log_id ? 'delivery' : 'orders',
        retry_id: row.delivery_status === 'failed' && row.next_retry_at === null ? row.notification_log_id : null,
        path: order ? (admin ? 'orders/' : 'staff/production/') + encodeURIComponent(order)
          : row.inventory_id ? (admin ? 'inventory/' : 'staff/inventory/') + encodeURIComponent(row.inventory_id) : null };
    });
  }

  const markCustomer = db.prepare(`UPDATE CustomerNotification SET read_at = ?
    WHERE recipient_account_id = ? AND read_at IS NULL AND (? IS NULL OR customer_notification_id = ?)`);
  const markSystem = db.prepare(`INSERT INTO SystemNotificationRead(system_notification_id, account_id, read_at)
    SELECT system_notification_id, ?, ? FROM SystemNotification
    WHERE recipient_role IN ('all', ?) AND (? IS NULL OR system_notification_id = ?)
    ON CONFLICT(system_notification_id, account_id) DO NOTHING`);
  const due = db.prepare(`SELECT l.*, n.title, n.message, a.email FROM NotificationLog l
    JOIN CustomerNotification n USING (customer_notification_id) JOIN Account a ON a.account_id = l.recipient_account_id
    WHERE l.status IN ('pending','failed') AND l.provider = 'local_outbox' AND l.next_retry_at <= ?
    ORDER BY l.next_retry_at LIMIT 1`);
  const dueReminders = db.prepare(`SELECT d.*, c.account_id FROM SubscriptionDelivery d
    JOIN Subscription s USING (subscription_id) JOIN CustomerProfile c USING (customer_id)
    WHERE s.status = 'active' AND d.status IN ('scheduled','preparing','ready')
      AND d.scheduled_date BETWEEN date(? / 1000, 'unixepoch', '+8 hours')
        AND date(? / 1000, 'unixepoch', '+8 hours', '+1 day')
      AND NOT EXISTS (SELECT 1 FROM CustomerNotification n WHERE n.recipient_account_id = c.account_id
        AND n.event_key = 'reminder:' || d.subscription_delivery_id || ':' || d.scheduled_date)`);
  const recordAttempt = db.prepare(`UPDATE NotificationLog
    SET status = ?, provider_message_id = ?, retry_count = ?, next_retry_at = ?, attempt_history = ?,
      error_message = ?, sent_at = ? WHERE notification_log_id = ?`);
  const queueRetry = db.prepare(`UPDATE NotificationLog SET status = 'pending', retry_count = 0, next_retry_at = ?
    WHERE notification_log_id = ? AND provider = 'local_outbox' AND customer_notification_id IS NOT NULL
      AND status = 'failed' AND next_retry_at IS NULL`);
  const retryDelays = [5, 15, 30];

  function dispatch(now) {
    const entry = due.get(now);
    if (!entry) return false;
    const id = entry.notification_log_id, filename = 'notification-' + id + '.txt';
    let error = null;
    try {
      const target = join(outbox, filename), temporary = target + '.tmp';
      if (!statSync(target, { throwIfNoEntry: false })?.isFile()) {
        writeFileSync(temporary, 'To: ' + entry.email + '\nSubject: ' + entry.title + '\n\n' + entry.message + '\n', { mode: 0o600 });
        renameSync(temporary, target);
      }
    } catch (failure) {
      error = failure.code || 'outbox-write-failed';
    }
    const status = error ? 'failed' : 'sent', attempt = { status, at: now };
    if (error) attempt.error = error;
    else attempt.provider_message_id = filename;
    const attempts = [...JSON.parse(entry.attempt_history), attempt];
    const count = entry.retry_count + Number(entry.status === 'failed');
    const delay = error ? retryDelays[count] : null;
    const next = delay ? now + delay * 60_000 : null;
    recordAttempt.run(status, error ? null : filename, count, next, JSON.stringify(attempts), error, error ? null : now, id);
    if (error && !next) system({ key: 'delivery-failure:' + id + ':' + attempts.length, role: 'admin',
      type: 'notification_send_failed', message: 'A customer notification could not be written to the local outbox.',
      log: id, now });
    return true;
  }

  let nextReminderCheck = 0;
  const timer = setInterval(() => {
    try {
      const now = Date.now();
      if (now >= nextReminderCheck) {
        transaction(() => {
          for (const row of dueReminders.all(now, now)) {
            customer({ account: row.account_id, key: 'reminder:' + row.subscription_delivery_id + ':' + row.scheduled_date,
              category: 'subscriptions', title: 'Upcoming subscription fulfillment',
              message: 'Your subscription fulfillment is scheduled for ' + row.scheduled_date + '.',
              cycle: row.subscription_delivery_id, type: 'subscription_delivery_reminder', now });
          }
        });
        nextReminderCheck = now + 60_000;
      }
      for (let index = 0; index < 20 && due.get(now); index++) transaction(() => dispatch(now));
    } catch (error) {
      console.error('Notification outbox processing failed:', error.code || error.name);
    }
  }, 2000);
  timer.unref();

  return { customer, paid, orderProgress, activated, subscriptionStatus, deferred, codeOutboxed,
    endpoints: {
      'GET notifications': (_input, request) => ({ notifications: feed(requireAccount(request)) }),
      'POST notifications/read': ({ id, all }, request) => {
        const account = requireAccount(request);
        if (!(all === true && id === undefined) && !(all === undefined && typeof id === 'string' && /^[a-f0-9-]{32,36}$/.test(id))) {
          throw new HttpError(400, 'invalid-notification');
        }
        const target = id ?? null, now = Date.now();
        return transaction(() => {
          if (account.role === 'customer') markCustomer.run(now, account.account_id, target, target);
          else markSystem.run(account.account_id, now, account.role, target, target);
          return { notifications: feed(account) };
        });
      },
      'POST notifications/retry': ({ id }, request) => {
        if (requireAccount(request).role !== 'admin') throw new HttpError(403, 'access-denied');
        if (typeof id !== 'string' || !queueRetry.run(Date.now(), id).changes) throw new HttpError(409, 'notification-not-retryable');
        return {};
      }
    }
  };
};
