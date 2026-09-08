const express = require('express');
const { getAvailablePickupSlots, getAvailableDeliverySlots } = require('../services/slotService');

const router = express.Router();

// GET /api/slots/pickup?city=Mumbai
router.get('/pickup', async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'city is required' });
    const slots = await getAvailablePickupSlots(city);
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch slots' });
  }
});

// GET /api/slots/delivery?city=Mumbai&turnaroundDays=1
router.get('/delivery', async (req, res) => {
  try {
    const { city, turnaroundDays, startDate } = req.query;
    if (!city) return res.status(400).json({ error: 'city is required' });
    const days = turnaroundDays ? parseInt(turnaroundDays, 10) : 3;
    const baseDate = startDate ? new Date(startDate) : new Date();
    const slots = await getAvailableDeliverySlots(city, { turnaroundDays: days, startDate: baseDate });
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch slots' });
  }
});

module.exports = router;
