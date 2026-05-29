CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  permissions TEXT
);

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

INSERT INTO roles (name, permissions) VALUES
  ('ADMIN', '["*"]'),
  ('INVENTORY_MANAGER', '["inventory.read", "inventory.write", "stock.read", "stock.write"]'),
  ('SALES_OFFICER', '["products.read", "customers.read", "customers.write", "orders.create", "orders.read"]'),
  ('VIEWER', '["products.read", "orders.read", "inventory.read"]');

CREATE INDEX idx_users_email ON users(email);
