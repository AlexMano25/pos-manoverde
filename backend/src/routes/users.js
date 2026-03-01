// ============================================================
// POS Mano Verde - User Management Routes
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const {
  getUsersByStore, getUserById, getUserByEmail, getUserByPin,
  createUser, updateUser,
} = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// ============================================================
// GET /api/users
// List all users for the store (manager+ only)
// ============================================================
router.get('/', authorize('admin', 'manager'), (req, res) => {
  try {
    const users = getUsersByStore(req.user.store_id);
    res.json(users);
  } catch (err) {
    console.error('[USERS] List error:', err);
    res.status(500).json({ error: 'Erreur lors de la recuperation des utilisateurs.' });
  }
});

// ============================================================
// POST /api/users
// Create a new user (manager+ only)
// ============================================================
router.post('/', authorize('admin', 'manager'), (req, res) => {
  try {
    const { name, email, password, role, pin, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Nom, email, mot de passe et role requis.' });
    }

    const validRoles = ['admin', 'manager', 'cashier', 'stock'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role invalide. Roles acceptes: ${validRoles.join(', ')}` });
    }

    // Only admin can create admin or manager users
    if ((role === 'admin' || role === 'manager') && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Seul un admin peut creer des utilisateurs admin ou manager.' });
    }

    // Check existing email
    const existing = getUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'Un utilisateur avec cet email existe deja.' });
    }

    // Check existing PIN
    if (pin) {
      const existingPin = getUserByPin(pin);
      if (existingPin) {
        return res.status(409).json({ error: 'Ce PIN est deja utilise par un autre utilisateur.' });
      }
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    createUser({
      id,
      store_id: req.user.store_id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      role,
      pin: pin || null,
      phone: phone || null,
    });

    const newUser = getUserById(id);

    res.status(201).json({
      id: newUser.id,
      store_id: newUser.store_id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      pin: newUser.pin,
      is_active: newUser.is_active,
      created_at: newUser.created_at,
    });
  } catch (err) {
    console.error('[USERS] Create error:', err);
    res.status(500).json({ error: 'Erreur lors de la creation de l\'utilisateur.' });
  }
});

// ============================================================
// PATCH /api/users/:id
// Update a user (manager+ only)
// ============================================================
router.patch('/:id', authorize('admin', 'manager'), (req, res) => {
  try {
    const user = getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    if (user.store_id !== req.user.store_id) {
      return res.status(403).json({ error: 'Acces refuse a cet utilisateur.' });
    }

    // Managers cannot edit admins
    if (req.user.role === 'manager' && user.role === 'admin') {
      return res.status(403).json({ error: 'Un manager ne peut pas modifier un admin.' });
    }

    const allowedFields = ['name', 'email', 'role', 'pin', 'phone', 'is_active'];
    const updateFields = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    }

    // Handle password change
    if (req.body.password) {
      updateFields.password_hash = bcrypt.hashSync(req.body.password, 10);
    }

    // Validate role if being changed
    if (updateFields.role) {
      const validRoles = ['admin', 'manager', 'cashier', 'stock'];
      if (!validRoles.includes(updateFields.role)) {
        return res.status(400).json({ error: `Role invalide. Roles acceptes: ${validRoles.join(', ')}` });
      }
      // Only admin can promote to admin/manager
      if ((updateFields.role === 'admin' || updateFields.role === 'manager') && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Seul un admin peut attribuer le role admin ou manager.' });
      }
    }

    // Check email uniqueness if being changed
    if (updateFields.email) {
      updateFields.email = updateFields.email.toLowerCase().trim();
      const existing = getUserByEmail(updateFields.email);
      if (existing && existing.id !== req.params.id) {
        return res.status(409).json({ error: 'Un utilisateur avec cet email existe deja.' });
      }
    }

    // Check PIN uniqueness if being changed
    if (updateFields.pin) {
      const existingPin = getUserByPin(updateFields.pin);
      if (existingPin && existingPin.id !== req.params.id) {
        return res.status(409).json({ error: 'Ce PIN est deja utilise par un autre utilisateur.' });
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'Aucun champ a mettre a jour.' });
    }

    updateUser(req.params.id, updateFields);

    const updated = getUserById(req.params.id);

    res.json({
      id: updated.id,
      store_id: updated.store_id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      phone: updated.phone,
      pin: updated.pin,
      is_active: updated.is_active,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    });
  } catch (err) {
    console.error('[USERS] Update error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise a jour de l\'utilisateur.' });
  }
});

// ============================================================
// DELETE /api/users/:id
// Deactivate a user (admin only) - soft delete
// ============================================================
router.delete('/:id', authorize('admin'), (req, res) => {
  try {
    const user = getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    if (user.store_id !== req.user.store_id) {
      return res.status(403).json({ error: 'Acces refuse a cet utilisateur.' });
    }

    // Prevent self-deactivation
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas desactiver votre propre compte.' });
    }

    updateUser(req.params.id, { is_active: 0 });

    res.json({ success: true, message: 'Utilisateur desactive.' });
  } catch (err) {
    console.error('[USERS] Delete error:', err);
    res.status(500).json({ error: 'Erreur lors de la desactivation de l\'utilisateur.' });
  }
});

module.exports = router;
