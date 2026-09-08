/**
 * WashX In-Memory Rate Limiter
 * Protects auth endpoints from brute-force attacks.
 * Max 5 attempts per IP per 10 minutes.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

// Map<ip -> { count, resetAt }>
const store = new Map();

// Cleanup expired entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(ip);
  }
}, 15 * 60 * 1000);

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    // Fresh window
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  entry.count += 1;

  if (entry.count > MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.set('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'Too many attempts. Please try again later.',
      retryAfterSeconds: retryAfter,
    });
  }

  next();
}

module.exports = rateLimiter;
