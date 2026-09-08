const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const router = express.Router();

// Agent JWT middleware
function agentAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.agentId) return res.status(403).json({ error: 'Not an agent token' });
    req.agentId = payload.agentId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/agent/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const agent = await prisma.agent.findUnique({ where: { email } });
    if (!agent) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, agent.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    if (!agent.isActive) return res.status(403).json({ error: 'Account deactivated' });

    const token = jwt.sign({ agentId: agent.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, agent: { id: agent.id, name: agent.name, email: agent.email, phone: agent.phone, role: agent.role, city: agent.city } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/agent/me
router.get('/me', agentAuth, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.agentId },
      select: { id: true, name: true, email: true, phone: true, role: true, city: true, isActive: true },
    });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// GET /api/agent/orders — Unclaimed orders in agent's city matching their role
router.get('/orders', agentAuth, async (req, res) => {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: req.agentId } });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    let statusFilter = [];
    if (agent.role === 'PICKUP' || agent.role === 'BOTH') {
      statusFilter.push('PICKUP_SCHEDULED');
    }
    if (agent.role === 'DELIVERY' || agent.role === 'BOTH') {
      statusFilter.push('DELIVERY_SCHEDULED', 'OUT_FOR_DELIVERY');
    }

    // Only show unclaimed pickup orders (pickupAgentId IS NULL) to avoid double-assignment
    const orders = await prisma.order.findMany({
      where: {
        city: agent.city,
        status: { in: statusFilter },
        // For pickup orders, only show unclaimed ones
        ...(statusFilter.includes('PICKUP_SCHEDULED') ? { pickupAgentId: null } : {}),
      },
      include: {
        clothesItems: true,
        user: { select: { name: true, phone: true, email: true, address: true } },
        payment: true,
      },
      orderBy: { pickupSlot: 'asc' },
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch orders' });
  }
});

// GET /api/agent/orders/my — Orders where I am assigned agent
router.get('/orders/my', agentAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { pickupAgentId: req.agentId },
          { deliveryAgentId: req.agentId },
        ],
      },
      include: {
        clothesItems: true,
        user: { select: { name: true, phone: true, address: true } },
        payment: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// PUT /api/agent/orders/:id/claim — Atomically claim a pickup order
router.put('/orders/:id/claim', agentAuth, async (req, res) => {
  try {
    const DAILY_ORDER_CAP = 15;

    const agent = await prisma.agent.findUnique({ where: { id: req.agentId } });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    if (!agent.isActive) return res.status(403).json({ error: 'Agent account is inactive' });

    // Reset daily counter if it's a new day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const needsReset = new Date(agent.dailyResetDate) < today;
    if (needsReset) {
      await prisma.agent.update({
        where: { id: req.agentId },
        data: { dailyOrdersClaimed: 0, dailyResetDate: today },
      });
      agent.dailyOrdersClaimed = 0;
    }

    // Capacity check
    if (agent.dailyOrdersClaimed >= DAILY_ORDER_CAP) {
      return res.status(429).json({
        error: `Daily capacity reached. You have claimed ${agent.dailyOrdersClaimed}/${DAILY_ORDER_CAP} orders today.`,
        dailyOrdersClaimed: agent.dailyOrdersClaimed,
        dailyOrderCap: DAILY_ORDER_CAP,
      });
    }

    // Atomic claim — use updateMany with pickupAgentId = null as condition
    const result = await prisma.order.updateMany({
      where: {
        id: req.params.id,
        status: 'PICKUP_SCHEDULED',
        pickupAgentId: null, // Only claim unclaimed orders
      },
      data: { pickupAgentId: req.agentId },
    });

    if (result.count === 0) {
      return res.status(409).json({ error: 'Order already claimed by another agent or not available' });
    }

    // Increment daily counter
    await prisma.agent.update({
      where: { id: req.agentId },
      data: { dailyOrdersClaimed: { increment: 1 } },
    });

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { clothesItems: true, user: { select: { name: true, phone: true, address: true } }, payment: true },
    });

    req.io?.to(`order_${req.params.id}`).emit('order:agent_assigned', { orderId: req.params.id, agentId: req.agentId });

    res.json({ success: true, order });
  } catch (err) {
    console.error('Claim order error:', err);
    res.status(500).json({ error: 'Could not claim order' });
  }
});

// PUT /api/agent/orders/:id/status — Agent updates order status
router.put('/orders/:id/status', agentAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const { notifyStatusChange } = require('../services/notificationService');

    // Allowed agent status transitions
    const AGENT_ALLOWED = ['PICKED_UP', 'IN_WASHING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    if (!AGENT_ALLOWED.includes(status)) {
      return res.status(400).json({ error: `Agents cannot set status to ${status}` });
    }

    const updateData = { status };
    // Auto-assign agent
    if (status === 'PICKED_UP') updateData.pickupAgentId = req.agentId;
    if (status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED') updateData.deliveryAgentId = req.agentId;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData,
      include: { user: true, clothesItems: true },
    });

    req.io?.to(`order_${order.id}`).emit('order:status_updated', { orderId: order.id, status });
    notifyStatusChange(order, order.user).catch(console.error);

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Status update failed' });
  }
});

// POST /api/agent/fcm-token
router.post('/fcm-token', agentAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'FCM token required' });
    await prisma.agent.update({
      where: { id: req.agentId },
      data: { fcmToken: token },
    });
    res.json({ success: true, message: 'Agent FCM token updated' });
  } catch (err) {
    console.error('Agent FCM token save error:', err);
    res.status(500).json({ error: 'Failed to update FCM token' });
  }
});

module.exports = router;
