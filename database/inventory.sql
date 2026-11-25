CREATE TABLE IF NOT EXISTS Inventory (
  inventory_id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  material_type TEXT NOT NULL CHECK (material_type IN ('ingredient', 'packaging')),
  unit TEXT NOT NULL CHECK (unit IN ('g', 'ml', 'pcs')),
  stock_on_hand REAL NOT NULL CHECK (stock_on_hand >= 0),
  reorder_threshold REAL NOT NULL CHECK (reorder_threshold >= 0),
  cost_per_unit REAL NOT NULL CHECK (cost_per_unit >= 0),
  status TEXT NOT NULL CHECK (status IN ('available', 'unavailable', 'low_stock')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
) STRICT;

CREATE TABLE IF NOT EXISTS InventoryMovement (
  movement_id TEXT PRIMARY KEY NOT NULL,
  inventory_id TEXT NOT NULL REFERENCES Inventory(inventory_id),
  order_id TEXT CHECK (order_id IS NULL),
  reservation_id TEXT CHECK (reservation_id IS NULL),
  performed_by_account_id TEXT REFERENCES Account(account_id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('restock', 'adjustment')),
  quantity_change REAL NOT NULL CHECK (quantity_change <> 0),
  unit_cost_snapshot REAL,
  reason TEXT CHECK (reason IN ('spoilage', 'damage', 'miscount', 'theft', 'correction', 'other')),
  notes TEXT,
  operation_key TEXT NOT NULL UNIQUE,
  occurred_at TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS InventoryMovementByMaterial ON InventoryMovement(inventory_id);

CREATE TABLE IF NOT EXISTS InventoryOperation (
  operation_key TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES Account(account_id),
  signature TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS Category (
  category_id TEXT PRIMARY KEY NOT NULL,
  category_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS ProductCoverAsset (
  image_id TEXT PRIMARY KEY NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  content BLOB NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS Product (
  product_id INTEGER PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES Category(category_id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  img_url TEXT NOT NULL,
  subscription_eligible INTEGER NOT NULL CHECK (subscription_eligible IN (0, 1)),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS SubscriptionSchedule (
  schedule_id TEXT PRIMARY KEY NOT NULL,
  product_id INTEGER NOT NULL REFERENCES Product(product_id),
  preparation_day INTEGER NOT NULL CHECK (preparation_day BETWEEN 0 AND 6),
  fulfillment_day INTEGER NOT NULL CHECK (fulfillment_day BETWEEN 0 AND 6),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  created_by_admin_id TEXT NOT NULL REFERENCES AdminProfile(admin_id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS ProductVariant (
  variant_id TEXT PRIMARY KEY NOT NULL,
  product_id INTEGER NOT NULL REFERENCES Product(product_id),
  variant_key TEXT NOT NULL,
  size TEXT NOT NULL,
  final_price REAL NOT NULL CHECK (final_price > 0),
  utility_overhead REAL CHECK (utility_overhead >= 0),
  status TEXT NOT NULL CHECK (status IN ('available', 'unavailable')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (product_id, variant_key)
) STRICT;

CREATE TABLE IF NOT EXISTS ProductBOM (
  product_bom_id TEXT PRIMARY KEY NOT NULL,
  variant_id TEXT NOT NULL REFERENCES ProductVariant(variant_id),
  inventory_id TEXT NOT NULL REFERENCES Inventory(inventory_id),
  quantity_required REAL NOT NULL CHECK (quantity_required > 0),
  UNIQUE (variant_id, inventory_id)
) STRICT;

CREATE INDEX IF NOT EXISTS ProductBOMByMaterial ON ProductBOM(inventory_id);
