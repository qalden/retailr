CREATE TABLE order_stock_reservations (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL,
  warehouse_id BIGINT NOT NULL,
  reserved_quantity INT NOT NULL,
  released_at TIMESTAMP,
  UNIQUE (order_id, product_id, warehouse_id)
);

CREATE INDEX idx_reservations_order_id ON order_stock_reservations(order_id);
