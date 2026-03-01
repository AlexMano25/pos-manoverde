// ============================================================
// POS Mano Verde - Database Initialization & Helpers
// ============================================================

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../pos.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

// ============================================================
// Initialize database
// ============================================================
function initDatabase() {
  db = new Database(DB_PATH);

  // Performance settings for local POS usage
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -20000'); // 20MB cache
  db.pragma('temp_store = MEMORY');

  // Run schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  // Seed default data if no store exists
  seedDefaultData();

  console.log('[DB] Database initialized at', DB_PATH);
  return db;
}

// ============================================================
// Seed default store and admin user
// ============================================================
function seedDefaultData() {
  const storeCount = db.prepare('SELECT COUNT(*) AS count FROM stores').get();

  if (storeCount.count === 0) {
    const storeId = uuidv4();
    const adminId = uuidv4();
    const now = new Date().toISOString();

    // Default store
    db.prepare(`
      INSERT INTO stores (id, name, address, phone, activity, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      storeId,
      'Mano Verde',
      'Douala, Cameroun',
      '+237 600 000 000',
      'Restaurant & Commerce',
      now,
      now
    );

    // Default admin user (password: admin123)
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, store_id, name, email, password_hash, role, pin, phone, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      adminId,
      storeId,
      'Administrateur',
      'admin@manoverde.com',
      passwordHash,
      'admin',
      '1234',
      '+237 600 000 000',
      1,
      now,
      now
    );

    // Seed some default products
    const products = [
      { name: 'Cafe Latte', price: 1500, cost: 500, stock: 50, category: 'Boissons', sku: 'CAF-001' },
      { name: 'Sandwich Poulet', price: 2500, cost: 1200, stock: 20, category: 'Snacking', sku: 'SND-001' },
      { name: 'Eau Minerale 1.5L', price: 500, cost: 200, stock: 100, category: 'Boissons', sku: 'EAU-001' },
      { name: 'Croissant', price: 600, cost: 250, stock: 30, category: 'Boulangerie', sku: 'BAK-001' },
      { name: 'Jus de Fruit', price: 1000, cost: 400, stock: 40, category: 'Boissons', sku: 'JUS-001' },
    ];

    const insertProduct = db.prepare(`
      INSERT INTO products (id, store_id, name, price, cost, stock, category, sku, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      for (const p of items) {
        insertProduct.run(uuidv4(), storeId, p.name, p.price, p.cost, p.stock, p.category, p.sku, now, now);
      }
    });

    insertMany(products);

    console.log('[DB] Default data seeded - Store:', storeId);
    console.log('[DB] Admin login: admin@manoverde.com / admin123');
    console.log('[DB] Admin PIN: 1234');
  }
}

// ============================================================
// Helper Functions
// ============================================================

// --- Stores ---
function getStore(id) {
  return db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
}

function getAllStores() {
  return db.prepare('SELECT * FROM stores ORDER BY created_at DESC').all();
}

function updateStore(id, fields) {
  const sets = [];
  const values = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key !== 'id' && key !== 'created_at') {
      sets.push(`${key} = ?`);
      values.push(value);
    }
  }
  sets.push("updated_at = datetime('now')");
  values.push(id);
  return db.prepare(`UPDATE stores SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

// --- Users ---
function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(id);
}

function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
}

function getUserByPin(pin) {
  return db.prepare('SELECT * FROM users WHERE pin = ? AND is_active = 1').get(pin);
}

function getUsersByStore(storeId) {
  return db.prepare(
    'SELECT id, store_id, name, email, role, pin, phone, is_active, created_at, updated_at FROM users WHERE store_id = ? ORDER BY created_at DESC'
  ).all(storeId);
}

function createUser(user) {
  const now = new Date().toISOString();
  return db.prepare(`
    INSERT INTO users (id, store_id, name, email, password_hash, role, pin, phone, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id, user.store_id, user.name, user.email, user.password_hash,
    user.role, user.pin || null, user.phone || null, user.is_active !== undefined ? user.is_active : 1,
    now, now
  );
}

function updateUser(id, fields) {
  const sets = [];
  const values = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key !== 'id' && key !== 'created_at') {
      sets.push(`${key} = ?`);
      values.push(value);
    }
  }
  sets.push("updated_at = datetime('now')");
  values.push(id);
  return db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

// --- Products ---
function getProducts(storeId) {
  return db.prepare(
    'SELECT * FROM products WHERE store_id = ? AND is_active = 1 ORDER BY category, name'
  ).all(storeId);
}

