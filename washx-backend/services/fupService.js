/**
 * WashX Fair Usage Policy (FUP) Service
 * Enforces pickup and item caps for Express Pass subscribers.
 */
const prisma = require('../lib/prisma');

/**
 * Check if a user has remaining FUP allowance.
 * @param {string} userId
 * @returns {{ allowed: boolean, reason?: string, usedPickups: number, usedItems: number, maxPickups: number, maxItems: number }}
 */
async function checkFupAllowance(userId) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });

  if (!sub || sub.status !== 'ACTIVE' || new Date(sub.endDate) < new Date()) {
    return { allowed: true, isSubscriber: false }; // non-subscribers are not FUP-gated
  }

  const pickupsOk = sub.fupUsedPickups < sub.fupMaxPickups;
  const itemsOk = true; // item check done at clothes step with count

  if (!pickupsOk) {
    return {
      allowed: false,
      isSubscriber: true,
      reason: `Express Pass FUP limit reached: you have used ${sub.fupUsedPickups}/${sub.fupMaxPickups} Express Pickups this cycle. Standard 3-day delivery is still available.`,
      usedPickups: sub.fupUsedPickups,
      usedItems: sub.fupUsedItems,
      maxPickups: sub.fupMaxPickups,
      maxItems: sub.fupMaxItems,
    };
  }

  return {
    allowed: true,
    isSubscriber: true,
    usedPickups: sub.fupUsedPickups,
    usedItems: sub.fupUsedItems,
    maxPickups: sub.fupMaxPickups,
    maxItems: sub.fupMaxItems,
  };
}

/**
 * Check FUP item allowance for a specific item count.
 */
async function checkFupItemAllowance(userId, newItemCount) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });

  if (!sub || sub.status !== 'ACTIVE' || new Date(sub.endDate) < new Date()) {
    return { allowed: true, isSubscriber: false };
  }

  const projectedItems = sub.fupUsedItems + newItemCount;
  if (projectedItems > sub.fupMaxItems) {
    return {
      allowed: false,
      isSubscriber: true,
      reason: `Express Pass FUP limit: adding ${newItemCount} items would exceed your ${sub.fupMaxItems}-item cap (currently used: ${sub.fupUsedItems}).`,
      usedItems: sub.fupUsedItems,
      maxItems: sub.fupMaxItems,
    };
  }

  return {
    allowed: true,
    isSubscriber: true,
    usedItems: sub.fupUsedItems,
    maxItems: sub.fupMaxItems,
  };
}

/**
 * Atomically increment FUP usage after a successful pickup.
 * @param {string} userId
 * @param {number} itemCount - total garment count in the order
 */
async function incrementFupUsage(userId, itemCount) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || sub.status !== 'ACTIVE') return;

  await prisma.subscription.update({
    where: { userId },
    data: {
      fupUsedPickups: { increment: 1 },
      fupUsedItems: { increment: itemCount },
    },
  });
}

/**
 * Get current FUP usage summary for a user.
 */
async function getFupSummary(userId) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || sub.status !== 'ACTIVE' || new Date(sub.endDate) < new Date()) {
    return { isSubscriber: false };
  }

  return {
    isSubscriber: true,
    plan: sub.plan,
    usedPickups: sub.fupUsedPickups,
    usedItems: sub.fupUsedItems,
    maxPickups: sub.fupMaxPickups,
    maxItems: sub.fupMaxItems,
    pickupPercentUsed: Math.round((sub.fupUsedPickups / sub.fupMaxPickups) * 100),
    itemPercentUsed: Math.round((sub.fupUsedItems / sub.fupMaxItems) * 100),
    daysRemaining: Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24))),
  };
}

module.exports = { checkFupAllowance, checkFupItemAllowance, incrementFupUsage, getFupSummary };
