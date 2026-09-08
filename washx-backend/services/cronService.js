/**
 * WashX Scheduled Jobs (node-cron)
 * Started at bootstrap in server.js.
 * All jobs are idempotent and logged.
 */
const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { notifyStatusChange } = require('./notificationService');

// ── Helpers ───────────────────────────────────────────────────────────────────
function hoursAgo(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}
function daysAgo(d) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}
function tomorrow8AM() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d;
}

// ── Job 1: Expire subscriptions ───────────────────────────────────────────────
// Every hour — set ACTIVE subscriptions past their endDate to EXPIRED
async function expireSubscriptions() {
  try {
    const result = await prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });
    if (result.count > 0) console.info(`[CRON] Expired ${result.count} subscription(s)`);
  } catch (err) {
    console.error('[CRON] expireSubscriptions error:', err.message);
  }
}

// ── Job 2: Flag missed pickups ────────────────────────────────────────────────
// Every hour — mark PICKUP_SCHEDULED orders as PICKUP_MISSED if slot passed > 2h ago
async function flagMissedPickups() {
  try {
    const cutoff = hoursAgo(2);
    const missed = await prisma.order.findMany({
      where: {
        status: 'PICKUP_SCHEDULED',
        pickupSlot: { lt: cutoff },
      },
      include: { user: true },
    });

    for (const order of missed) {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PICKUP_MISSED', pickupAgentId: null },
      });
      if (order.user) {
        notifyStatusChange({ ...updated, user: order.user }, order.user).catch(() => {});
      }
    }

    if (missed.length > 0) console.info(`[CRON] Flagged ${missed.length} missed pickup(s)`);
  } catch (err) {
    console.error('[CRON] flagMissedPickups error:', err.message);
  }
}

// ── Job 3: Pickup reminders (day before) ─────────────────────────────────────
// Daily 8AM — SMS/email users with a pickup scheduled tomorrow
async function sendPickupReminders() {
  try {
    const tomorrowStart = tomorrow8AM();
    const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        status: 'PICKUP_SCHEDULED',
        pickupSlot: { gte: tomorrowStart, lt: tomorrowEnd },
      },
      include: { user: true },
    });

    for (const order of orders) {
      if (order.user) {
        notifyStatusChange({ ...order, _reminderType: 'PICKUP_REMINDER' }, order.user).catch(() => {});
      }
    }

    if (orders.length > 0) console.info(`[CRON] Sent ${orders.length} pickup reminder(s)`);
  } catch (err) {
    console.error('[CRON] sendPickupReminders error:', err.message);
  }
}

// ── Job 4: Stale washing reminders ───────────────────────────────────────────
// Daily 9AM — notify users whose order has been WASHING_DONE for 2+ days (delivery not booked)
async function sendWashingDoneReminders() {
  try {
    const twoDaysAgo = daysAgo(2);
    const orders = await prisma.order.findMany({
      where: {
        status: 'WASHING_DONE',
        updatedAt: { lt: twoDaysAgo },
        deliverySlot: null,
      },
      include: { user: true },
    });

    for (const order of orders) {
      if (order.user) {
        notifyStatusChange({ ...order, _reminderType: 'DELIVERY_REMINDER' }, order.user).catch(() => {});
      }
    }

    if (orders.length > 0) console.info(`[CRON] Sent ${orders.length} washing-done reminder(s)`);
  } catch (err) {
    console.error('[CRON] sendWashingDoneReminders error:', err.message);
  }
}

// ── Job 5: Cleanup expired JWT blacklist tokens ───────────────────────────────
// Daily midnight — purge expired tokens from TokenBlacklist table
async function cleanupBlacklist() {
  try {
    const result = await prisma.tokenBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) console.info(`[CRON] Cleaned ${result.count} expired blacklist token(s)`);
  } catch (err) {
    console.error('[CRON] cleanupBlacklist error:', err.message);
  }
}

// ── Job 6: Reset agent daily counters ────────────────────────────────────────
// Daily at 00:01 — in case agents haven't made a request to trigger auto-reset
async function resetAgentDailyCounters() {
  try {
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0);
    const result = await prisma.agent.updateMany({
      where: {
        dailyOrdersClaimed: { gt: 0 },
        dailyResetDate: { lt: yesterday },
      },
      data: { dailyOrdersClaimed: 0, dailyResetDate: yesterday },
    });
    if (result.count > 0) console.info(`[CRON] Reset daily counters for ${result.count} agent(s)`);
  } catch (err) {
    console.error('[CRON] resetAgentDailyCounters error:', err.message);
  }
}

// ── Start all cron jobs ───────────────────────────────────────────────────────
function startCronJobs() {
  // Every hour
  cron.schedule('0 * * * *', expireSubscriptions,      { name: 'expire-subs' });
  cron.schedule('15 * * * *', flagMissedPickups,        { name: 'flag-missed-pickups' });

  // Daily 8AM
  cron.schedule('0 8 * * *', sendPickupReminders,       { name: 'pickup-reminders' });

  // Daily 9AM
  cron.schedule('0 9 * * *', sendWashingDoneReminders,  { name: 'delivery-reminders' });

  // Daily midnight
  cron.schedule('0 0 * * *', cleanupBlacklist,          { name: 'blacklist-cleanup' });
  cron.schedule('1 0 * * *', resetAgentDailyCounters,   { name: 'agent-counter-reset' });

  console.log('✓ Cron jobs started (subscriptions, missed pickups, reminders, cleanup)');

  // Run immediately on startup to catch any missed events
  expireSubscriptions();
  flagMissedPickups();
  cleanupBlacklist();
}

module.exports = { startCronJobs };
