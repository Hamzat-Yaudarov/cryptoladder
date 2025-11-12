import express from 'express';
import { createCity, upgradeCity, getCity, addHouse } from '../services/cityService.js';
import { activateFactory, getActiveFactories, getFactoryStats } from '../services/factoryService.js';
import { addResident, getResidents, getProfitDistribution, getTotalResidents } from '../services/residentService.js';
import { getWeeklyRating, getTopRatings, claimReward, getCurrentWeeklyRating } from '../services/ratingService.js';
import { 
  getUserWithCity, 
  updateBalance, 
  getUserStats, 
  getUser,
  addReferral
} from '../services/userService.js';
import { query } from '../database/client.js';

const router = express.Router();

// Middleware to verify telegram data (simplified)
const verifyUser = (req, res, next) => {
  const telegramId = req.body.telegram_id || req.query.telegram_id || req.headers['x-telegram-id'];
  if (!telegramId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.telegramId = BigInt(telegramId);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid Telegram ID format' });
  }
  next();
};

// User endpoints
router.get('/user', verifyUser, async (req, res) => {
  try {
    const userStats = await getUserStats(req.telegramId);
    if (!userStats) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(userStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// City endpoints
router.post('/city/create', verifyUser, async (req, res) => {
  try {
    const user = await getUser(req.telegramId);
    
    // Check balance
    if (user.balance < 3) {
      return res.status(400).json({ error: 'Insufficient balance. Need 3 stars.' });
    }
    
    // Deduct creation cost
    await updateBalance(req.telegramId, -3);
    
    // Create city
    const city = await createCity(req.telegramId);
    
    res.json({ success: true, city });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/city', verifyUser, async (req, res) => {
  try {
    const city = await getCity(req.telegramId);
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    const stats = await query(
      `SELECT 
        c.houses,
        c.factory_count,
        (SELECT COUNT(*) FROM factories WHERE owner_id = $1 AND is_active = true) as active_factories,
        (SELECT COUNT(*) FROM residents WHERE city_owner_id = $1) as total_residents
       FROM cities c
       WHERE c.user_id = $1`,
      [req.telegramId]
    );
    
    res.json({
      ...city,
      ...stats.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/city/upgrade', verifyUser, async (req, res) => {
  try {
    const updatedCity = await upgradeCity(req.telegramId);
    res.json({ success: true, city: updatedCity });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/city/add-house', verifyUser, async (req, res) => {
  try {
    const city = await addHouse(req.telegramId);
    res.json({ success: true, city });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Factory endpoints
router.post('/factory/activate', verifyUser, async (req, res) => {
  try {
    const factory = await activateFactory(req.telegramId);
    res.json({ success: true, factory });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/factory/active', verifyUser, async (req, res) => {
  try {
    const factories = await getActiveFactories(req.telegramId);
    res.json(factories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/factory/stats', verifyUser, async (req, res) => {
  try {
    const stats = await getFactoryStats(req.telegramId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resident endpoints
router.get('/residents', verifyUser, async (req, res) => {
  try {
    const residents = await getResidents(req.telegramId);
    res.json(residents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/residents/count', verifyUser, async (req, res) => {
  try {
    const count = await getTotalResidents(req.telegramId);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/residents/distribution', verifyUser, async (req, res) => {
  try {
    const distribution = await getProfitDistribution(req.telegramId);
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/residents/add', verifyUser, async (req, res) => {
  try {
    const { resident_id } = req.body;
    const resident = await addResident(req.telegramId, BigInt(resident_id));
    res.json({ success: true, resident });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rating endpoints
router.get('/rating/current', verifyUser, async (req, res) => {
  try {
    const rating = await getCurrentWeeklyRating(req.telegramId);
    res.json(rating || { position: null, reward: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/rating/top', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const topRatings = await getTopRatings(limit);
    res.json(topRatings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/rating/claim-reward', verifyUser, async (req, res) => {
  try {
    const reward = await claimReward(req.telegramId);
    res.json({ success: true, reward });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Profit history
router.get('/profit-history', verifyUser, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM profit_history 
       WHERE earner_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.telegramId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profit-today', verifyUser, async (req, res) => {
  try {
    const result = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_today
       FROM profit_history 
       WHERE earner_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [req.telegramId]
    );
    res.json({ profit_today: parseFloat(result.rows[0].total_today) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
