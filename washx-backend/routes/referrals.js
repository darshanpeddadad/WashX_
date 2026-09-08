/**
 * WashX Referral Program Routes
 * Each user gets a unique referral code.
 * Referees get ₹50 wallet credit after their first order is delivered.
 * Referrers get ₹50 wallet credit when referee's first order is delivered.
 */
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

// Helper — generate or return existing referral code for a user
async function ensureReferralCode(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.referralCode) return user.referralCode;

  // Generate a short, human-friendly code: WXAB1234
  let code;
  let attempts = 0;
  do {
    code = 'WX' + Math.random().toString(36).toUpperCase().slice(2, 8);
    attempts++;
  } while (attempts < 10 && await prisma.user.findUnique({ where: { referralCode: code } }));

  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}

// GET /api/referrals/my-code — Get the user's referral code & stats
router.get('/my-code', auth, async (req, res) => {
  try {
    const code = await ensureReferralCode(req.userId);
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { walletBalance: true, referralsGiven: { select: { status: true, rewardGiven: true } } },
    });

    res.json({
      referralCode: code,
      referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${code}`,
      walletBalance: user.walletBalance,
      totalReferrals: user.referralsGiven.length,
      credited: user.referralsGiven.filter((r) => r.rewardGiven).length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get referral code' });
  }
});

// POST /api/referrals/apply — Apply a referral code at registration
// (Called automatically during registration if referralCode is provided in query)
router.post('/apply', auth, validate(schemas.applyReferral), async (req, res) => {
  try {
    const { referralCode } = req.body;

    // Check the referee hasn't already used a code
    const existingReferral = await prisma.referral.findUnique({ where: { refereeId: req.userId } });
    if (existingReferral) return res.status(400).json({ error: 'Referral code already applied to your account' });

    // Find referrer
    const referrer = await prisma.user.findUnique({ where: { referralCode: referralCode.toUpperCase() } });
    if (!referrer) return res.status(404).json({ error: 'Invalid referral code' });
    if (referrer.id === req.userId) return res.status(400).json({ error: 'Cannot refer yourself' });

    await prisma.referral.create({
      data: { referrerId: referrer.id, refereeId: req.userId },
    });

    res.json({ success: true, message: 'Referral applied! You and your friend will each earn ₹50 after your first order.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to apply referral code' });
  }
});

// Internal helper — called when an order is delivered
// Checks if this is the user's first delivered order and credits both parties
async function processReferralReward(userId) {
  try {
    // Check if this is the user's first delivered order
    const deliveredCount = await prisma.order.count({
      where: { userId, status: 'DELIVERED' },
    });

    if (deliveredCount !== 1) return; // Only credit on the very first delivery

    // Find the referral where this user is the referee
    const referral = await prisma.referral.findUnique({
      where: { refereeId: userId },
    });

    if (!referral || referral.rewardGiven) return;

    const REWARD = 50; // ₹50 each

    // Credit both parties atomically
    await prisma.$transaction([
      // Credit referrer
      prisma.user.update({
        where: { id: referral.referrerId },
        data: { walletBalance: { increment: REWARD } },
      }),
      // Credit referee
      prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: REWARD } },
      }),
      // Mark reward as given
      prisma.referral.update({
        where: { id: referral.id },
        data: { status: 'CREDITED', rewardGiven: true },
      }),
    ]);

    console.info(`[REFERRAL] ₹${REWARD} credited to referrer ${referral.referrerId} and referee ${userId}`);
  } catch (err) {
    console.error('[REFERRAL] processReferralReward error:', err.message);
  }
}

// GET /api/referrals/admin — Admin: list all referrals
router.get('/admin', require('./adminAuth').requireAdmin, async (_req, res) => {
  try {
    const referrals = await prisma.referral.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        referrer: { select: { name: true, email: true } },
        referee:  { select: { name: true, email: true } },
      },
    });
    res.json(referrals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

module.exports = { router, processReferralReward };
