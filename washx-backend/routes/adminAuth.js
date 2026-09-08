/**
 * WashX Admin Authentication
 * Replaces the insecure static X-Admin-Key header with proper JWT auth.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
const ADMIN_TOKEN_EXPIRY = '8h';

// Admin JWT middleware — exported for use in admin.js
function adminJwtAuth(req, res, next) {
  const header = req.headers.authorization;
  // Fallback: still accept legacy X-Admin-Key for backward compat (deprecate later)
  if (req.headers['x-admin-key'] && req.headers['x-admin-key'] === process.env.ADMIN_KEY) {
    req.adminUser = { role: 'SUPER', name: 'Legacy Key', email: 'legacy@admin' };
    return next();
  }
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    if (!payload.adminId) return res.status(403).json({ error: 'Not an admin token' });
    req.adminId = payload.adminId;
    req.adminUser = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

// POST /api/admin/auth/login
router.post('/login', rateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, name: admin.name, role: admin.role },
      ADMIN_JWT_SECRET,
      { expiresIn: ADMIN_TOKEN_EXPIRY }
    );

    res.json({
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      expiresIn: ADMIN_TOKEN_EXPIRY,
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

// GET /api/admin/auth/me
router.get('/me', adminJwtAuth, async (req, res) => {
  try {
    if (!req.adminId) return res.json(req.adminUser); // legacy key
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.adminId },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin profile' });
  }
});

// POST /api/admin/auth/create-admin — SUPER only, creates new admin accounts
router.post('/create-admin', adminJwtAuth, async (req, res) => {
  try {
    if (req.adminUser?.role !== 'SUPER') {
      return res.status(403).json({ error: 'Only SUPER admins can create admin accounts' });
    }
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Admin email already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.adminUser.create({
      data: { name, email, passwordHash, role: role || 'VIEWER' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json(admin);
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ error: 'Could not create admin' });
  }
});

module.exports = { router, adminJwtAuth, requireAdmin: adminJwtAuth };

