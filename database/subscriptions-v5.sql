CREATE TABLE NextOrder (
  order_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES CustomerProfile(customer_id),
  ref_number TEXT NOT NULL UNIQUE,
  request_key TEXT NOT NULL,
  request_signature TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('standard_purchase','subscription_purchase','subscription_fulfillment')),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  fulfillment_date TEXT,
  fulfillment_method TEXT CHECK (fulfillment_method IN ('pickup','delivery')),
  status TEXT NOT NULL CHECK (status IN ('pending_payment','confirmed','cancelled')),
  created_at INTEGER NOT NULL,
  amount_payable_cents INTEGER GENERATED ALWAYS AS
    (CASE WHEN type = 'subscription_fulfillment' THEN 0 ELSE total_cents END) VIRTUAL,
  UNIQUE (customer_id, request_key),
  CHECK ((type = 'subscription_purchase' AND fulfillment_date IS NULL AND fulfillment_method IS NULL)
    OR (type <> 'subscription_purchase' AND fulfillment_date IS NOT NULL AND fulfillment_method IS NOT NULL)),
  CHECK (type <> 'standard_purchase' OR (fulfillment_method = 'pickup' AND total_cents > 0))
) STRICT;
INSERT INTO NextOrder SELECT * FROM "Order";
DROP TABLE "Order";
ALTER TABLE NextOrder RENAME TO "Order";

ALTER TABLE OrderItem ADD COLUMN net_product_cents INTEGER CHECK (net_product_cents >= 0);

CREATE TABLE SubscriptionCapacityConfig (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  weekly_units INTEGER NOT NULL CHECK (weekly_units > 0),
  lead_value REAL NOT NULL CHECK (lead_value >= 0),
  lead_unit TEXT NOT NULL CHECK (lead_unit IN ('hours','days')),
  cutoff_time TEXT NOT NULL
) STRICT;
INSERT INTO SubscriptionCapacityConfig VALUES (1,10,2,'days','16:00');

CREATE TABLE SubscriptionCheckout (
  purchase_order_id TEXT PRIMARY KEY REFERENCES "Order"(order_id),
  schedule_id TEXT REFERENCES SubscriptionSchedule(schedule_id),
  fulfillment_day INTEGER NOT NULL CHECK (fulfillment_day BETWEEN 0 AND 6),
  preparation_day INTEGER NOT NULL CHECK (preparation_day BETWEEN 0 AND 6),
  start_date TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('pickup','delivery')),
  address_snapshot TEXT CHECK (address_snapshot IS NULL OR json_valid(address_snapshot)),
  fee_snapshot TEXT NOT NULL CHECK (json_valid(fee_snapshot))
) STRICT;

CREATE TABLE Subscription (
  subscription_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES CustomerProfile(customer_id),
  variant_id TEXT NOT NULL REFERENCES ProductVariant(variant_id),
  purchase_order_id TEXT NOT NULL UNIQUE REFERENCES SubscriptionCheckout(purchase_order_id),
  product_total_cents INTEGER NOT NULL CHECK (product_total_cents > 0),
  delivery_fee_total_cents INTEGER NOT NULL CHECK (delivery_fee_total_cents >= 0),
  status TEXT NOT NULL CHECK (status IN ('active','completed','cancelled')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;
CREATE INDEX SubscriptionByCustomer ON Subscription(customer_id);

CREATE TABLE SubscriptionCapacityAllocation (
  allocation_id INTEGER PRIMARY KEY,
  purchase_order_id TEXT NOT NULL REFERENCES SubscriptionCheckout(purchase_order_id),
  hold_id TEXT NOT NULL REFERENCES CheckoutHold(hold_id),
  cycle_number INTEGER NOT NULL CHECK (cycle_number BETWEEN 1 AND 4),
  scheduled_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('held','confirmed','released','expired'))
) STRICT;
CREATE INDEX SubscriptionCapacityByDate ON SubscriptionCapacityAllocation(scheduled_date,status);
CREATE UNIQUE INDEX ActiveSubscriptionCapacity ON SubscriptionCapacityAllocation(purchase_order_id,cycle_number)
  WHERE status IN ('held','confirmed');

CREATE TABLE SubscriptionDelivery (
  subscription_delivery_id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES Subscription(subscription_id),
  fulfillment_order_id TEXT NOT NULL UNIQUE REFERENCES "Order"(order_id),
  allocation_id INTEGER NOT NULL UNIQUE REFERENCES SubscriptionCapacityAllocation(allocation_id),
  cycle_number INTEGER NOT NULL CHECK (cycle_number BETWEEN 1 AND 4),
  original_scheduled_date TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  preparation_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled','preparing','ready','fulfilled','cancelled')),
  fulfilled_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (subscription_id,cycle_number),
  UNIQUE (subscription_id,subscription_delivery_id)
) STRICT;

CREATE TABLE SubscriptionDeferment (
  subscription_id TEXT PRIMARY KEY REFERENCES Subscription(subscription_id),
  subscription_delivery_id TEXT NOT NULL UNIQUE,
  original_allocation_id INTEGER NOT NULL REFERENCES SubscriptionCapacityAllocation(allocation_id),
  replacement_allocation_id INTEGER NOT NULL UNIQUE REFERENCES SubscriptionCapacityAllocation(allocation_id),
  original_scheduled_date TEXT NOT NULL,
  new_scheduled_date TEXT NOT NULL,
  deferment_option TEXT NOT NULL CHECK (deferment_option IN ('next_day','next_week')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (subscription_id,subscription_delivery_id)
    REFERENCES SubscriptionDelivery(subscription_id,subscription_delivery_id)
) STRICT;

CREATE TABLE SubscriptionCourierBooking (
  booking_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES SubscriptionDelivery(fulfillment_order_id),
  operation_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending','booked','in_transit','delivered','failed','cancelled')),
  outcome TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;
CREATE UNIQUE INDEX ActiveSubscriptionCourierBooking ON SubscriptionCourierBooking(order_id)
  WHERE status IN ('pending','booked','in_transit','delivered');
