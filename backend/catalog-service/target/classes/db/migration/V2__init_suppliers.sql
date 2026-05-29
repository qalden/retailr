CREATE TABLE suppliers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  contact_email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE product_suppliers (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_sku VARCHAR(50),
  lead_time_days INT DEFAULT 7,
  PRIMARY KEY (product_id, supplier_id),
  CONSTRAINT lead_time_non_negative CHECK (lead_time_days >= 0)
);

CREATE INDEX idx_product_suppliers_supplier_id ON product_suppliers(supplier_id);
