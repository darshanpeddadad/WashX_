const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const rateLimiter = require('../middleware/rateLimiter');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/register
router.post('/register', rateLimiter, validate(schemas.register), async (req, res) => {
  try {
    const { name, email, phone, password, city, address, pincode } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Name, email, phone and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash, city, address, pincode },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, city: user.city },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', rateLimiter, validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, city: user.city },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, phone: true, city: true, address: true, pincode: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user' });
  }
});

// PUT /api/auth/profile
router.put('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const { name, phone, city, address, pincode } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, phone, city, address, pincode },
      select: { id: true, name: true, email: true, phone: true, city: true, address: true, pincode: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// POST /api/auth/fcm-token
router.post('/fcm-token', require('../middleware/auth'), async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'FCM token required' });
    await prisma.user.update({
      where: { id: req.userId },
      data: { fcmToken: token },
    });
    res.json({ success: true, message: 'FCM token updated' });
  } catch (err) {
    console.error('FCM token save error:', err);
    res.status(500).json({ error: 'Failed to update FCM token' });
  }
});

// POST /api/auth/logout — Blacklist the current token
router.post('/logout', require('../middleware/auth'), async (req, res) => {
  try {
    const expiresAt = req.tokenExp ? new Date(req.tokenExp * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.tokenBlacklist.upsert({
      where: { token: req.tokenRaw },
      update: {},
      create: { token: req.tokenRaw, expiresAt },
    });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', rateLimiter, require('../middleware/auth'), validate(schemas.changePassword), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash: newHash } });

    // Blacklist current token — force re-login
    const expiresAt = req.tokenExp ? new Date(req.tokenExp * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.tokenBlacklist.upsert({
      where: { token: req.tokenRaw },
      update: {},
      create: { token: req.tokenRaw, expiresAt },
    });

    res.json({ success: true, message: 'Password changed. Please log in again.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Password change failed' });
  }
});

module.exports = router;
