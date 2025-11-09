import express from 'express';
import { getOrCreateUser, getUserById, getUserWithStats, assignParentAndPosition, addReferral } from '../services/userService.js';

const router = express.Router();

router.post('/init', async (req, res) => {
  try {
    const { telegramId, userData, referrerId } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }

    // Get or create user with Telegram data
    const user = await getOrCreateUser(telegramId, userData);

    // Assign parent if referrer provided and user doesn't have one yet
    if (referrerId && !user.parent_id) {
      try {
        // referrerId is a database user ID from the start param
        const referrerUser = await getUserById(parseInt(referrerId));
        if (referrerUser && referrerUser.id !== user.id) {
          await assignParentAndPosition(user.id, referrerUser.id);
          await addReferral(referrerUser.id, user.id);
        } else if (!user.parent_id) {
          // No valid referrer, assign to root
          await assignParentAndPosition(user.id);
        }
      } catch (err) {
        console.warn('Error assigning referrer:', err.message);
        // If referrer assignment fails, continue with normal assignment
        if (!user.parent_id) {
          await assignParentAndPosition(user.id);
        }
      }
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

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userWithStats = await getUserWithStats(parseInt(userId));

    if (!userWithStats) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userWithStats);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
