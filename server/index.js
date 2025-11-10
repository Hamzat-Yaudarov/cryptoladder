import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db.js';
import { createBot } from './bot.js';
import authRoutes from './routes/auth.js';
import activationRoutes from './routes/activation.js';
import pyramidRoutes from './routes/pyramid.js';
import paymentsRoutes from './routes/payments.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL || 'https://cryptoladder-production.up.railway.app/';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activation', activationRoutes);
app.use('/api/pyramid', pyramidRoutes);
app.use('/api/payments', paymentsRoutes);

// Serve static files from client/dist
app.use(express.static('client/dist'));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(new URL('../client/dist/index.html', import.meta.url).pathname);
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized');

    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    // Initialize Telegram bot
    if (botToken) {
      const bot = createBot(botToken, webAppUrl);
      
      bot.launch().catch((err) => {
        console.error('Failed to launch bot:', err);
      });

      process.once('SIGINT', () => {
        bot.stop('SIGINT');
      });
      process.once('SIGTERM', () => {
        bot.stop('SIGTERM');
      });

      console.log('Telegram bot started');
    } else {
      console.warn('TELEGRAM_BOT_TOKEN not set, bot not started');
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
