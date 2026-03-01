// ============================================================
// POS Mano Verde - Stock Routes
// ============================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
  getProducts, getProductById, getStockMoves,
  createStockMove, updateProductStock, addToSyncQueue,
} = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');
const { broadcastToStore } = require('../services/websocket');

const router = express.Router();

// All stock routes require authentication
router.use(authenticate);

// ============================================================
// GET /api/stock
// Get stock levels for all active products in the store
// ============================================================
router.get('/', (req, res) => {
  try {
    const products = getProducts(req.user.store_id);

    const stockLevels = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      stock: p.stock,
      price: p.price,
      cost: p.cost,
      is_active: p.is_active,
      updated_at: p.updated_at,
    }));

    res.json(stockLevels);
  } catch (err) {
    console.error('[STOCK] List error:', err);
    res.status(500).json({ error: 'Erreur lors de la recuperation du stock.' });
  }
});

// ============================================================
// GET /api/stock/moves
// Get stock movement history
// Supports ?product_id=xxx filter
// ============================================================
router.get('/moves', (req, res) => {
  try {
    const { product_id } = req.query;
    const moves = getStockMoves(req.user.store_id, product_id || null);
    res.json(moves);
  } catch (err) {
    console.error('[STOCK] Moves list error:', err);
    res.status(500).json({ error: 'Erreur lors de la recuperation des mouvements de stock.' });
  }
});

// ============================================================
// POST /api/stock/moves
// Create a stock movement (adjustment)
// Types: 'in' (restock), 'out' (manual removal), 'adjustment', 'loss', 'transfer'
// ============================================================
router.post('/moves', authorize('admin', 'manager', 'stock'), (req, res) => {
  try {
    const { product_id, type, qty, reason } = req.body;

    if (!product_id || !type || qty === undefined || qty === null) {
      return res.status(400).json({ error: 'product_id, type et qty requis.' });
    }

    const validTypes = ['in', 'out', 'adjustment', 'loss', 'transfer', 'return'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Type invalide. Types acceptes: ${validTypes.join(', ')}` });
    }

    if (typeof qty !== 'number' || qty === 0) {
      return res.status(400).json({ error: 'La quantite doit etre un nombre different de zero.' });
    }

    const product = getProductById(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    if (product.store_id !== req.user.store_id) {
      return res.status(403).json({ error: 'Acces refuse a ce produit.' });
    }

    // Determine stock change direction based on type
    let stockChange;
    if (type === 'in' || type === 'return') {
      stockChange = Math.abs(qty);
    } else if (type === 'out' || type === 'loss') {
      stockChange = -Math.abs(qty);
    } else {
      // adjustment and transfer: use qty as-is (positive = add, negative = remove)
      stockChange = qty;
    }

    // Check if removal would result in negative stock
    if (stockChange < 0 && product.stock + stockChange < 0) {
      return res.status(400).json({
        error: `Stock insuffisant. Stock actuel: ${product.stock}, modification demandee: ${stockChange}`,
      });
    }

    const moveId = uuidv4();

    // Update product stock
    updateProductStock(product_id, stockChange);

    // Record the stock move
    createStockMove({
      id: moveId,
      store_id: req.user.store_id,
      product_id,
      type,
      qty: stockChange,
      reason: reason || null,
      user_id: req.user.id,
    });

    // Add to sync queue
    addToSyncQueue({
      id: uuidv4(),
      entity_type: 'stock_move',
      entity_id: moveId,
      operation: 'create',
      data: { product_id, type, qty: stockChange, reason },
      store_id: req.user.store_id,
    });

    const updatedProduct = getProductById(product_id);

    // Broadcast stock update
    broadcastToStore(req.user.store_id, 'stock:updated', {
      product_id: updatedProduct.id,
      name: updatedProduct.name,
      stock: updatedProduct.stock,
      move: {
        id: moveId,
        type,
        qty: stockChange,
        reason,
      },
    });

    res.status(201).json({
      id: moveId,
      product_id,
      product_name: updatedProduct.name,
      type,
      qty: stockChange,
      reason,
      new_stock: updatedProduct.stock,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[STOCK] Create move error:', err);
    res.status(500).json({ error: 'Erreur lors de la creation du mouvement de stock.' });
  }
});

module.exports = router;
