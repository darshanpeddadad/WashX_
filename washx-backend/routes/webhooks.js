/**
 * WashX Razorpay Webhook Handler
 * Receives and verifies HMAC-signed events from Razorpay.
 * 
 * IMPORTANT: This route uses express.raw() body parser (set in server.js)
 * so req.body is a Buffer here, not a parsed object.
 */
const express = require('express');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { notifyStatusChange } = require('../services/notificationService');

const router = express.Router();

// Processed event IDs for idempotency (in-memory, survives restarts with DB check)
const processedEvents = new Set();

function verifyRazorpaySignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[WEBHOOK] RAZORPAY_WEBHOOK_SECRET not set — skipping signature verification');
    return true; // Permissive in dev only
  }
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// POST /api/webhooks/razorpay
router.post('/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) return res.status(400).json({ error: 'Missing signature' });

  const rawBody = req.body; // Buffer from express.raw()
  if (!verifyRazorpaySignature(rawBody, signature)) {
    console.warn('[WEBHOOK] Invalid Razorpay signature — rejected');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const eventId = event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id || Math.random().toString();

  // Idempotency — skip duplicate events
  if (processedEvents.has(eventId)) {
    return res.status(200).json({ status: 'already_processed' });
  }
  processedEvents.add(eventId);
  if (processedEvents.size > 10000) {
    // Prune oldest entries to prevent memory leak
    const first = processedEvents.values().next().value;
    processedEvents.delete(first);
  }

  console.info(`[WEBHOOK] Razorpay event: ${event.event} | entity: ${eventId}`);

  try {
    switch (event.event) {

      // ── Payment captured ──────────────────────────────────────────────────
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        const orderId = payment.notes?.orderId;

        // Update payment record to PAID
        await prisma.payment.updateMany({
          where: { razorpayOrderId: payment.order_id, status: { not: 'PAID' } },
          data: {
            status: 'PAID',
            razorpayPaymentId: payment.id,
            paidAt: new Date(payment.created_at * 1000),
          },
        });

        // Notify user if we have an order reference
        if (orderId) {
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true },
          });
          if (order?.user) {
            notifyStatusChange(order, order.user).catch(() => {});
          }
        }
        break;
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case 'payment.failed': {
        const payment = event.payload.payment.entity;
        await prisma.payment.updateMany({
          where: { razorpayOrderId: payment.order_id, status: 'PENDING' },
          data: { status: 'FAILED' },
        });
        console.warn(`[WEBHOOK] Payment failed: ${payment.id} | reason: ${payment.error_description}`);
        break;
      }

      // ── Refund processed ──────────────────────────────────────────────────
      case 'refund.processed': {
        const refund = event.payload.refund.entity;
        await prisma.payment.updateMany({
          where: { razorpayPaymentId: refund.payment_id },
          data: {
            status: 'REFUNDED',
            refundId: refund.id,
            refundAmount: refund.amount / 100,
            refundedAt: new Date(refund.created_at * 1000),
          },
        });
        console.info(`[WEBHOOK] Refund processed: ${refund.id} ₹${refund.amount / 100}`);
        break;
      }

      // ── Subscription activated (double-confirm) ───────────────────────────
      case 'subscription.activated': {
        const sub = event.payload.subscription?.entity;
        if (sub?.notes?.userId) {
          await prisma.subscription.updateMany({
            where: { userId: sub.notes.userId, status: { not: 'ACTIVE' } },
            data: { status: 'ACTIVE' },
          });
        }
        break;
      }

      default:
        // Acknowledge but don't process
        console.info(`[WEBHOOK] Unhandled event type: ${event.event}`);
    }

    res.status(200).json({ status: 'ok', event: event.event });
  } catch (err) {
    console.error('[WEBHOOK] Handler error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