function getProductById(id) {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

function createProduct(product) {
  const now = new Date().toISOString();
  return db.prepare(`
    INSERT INTO products (id, store_id, name, price, cost, stock, category, sku, barcode, image_url, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    product.id, product.store_id, product.name, product.price, product.cost || 0,
    product.stock || 0, product.category || null, product.sku || null,
    product.barcode || null, product.image_url || null, 1, now, now
  );
}

function updateProduct(id, fields) {
  const sets = [];
  const values = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key !== 'id' && key !== 'created_at' && key !== 'store_id') {
      sets.push(`${key} = ?`);
      values.push(value);
    }
  }
  sets.push("updated_at = datetime('now')");
  values.push(id);
  return db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

function updateProductStock(id, quantityChange) {
  return db.prepare(`
    UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?
  `).run(quantityChange, id);
}

// --- Orders ---
function getOrders(storeId, date) {
  if (date) {
    return db.prepare(
      "SELECT * FROM orders WHERE store_id = ? AND DATE(created_at) = ? ORDER BY created_at DESC"
    ).all(storeId, date);
  }
  return db.prepare(
    'SELECT * FROM orders WHERE store_id = ? ORDER BY created_at DESC'
  ).all(storeId);
}

function getOrderById(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

function createOrder(order) {
  const now = new Date().toISOString();
  return db.prepare(`
    INSERT INTO orders (id, store_id, user_id, items, subtotal, discount, tax, total, payment_method, status, synced, device_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    order.id, order.store_id, order.user_id, order.items,
    order.subtotal, order.discount || 0, order.tax || 0, order.total,
    order.payment_method || 'cash', order.status || 'paid', 0,
    order.device_id || null, now, now
  );
}

function updateOrder(id, fields) {
  const sets = [];
  const values = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key !== 'id' && key !== 'created_at' && key !== 'store_id') {
      sets.push(`${key} = ?`);
      values.push(value);
    }
  }
  sets.push("updated_at = datetime('now')");
  values.push(id);
  return db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

// --- Stock Moves ---
function getStockMoves(storeId, productId) {
  if (productId) {
    return db.prepare(
      'SELECT * FROM stock_moves WHERE store_id = ? AND product_id = ? ORDER BY created_at DESC'
    ).all(storeId, productId);
  }
  return db.prepare(
    'SELECT * FROM stock_moves WHERE store_id = ? ORDER BY created_at DESC'
  ).all(storeId);
}

function createStockMove(move) {
  const now = new Date().toISOString();
  return db.prepare(`
    INSERT INTO stock_moves (id, store_id, product_id, type, qty, reason, user_id, synced, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    move.id, move.store_id, move.product_id, move.type, move.qty,
    move.reason || null, move.user_id || null, 0, now
  );
}

// --- Sync Queue ---
function addToSyncQueue(entry) {
  const now = new Date().toISOString();
  return db.prepare(`
    INSERT INTO sync_queue (id, entity_type, entity_id, operation, data, device_id, store_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.id, entry.entity_type, entry.entity_id, entry.operation,
    typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data),
    entry.device_id || null, entry.store_id || null, now
  );
}

function getSyncQueuePending(storeId) {
  return db.prepare(
    'SELECT * FROM sync_queue WHERE store_id = ? AND synced_at IS NULL ORDER BY created_at ASC'
  ).all(storeId);
}

function getSyncQueueSince(storeId, since) {
  return db.prepare(
    'SELECT * FROM sync_queue WHERE store_id = ? AND created_at > ? ORDER BY created_at ASC'
  ).all(storeId, since);
}

function markSynced(id) {
  return db.prepare(
    "UPDATE sync_queue SET synced_at = datetime('now') WHERE id = ?"
  ).run(id);
}

function getSyncStatus(storeId) {
  const pending = db.prepare(
    'SELECT COUNT(*) AS count FROM sync_queue WHERE store_id = ? AND synced_at IS NULL'
  ).get(storeId);
  const lastSync = db.prepare(
    'SELECT MAX(synced_at) AS last_synced_at FROM sync_queue WHERE store_id = ? AND synced_at IS NOT NULL'
  ).get(storeId);
  return {
    pending_count: pending.count,
    last_synced_at: lastSync.last_synced_at || null,
  };
}

// --- Transactions ---
function runTransaction(fn) {
  const transaction = db.transaction(fn);
  return transaction();
}

// ============================================================
// Exports
// ============================================================
module.exports = {
  initDatabase,
  getDb: () => db,

  // Stores
  getStore,
  getAllStores,
  updateStore,

  // Users
  getUserById,
  getUserByEmail,
  getUserByPin,
  getUsersByStore,
  createUser,
  updateUser,

  // Products
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,

  // Orders
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,

  // Stock Moves
  getStockMoves,
  createStockMove,

  // Sync
  addToSyncQueue,
  getSyncQueuePending,
  getSyncQueueSince,
  markSynced,
  getSyncStatus,

  // Utilities
  runTransaction,
};
