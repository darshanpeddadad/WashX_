/**
 * WashX Order Service
 * Handles business operations for customer orders.
 */

const prisma = require('../lib/prisma');
const { calculateOrderBreakdown, MIN_ORDER_VALUE } = require('./pricingService');
const { checkFupAllowance, checkFupItemAllowance, incrementFupUsage } = require('./fupService');
const { notifyStatusChange } = require('./notificationService');
const { ORDER_STATUSES, TURNAROUND_DAYS } = require('../lib/constants');

/**
 * Create a new order for a user
 */
async function createOrder(userId, { city, address, specialNotes, deliveryPreference }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  if (!user) throw { status: 404, message: 'User not found' };

  const now = new Date();
  const isExpress = Boolean(
    user.subscription &&
    user.subscription.status === 'ACTIVE' &&
    new Date(user.subscription.endDate) > now
  );
  const turnaroundDays = isExpress ? TURNAROUND_DAYS.EXPRESS : TURNAROUND_DAYS.STANDARD;
  const orderAddress = address || user.address;

  const order = await prisma.order.create({
    data: {
      userId,
      city: city || user.city,
      pickupAddress: orderAddress,
      deliveryAddress: orderAddress,
      specialNotes: specialNotes || null,
      deliveryPreference: deliveryPreference || 'HAND',
      isExpress,
      turnaroundDays,
      status: ORDER_STATUSES.PENDING,
    },
  });

  return order;
}

/**
 * List all orders for a user
 */
async function getUserOrders(userId) {
  return prisma.order.findMany({
    where: { userId },
    include: { clothesItems: true, payment: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a single order by ID
 */
async function getOrderById(orderId, userId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      clothesItems: true,
      payment: true,
      user: { select: { name: true, phone: true, email: true } },
    },
  });
  if (!order) throw { status: 404, message: 'Order not found' };
  return order;
}

/**
 * Book pickup slot (validates payment and subscriber FUP)
 */
async function bookPickupSlot(orderId, userId, pickupSlot, io = null) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { payment: true },
  });
  if (!order) throw { status: 404, message: 'Order not found' };

  if (![ORDER_STATUSES.PENDING, 'PICKUP_MISSED'].includes(order.status)) {
    throw { status: 400, message: 'Pickup slot cannot be booked at this order stage' };
  }

  // Payment must be completed before pickup is scheduled
  if (!order.payment || order.payment.status !== 'PAID') {
    throw {
      status: 402,
      message: 'Payment required before scheduling pickup. Please complete payment first.',
      paymentRequired: true,
    };
  }

  // Check FUP pickup allowance for subscribers
  const fupCheck = await checkFupAllowance(userId);
  if (!fupCheck.allowed) {
    throw {
      status: 403,
      message: fupCheck.reason,
      fup: { usedPickups: fupCheck.usedPickups, maxPickups: fupCheck.maxPickups },
    };
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      pickupSlot: new Date(pickupSlot),
      status: ORDER_STATUSES.PICKUP_SCHEDULED,
    },
  });

  // Increment FUP usage for subscribers
  if (fupCheck.isSubscriber) {
    const totalItems = await prisma.clothesItem.aggregate({
      where: { orderId: order.id },
      _sum: { quantity: true },
    });
    await incrementFupUsage(userId, totalItems._sum.quantity || 0);
  }

  if (io) {
    io.to(`order_${order.id}`).emit('order:status_updated', {
      orderId: order.id,
      status: ORDER_STATUSES.PICKUP_SCHEDULED,
    });
  }

  return updated;
}

/**
 * Update clothes items and recompute costs, delivery fee, and minimum order rules
 */
