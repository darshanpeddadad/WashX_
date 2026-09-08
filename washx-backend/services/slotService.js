/**
 * WashX Slot Service
 * Generates available time slots for pickup/delivery
 * Operating hours: 8 AM – 8 PM IST
 * Slot duration: 1 hour
 * Max orders per slot: 10
 */

const prisma = require('../lib/prisma');

const SLOT_START_HOUR = 8;  // 8 AM
const SLOT_END_HOUR = 20;   // 8 PM
const MAX_ORDERS_PER_SLOT = 10;

/**
 * Generate all slot times for a given date (IST)
 */
function generateSlotsForDate(dateStr) {
  const slots = [];
  const base = new Date(dateStr);

  for (let hour = SLOT_START_HOUR; hour < SLOT_END_HOUR; hour++) {
    const start = new Date(base);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(base);
    end.setHours(hour + 1, 0, 0, 0);
    slots.push({
      label: `${formatHour(hour)} - ${formatHour(hour + 1)}`,
      start: start.toISOString(),
      end: end.toISOString(),
      hour,
    });
  }
  return slots;
}

function formatHour(hour) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}:00 ${suffix}`;
}

/**
 * Get available pickup slots for next 7 days
 */
async function getAvailablePickupSlots(city) {
  const slots = [];
  const today = new Date();

  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const daySlots = generateSlotsForDate(dateStr);

    // Check existing bookings for each slot
    const bookedCounts = await prisma.order.groupBy({
      by: ['pickupSlot'],
      where: {
        city,
        pickupSlot: {
          gte: new Date(`${dateStr}T00:00:00`),
          lt: new Date(`${dateStr}T23:59:59`),
        },
        status: { notIn: ['CANCELLED'] },
      },
      _count: { id: true },
    });

    const bookedMap = {};
    bookedCounts.forEach((b) => {
      const key = new Date(b.pickupSlot).getHours();
      bookedMap[key] = b._count.id;
    });

    slots.push({
      date: dateStr,
      displayDate: date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }),
      slots: daySlots.map((s) => ({
        ...s,
        available: (bookedMap[s.hour] || 0) < MAX_ORDERS_PER_SLOT,
        remainingCapacity: MAX_ORDERS_PER_SLOT - (bookedMap[s.hour] || 0),
      })),
    });
  }

  return slots;
}

/**
 * Get available delivery slots based on turnaround days:
 * - Express subscribers: 1 day turnaround (slots start from day 1 / tomorrow)
 * - Standard non-subscribers: 3 day turnaround (slots start from day 3)
 */
async function getAvailableDeliverySlots(city, { turnaroundDays = 3, startDate = new Date() } = {}) {
  const slots = [];
  const start = new Date(startDate);
  const minOffset = Math.max(1, parseInt(turnaroundDays, 10) || 3);

  // Generate 7 selectable days starting from minimum turnaround offset
  for (let i = minOffset; i < minOffset + 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const daySlots = generateSlotsForDate(dateStr);

    // Check existing delivery bookings
    const bookedCounts = await prisma.order.groupBy({
      by: ['deliverySlot'],
      where: {
        city,
        deliverySlot: {
          gte: new Date(`${dateStr}T00:00:00`),
          lt: new Date(`${dateStr}T23:59:59`),
        },
        status: { notIn: ['CANCELLED'] },
      },
      _count: { id: true },
    });

    const bookedMap = {};
    bookedCounts.forEach((b) => {
      if (b.deliverySlot) {
        const key = new Date(b.deliverySlot).getHours();
        bookedMap[key] = b._count.id;
      }
    });

    const isNextDay = i === 1;

    slots.push({
      date: dateStr,
      turnaroundDayIndex: i,
      isExpressNextDay: isNextDay,
      displayDate: date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }),
      slots: daySlots.map((s) => ({
        ...s,
        available: (bookedMap[s.hour] || 0) < MAX_ORDERS_PER_SLOT,
        remainingCapacity: MAX_ORDERS_PER_SLOT - (bookedMap[s.hour] || 0),
      })),
    });
  }

  return slots;
}

module.exports = { getAvailablePickupSlots, getAvailableDeliverySlots, generateSlotsForDate };

