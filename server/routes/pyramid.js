import express from 'express';
import { getUserPyramidStructure, getDownlineUsers, getReferralsList } from '../services/userService.js';

const router = express.Router();

router.get('/structure/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { depth = 3 } = req.query;

    const structure = await getUserPyramidStructure(parseInt(userId), parseInt(depth));

    res.json({
      success: true,
      structure,
    });
  } catch (error) {
    console.error('Get pyramid structure error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/downline/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { maxLevel = 5 } = req.query;

    const downline = await getDownlineUsers(parseInt(userId), parseInt(maxLevel));

    res.json({
      success: true,
      downline,
    });
  } catch (error) {
    console.error('Get downline error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/referrals/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const data = await getReferralsList(
      parseInt(userId),
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
