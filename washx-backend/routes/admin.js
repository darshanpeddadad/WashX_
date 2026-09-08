const express = require('express');
const prisma = require('../lib/prisma');
const { notifyStatusChange } = require('../services/notificationService');
const { adminJwtAuth } = require('./adminAuth');

const router = express.Router();

// All admin routes use JWT auth (with legacy key fallback)
const adminAuth = adminJwtAuth;

// ── GET /api/admin/orders ─────────────────────────────────────────────────────
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { status, city, page = 1, limit = 20, search } = req.query;
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (city) where.city = city;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          clothesItems: true,
          payment: true,
          user: { select: { name: true, phone: true, email: true, address: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch orders' });
  }
});

// ── GET /api/admin/orders/:id ─────────────────────────────────────────────────
router.get('/orders/:id', adminAuth, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        clothesItems: true,
        payment: true,
        user: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch order' });
  }
});

// ── PUT /api/admin/orders/:id/status ─────────────────────────────────────────
router.put('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, pickupAgentId, deliveryAgentId } = req.body;

    const validStatuses = ['PENDING', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_WASHING', 'WASHING_DONE', 'DELIVERY_SCHEDULED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(pickupAgentId && { pickupAgentId }),
        ...(deliveryAgentId && { deliveryAgentId }),
      },
      include: {
        user: true,
        clothesItems: true,
      },
    });

    // Real-time socket event
    req.io?.to(`order_${order.id}`).emit('order:status_updated', { orderId: order.id, status });

    // Fire notifications (non-blocking)
    notifyStatusChange(order, order.user).catch((e) => console.error('Notification failed:', e));

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Status update failed' });
  }
});

// ── GET /api/admin/stats ───────────────────────────────────────────────────────────────────────────
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders, todayOrders, pendingPickup, inWashing, washingDone,
      outForDelivery, delivered, cancelled, revenue, todayRevenue,
      subscriptionRevenue, activeSubscriptions,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { status: 'PICKUP_SCHEDULED' } }),
      prisma.order.count({ where: { status: 'IN_WASHING' } }),
      prisma.order.count({ where: { status: 'WASHING_DONE' } }),
      prisma.order.count({ where: { status: 'OUT_FOR_DELIVERY' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.payment.aggregate({ where: { status: 'PAID', type: 'ORDER' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'PAID', type: 'ORDER', paidAt: { gte: today } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'PAID', type: 'SUBSCRIPTION' }, _sum: { amount: true } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    // Per-city revenue breakdown
    const cityRevenue = await prisma.order.groupBy({
      by: ['city'],
      where: { payment: { status: 'PAID' } },
      _sum: { totalPrice: true },
      _count: { id: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
    });

    res.json({
      totalOrders, todayOrders, pendingPickup, inWashing, washingDone,
      outForDelivery, delivered, cancelled,
      orderRevenue: revenue._sum.amount || 0,
      todayOrderRevenue: todayRevenue._sum.amount || 0,
      todayRevenue: todayRevenue._sum.amount || 0,
      subscriptionRevenue: subscriptionRevenue._sum.amount || 0,
      totalRevenue: (revenue._sum.amount || 0) + (subscriptionRevenue._sum.amount || 0),
      activeSubscriptions,
      cityRevenue: cityRevenue.map(r => ({
        city: r.city || 'Unknown',
        revenue: r._sum.totalPrice || 0,
        orders: r._count.id,
      })),
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Stats failed' });
  }
});

// ── POST /api/admin/payments/:id/refund ───────────────────────────────────────────────────────────
router.post('/payments/:id/refund', adminAuth, async (req, res) => {
  try {
    const { reason, amount } = req.body;
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status !== 'PAID') return res.status(400).json({ error: 'Only PAID payments can be refunded' });
    if (!payment.razorpayPaymentId) return res.status(400).json({ error: 'No Razorpay payment ID found' });

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

    const refundAmount = amount ? Math.round(amount * 100) : Math.round(payment.amount * 100);
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: refundAmount,
      notes: { reason: reason || 'Admin-initiated refund' },
    });

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundId: refund.id,
        refundAmount: refundAmount / 100,
        refundReason: reason || 'Admin-initiated refund',
        refundedAt: new Date(),
      },
    });

    res.json({ success: true, refund, payment: updated });
  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({ error: 'Refund failed: ' + (err.message || 'Unknown error') });
  }
});

// ── PUT /api/admin/orders/:id/retry-pickup ─────────────────────────────────────────────────────
router.put('/orders/:id/retry-pickup', adminAuth, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!['PICKUP_SCHEDULED', 'PICKUP_MISSED'].includes(order.status)) {
      return res.status(400).json({ error: 'Order is not in a pickup-retry eligible state' });
    }
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PICKUP_MISSED', pickupSlot: null, pickupAgentId: null },
    });
    req.io?.to(`order_${order.id}`).emit('order:status_updated', { orderId: order.id, status: 'PICKUP_MISSED' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Retry pickup failed' });
  }
});

// ── Agents CRUD ───────────────────────────────────────────────────────────────
router.get('/agents', adminAuth, async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch agents' });
  }
});

router.post('/agents', adminAuth, async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { name, phone, email, role, city, password } = req.body;
    const existing = await prisma.agent.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Agent email already exists' });
    const agent = await prisma.agent.create({
      data: { name, phone, email, role, city, password: await bcrypt.hash(password, 10) },
    });
    res.status(201).json({ ...agent, password: undefined });
  } catch (err) {
    res.status(500).json({ error: 'Could not create agent' });
  }
});

router.put('/agents/:id', adminAuth, async (req, res) => {
  try {
    const { name, phone, city, role, isActive } = req.body;
    const agent = await prisma.agent.update({
      where: { id: req.params.id },
      data: { name, phone, city, role, isActive },
    });
    res.json({ ...agent, password: undefined });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;
