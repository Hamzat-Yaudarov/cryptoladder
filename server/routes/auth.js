import express from 'express';
import { getOrCreateUser, getUserWithStats, assignParentAndPosition, addReferral } from '../services/userService.js';

const router = express.Router();

router.post('/init', async (req, res) => {
  try {
    const { telegramId, referrerId } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }

    // Get or create user
    const user = await getOrCreateUser(telegramId);

    // Assign parent if referrer provided
    if (referrerId && !user.parent_id) {
      const referrerUser = await getOrCreateUser(referrerId);
      await assignParentAndPosition(user.id, referrerUser.id);
      await addReferral(referrerUser.id, user.id);
    } else if (!user.parent_id) {
      await assignParentAndPosition(user.id);
    }

    const userWithStats = await getUserWithStats(user.id);

    res.json({
      success: true,
      user: userWithStats,
    });
  } catch (error) {
    console.error('Auth init error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;

    const user = await getOrCreateUser(telegramId);
    const userWithStats = await getUserWithStats(user.id);

    res.json(userWithStats);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
