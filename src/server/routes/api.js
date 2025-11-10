import express from 'express';
import { getUserByTelegramId, getUserWithCity } from '../services/userService.js';
import { getCityStats, buildHouse } from '../services/cityService.js';
import { getReferrals, getReferralCount, generateReferralLink } from '../services/referralService.js';
import { getWeeklyRating, getCurrentWeekRank } from '../services/ratingService.js';
import { getFactoriesByCity, activateFactory } from '../services/factoryService.js';
import { query } from '../db/client.js';

const router = express.Router();

// Полностью отключаем кэширование API
router.use((req, res, next) => {
  res.removeHeader('ETag');
  res.removeHeader('Last-Modified');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '-1');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Authentication middleware
router.use((req, res, next) => {
  const userId = req.query.user_id || req.body.user_id;
  if (!userId) {
    return res.status(401).json({ error: 'Missing user_id' });
  }
  req.userId = userId;
  next();
});

// Get user profile
router.get('/user/profile', async (req, res) => {
  try {
    const userId = parseInt(req.userId, 10);
    const user = await getUserByTelegramId(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = await getUserWithCity(user.id);
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get city stats
router.get('/city/stats', async (req, res) => {
  try {
    const userId = parseInt(req.userId, 10);
    const user = await getUserByTelegramId(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = await getCityStats(user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get referrals
router.get('/referrals', async (req, res) => {
  try {
    const userId = parseInt(req.userId, 10);
    const user = await getUserByTelegramId(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const referrals = await getReferrals(user.id);
    const referralLink = await generateReferralLink(user.id, user.telegram_id);

    res.json({
      referrals,
      count: referrals.length,
      link: referralLink,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get weekly rating
router.get('/rating/weekly', async (req, res) => {
  try {
    const userId = parseInt(req.userId, 10);
    const user = await getUserByTelegramId(userId);

    const rating = await getWeeklyRating();
    const userRank = user ? await getCurrentWeekRank(user.id) : null;

    res.json({
      rating,
      userRank,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activate factory
router.post('/factory/activate', async (req, res) => {
  try {
    const userId = parseInt(req.userId, 10);
    const user = await getUserByTelegramId(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = await getCityStats(user.id);
    const factory = await activateFactory(user.id, stats.city.id);

    res.json({
      success: true,
      factory,
      message: 'Factory activated for 24 hours',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get transactions
router.get('/transactions', async (req, res) => {
  try {
    const userId = parseInt(req.userId, 10);
    const user = await getUserByTelegramId(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await query(
      `SELECT * FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Build house (city upgrade)
router.post('/city/build-house', async (req, res) => {
  try {
    const userId = parseInt(req.userId, 10);
    const { costInStars } = req.body;

    if (!costInStars || costInStars < 0) {
      return res.status(400).json({ error: 'Invalid cost' });
    }

    const user = await getUserByTelegramId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedCity = await buildHouse(user.id, costInStars);

    res.json({
      success: true,
      city: updatedCity,
      message: 'House built successfully',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
