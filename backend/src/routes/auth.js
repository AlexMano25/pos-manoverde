// ============================================================
// POS Mano Verde - Authentication Routes
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getUserByEmail, getUserByPin, createUser, getUserById } = require('../db/database');
const { generateToken, authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// POST /api/auth/login
// Login with email + password
// ============================================================
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const user = getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        store_id: user.store_id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

// ============================================================
// POST /api/auth/login/pin
// Quick login with PIN (for cashiers)
// ============================================================
router.post('/login/pin', (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: 'PIN requis.' });
    }

    const user = getUserByPin(pin.trim());
    if (!user) {
      return res.status(401).json({ error: 'PIN invalide.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        store_id: user.store_id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error('[AUTH] PIN login error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

// ============================================================
// GET /api/auth/me
// Get current authenticated user
// ============================================================
router.get('/me', authenticate, (req, res) => {
  try {
    const user = getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    res.json({
      id: user.id,
      store_id: user.store_id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      is_active: user.is_active,
      created_at: user.created_at,
    });
  } catch (err) {
    console.error('[AUTH] Get me error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

// ============================================================
// POST /api/auth/register
// Create a new user (admin only)
// ============================================================
router.post('/register', authenticate, authorize('admin'), (req, res) => {
  try {
    const { name, email, password, role, pin, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Nom, email, mot de passe et role requis.' });
    }

    const validRoles = ['admin', 'manager', 'cashier', 'stock'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role invalide. Roles acceptes: ${validRoles.join(', ')}` });
    }

    // Check for existing email
    const existing = getUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'Un utilisateur avec cet email existe deja.' });
    }

    // Check for existing PIN if provided
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
      created_at: newUser.created_at,
    });
  } catch (err) {
    console.error('[AUTH] Register error:', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

module.exports = router;
