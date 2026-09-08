const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order — Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.userId },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.totalPrice <= 0) return res.status(400).json({ error: 'No clothes added yet' });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalPrice * 100), // paise
      currency: 'INR',
      receipt: order.id,
      notes: { washxOrderId: order.id },
    });

    // Create payment record
    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { razorpayOrderId: razorpayOrder.id, amount: order.totalPrice, status: 'PENDING' },
      create: {
        orderId: order.id,
        amount: order.totalPrice,
        status: 'PENDING',
        razorpayOrderId: razorpayOrder.id,
      },
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create payment order' });
  }
});

// POST /api/payments/verify — Verify Razorpay payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Update payment status
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: 'PAID',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        method: 'razorpay',
        paidAt: new Date(),
      },
    });

    res.json({ success: true, message: 'Payment verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
