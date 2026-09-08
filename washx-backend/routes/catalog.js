const express = require('express');
const router = express.Router();
const {
  CLOTHES_CATALOG,
  BASE_PRICES,
  SERVICE_MULTIPLIERS,
  CATEGORY_META,
  getPricePerUnit,
} = require('../services/pricingService');

// GET /api/catalog — Full clothes & laundry washing catalog
router.get('/', (_req, res) => {
  res.json({
    catalog: CLOTHES_CATALOG,
    basePrices: BASE_PRICES,
    serviceMultipliers: SERVICE_MULTIPLIERS,
    categoryMeta: CATEGORY_META,
    services: [
      { id: 'wash', name: 'Wash Only', multiplier: 1, icon: '🧺', desc: 'Fresh & clean wash' },
      { id: 'wash_iron', name: 'Wash + Iron', multiplier: 1.5, icon: '👔', desc: 'Crisp & steam ironed' },
      { id: 'dry_clean', name: 'Dry Clean', multiplier: 3, icon: '✨', desc: 'Specialized fabric care' },
    ],
  });
});

// GET /api/catalog/price?category=mens&service=wash_iron
router.get('/price', (req, res) => {
  const { category, service } = req.query;
  if (!category || !service) {
    return res.status(400).json({ error: 'category and service query parameters are required' });
  }
  const price = getPricePerUnit(category, service);
  res.json({ category, service, pricePerUnit: price });
});

module.exports = router;
