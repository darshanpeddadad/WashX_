const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

const INDIA_CITIES = [
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Delhi', state: 'Delhi' },
  { name: 'Bengaluru', state: 'Karnataka' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Surat', state: 'Gujarat' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Kanpur', state: 'Uttar Pradesh' },
  { name: 'Nagpur', state: 'Maharashtra' },
  { name: 'Indore', state: 'Madhya Pradesh' },
  { name: 'Thane', state: 'Maharashtra' },
  { name: 'Bhopal', state: 'Madhya Pradesh' },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { name: 'Pimpri-Chinchwad', state: 'Maharashtra' },
  { name: 'Patna', state: 'Bihar' },
  { name: 'Vadodara', state: 'Gujarat' },
  { name: 'Ghaziabad', state: 'Uttar Pradesh' },
  { name: 'Ludhiana', state: 'Punjab' },
  { name: 'Agra', state: 'Uttar Pradesh' },
  { name: 'Nashik', state: 'Maharashtra' },
  { name: 'Faridabad', state: 'Haryana' },
  { name: 'Meerut', state: 'Uttar Pradesh' },
  { name: 'Rajkot', state: 'Gujarat' },
  { name: 'Kalyan-Dombivali', state: 'Maharashtra' },
  { name: 'Vasai-Virar', state: 'Maharashtra' },
  { name: 'Varanasi', state: 'Uttar Pradesh' },
  { name: 'Srinagar', state: 'Jammu & Kashmir' },
  { name: 'Aurangabad', state: 'Maharashtra' },
  { name: 'Dhanbad', state: 'Jharkhand' },
  { name: 'Amritsar', state: 'Punjab' },
  { name: 'Allahabad', state: 'Uttar Pradesh' },
  { name: 'Ranchi', state: 'Jharkhand' },
  { name: 'Gwalior', state: 'Madhya Pradesh' },
  { name: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Coimbatore', state: 'Tamil Nadu' },
  { name: 'Vijayawada', state: 'Andhra Pradesh' },
  { name: 'Madurai', state: 'Tamil Nadu' },
  { name: 'Raipur', state: 'Chhattisgarh' },
  { name: 'Kota', state: 'Rajasthan' },
  { name: 'Guwahati', state: 'Assam' },
  { name: 'Chandigarh', state: 'Chandigarh' },
  { name: 'Thiruvananthapuram', state: 'Kerala' },
  { name: 'Solapur', state: 'Maharashtra' },
  { name: 'Hubballi-Dharwad', state: 'Karnataka' },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu' },
  { name: 'Kochi', state: 'Kerala' },
];

// GET /api/cities — Return list of serviceable cities
router.get('/', (_req, res) => {
  res.json(INDIA_CITIES.map((c) => ({ ...c, isActive: true })));
});

module.exports = router;
