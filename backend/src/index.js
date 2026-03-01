// ============================================================
// POS Mano Verde - Main Entry Point
// ============================================================

const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');

// Initialize database (must come before routes that use it)
const { initDatabase, getAllStores } = require('./db/database');
const db = initDatabase();

// Import services
const { setupWebSocket, getConnectedClients } = require('./services/websocket');
const { startMDNS, stopMDNS } = require('./services/mdns');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const stockRoutes = require('./routes/stock');
const userRoutes = require('./routes/users');
const syncRoutes = require('./routes/sync');

// ============================================================
// Express App Setup
// ============================================================
const app = express();
const server = http.createServer(app);

// CORS - allow all origins (local network usage)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// Serve static frontend files (if they exist)
// ============================================================
const frontendPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  console.log('[SERVER] Serving frontend from', frontendPath);
}

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sync', syncRoutes);

// ============================================================
// Health check / Server info
// ============================================================
app.get('/api/health', (req, res) => {
  const stores = getAllStores();
  const store = stores[0] || {};
  res.json({
    status: 'ok',
    server: 'POS Mano Verde',
    version: '1.0.0',
    store: {
      id: store.id,
      name: store.name,
    },
    uptime: Math.floor(process.uptime()),
    connected_clients: store.id ? getConnectedClients(store.id) : 0,
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  // If frontend exists, serve it; otherwise show API info
  if (fs.existsSync(path.join(frontendPath, 'index.html'))) {
    return res.sendFile(path.join(frontendPath, 'index.html'));
  }

  res.json({
    message: 'POS Mano Verde - API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      stock: '/api/stock',
      users: '/api/users',
      sync: '/api/sync',
    },
  });
});

// SPA fallback - serve index.html for any unmatched routes (if frontend exists)
// Express 5 requires named wildcard parameters instead of bare '*'
app.get('{*path}', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Route API introuvable.' });
  }

  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  res.status(404).json({ error: 'Route introuvable.' });
});

// ============================================================
// Setup WebSocket (Socket.IO)
// ============================================================
setupWebSocket(server);

// ============================================================
// Get local network addresses
// ============================================================
function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const [name, netInterfaces] of Object.entries(interfaces)) {
    for (const net of netInterfaces) {
      // Skip internal/loopback and IPv6
      if (!net.internal && net.family === 'IPv4') {
        addresses.push({
          interface: name,
          address: net.address,
        });
      }
    }
  }

  return addresses;
}

// ============================================================
// Start Server
// ============================================================
const PORT = parseInt(process.env.PORT, 10) || 4000;

server.listen(PORT, '0.0.0.0', () => {
  const stores = getAllStores();
  const storeName = stores[0]?.name || 'POS Store';

  console.log('');
  console.log('============================================================');
  console.log('  POS Mano Verde - Server Started');
  console.log('============================================================');
  console.log('');
  console.log(`  Local:    http://localhost:${PORT}`);

  const addresses = getNetworkAddresses();
  if (addresses.length > 0) {
    for (const addr of addresses) {
      console.log(`  Network:  http://${addr.address}:${PORT}  (${addr.interface})`);
    }
  } else {
    console.log('  Network:  No network interfaces detected');
  }

  console.log('');
  console.log(`  Store:    ${storeName}`);
  console.log(`  Database: ${path.join(__dirname, '../pos.db')}`);
  console.log('');
  console.log('  API:      /api/health');
  console.log('  Auth:     /api/auth/login');
  console.log('  Products: /api/products');
  console.log('  Orders:   /api/orders');
  console.log('  Stock:    /api/stock');
  console.log('  Users:    /api/users');
  console.log('  Sync:     /api/sync');
  console.log('');
  console.log('  WebSocket: Enabled (Socket.IO)');
  console.log('');
  console.log('  Default login:');
  console.log('    Email: admin@manoverde.com');
  console.log('    Password: admin123');
  console.log('    PIN: 1234');
  console.log('');
  console.log('============================================================');
  console.log('');

  // Start mDNS service discovery
  startMDNS(storeName, PORT);
});

// ============================================================
// Graceful shutdown
// ============================================================
function gracefulShutdown(signal) {
  console.log(`\n[SERVER] Received ${signal}. Shutting down gracefully...`);

  // Stop mDNS
  stopMDNS();

  // Close HTTP server
  server.close(() => {
    console.log('[SERVER] HTTP server closed.');

    // Close database
    const database = require('./db/database').getDb();
    if (database) {
      database.close();
      console.log('[SERVER] Database connection closed.');
    }

    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[SERVER] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('[SERVER] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[SERVER] Unhandled rejection:', reason);
});

module.exports = { app, server };
