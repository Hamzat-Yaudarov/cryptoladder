import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { UserService } from '../services/userService.js';
import { CityService } from '../services/cityService.js';
import { EconomyService } from '../services/economyService.js';
import { ReferralService } from '../services/referralService.js';
import { RankingService } from '../services/rankingService.js';

const router = express.Router();

// ==================== USER ENDPOINTS ====================

// Get current user
router.get('/user/me', authMiddleware, async (req, res) => {
  try {
    const user = await UserService.getUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const referralCount = await ReferralService.getReferralCount(user.id);
    const city = await CityService.getCity(user.id);
    const ranking = await RankingService.getUserRanking(user.id);

    res.json({
      id: user.id,
      telegramId: user.telegram_id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      balance: parseFloat(user.balance),
      referralCount,
      city,
      currentRanking: ranking,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ==================== CITY ENDPOINTS ====================

// Get city
router.get('/city', authMiddleware, async (req, res) => {
  try {
    const city = await CityService.getCityWithDetails(req.userId);
    if (!city) return res.status(404).json({ error: 'City not found' });

    res.json(city);
  } catch (error) {
    console.error('Error getting city:', error);
    res.status(500).json({ error: 'Failed to get city' });
  }
});

// Create city
router.post('/city/create', authMiddleware, async (req, res) => {
  try {
    const user = await UserService.getUserById(req.userId);
    const existingCity = await CityService.getCity(req.userId);

    if (existingCity) return res.status(400).json({ error: 'City already exists' });

    const cost = parseFloat(process.env.CITY_CREATION_COST) || 3;
    if (user.balance < cost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct cost
    await UserService.updateBalance(req.userId, -cost);

    // Create city
    const city = await CityService.createCity(req.userId);

    // Create factory
    await EconomyService.createFactory(req.userId);

    // Log activity
    await UserService.logActivity(req.userId, 'CITY_CREATED');
    await UserService.addTransaction(req.userId, 'CITY_CREATION', -cost, 'City creation');

    res.json({ success: true, city });
  } catch (error) {
    console.error('Error creating city:', error);
    res.status(500).json({ error: 'Failed to create city' });
  }
});

// Get house structure
router.get('/city/structure', authMiddleware, async (req, res) => {
  try {
    const structure = await CityService.getHouseStructure(req.userId);
    if (!structure) return res.status(404).json({ error: 'City not found' });

    res.json(structure);
  } catch (error) {
    console.error('Error getting house structure:', error);
    res.status(500).json({ error: 'Failed to get structure' });
  }
});

// ==================== FACTORY ENDPOINTS ====================

// Get factory
router.get('/factory', authMiddleware, async (req, res) => {
  try {
    let factory = await EconomyService.getFactory(req.userId);

    if (!factory) {
      factory = await EconomyService.createFactory(req.userId);
    }

    res.json(factory);
  } catch (error) {
    console.error('Error getting factory:', error);
    res.status(500).json({ error: 'Failed to get factory' });
  }
});

// Activate factory
router.post('/factory/activate', authMiddleware, async (req, res) => {
  try {
    const factory = await EconomyService.activateFactory(req.userId);

    res.json({
      success: true,
      factory,
      message: 'Factory activated for 24 hours',
    });
  } catch (error) {
    console.error('Error activating factory:', error);
    res.status(400).json({ error: error.message || 'Failed to activate factory' });
  }
});

// ==================== INCOME ENDPOINTS ====================

// Get profit history
router.get('/income/history', authMiddleware, async (req, res) => {
  try {
    const history = await EconomyService.getProfitHistory(req.userId);
    const stats = await EconomyService.getProfitStats(req.userId);
    const byLevel = await EconomyService.getProfitByLevel(req.userId);

    res.json({ history, stats, byLevel });
  } catch (error) {
    console.error('Error getting income history:', error);
    res.status(500).json({ error: 'Failed to get income history' });
  }
});

// ==================== REFERRAL ENDPOINTS ====================

// Get referral link
router.get('/referrals/link', authMiddleware, async (req, res) => {
  try {
    const link = await ReferralService.generateReferralLink(req.userId);
    res.json({ link });
  } catch (error) {
    console.error('Error generating referral link:', error);
    res.status(500).json({ error: 'Failed to generate link' });
  }
});

// Get referrals
router.get('/referrals', authMiddleware, async (req, res) => {
  try {
    const referrals = await ReferralService.getReferrals(req.userId);
    const stats = await ReferralService.getReferralStats(req.userId);

    res.json({ referrals, stats });
  } catch (error) {
    console.error('Error getting referrals:', error);
    res.status(500).json({ error: 'Failed to get referrals' });
  }
});

// Get referral tree
router.get('/referrals/tree', authMiddleware, async (req, res) => {
  try {
    const tree = await ReferralService.getReferralTree(req.userId, 5);
    res.json(tree);
  } catch (error) {
    console.error('Error getting referral tree:', error);
    res.status(500).json({ error: 'Failed to get referral tree' });
  }
});

// ==================== RANKING ENDPOINTS ====================

// Get weekly ranking
router.get('/ranking/weekly', async (req, res) => {
  try {
    const ranking = await RankingService.getWeeklyRanking();
    res.json(ranking);
  } catch (error) {
    console.error('Error getting ranking:', error);
    res.status(500).json({ error: 'Failed to get ranking' });
  }
});

// Get user ranking
router.get('/ranking/me', authMiddleware, async (req, res) => {
  try {
    const ranking = await RankingService.getUserRanking(req.userId);
    const stats = await RankingService.getUserStats(req.userId);

    res.json({ ranking, stats });
  } catch (error) {
    console.error('Error getting user ranking:', error);
    res.status(500).json({ error: 'Failed to get ranking' });
  }
});

// Claim weekly reward
router.post('/ranking/claim-reward', authMiddleware, async (req, res) => {
  try {
    const ranking = await RankingService.claimWeeklyReward(req.userId);
    res.json({ success: true, ranking });
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(400).json({ error: error.message || 'Failed to claim reward' });
  }
});

// ==================== ACTIVITY ENDPOINTS ====================

// Get activities
router.get('/activities', authMiddleware, async (req, res) => {
  try {
    const activities = await UserService.getActivities(req.userId, 50);
    res.json(activities);
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

// Get transactions
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await UserService.getTransactions(req.userId, 50);
    res.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// ==================== BUILDING ENDPOINTS ====================

// Get building upgrades
router.get('/building/upgrades', authMiddleware, async (req, res) => {
  try {
    const user = await UserService.getUserById(req.userId);
    const city = await CityService.getCity(req.userId);
    const referralCount = await ReferralService.getReferralCount(req.userId);

    if (!city) return res.status(404).json({ error: 'City not found' });

    const upgrades = [];
    for (let level = city.level + 1; level <= 5; level++) {
      const config = CityService.CITY_LEVELS[level];
      upgrades.push({
        level,
        houses: config.houses,
        minReferrals: config.minReferrals,
        maxReferrals: config.maxReferrals,
        available: referralCount >= config.minReferrals && referralCount <= config.maxReferrals,
      });
    }

    res.json(upgrades);
  } catch (error) {
    console.error('Error getting upgrades:', error);
    res.status(500).json({ error: 'Failed to get upgrades' });
  }
});

// Upgrade city
router.post('/building/upgrade', authMiddleware, async (req, res) => {
  try {
    const referralCount = await ReferralService.getReferralCount(req.userId);
    const city = await CityService.upgradeCity(req.userId, referralCount);

    await UserService.logActivity(req.userId, 'CITY_UPGRADED', { newLevel: city.level });

    res.json({ success: true, city });
  } catch (error) {
    console.error('Error upgrading city:', error);
    res.status(400).json({ error: error.message || 'Failed to upgrade city' });
  }
});

export default router;
