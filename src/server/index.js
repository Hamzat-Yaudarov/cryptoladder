import express from 'express';
import cors from 'cors';
import TelegramBot from 'node-telegram-bot-api';
import pool from '../db/connection.js';
import initializeDatabase from '../db/init.js';
import {
  getOrCreateUser,
  getUserByTelegramId,
  buyPlace,
  getUserReferrals,
  addReferral,
  getUserStats,
  getEarningHierarchy,
  getStarTransactions,
  addStars
} from '../services/userService.js';
import {
  activate,
  getActivationStatus,
  giveReferralBonus,
  checkInactivity
} from '../services/activationService.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8212904290:AAE2-EfWsYZ_kwVLMM4GOJMHkfwd4d2lW8M';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://cryptoladder-production.up.railway.app/bot/webhook';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize bot with polling in development, webhook in production
const botOptions = NODE_ENV === 'production'
  ? { webHook: { port: process.env.PORT || 8080 } }
  : { polling: true };

const bot = new TelegramBot(BOT_TOKEN, botOptions);

// Telegram bot webhook handler
app.post('/bot/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Handle /start command
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  try {
    const userId = msg.from.id;
    const userData = {
      username: msg.from.username,
      first_name: msg.from.first_name,
      last_name: msg.from.last_name
    };

    const user = await getOrCreateUser(userId, userData);
    const referralCode = match[1];

    // Handle referral
    if (referralCode) {
      try {
        const referrerTgId = parseInt(referralCode.replace('ref_', ''));
        const referrer = await getUserByTelegramId(referrerTgId);
        if (referrer && referrer.id !== user.id) {
          await addReferral(referrer.id, user.id);
        }
      } catch (err) {
        console.log('Invalid referral code:', referralCode);
      }
    }

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🚀 Open Crypto Ladder',
            web_app: { url: 'https://cryptoladder-production.up.railway.app/' }
          }
        ]
      ]
    };

    await bot.sendMessage(userId,
      `👋 Welcome to Crypto Ladder!\n\n` +
      `🪜 Buy your place in the pyramid, activate daily, and earn ⭐️ stars!\n\n` +
      `💎 Your Referral Link: https://t.me/cryptoladderbot/miniapp?startapp=ref_${userId}\n\n` +
      `Click the button below to open the MiniApp:`,
      { reply_markup: keyboard }
    );
  } catch (err) {
    console.error('Error handling /start:', err);
  }
});

