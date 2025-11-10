import express from 'express';
import { purchaseStars } from '../services/paymentService.js';
import { getUserWithStats } from '../services/userService.js';

const router = express.Router();

// Purchase stars (simulated provider) - requires userId and amount
router.post('/purchase', async (req, res) => {
  try {
    const { userId, amount, provider } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ error: 'userId and amount are required' });
    }

    const result = await purchaseStars(parseInt(userId), parseInt(amount), provider || 'telegram-stars');
    const user = await getUserWithStats(parseInt(userId));

    res.json({ success: true, result, user });
  } catch (error) {
    console.error('Ошибка при покупке звёзд:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
