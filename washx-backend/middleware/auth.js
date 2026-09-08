const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Check token blacklist (for logged-out or password-changed sessions)
    const blacklisted = await prisma.tokenBlacklist.findUnique({ where: { token } });
    if (blacklisted) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    // Prune expired blacklist entries (non-blocking)
    prisma.tokenBlacklist.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});

    req.userId = payload.userId;
    req.tokenRaw = token;
    req.tokenExp = payload.exp; // Unix timestamp
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
