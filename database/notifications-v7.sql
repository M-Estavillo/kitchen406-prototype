CREATE TABLE CustomerNotification (
  customer_notification_id TEXT PRIMARY KEY,
  recipient_account_id TEXT NOT NULL REFERENCES Account(account_id),
  event_key TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('orders','payments','subscriptions','cakes','account')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  order_id TEXT REFERENCES "Order"(order_id),
  payment_id TEXT REFERENCES Payment(payment_id),
  standard_delivery_order_id TEXT REFERENCES StandardCourierDelivery(order_id),
  subscription_id TEXT REFERENCES Subscription(subscription_id),
  subscription_delivery_id TEXT REFERENCES SubscriptionDelivery(subscription_delivery_id),
  deferment_subscription_id TEXT REFERENCES SubscriptionDeferment(subscription_id),
  verification_id TEXT REFERENCES AccountVerification(account_verification_id),
  source_account_id TEXT REFERENCES Account(account_id),
  created_at INTEGER NOT NULL,
  read_at INTEGER,
  UNIQUE (recipient_account_id, event_key),
  CHECK ((order_id IS NOT NULL) + (payment_id IS NOT NULL) + (standard_delivery_order_id IS NOT NULL)
       + (subscription_id IS NOT NULL) + (subscription_delivery_id IS NOT NULL)
       + (deferment_subscription_id IS NOT NULL) + (verification_id IS NOT NULL)
       + (source_account_id IS NOT NULL) = 1)
) STRICT;
CREATE INDEX CustomerNotificationFeed ON CustomerNotification(recipient_account_id, created_at DESC);

CREATE TABLE NotificationLog (
  notification_log_id TEXT PRIMARY KEY,
  recipient_account_id TEXT NOT NULL REFERENCES Account(account_id),
  customer_notification_id TEXT REFERENCES CustomerNotification(customer_notification_id),
  verification_id TEXT REFERENCES AccountVerification(account_verification_id),
  event_key TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('local_outbox','brevo','semaphore')),
  status TEXT NOT NULL CHECK (status IN ('pending','sent','failed')),
  provider_message_id TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count BETWEEN 0 AND 3),
  next_retry_at INTEGER,
  attempt_history TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(attempt_history) AND json_type(attempt_history) = 'array'),
  error_message TEXT,
  sent_at INTEGER,
  created_at INTEGER NOT NULL,
  UNIQUE (recipient_account_id, event_key, provider),
  CHECK ((customer_notification_id IS NOT NULL) + (verification_id IS NOT NULL) = 1)
) STRICT;
CREATE INDEX NotificationLogDue ON NotificationLog(next_retry_at) WHERE next_retry_at IS NOT NULL;

CREATE TABLE SystemNotification (
  system_notification_id TEXT PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('admin','staff','all')),
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'new_order','custom_cake_submitted','low_stock_alert','subscription_deferment_completed',
    'payment_received','notification_send_failed')),
  message TEXT NOT NULL,
  order_id TEXT REFERENCES "Order"(order_id),
  payment_id TEXT REFERENCES Payment(payment_id),
  inventory_id TEXT REFERENCES Inventory(inventory_id) ON DELETE CASCADE,
  deferment_subscription_id TEXT REFERENCES SubscriptionDeferment(subscription_id),
  notification_log_id TEXT REFERENCES NotificationLog(notification_log_id),
  created_at INTEGER NOT NULL,
  CHECK ((order_id IS NOT NULL) + (payment_id IS NOT NULL) + (inventory_id IS NOT NULL)
       + (deferment_subscription_id IS NOT NULL) + (notification_log_id IS NOT NULL) = 1)
) STRICT;
CREATE INDEX SystemNotificationFeed ON SystemNotification(recipient_role, created_at DESC);

CREATE TABLE SystemNotificationRead (
  notification_read_id INTEGER PRIMARY KEY,
  system_notification_id TEXT NOT NULL REFERENCES SystemNotification(system_notification_id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES Account(account_id),
  read_at INTEGER NOT NULL,
  UNIQUE (system_notification_id, account_id)
) STRICT;
CREATE INDEX SystemNotificationReadByAccount ON SystemNotificationRead(account_id, system_notification_id);

INSERT INTO SystemNotification
  (system_notification_id, event_key, recipient_role, notification_type, message, inventory_id, created_at)
SELECT lower(hex(randomblob(16))), 'stock:' || inventory_id || ':migration', 'all', 'low_stock_alert',
  name || ' needs stock attention.', inventory_id, CAST(unixepoch('subsec') * 1000 AS INTEGER)
FROM Inventory WHERE archived_at IS NULL AND status IN ('low_stock','unavailable');

CREATE TRIGGER NotifyInventoryLowAfterInsert
AFTER INSERT ON Inventory
WHEN NEW.archived_at IS NULL AND NEW.status IN ('low_stock','unavailable')
BEGIN
  INSERT INTO SystemNotification
    (system_notification_id, event_key, recipient_role, notification_type, message, inventory_id, created_at)
  VALUES (lower(hex(randomblob(16))), 'stock:' || NEW.inventory_id || ':initial',
    'all', 'low_stock_alert', NEW.name || ' needs stock attention.', NEW.inventory_id,
    CAST(unixepoch('subsec') * 1000 AS INTEGER));
END;

CREATE TRIGGER NotifyInventoryLowAfterUpdate
AFTER UPDATE OF status, archived_at ON Inventory
WHEN NEW.archived_at IS NULL AND NEW.status IN ('low_stock','unavailable')
  AND (OLD.status = 'available' OR OLD.archived_at IS NOT NULL)
BEGIN
  INSERT INTO SystemNotification
    (system_notification_id, event_key, recipient_role, notification_type, message, inventory_id, created_at)
  VALUES (lower(hex(randomblob(16))), 'stock:' || NEW.inventory_id || ':' || lower(hex(randomblob(16))),
    'all', 'low_stock_alert', NEW.name || ' needs stock attention.', NEW.inventory_id,
    CAST(unixepoch('subsec') * 1000 AS INTEGER));
END;
