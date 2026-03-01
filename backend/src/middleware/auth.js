// ============================================================
// POS Mano Verde - JWT Authentication Middleware
// ============================================================

const jwt = require('jsonwebtoken');
const { getUserById } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'pos-manoverde-secret-key';
const TOKEN_EXPIRY = '24h';

// ============================================================
// Generate JWT token for a user
// ============================================================
function generateToken(user) {
  const payload = {
    id: user.id,
    store_id: user.store_id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// ============================================================
// Authenticate middleware
// Extracts and verifies JWT from Authorization header
// ============================================================
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token requis. Ajoutez Authorization: Bearer <token>' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Format de token invalide. Utilisez: Bearer <token>' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch fresh user data from DB to ensure user still exists and is active
    const user = getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable ou desactive' });
    }

    // Attach user info to request (exclude password_hash)
    req.user = {
      id: user.id,
      store_id: user.store_id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      is_active: user.is_active,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expire. Veuillez vous reconnecter.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide.' });
    }
    return res.status(401).json({ error: 'Erreur d\'authentification.' });
  }
}

// ============================================================
// Authorization middleware - restrict to specific roles
// Usage: authorize('admin', 'manager')
// ============================================================
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acces refuse. Roles autorises: ${roles.join(', ')}. Votre role: ${req.user.role}`,
      });
    }

    next();
  };
}

// ============================================================
// Exports
// ============================================================
module.exports = {
  generateToken,
  authenticate,
  authorize,
  JWT_SECRET,
};
