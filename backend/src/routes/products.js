// ============================================================
// POS Mano Verde - Product Routes
// ============================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getProducts, getProductById, createProduct, updateProduct, addToSyncQueue } = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');
const { broadcastToStore } = require('../services/websocket');

const router = express.Router();

// All product routes require authentication
router.use(authenticate);

// ============================================================
// GET /api/products
// List all active products for the user's store
// ============================================================
router.get('/', (req, res) => {
  try {
    const products = getProducts(req.user.store_id);
    res.json(products);
  } catch (err) {
    console.error('[PRODUCTS] List error:', err);
    res.status(500).json({ error: 'Erreur lors de la recuperation des produits.' });
  }
});

// ============================================================
// GET /api/products/:id
// Get a single product by ID
// ============================================================
router.get('/:id', (req, res) => {
  try {
    const product = getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    // Ensure the product belongs to the user's store
    if (product.store_id !== req.user.store_id) {
      return res.status(403).json({ error: 'Acces refuse a ce produit.' });
    }

    res.json(product);
  } catch (err) {
    console.error('[PRODUCTS] Get error:', err);
    res.status(500).json({ error: 'Erreur lors de la recuperation du produit.' });
  }
});

// ============================================================
// POST /api/products
// Create a new product (manager+ only)
// ============================================================
router.post('/', authorize('admin', 'manager'), (req, res) => {
  try {
    const { name, price, cost, stock, category, sku, barcode, image_url } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ error: 'Nom et prix requis.' });
    }

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Le prix doit etre un nombre positif.' });
    }

    const id = uuidv4();
    const product = {
      id,
      store_id: req.user.store_id,
      name: name.trim(),
      price,
      cost: cost || 0,
      stock: stock || 0,
      category: category || null,
      sku: sku || null,
      barcode: barcode || null,
      image_url: image_url || null,
    };

    createProduct(product);

    // Add to sync queue
    addToSyncQueue({
      id: uuidv4(),
      entity_type: 'product',
      entity_id: id,
      operation: 'create',
      data: product,
      store_id: req.user.store_id,
    });

    const created = getProductById(id);

    // Broadcast to all connected clients in the store
    broadcastToStore(req.user.store_id, 'product:created', created);

    res.status(201).json(created);
  } catch (err) {
    console.error('[PRODUCTS] Create error:', err);
    res.status(500).json({ error: 'Erreur lors de la creation du produit.' });
  }
});

// ============================================================
// PATCH /api/products/:id
// Update a product (manager+ only)
// ============================================================
router.patch('/:id', authorize('admin', 'manager'), (req, res) => {
  try {
    const product = getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    if (product.store_id !== req.user.store_id) {
      return res.status(403).json({ error: 'Acces refuse a ce produit.' });
    }

    // Validate price if provided
    if (req.body.price !== undefined && (typeof req.body.price !== 'number' || req.body.price < 0)) {
      return res.status(400).json({ error: 'Le prix doit etre un nombre positif.' });
    }

    // Build update fields (only allow valid fields)
    const allowedFields = ['name', 'price', 'cost', 'stock', 'category', 'sku', 'barcode', 'image_url'];
    const updateFields = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'Aucun champ a mettre a jour.' });
    }

    updateProduct(req.params.id, updateFields);

    // Add to sync queue
    addToSyncQueue({
      id: uuidv4(),
      entity_type: 'product',
      entity_id: req.params.id,
      operation: 'update',
      data: updateFields,
      store_id: req.user.store_id,
    });

    const updated = getProductById(req.params.id);

    // Broadcast update
    broadcastToStore(req.user.store_id, 'product:updated', updated);

    res.json(updated);
  } catch (err) {
    console.error('[PRODUCTS] Update error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise a jour du produit.' });
  }
});

// ============================================================
// DELETE /api/products/:id
// Soft delete a product (set is_active = 0) (manager+ only)
// ============================================================
router.delete('/:id', authorize('admin', 'manager'), (req, res) => {
  try {
    const product = getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    if (product.store_id !== req.user.store_id) {
      return res.status(403).json({ error: 'Acces refuse a ce produit.' });
    }

    updateProduct(req.params.id, { is_active: 0 });

    // Add to sync queue
    addToSyncQueue({
      id: uuidv4(),
      entity_type: 'product',
      entity_id: req.params.id,
      operation: 'delete',
      data: { is_active: 0 },
      store_id: req.user.store_id,
    });

    // Broadcast deletion
    broadcastToStore(req.user.store_id, 'product:deleted', { id: req.params.id });

    res.json({ success: true, message: 'Produit desactive.' });
  } catch (err) {
    console.error('[PRODUCTS] Delete error:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression du produit.' });
  }
});

module.exports = router;
