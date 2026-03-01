// ============================================================
// POS Mano Verde - WebSocket (Socket.IO) Service
// ============================================================

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { getUserById } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'pos-manoverde-secret-key';

let io = null;

// ============================================================
// Setup WebSocket server
// ============================================================
function setupWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    // Optimize for local network
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Token d\'authentification requis.'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = getUserById(decoded.id);

      if (!user) {
        return next(new Error('Utilisateur introuvable ou desactive.'));
      }

      // Attach user info to socket
      socket.user = {
        id: user.id,
        store_id: user.store_id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (err) {
      return next(new Error('Token invalide ou expire.'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const { user } = socket;
    console.log(`[WS] Client connected: ${user.name} (${user.role}) - Store: ${user.store_id}`);

    // Join the store room so we can broadcast per-store
    socket.join(`store:${user.store_id}`);

    // Send welcome event
    socket.emit('connected', {
      message: `Bienvenue ${user.name}`,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      connectedAt: new Date().toISOString(),
    });

    // Notify other clients in the store
    socket.to(`store:${user.store_id}`).emit('user:joined', {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      timestamp: new Date().toISOString(),
    });

    // ---- Event Handlers ----

    // Client requests sync
    socket.on('sync:request', (data) => {
      console.log(`[WS] Sync request from ${user.name}:`, data);
      // Broadcast to other clients that a sync was requested
      socket.to(`store:${user.store_id}`).emit('sync:requested', {
        requestedBy: user.name,
        timestamp: new Date().toISOString(),
      });
    });

    // Client sends a ping (keep-alive)
    socket.on('ping:client', () => {
      socket.emit('pong:server', { timestamp: new Date().toISOString() });
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.log(`[WS] Client disconnected: ${user.name} - Reason: ${reason}`);

      // Notify other clients
      socket.to(`store:${user.store_id}`).emit('user:left', {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
        reason,
        timestamp: new Date().toISOString(),
      });
    });

    // Error handler
    socket.on('error', (err) => {
      console.error(`[WS] Socket error for ${user.name}:`, err);
    });
  });

  console.log('[WS] WebSocket server initialized');
  return io;
}

// ============================================================
// Broadcast to all clients in a specific store
// ============================================================
function broadcastToStore(storeId, event, data) {
  if (!io) {
    // Socket.IO not yet initialized, skip silently
    return;
  }

  io.to(`store:${storeId}`).emit(event, {
    ...data,
    _timestamp: new Date().toISOString(),
  });
}

// ============================================================
// Get connected clients count for a store
// ============================================================
function getConnectedClients(storeId) {
  if (!io) return 0;
  const room = io.sockets.adapter.rooms.get(`store:${storeId}`);
  return room ? room.size : 0;
}

// ============================================================
// Exports
// ============================================================
module.exports = {
  setupWebSocket,
  broadcastToStore,
  getConnectedClients,
  getIO: () => io,
};
