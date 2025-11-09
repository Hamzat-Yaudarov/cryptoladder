import express from 'express';
import { activateUser, buyPlace, getEarningsStats } from '../services/activationService.js';
import { getUserWithStats } from '../services/userService.js';

const router = express.Router();

router.post('/activate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await activateUser(parseInt(userId));
    const user = await getUserWithStats(parseInt(userId));

    res.json({
      success: true,
      message: 'Активация успешна',
      activationCost: result.activationCost,
      user,
    });
  } catch (error) {
    console.error('Ошибка активации:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/buy-place/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await buyPlace(parseInt(userId));
    const user = await getUserWithStats(parseInt(userId));

    res.json({
      success: true,
      message: 'Место куплено успешно',
      purchaseCost: result.purchaseCost,
      user,
    });
  } catch (error) {
    console.error('Ошибка покупки места:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/earnings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await getEarningsStats(parseInt(userId));

    res.json({
      success: true,
      earnings: stats,
    });
  } catch (error) {
    console.error('Ошибка получения статистики доходов:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
