/**
 * WashX Coupon Routes
 * Public: validate a coupon code
 * Admin-only: CRUD coupon codes
 */
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { requireAdmin } = require('./adminAuth');

const router = express.Router();

// POST /api/coupons/validate — Check if a coupon is valid for a given cart total
router.post('/validate', auth, validate(schemas.couponValidate), async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) return res.status(404).json({ error: 'Invalid or expired coupon code' });
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }
    if (cartTotal < coupon.minOrder) {
      return res.status(400).json({ error: `Minimum order of ₹${coupon.minOrder} required for this coupon` });
    }

    const discount = coupon.type === 'PERCENT'
      ? Math.min((cartTotal * coupon.value) / 100, cartTotal)
      : Math.min(coupon.value, cartTotal);

    res.json({
      valid: true,
      coupon: { id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value },
      discount: Math.round(discount * 100) / 100,
      discountedTotal: Math.round((cartTotal - discount) * 100) / 100,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Coupon validation failed' });
  }
});

// GET /api/coupons — Admin: list all coupons
router.get('/', requireAdmin, async (_req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// POST /api/coupons — Admin: create a coupon
router.post('/', requireAdmin, validate(schemas.createCoupon), async (req, res) => {
  try {
    const { code, type, value, minOrder, maxUses, expiresAt } = req.body;
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        minOrder: minOrder || 0,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Coupon code already exists' });
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// PUT /api/coupons/:id — Admin: toggle active / update
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { isActive, expiresAt, maxUses, value } = req.body;
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        ...(maxUses !== undefined && { maxUses }),
        ...(value !== undefined && { value }),
      },
    });
    res.json(coupon);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Coupon not found' });
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// DELETE /api/coupons/:id — Admin: delete coupon
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Coupon not found' });
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

module.exports = router;