// API endpoints for MiniApp
app.get('/api/user/:telegramId', async (req, res) => {
  try {
    const telegramId = BigInt(req.params.telegramId);

    // Try to get existing user
    let user = await getUserByTelegramId(telegramId);

    // If user doesn't exist, create them
    if (!user) {
      user = await getOrCreateUser(telegramId, {
        username: null,
        first_name: 'User',
        last_name: null
      });
    }

    const stats = await getUserStats(user.id);
    const activation = await getActivationStatus(user.id);
    const referralCount = (await pool.query(
      'SELECT COUNT(*) as count FROM referrals WHERE inviter_id = $1',
      [user.id]
    )).rows[0].count;

    res.json({
      user,
      stats: {
        referralCount: parseInt(referralCount),
        activeReferrals: stats.activeReferrals
      },
      activation
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/user/buy-place', async (req, res) => {
  try {
    const { telegramId, parentId } = req.body;
    const user = await getUserByTelegramId(BigInt(telegramId));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.has_bought_place) {
      return res.status(400).json({ error: 'Already bought place' });
    }

    if (user.stars < 3) {
      return res.status(400).json({ error: 'Insufficient stars' });
    }

    // Deduct cost
    await pool.query(
      'UPDATE users SET stars = stars - 3 WHERE id = $1',
      [user.id]
    );

    // Award to creator (root user)
    const rootUser = await pool.query(
      'SELECT id FROM users WHERE parent_id IS NULL AND has_bought_place = TRUE LIMIT 1'
    );

    if (rootUser.rows.length > 0) {
      await addStars(rootUser.rows[0].id, 3, 'purchase_income', user.id, null);
    }

    // Buy place
    await buyPlace(user.id, parentId || null);

    res.json({ success: true, message: 'Place purchased' });
  } catch (err) {
    console.error('Error buying place:', err);
    res.status(500).json({ error: 'Failed to buy place' });
  }
});

app.post('/api/user/activate', async (req, res) => {
  try {
    const { telegramId, referrerId } = req.body;
    const user = await getUserByTelegramId(BigInt(telegramId));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.has_bought_place) {
      return res.status(400).json({ error: 'Must buy place first' });
    }

    if (user.stars < 10) {
      return res.status(400).json({ error: 'Insufficient stars' });
    }

    // Activate
    await activate(user.id);

    // Give referral bonus if applicable
    if (referrerId) {
      const referrer = await getUserByTelegramId(BigInt(referrerId));
      if (referrer) {
        await giveReferralBonus(referrer.id, user.id);
      }
    }

    // Update last activation
    await pool.query(
      'UPDATE users SET last_activation = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({ success: true, message: 'Activation successful' });
  } catch (err) {
    console.error('Error activating:', err);
    res.status(500).json({ error: 'Failed to activate' });
  }
});

app.get('/api/user/:telegramId/referrals', async (req, res) => {
  try {
    const user = await getUserByTelegramId(BigInt(req.params.telegramId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const referrals = await getUserReferrals(user.id);
    res.json({ referrals });
  } catch (err) {
    console.error('Error fetching referrals:', err);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

app.get('/api/user/:telegramId/hierarchy', async (req, res) => {
  try {
    const user = await getUserByTelegramId(BigInt(req.params.telegramId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { hierarchy, maxDepth } = await getEarningHierarchy(user.id);
    res.json({ hierarchy, maxDepth });
  } catch (err) {
    console.error('Error fetching hierarchy:', err);
    res.status(500).json({ error: 'Failed to fetch hierarchy' });
  }
});

app.get('/api/user/:telegramId/transactions', async (req, res) => {
  try {
    const user = await getUserByTelegramId(BigInt(req.params.telegramId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const transactions = await getStarTransactions(user.id, limit);
    res.json({ transactions });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.telegram_id, u.first_name, u.stars,
              COUNT(r.invited_id) as referral_count
       FROM users u
       LEFT JOIN referrals r ON r.inviter_id = u.id
       WHERE u.has_bought_place = TRUE
       GROUP BY u.id
       ORDER BY u.stars DESC
       LIMIT 100`
    );
    res.json({ leaderboard: result.rows });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    console.log('🚀 Starting Crypto Ladder server...');
    console.log('');

    // Initialize database (don't fail if it's not available)
    const dbReady = await initializeDatabase();
    console.log('');

    // Start Express server
    app.listen(PORT, async () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 App URL: https://cryptoladder-production.up.railway.app`);
      console.log(`🤖 Bot: @cryptoladderbot`);
      console.log(`📱 MiniApp: https://t.me/cryptoladderbot/miniapp`);
      console.log(`💾 Database: ${dbReady ? '✅ Connected' : '⚠️  Unavailable (limited mode)'}`);
      console.log('');

      // Set webhook in production
      if (NODE_ENV === 'production') {
        try {
          await bot.setWebHook(WEBHOOK_URL);
          console.log(`✅ Webhook set: ${WEBHOOK_URL}`);
        } catch (err) {
          console.warn('⚠️  Could not set webhook:', err.message);
        }
      } else {
        console.log('📡 Bot: Polling mode (development)');
      }

      console.log('✅ Crypto Ladder is ready!');
      console.log('');

      if (!dbReady) {
        console.log('⚠️  DATABASE NOT CONNECTED');
        console.log('📋 Fix checklist:');
        console.log('1. Check Railway environment variables');
        console.log('2. Verify DATABASE_URL is set correctly');
        console.log('3. Check Neon database status');
        console.log('4. Restart the deployment');
        console.log('');
      }
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('');
    console.error('📋 Troubleshooting:');
    console.error('1. Check that all environment variables are set');
    console.error('2. Verify DATABASE_URL format');
    console.error('3. Check Railway logs for more details');
    console.error('');
    // Don't exit - try to keep server running for diagnostics
    console.log('⚠️  Server starting in limited mode...');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (limited mode)`);
      console.log('📧 Check logs for database connection details');
    });
  }
}

startServer();
