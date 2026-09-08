const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// ── Startup validation ────────────────────────────────────────────────────────
const { validateEnv } = require('./middleware/envValidator');
validateEnv();

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const orderRoutes       = require('./routes/orders');
const slotRoutes        = require('./routes/slots');
const cityRoutes        = require('./routes/cities');
const paymentRoutes     = require('./routes/payments');
const adminRoutes       = require('./routes/admin');
const { router: adminAuthRoutes } = require('./routes/adminAuth');
const agentRoutes       = require('./routes/agent');
const catalogRoutes     = require('./routes/catalog');
const subscriptionRoutes = require('./routes/subscriptions');
const webhookRoutes     = require('./routes/webhooks');
const couponRoutes      = require('./routes/coupons');
const { router: referralRoutes } = require('./routes/referrals');

// ── Logging ───────────────────────────────────────────────────────────────────
const { requestLogger } = require('./middleware/auditLogger');

const app    = express();
const server = http.createServer(app);

// ── CORS — strict whitelist ───────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL   || 'http://localhost:3000',
  process.env.AGENT_URL      || 'http://localhost:3001',
  process.env.ADMIN_URL      || 'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Allow server-to-server (no origin) and whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
};

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] },
});

// ── Security Headers (helmet) ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API (not serving HTML)
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));

// ── Global Rate Limit — 120 req/min/IP ───────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.', retryAfterSeconds: 60 },
  skip: (req) => req.path === '/health',
});
app.use(globalLimiter);

// ── Body parsers with size limits ─────────────────────────────────────────────
// Webhooks need raw body for HMAC verification — must come BEFORE json parser
app.use('/api/webhooks', express.raw({ type: 'application/json', limit: '512kb' }));

// All other routes get parsed JSON (1MB limit)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Request Logger ────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Inject io into all requests ───────────────────────────────────────────────
app.use((req, _res, next) => { req.io = io; next(); });

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/slots',         slotRoutes);
app.use('/api/cities',        cityRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/admin/auth',    adminAuthRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/agent',         agentRoutes);
app.use('/api/catalog',       catalogRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/webhooks',      webhookRoutes);
app.use('/api/coupons',       couponRoutes);
app.use('/api/referrals',     referralRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'WashX API', ts: new Date().toISOString() }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join_order', (orderId) => { if (orderId) socket.join(`order_${orderId}`); });
  socket.on('disconnect', () => {});
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const { ensureDb } = require('./scripts/ensure-db');
const PORT = process.env.PORT || 5000;

async function bootstrap() {
  if (process.env.NODE_ENV !== 'production' && (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost'))) {
    try { await ensureDb(); } catch (err) { console.warn('Local DB check:', err.message); }
  }

  // Start cron jobs
  try {
    const { startCronJobs } = require('./services/cronService');
    startCronJobs();
  } catch (err) {
    console.warn('Cron jobs not started:', err.message);
  }

  server.listen(PORT, () => console.log(`🚀 WashX API running on port ${PORT}`));
}

bootstrap();
module.exports = { app, io };
