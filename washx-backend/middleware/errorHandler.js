/**
 * Centralized Express Error Handler Middleware
 */

function errorHandler(err, req, res, _next) {
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ error: 'CORS: request blocked' });
  }

  // Joi validation error
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details ? err.details.map((d) => d.message) : [err.message],
    });
  }

  // Prisma unique constraint violation or error
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'A record with this field already exists',
      target: err.meta?.target,
    });
  }

  console.error('[UNHANDLED ERROR]', err.message, err.stack?.split('\n')[1] || '');
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
