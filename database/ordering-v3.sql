CREATE TABLE IF NOT EXISTS "Order" (
  order_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES CustomerProfile(customer_id),
  ref_number TEXT NOT NULL UNIQUE,
  request_key TEXT NOT NULL,
  request_signature TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type = 'standard_purchase'),
  total_cents INTEGER NOT NULL CHECK (total_cents > 0),
  fulfillment_date TEXT NOT NULL,
  fulfillment_method TEXT NOT NULL CHECK (fulfillment_method = 'pickup'),
  status TEXT NOT NULL CHECK (status IN ('pending_payment','confirmed','cancelled')),
  created_at INTEGER NOT NULL,
  UNIQUE (customer_id, request_key)
) STRICT;

CREATE TABLE IF NOT EXISTS OrderItem (
  order_item_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES "Order"(order_id),
  variant_id TEXT NOT NULL REFERENCES ProductVariant(variant_id),
  name_snapshot TEXT NOT NULL,
  size_snapshot TEXT NOT NULL,
  image_snapshot TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0),
  UNIQUE (order_id, variant_id)
) STRICT;

CREATE TABLE IF NOT EXISTS OrderStatusHistory (
  history_id INTEGER PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES "Order"(order_id),
  status TEXT NOT NULL,
  changed_by_account_id TEXT REFERENCES Account(account_id),
  changed_at INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS OrderHistoryByOrder ON OrderStatusHistory(order_id, history_id);

CREATE TABLE IF NOT EXISTS BlockedDate (
  date TEXT PRIMARY KEY,
  reason TEXT,
  created_by_admin_id TEXT REFERENCES AdminProfile(admin_id),
  created_at INTEGER NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS CapacityConfig (
  order_type TEXT PRIMARY KEY CHECK (order_type = 'standard'),
  max_varieties_per_day INTEGER NOT NULL CHECK (max_varieties_per_day > 0),
  max_units INTEGER NOT NULL CHECK (max_units > 0),
  created_by_admin_id TEXT REFERENCES AdminProfile(admin_id)
) STRICT;
INSERT OR IGNORE INTO CapacityConfig VALUES ('standard', 4, 10, NULL);

CREATE TABLE IF NOT EXISTS CheckoutHold (
  hold_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES "Order"(order_id),
  status TEXT NOT NULL CHECK (status IN ('active','confirmed','released','expired')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  released_at INTEGER
) STRICT;
CREATE UNIQUE INDEX IF NOT EXISTS ActiveCheckoutHold ON CheckoutHold(order_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS CheckoutHoldByOrder ON CheckoutHold(order_id, created_at);
CREATE INDEX IF NOT EXISTS CheckoutHoldByExpiry ON CheckoutHold(status, expires_at);

CREATE TABLE IF NOT EXISTS Payment (
  payment_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES "Order"(order_id),
  hold_id TEXT NOT NULL UNIQUE REFERENCES CheckoutHold(hold_id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL CHECK (status IN ('pending','paid','expired','cancelled')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  paid_at INTEGER
) STRICT;
CREATE INDEX IF NOT EXISTS PaymentByOrder ON Payment(order_id, created_at);

CREATE TABLE IF NOT EXISTS CapacityAllocation (
  allocation_id INTEGER PRIMARY KEY,
  order_type TEXT NOT NULL REFERENCES CapacityConfig(order_type),
  product_id INTEGER NOT NULL REFERENCES Product(product_id),
  source_order_id TEXT NOT NULL REFERENCES "Order"(order_id),
  hold_id TEXT NOT NULL REFERENCES CheckoutHold(hold_id),
  fulfillment_date TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL CHECK (status IN ('held','confirmed','released','expired')),
  UNIQUE (hold_id, product_id)
) STRICT;
CREATE INDEX IF NOT EXISTS CapacityByDate ON CapacityAllocation(fulfillment_date, status);

CREATE TABLE IF NOT EXISTS OrderMaterialRequirement (
  requirement_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES "Order"(order_id),
  inventory_id TEXT NOT NULL REFERENCES Inventory(inventory_id),
  quantity_required REAL NOT NULL CHECK (quantity_required > 0),
  fulfillment_date TEXT NOT NULL,
  reserve_at INTEGER NOT NULL,
  UNIQUE (order_id, inventory_id)
) STRICT;
CREATE INDEX IF NOT EXISTS RequirementsByMaterial ON OrderMaterialRequirement(inventory_id);

CREATE TABLE IF NOT EXISTS InventoryReservation (
  reservation_id INTEGER PRIMARY KEY,
  requirement_id TEXT NOT NULL REFERENCES OrderMaterialRequirement(requirement_id),
  hold_id TEXT NOT NULL REFERENCES CheckoutHold(hold_id),
  quantity REAL NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL CHECK (status IN ('held','confirmed','released','expired')),
  UNIQUE (hold_id, requirement_id)
) STRICT;
CREATE UNIQUE INDEX IF NOT EXISTS ActiveMaterialReservation ON InventoryReservation(requirement_id)
WHERE status IN ('held','confirmed');