async function updateOrderClothes(orderId, userId, { items, inspectionAcknowledged, inspectionNotes }) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw { status: 400, message: 'At least one clothes item required' };
  }

  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw { status: 404, message: 'Order not found' };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  const now = new Date();
  const isSubscriber = Boolean(
    order.isExpress ||
    (user?.subscription &&
      user.subscription.status === 'ACTIVE' &&
      new Date(user.subscription.endDate) > now)
  );

  const breakdown = calculateOrderBreakdown(items, { isSubscriber });

  // Enforce minimum order value
  if (breakdown.belowMinimum) {
    throw {
      status: 400,
      message: `Minimum order value is ₹${MIN_ORDER_VALUE}. Your cart total is ₹${breakdown.garmentsTotal}. Please add more items.`,
      garmentsTotal: breakdown.garmentsTotal,
      minimumOrderValue: MIN_ORDER_VALUE,
      belowMinimum: true,
    };
  }

  // Check FUP item allowance for subscribers
  if (isSubscriber) {
    const totalItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    const fupCheck = await checkFupItemAllowance(userId, totalItems);
    if (!fupCheck.allowed) {
      throw {
        status: 403,
        message: fupCheck.reason,
        fup: { usedItems: fupCheck.usedItems, maxItems: fupCheck.maxItems },
      };
    }
  }

  // Replace clothes items
  await prisma.clothesItem.deleteMany({ where: { orderId: order.id } });
  await prisma.clothesItem.createMany({
    data: breakdown.items.map((i) => ({
      orderId: order.id,
      category: i.category,
      type: i.type,
      quantity: i.quantity,
      service: i.service,
      pricePerUnit: i.pricePerUnit,
      totalPrice: i.totalPrice,
    })),
  });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      garmentsTotal: breakdown.garmentsTotal,
      deliveryFee: breakdown.deliveryFee,
      totalPrice: breakdown.finalTotal,
      inspectionVerified: Boolean(inspectionAcknowledged),
      inspectionNotes: inspectionNotes || null,
    },
    include: { clothesItems: true },
  });

  return { ...updated, breakdown };
}

/**
 * Schedule delivery slot (only when WASHING_DONE)
 */
async function scheduleDeliverySlot(orderId, userId, { deliverySlot, deliveryAddress, deliveryPreference }, io = null) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw { status: 404, message: 'Order not found' };

  if (order.status !== ORDER_STATUSES.WASHING_DONE) {
    throw { status: 400, message: 'Order is not ready for delivery scheduling' };
  }

  const pref = deliveryPreference || order.deliveryPreference || 'HANDOVER_PERSON';
  let deliveryOtp = order.deliveryOtp;
  if (pref === 'SECURITY_GATE' && !deliveryOtp) {
    deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      deliverySlot: new Date(deliverySlot),
      deliveryAddress: deliveryAddress || order.deliveryAddress,
      deliveryPreference: pref,
      deliveryOtp: deliveryOtp || null,
      status: ORDER_STATUSES.DELIVERY_SCHEDULED,
    },
  });

  if (io) {
    io.to(`order_${order.id}`).emit('order:status_updated', {
      orderId: order.id,
      status: ORDER_STATUSES.DELIVERY_SCHEDULED,
    });
  }

  return updated;
}

/**
 * Cancel an order if it hasn't progressed past pickup
 */
async function cancelOrder(orderId, userId, cancellationReason, io = null) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { user: true },
  });
  if (!order) throw { status: 404, message: 'Order not found' };

  if ([ORDER_STATUSES.PICKED_UP, ORDER_STATUSES.IN_WASHING, ORDER_STATUSES.WASHING_DONE, ORDER_STATUSES.DELIVERED].includes(order.status)) {
    throw { status: 400, message: 'Cannot cancel order at this stage' };
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: ORDER_STATUSES.CANCELLED,
      cancellationReason,
    },
  });

  if (io) {
    io.to(`order_${order.id}`).emit('order:status_updated', {
      orderId: order.id,
      status: ORDER_STATUSES.CANCELLED,
    });
  }

  notifyStatusChange({ ...updated, user: order.user }, order.user).catch(() => {});

  return updated;
}

/**
 * Rate a delivered order
 */
async function rateOrder(orderId, userId, { rating, review }) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, status: ORDER_STATUSES.DELIVERED },
  });
  if (!order) throw { status: 404, message: 'Order not found or not yet delivered' };

  return prisma.order.update({
    where: { id: order.id },
    data: { rating, review: review || null },
  });
}

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  bookPickupSlot,
  updateOrderClothes,
  scheduleDeliverySlot,
  cancelOrder,
  rateOrder,
};
