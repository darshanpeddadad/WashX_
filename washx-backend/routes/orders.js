const express = require('express');
const auth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const orderService = require('../services/orderService');
const { sendSuccess, sendError } = require('../lib/response');

const router = express.Router();

// POST /api/orders — Create a new order
router.post('/', auth, validate(schemas.createOrder), async (req, res) => {
  try {
    const order = await orderService.createOrder(req.userId, req.body);
    return res.status(201).json(order);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not create order' });
  }
});

// GET /api/orders — List user's orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await orderService.getUserOrders(req.userId);
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch orders' });
  }
});

// GET /api/orders/:id — Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.userId);
    return res.json(order);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not fetch order' });
  }
});

// PUT /api/orders/:id/pickup-slot — Book pickup slot
router.put('/:id/pickup-slot', auth, validate(schemas.pickupSlot), async (req, res) => {
  try {
    const updated = await orderService.bookPickupSlot(
      req.params.id,
      req.userId,
      req.body.pickupSlot,
      req.io
    );
    return res.json(updated);
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.message || 'Could not book pickup slot',
      ...(err.paymentRequired ? { paymentRequired: true } : {}),
      ...(err.fup ? { fup: err.fup } : {}),
    });
  }
});

// PUT /api/orders/:id/clothes — Add/update clothes details
router.put('/:id/clothes', auth, validate(schemas.clothesItems), async (req, res) => {
  try {
    const result = await orderService.updateOrderClothes(req.params.id, req.userId, req.body);
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.message || 'Could not update clothes',
      ...(err.belowMinimum ? {
        garmentsTotal: err.garmentsTotal,
        minimumOrderValue: err.minimumOrderValue,
        belowMinimum: true,
      } : {}),
      ...(err.fup ? { fup: err.fup } : {}),
    });
  }
});

// PUT /api/orders/:id/delivery-slot — Book delivery slot (only when WASHING_DONE)
router.put('/:id/delivery-slot', auth, async (req, res) => {
  try {
    const updated = await orderService.scheduleDeliverySlot(
      req.params.id,
      req.userId,
      req.body,
      req.io
    );
    return res.json(updated);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not book delivery slot' });
  }
});

// PUT /api/orders/:id/cancel — Cancel order
router.put('/:id/cancel', auth, validate(schemas.cancelOrder), async (req, res) => {
  try {
    const updated = await orderService.cancelOrder(
      req.params.id,
      req.userId,
      req.body.cancellationReason,
      req.io
    );
    return res.json(updated);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Could not cancel order' });
  }
});

// PUT /api/orders/:id/rate — Submit rating & review
router.put('/:id/rate', auth, validate(schemas.rating), async (req, res) => {
  try {
    const updated = await orderService.rateOrder(req.params.id, req.userId, req.body);
    return res.json(updated);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Rating failed' });
  }
});

module.exports = router;
