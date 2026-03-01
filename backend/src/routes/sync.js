// ============================================================
// POS Mano Verde - Sync Routes
// ============================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
  addToSyncQueue, getSyncQueuePending, getSyncQueueSince,
  markSynced, getSyncStatus,
  getProductById, createProduct, updateProduct,
  getOrderById, createOrder, updateOrder,
  createStockMove, updateProductStock,
  runTransaction,
} = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { broadcastToStore } = require('../services/websocket');

const router = express.Router();

// All sync routes require authentication
router.use(authenticate);

// ============================================================
// POST /api/sync/push
// Receive sync_queue entries from clients and apply them
// Clients send changes they made offline, server applies them
// ============================================================
router.post('/push', (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Tableau d\'entries requis.' });
    }

    const results = [];
    const errors = [];

    runTransaction(() => {
      for (const entry of entries) {
        try {
          const { entity_type, entity_id, operation, data, device_id } = entry;

          if (!entity_type || !entity_id || !operation) {
            errors.push({ entry_id: entry.id, error: 'entity_type, entity_id et operation requis.' });
            continue;
          }

          // Apply the change based on entity type and operation
          applyChange(entity_type, entity_id, operation, data, req.user);

          // Record in sync queue
          addToSyncQueue({
            id: entry.id || uuidv4(),
            entity_type,
            entity_id,
            operation,
            data,
            device_id: device_id || null,
            store_id: req.user.store_id,
          });

          results.push({ entry_id: entry.id || entity_id, status: 'applied' });

          // Broadcast the change to other clients
          broadcastToStore(req.user.store_id, `${entity_type}:${operation === 'create' ? 'created' : 'updated'}`, {
            entity_type,
            entity_id,
            data,
          });
        } catch (err) {
          errors.push({ entry_id: entry.id, error: err.message });
        }
      }
    });

    res.json({
      applied: results.length,
      errors: errors.length,
      results,
      errors_detail: errors,
    });
  } catch (err) {
    console.error('[SYNC] Push error:', err);
    res.status(500).json({ error: 'Erreur lors de la synchronisation.' });
  }
});

// ============================================================
// GET /api/sync/pull?since=timestamp
// Returns all sync queue entries since a given timestamp
// Clients use this to get changes they missed while offline
// ============================================================
router.get('/pull', (req, res) => {
  try {
    const { since } = req.query;

    if (!since) {
      return res.status(400).json({ error: 'Parametre "since" requis (format ISO 8601).' });
    }

    const entries = getSyncQueueSince(req.user.store_id, since);

    // Parse data field
    const parsed = entries.map((entry) => ({
      ...entry,
      data: typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data,
    }));

    res.json({
      count: parsed.length,
      since,
      entries: parsed,
    });
  } catch (err) {
    console.error('[SYNC] Pull error:', err);
    res.status(500).json({ error: 'Erreur lors de la recuperation des modifications.' });
  }
});

// ============================================================
// GET /api/sync/status
// Returns sync status (pending count, last sync time)
// ============================================================
router.get('/status', (req, res) => {
  try {
    const status = getSyncStatus(req.user.store_id);
    res.json(status);
  } catch (err) {
    console.error('[SYNC] Status error:', err);
    res.status(500).json({ error: 'Erreur lors de la recuperation du statut de synchronisation.' });
  }
});

// ============================================================
// Apply a change to the database based on entity type
// ============================================================
function applyChange(entityType, entityId, operation, data, user) {
  const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

  switch (entityType) {
    case 'product':
      applyProductChange(entityId, operation, parsedData, user);
      break;
    case 'order':
      applyOrderChange(entityId, operation, parsedData, user);
      break;
    case 'stock_move':
      applyStockMoveChange(entityId, operation, parsedData, user);
      break;
    default:
      throw new Error(`Type d'entite non supporte: ${entityType}`);
  }
}

function applyProductChange(entityId, operation, data, user) {
  switch (operation) {
    case 'create': {
      const existing = getProductById(entityId);
      if (!existing) {
        createProduct({
          id: entityId,
          store_id: user.store_id,
          name: data.name,
          price: data.price || 0,
          cost: data.cost || 0,
          stock: data.stock || 0,
          category: data.category || null,
          sku: data.sku || null,
          barcode: data.barcode || null,
          image_url: data.image_url || null,
        });
      }
      break;
    }
    case 'update': {
      const existing = getProductById(entityId);
      if (existing) {
        updateProduct(entityId, data);
      }
      break;
    }
    case 'delete': {
      const existing = getProductById(entityId);
      if (existing) {
        updateProduct(entityId, { is_active: 0 });
      }
      break;
    }
    default:
      throw new Error(`Operation non supportee pour product: ${operation}`);
  }
}

function applyOrderChange(entityId, operation, data, user) {
  switch (operation) {
    case 'create': {
      const existing = getOrderById(entityId);
      if (!existing) {
        createOrder({
          id: entityId,
          store_id: user.store_id,
          user_id: data.user_id || user.id,
          items: typeof data.items === 'string' ? data.items : JSON.stringify(data.items || []),
          subtotal: data.subtotal || data.total || 0,
          discount: data.discount || 0,
          tax: data.tax || 0,
          total: data.total || 0,
          payment_method: data.payment_method || 'cash',
          status: data.status || 'paid',
          device_id: data.device_id || null,
        });
      }
      break;
    }
    case 'update': {
      const existing = getOrderById(entityId);
      if (existing) {
        updateOrder(entityId, data);
      }
      break;
    }
    default:
      throw new Error(`Operation non supportee pour order: ${operation}`);
  }
}

function applyStockMoveChange(entityId, operation, data, user) {
  if (operation === 'create') {
    createStockMove({
      id: entityId,
      store_id: user.store_id,
      product_id: data.product_id,
      type: data.type,
      qty: data.qty,
      reason: data.reason || null,
      user_id: data.user_id || user.id,
    });

    // Also update product stock
    if (data.product_id && data.qty) {
      updateProductStock(data.product_id, data.qty);
    }
  } else {
    throw new Error(`Operation non supportee pour stock_move: ${operation}`);
  }
}

module.exports = router;
