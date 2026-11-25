CREATE TABLE IF NOT EXISTS PickupFulfillment (
  order_id TEXT PRIMARY KEY NOT NULL REFERENCES "Order"(order_id),
  status TEXT NOT NULL CHECK (status IN ('preparing','ready','completed')),
  arrived_at INTEGER,
  arrived_by_account_id TEXT REFERENCES Account(account_id),
  completed_at INTEGER
) STRICT;

ALTER TABLE InventoryMovement RENAME TO InventoryMovementPrevious;
CREATE TABLE InventoryMovement (
  movement_id TEXT PRIMARY KEY NOT NULL,
  inventory_id TEXT NOT NULL REFERENCES Inventory(inventory_id),
  order_id TEXT REFERENCES "Order"(order_id),
  reservation_id INTEGER UNIQUE REFERENCES InventoryReservation(reservation_id),
  performed_by_account_id TEXT REFERENCES Account(account_id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('restock','adjustment','consumption')),
  quantity_change REAL NOT NULL CHECK (quantity_change <> 0),
  unit_cost_snapshot REAL,
  reason TEXT CHECK (reason IN ('spoilage','damage','miscount','theft','correction','other')),
  notes TEXT,
  operation_key TEXT NOT NULL UNIQUE,
  occurred_at TEXT NOT NULL,
  CHECK ((movement_type = 'consumption' AND order_id IS NOT NULL AND reservation_id IS NOT NULL AND quantity_change < 0)
    OR (movement_type IN ('restock','adjustment') AND order_id IS NULL AND reservation_id IS NULL))
) STRICT;
INSERT INTO InventoryMovement SELECT * FROM InventoryMovementPrevious;
DROP TABLE InventoryMovementPrevious;
CREATE INDEX InventoryMovementByMaterial ON InventoryMovement(inventory_id);
