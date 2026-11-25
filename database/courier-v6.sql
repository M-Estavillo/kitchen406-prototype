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
  CHECK (type <> 'standard_purchase' OR (total_cents > 0))
) STRICT;
INSERT INTO NextOrder SELECT order_id, customer_id, ref_number, request_key, request_signature, type, total_cents, fulfillment_date, fulfillment_method, status, created_at FROM "Order";
DROP TABLE "Order";
ALTER TABLE NextOrder RENAME TO "Order";

CREATE TABLE SavedDeliveryAddress (
  address_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES CustomerProfile(customer_id),
  data TEXT NOT NULL CHECK (json_valid(data)),
  is_default INTEGER NOT NULL CHECK (is_default IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE UNIQUE INDEX OneDefaultDeliveryAddress ON SavedDeliveryAddress(customer_id) WHERE is_default = 1;

CREATE TABLE StandardCourierDelivery (
  order_id TEXT PRIMARY KEY REFERENCES "Order"(order_id),
  address_snapshot TEXT NOT NULL CHECK (json_valid(address_snapshot)),
  fee_cents INTEGER NOT NULL CHECK (fee_cents >= 0),
  status TEXT CHECK (status IN ('preparing','ready','completed')),
  completed_at INTEGER
) STRICT;

CREATE TABLE CourierBooking (
  booking_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES "Order"(order_id),
  operation_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending','booked','in_transit','delivered','failed','cancelled')),
  outcome TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;
CREATE UNIQUE INDEX ActiveCourierBooking ON CourierBooking(order_id)
  WHERE status IN ('pending','booked','in_transit','delivered');
INSERT INTO CourierBooking SELECT * FROM SubscriptionCourierBooking;
DROP TABLE SubscriptionCourierBooking;
