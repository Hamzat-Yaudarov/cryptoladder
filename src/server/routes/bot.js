import express from 'express';
import { handleStart, handleCallback } from '../bot/handlers.js';

const router = express.Router();

router.post('/webhook', async (req, res) => {
  const { message, callback_query } = req.body;

  try {
    if (message) {
      if (message.text && message.text.startsWith('/start')) {
        await handleStart(message);
      }
    } else if (callback_query) {
      await handleCallback(callback_query);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
