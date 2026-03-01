// ============================================================
// POS Mano Verde - Order Routes
// ============================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
  getOrders, getOrderById, createOrder, updateOrder,
  getProductById, updateProductStock,
  createStockMove, addToSyncQueue, runTransaction,
} = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { broadcastToStore } = require('../services/websocket');

const router = express.Router();

// All order routes require authentication
router.use(authenticate);

// ============================================================
// GET /api/orders
// List orders for the user's store
// Supports ?date=YYYY-MM-DD filter
// ============================================================
router.get('/', (req, res) => {
  try {
    const { date } = req.query;
    const orders = getOrders(req.user.store_id, date || null);

    // Parse items JSON for each order
    const parsed = orders.map((order) => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    }));

    res.json(parsed);
  } catch (err) {
    console.error('[ORDERS] List error:', err);
    res.status(500).json({ error: 'Erreur lors de la recuperation des commandes.' });
  }
});

// ============================================================
// GET /api/orders/:id
// Get a single order by ID
// ============================================================
router.get('/:id', (req, res) => {
  try {
    const order = getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    if (order.store_id !== req.user.store_id) {
      return res.status(403).json({ error: 'Acces refuse a cette commande.' });
    }

    res.json({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    });
  } catch (err) {
    console.error('[ORDERS] Get error:', err);
    res.status(500).json({ error: 'Erreur lors de la recuperation de la commande.' });
  }
});

// ============================================================
// POST /api/orders
// Create a new order
// - Validates all items exist and have sufficient stock
// - Decrements product stock
// - Creates stock_moves of type 'sale'
// - Adds to sync queue
// ============================================================
router.post('/', (req, res) => {
  try {
    const { items, subtotal, discount, tax, total, payment_method, device_id } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'La commande doit contenir au moins un article.' });
    }

    if (total === undefined || total === null) {
      return res.status(400).json({ error: 'Le total est requis.' });
    }

    const orderId = uuidv4();

    // Validate items and compute within a transaction
    runTransaction(() => {
      // Validate each item
      for (const item of items) {
        const itemQty = item.qty || item.quantity;
        if (!item.product_id || !itemQty || itemQty <= 0) {
          throw new Error(`Article invalide: product_id et qty requis (qty > 0).`);
        }

        const product = getProductById(item.product_id);
        if (!product) {
          throw new Error(`Produit introuvable: ${item.product_id}`);
        }

        if (product.store_id !== req.user.store_id) {
          throw new Error(`Produit n'appartient pas a ce magasin: ${item.product_id}`);
        }

        if (product.stock < itemQty) {
          throw new Error(`Stock insuffisant pour "${product.name}": ${product.stock} disponible(s), ${itemQty} demande(s).`);
        }

        // Decrement stock
        updateProductStock(item.product_id, -itemQty);

        // Create stock move for the sale
        createStockMove({
          id: uuidv4(),
          store_id: req.user.store_id,
          product_id: item.product_id,
          type: 'sale',
          qty: -itemQty,
          reason: `Vente - Commande ${orderId}`,
          user_id: req.user.id,
        });
      }

      // Create the order
      createOrder({
        id: orderId,
        store_id: req.user.store_id,
        user_id: req.user.id,
        items: JSON.stringify(items),
        subtotal: subtotal || total,
        discount: discount || 0,
        tax: tax || 0,
        total,
        payment_method: payment_method || 'cash',
        status: 'paid',
        device_id: device_id || null,
      });

      // Add to sync queue
      addToSyncQueue({
        id: uuidv4(),
        entity_type: 'order',
        entity_id: orderId,
        operation: 'create',
        data: { id: orderId, items, total, payment_method },
        store_id: req.user.store_id,
      });
    });

    const order = getOrderById(orderId);

    // Broadcast to store
    broadcastToStore(req.user.store_id, 'order:created', {
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    });

    // Also broadcast updated stock levels
    for (const item of items) {
      const updated = getProductById(item.product_id);
      if (updated) {
        broadcastToStore(req.user.store_id, 'stock:updated', {
          product_id: updated.id,
          name: updated.name,
          stock: updated.stock,
        });
      }
    }

    res.status(201).json({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    });
  } catch (err) {
    console.error('[ORDERS] Create error:', err);
    // Transaction errors include our validation messages
    if (err.message && !err.message.includes('SQLITE')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erreur lors de la creation de la commande.' });
  }
});

// ============================================================
// PATCH /api/orders/:id
// Update order status (refund, cancel)
// ============================================================
router.patch('/:id', (req, res) => {
  try {
    const order = getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    if (order.store_id !== req.user.store_id) {
      return res.status(403).json({ error: 'Acces refuse a cette commande.' });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Le statut est requis.' });
    }

    const validStatuses = ['paid', 'refunded', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Statut invalide. Statuts acceptes: ${validStatuses.join(', ')}` });
    }

    // If refunding or cancelling, restore stock
    if ((status === 'refunded' || status === 'cancelled') && order.status === 'paid') {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

      runTransaction(() => {
        for (const item of items) {
          const itemQty = item.qty || item.quantity;
          // Restore stock
          updateProductStock(item.product_id, itemQty);

          // Create stock move for the refund/cancel
          createStockMove({
            id: uuidv4(),
            store_id: req.user.store_id,
            product_id: item.product_id,
            type: status === 'refunded' ? 'refund' : 'cancel',
            qty: itemQty,
            reason: `${status === 'refunded' ? 'Remboursement' : 'Annulation'} - Commande ${order.id}`,
            user_id: req.user.id,
          });
        }

        updateOrder(req.params.id, { status });

        // Add to sync queue
        addToSyncQueue({
          id: uuidv4(),
          entity_type: 'order',
          entity_id: req.params.id,
          operation: 'update',
          data: { status },
          store_id: req.user.store_id,
        });
      });

      // Broadcast stock updates
      for (const item of items) {
        const updated = getProductById(item.product_id);
        if (updated) {
          broadcastToStore(req.user.store_id, 'stock:updated', {
            product_id: updated.id,
            name: updated.name,
            stock: updated.stock,
          });
        }
      }
    } else {
      updateOrder(req.params.id, { status });

      addToSyncQueue({
        id: uuidv4(),
        entity_type: 'order',
        entity_id: req.params.id,
        operation: 'update',
        data: { status },
        store_id: req.user.store_id,
      });
    }

    const updated = getOrderById(req.params.id);

    broadcastToStore(req.user.store_id, 'order:updated', {
      ...updated,
      items: typeof updated.items === 'string' ? JSON.parse(updated.items) : updated.items,
    });

    res.json({
      ...updated,
      items: typeof updated.items === 'string' ? JSON.parse(updated.items) : updated.items,
    });
  } catch (err) {
    console.error('[ORDERS] Update error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise a jour de la commande.' });
  }
});

module.exports = router;
