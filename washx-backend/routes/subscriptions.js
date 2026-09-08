const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { getFupSummary } = require('../services/fupService');

const router = express.Router();

const SUBSCRIPTION_PLANS = {
  WEEKLY: {
    id: 'WEEKLY',
    name: 'Weekly Express Pass',
    price: 99,
    durationDays: 7,
    turnaroundDays: 1,
    turnaroundLabel: '1-Day Express (24h)',
    tagline: 'Short stays & urgent weeks',
    description: 'Perfect for business trips, quick turnaround needs, or testing WashX Express.',
    fupMaxPickups: 3,
    fupMaxItems: 25,
    fupLabel: 'Up to 3 Express Pickups (25 pcs)',
    features: [
      '1-Day Express Delivery (vs 3-Day Standard)',
      '100% FREE Delivery on all orders (Bypasses ₹40 small-order fee)',
      'Fair Usage Policy: 3 Express Pickups (max 25 garments)',
      'Midweek Saver: Tuesday & Wednesday collections processed in 18h',
      'Real-time GPS Tracking & Tamper-Evident Bag Sealing',
    ],
  },
  MONTHLY: {
    id: 'MONTHLY',
    name: 'Monthly VIP Pass',
    price: 299,
    popular: true,
    durationDays: 30,
    turnaroundDays: 1,
    turnaroundLabel: '1-Day Express (24h)',
    tagline: 'Most Popular for Homes',
    description: 'Our standard for regular households. Never wait 3 days for clean clothes again.',
    fupMaxPickups: 8,
    fupMaxItems: 80,
    fupLabel: 'Up to 8 Express Pickups (80 pcs)',
    features: [
      '1-Day Express Delivery on every single order',
      '100% FREE Delivery on every order (Zero delivery fees)',
      'Fair Usage Policy: 8 Express Pickups (max 80 garments)',
      'Midweek Priority: Tue–Wed priority wash slots & zero wait times',
      'Dedicated VIP WhatsApp Support & Barcode Traceability',
      'Free Pre-wash Fabric Inspection & Stain Protection Log',
    ],
  },
  YEARLY: {
    id: 'YEARLY',
    name: 'Annual Elite Pass',
    price: 2499,
    durationDays: 365,
    turnaroundDays: 1,
    turnaroundLabel: '1-Day Express (24h)',
    tagline: 'Best Value • Save 30%',
    description: 'The ultimate zero-compromise laundry subscription for families and executives.',
    fupMaxPickups: 100,
    fupMaxItems: 1000,
    fupLabel: 'Up to 100 Express Pickups (1,000 pcs)',
    features: [
      'Full year of 1-Day Express Delivery across 50+ cities',
      'Unlimited FREE Delivery all year (Save ₹400+ per month)',
      'Generous FUP: 100 Express Pickups (max 1,000 garments)',
      'Midweek Saver: Priority slot reservation for Tue–Wed laundry days',
      'Complimentary Breathable Eco Garment Covers & Steam Finish',
      'Saves ₹1,089 compared to monthly billing',
    ],
  },
};

// GET /api/subscriptions/plans — Public plans listing
router.get('/plans', (req, res) => {
  res.json({
    plans: Object.values(SUBSCRIPTION_PLANS),
    standardTurnaroundDays: 3,
    expressTurnaroundDays: 1,
  });
});

// Helper to evaluate if subscription is active
function isSubscriptionActive(sub) {
  if (!sub) return false;
  if (sub.status !== 'ACTIVE') return false;
  const now = new Date();
  return new Date(sub.endDate) > now;
}

// GET /api/subscriptions/my — Get current user's subscription
router.get('/my', auth, async (req, res) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: req.userId },
    });

    const active = isSubscriptionActive(sub);
    const now = new Date();
    let daysRemaining = 0;

    if (active && sub?.endDate) {
      const diffMs = new Date(sub.endDate).getTime() - now.getTime();
      daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    res.json({
      hasSubscription: Boolean(sub),
      isActive: active,
      plan: active ? sub.plan : null,
      planDetails: active ? SUBSCRIPTION_PLANS[sub.plan] : null,
      startDate: sub?.startDate || null,
      endDate: sub?.endDate || null,
      daysRemaining,
      turnaroundDays: active ? 1 : 3,
      deliverySpeedLabel: active ? '1-Day Express Turnaround ⚡' : '3-Day Standard Turnaround',
    });
  } catch (err) {
    console.error('Error fetching subscription:', err);
    res.status(500).json({ error: 'Could not fetch subscription details' });
  }
});

