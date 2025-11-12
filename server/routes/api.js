import express from 'express';
import { query } from '../db.js';
import { getOrCreateUser, getUserProfile, addUserBalance, getUserTransactions, getUserStats } from '../services/userService.js';
import { getCityData, activateFactory, checkAndDeactivateExpiredFactories } from '../services/cityService.js';
import { getUserReferrals, joinCityViaReferral, claimReferralBonus, getWeeklyRankings } from '../services/referralService.js';
import { getUserProfitSummary } from '../services/profitService.js';

const router = express.Router();

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Get or create user and initialize city
 */
router.post('/auth/user', async (req, res) => {
  try {
    const { telegram_user } = req.body;
    
    if (!telegram_user || !telegram_user.id) {
      return res.status(400).json({ error: 'Invalid telegram user data' });
    }
    
    const user = await getOrCreateUser(telegram_user);
    const profile = await getUserProfile(user.telegram_id);
    
    res.json({
      success: true,
      user,
      profile,
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user profile
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const profile = await getUserProfile(req.params.userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get city data
 */
router.get('/city/:userId', async (req, res) => {
  try {
    const city = await getCityData(req.params.userId);
    
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    res.json({ success: true, city });
  } catch (error) {
    console.error('City error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get profit summary for user
 */
router.get('/profit/summary/:userId', async (req, res) => {
  try {
    const summary = await getUserProfitSummary(req.params.userId);
    
    res.json({ success: true, summary });
  } catch (error) {
    console.error('Profit summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Activate factory
 */
router.post('/factory/activate', async (req, res) => {
  try {
    const { city_id, user_id } = req.body;
    
    if (!city_id || !user_id) {
      return res.status(400).json({ error: 'Missing city_id or user_id' });
    }
    
    const result = await activateFactory(city_id, user_id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Factory activation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get referrals for user
 */
router.get('/referrals/:userId', async (req, res) => {
  try {
    const referrals = await getUserReferrals(req.params.userId);
    
    res.json({ success: true, referrals });
  } catch (error) {
    console.error('Referrals error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Join city via referral code
 */
router.post('/referral/join', async (req, res) => {
  try {
    const { user_id, referral_code } = req.body;
    
    if (!user_id || !referral_code) {
      return res.status(400).json({ error: 'Missing user_id or referral_code' });
    }
    
    const result = await joinCityViaReferral(user_id, referral_code);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Referral join error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Claim referral bonus
 */
router.post('/referral/claim-bonus', async (req, res) => {
  try {
    const { referral_id, user_id } = req.body;
    
    if (!referral_id || !user_id) {
      return res.status(400).json({ error: 'Missing referral_id or user_id' });
    }
    
    const result = await claimReferralBonus(referral_id, user_id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Claim bonus error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get weekly rankings
 */
router.get('/rankings/weekly', async (req, res) => {
  try {
    const rankings = await getWeeklyRankings();
    
    res.json({ success: true, rankings });
  } catch (error) {
    console.error('Rankings error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user transactions
 */
router.get('/transactions/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await getUserTransactions(req.params.userId, limit, offset);
    
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user stats
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const stats = await getUserStats(req.params.userId);
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add stars to user balance (for testing)
 */
router.post('/balance/add', async (req, res) => {
  try {
    const { user_id, amount } = req.body;
    
    if (!user_id || !amount) {
      return res.status(400).json({ error: 'Missing user_id or amount' });
    }
    
    const result = await addUserBalance(user_id, amount, 'Manual addition');
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Balance add error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check and deactivate expired factories (cron job)
 */
router.post('/maintenance/check-factories', async (req, res) => {
  try {
    const deactivated = await checkAndDeactivateExpiredFactories();
    
    res.json({ success: true, deactivated_count: deactivated.length });
  } catch (error) {
    console.error('Factory maintenance error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
