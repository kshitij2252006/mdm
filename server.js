'use strict';
require('dotenv').config();

const express      = require('express');
const http         = require('http');
const cors         = require('cors');
const { Server }   = require('socket.io');

const authRoutes      = require('./routes/auth');
const shipmentRoutes  = require('./routes/shipments');
const analyticsRoutes = require('./routes/analytics');
const { initTracking } = require('./sockets/tracking');
const trackingSvc     = require('./services/trackingService');

const app    = express();
const server = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});

trackingSvc.init(io);
initTracking(io);

// ── Middleware ────────────────────────────────────────────────
const allowedOrigin = process.env.CLIENT_URL;
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    if (isLocalhost || !allowedOrigin || origin === allowedOrigin) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/shipments',  shipmentRoutes);
app.use('/api/analytics',  analyticsRoutes);

// Health check — useful for deployment platforms
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── 404 + error handlers ──────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`SwiftDelivery API running on http://localhost:${PORT}`);
});