// Helper: Razorpay instance
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// POST /api/subscriptions/create-order — Step 1: Create Razorpay order for subscription
router.post('/create-order', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !SUBSCRIPTION_PLANS[plan]) {
      return res.status(400).json({
        error: 'Invalid plan. Choose from: ' + Object.keys(SUBSCRIPTION_PLANS).join(', '),
      });
    }

    const planConfig = SUBSCRIPTION_PLANS[plan];
    const razorpay = getRazorpay();

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(planConfig.price * 100), // paise
      currency: 'INR',
      receipt: `sub_${req.userId}_${plan}`,
      notes: { userId: req.userId, plan, productType: 'SUBSCRIPTION' },
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      plan,
      planDetails: planConfig,
    });
  } catch (err) {
    console.error('Subscription create-order error:', err);
    res.status(500).json({ error: 'Could not create subscription payment order' });
  }
});

// POST /api/subscriptions/verify-and-activate — Step 2: Verify payment & activate
router.post('/verify-and-activate', auth, async (req, res) => {
  try {
    const { plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!plan || !SUBSCRIPTION_PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification fields missing' });
    }

    // Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
    }

    const planConfig = SUBSCRIPTION_PLANS[plan];
    const existing = await prisma.subscription.findUnique({ where: { userId: req.userId } });

    const now = new Date();
    let startDate = now;
    let baseDate = now;

    // If already active, extend from existing endDate
    if (existing && isSubscriptionActive(existing)) {
      baseDate = new Date(existing.endDate);
      startDate = existing.startDate;
    }

    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + planConfig.durationDays);

    // Upsert subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: req.userId },
      update: {
        plan,
        status: 'ACTIVE',
        startDate,
        endDate,
        amountPaid: planConfig.price,
        fupMaxPickups: planConfig.fupMaxPickups || 8,
        fupMaxItems: planConfig.fupMaxItems || 80,
        fupUsedPickups: 0,
        fupUsedItems: 0,
      },
      create: {
        userId: req.userId,
        plan,
        status: 'ACTIVE',
        startDate,
        endDate,
        amountPaid: planConfig.price,
        fupMaxPickups: planConfig.fupMaxPickups || 8,
        fupMaxItems: planConfig.fupMaxItems || 80,
        fupUsedPickups: 0,
        fupUsedItems: 0,
      },
    });

    // Create payment record linked to subscription
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: planConfig.price,
        type: 'SUBSCRIPTION',
        status: 'PAID',
        method: 'razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
      },
    });

    const daysRemaining = Math.max(1, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    res.json({
      message: `✓ Successfully activated ${planConfig.name}! Enjoy 1-Day Express Delivery.`,
      subscription,
      isActive: true,
      turnaroundDays: 1,
      daysRemaining,
      planDetails: planConfig,
    });
  } catch (err) {
    console.error('Subscription verify-and-activate error:', err);
    res.status(500).json({ error: 'Could not activate subscription' });
  }
});

// GET /api/subscriptions/usage — FUP usage for current subscriber
router.get('/usage', auth, async (req, res) => {
  try {
    const summary = await getFupSummary(req.userId);
    res.json(summary);
  } catch (err) {
    console.error('FUP usage error:', err);
    res.status(500).json({ error: 'Could not fetch FUP usage' });
  }
});




// POST /api/subscriptions/cancel — Cancel active subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const existing = await prisma.subscription.findUnique({
      where: { userId: req.userId },
    });

    if (!existing || existing.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'No active subscription to cancel' });
    }

    const updated = await prisma.subscription.update({
      where: { userId: req.userId },
      data: { status: 'CANCELLED' },
    });

    res.json({
      message: 'Subscription cancelled. You will revert to 3-day standard turnaround.',
      subscription: updated,
      isActive: false,
      turnaroundDays: 3,
    });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    res.status(500).json({ error: 'Could not cancel subscription' });
  }
});

module.exports = router;
