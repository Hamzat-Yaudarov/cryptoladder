import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import bot from '../bot/telegramBot.js';
import apiRouter from '../routes/api.js';
import { initializeDatabase } from '../database/client.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize database
try {
  await initializeDatabase();
  console.log('✅ Database initialized');
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}

// API Routes
app.use('/api', apiRouter);

// Telegram webhook
const BOT_USERNAME = process.env.BOT_USERNAME || 'cryptoladderbot';
const WEBHOOK_URL = `${process.env.WEBAPP_URL}/webhook/${BOT_USERNAME}`;

app.post(`/webhook/${BOT_USERNAME}`, (req, res) => {
  bot.handleUpdate(req.body, res)
    .then(() => res.status(200).end())
    .catch((err) => {
      console.error('Webhook error:', err);
      res.status(200).end();
    });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve MiniApp
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 MiniApp available at ${process.env.WEBAPP_URL}`);
  console.log(`🤖 Telegram bot: @${BOT_USERNAME}`);
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
  
  // Set webhook on startup (optional, can be done via Telegram API)
  try {
    await bot.telegram.setWebhook(WEBHOOK_URL, {
      allowed_updates: ['message', 'callback_query']
    });
    console.log('✅ Webhook set successfully');
  } catch (error) {
    console.warn('⚠️ Could not set webhook:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
