CREATE TABLE warehouses (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  location VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_items (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, warehouse_id),
  CONSTRAINT quantity_non_negative CHECK (quantity >= 0),
  CONSTRAINT reserved_non_negative CHECK (reserved_quantity >= 0),
  CONSTRAINT reserved_less_than_quantity CHECK (reserved_quantity <= quantity)
);

CREATE INDEX idx_stock_items_product_id ON stock_items(product_id);
CREATE INDEX idx_stock_items_warehouse_id ON stock_items(warehouse_id);

CREATE TABLE stock_movements (
  id BIGSERIAL PRIMARY KEY,
  stock_item_id BIGINT NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  quantity_delta INT NOT NULL,
  movement_type VARCHAR(50) NOT NULL,
  reference_type VARCHAR(50),
  reference_id BIGINT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_stock_item_id ON stock_movements(stock_item_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);

CREATE TABLE low_stock_alerts (
  id BIGSERIAL PRIMARY KEY,
  stock_item_id BIGINT NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  acknowledged_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_alerts_stock_item_id ON low_stock_alerts(stock_item_id);
CREATE INDEX idx_alerts_triggered_at ON low_stock_alerts(triggered_at);
