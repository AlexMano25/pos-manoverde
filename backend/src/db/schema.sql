-- ============================================================
-- POS Mano Verde - Database Schema
-- ============================================================

-- Enable WAL mode for better concurrent read/write performance
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

-- ============================================================
-- STORES
-- ============================================================
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  activity TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stores_created_at ON stores(created_at);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'cashier', 'stock')),
  pin TEXT,
  phone TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_pin ON users(pin);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  cost REAL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  sku TEXT,
  barcode TEXT,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  items TEXT NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'paid',
  synced INTEGER NOT NULL DEFAULT 0,
  device_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_synced ON orders(synced);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_device_id ON orders(device_id);

-- ============================================================
-- STOCK MOVES
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_moves (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  type TEXT NOT NULL,
  qty INTEGER NOT NULL,
  reason TEXT,
  user_id TEXT,
  synced INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_moves_store_id ON stock_moves(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_moves_product_id ON stock_moves(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_moves_type ON stock_moves(type);
CREATE INDEX IF NOT EXISTS idx_stock_moves_synced ON stock_moves(synced);
CREATE INDEX IF NOT EXISTS idx_stock_moves_created_at ON stock_moves(created_at);

-- ============================================================
-- SYNC QUEUE
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  data TEXT,
  device_id TEXT,
  store_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_entity_type ON sync_queue(entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity_id ON sync_queue(entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_store_id ON sync_queue(store_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced_at ON sync_queue(synced_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);
