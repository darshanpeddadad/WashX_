/**
 * WashX Business Constants & Enums
 */

const ORDER_STATUSES = {
  PENDING: 'PENDING',
  PICKUP_SCHEDULED: 'PICKUP_SCHEDULED',
  PICKED_UP: 'PICKED_UP',
  IN_WASHING: 'IN_WASHING',
  WASHING_DONE: 'WASHING_DONE',
  DELIVERY_SCHEDULED: 'DELIVERY_SCHEDULED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

const DELIVERY_RULES = {
  FREE_DELIVERY_THRESHOLD: 250, // ₹250 or more qualifies for free delivery
  STANDARD_DELIVERY_FEE: 40,    // ₹40 if below threshold
  MIN_ORDER_VALUE: 99,          // ₹99 minimum order required
};

const AGENT_LIMITS = {
  MAX_DAILY_ORDERS: 15,         // Max orders an agent can claim per day
};

const TURNAROUND_DAYS = {
  STANDARD: 3,
  EXPRESS: 1,
};

module.exports = {
  ORDER_STATUSES,
  DELIVERY_RULES,
  AGENT_LIMITS,
  TURNAROUND_DAYS,
};
