import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection, query } from './db/connection.js';
import apiRoutes from './api/routes.js';
import { errorHandler } from './middleware/auth.js';
import bot from './bot/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api', apiRoutes);

// Static files (for frontend build)
app.use(express.static('public'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Automatic database migration
async function runMigrations() {
  try {
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Running database migrations...');

    const statements = schema
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      await query(statement);
    }

    console.log('✅ Database migrations completed');
    return true;
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    return false;
  }
}

// Initialize server
async function initialize() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Run migrations
    await runMigrations();

    // Start Express server
    app.listen(port, () => {
      console.log(`✅ Server listening on port ${port}`);
      console.log(`🌐 Web App: ${process.env.WEB_APP_URL}`);
    });

    // Start Telegram bot (non-blocking)
    if (process.env.TELEGRAM_BOT_TOKEN) {
      bot
        .launch()
        .then(() => {
          console.log('✅ Telegram bot is running');
          console.log(`🤖 Bot: @${process.env.TELEGRAM_BOT_USERNAME}`);
        })
        .catch((error) => {
          console.error('❌ Failed to launch bot:', error.message);
          console.warn('⚠️  Bot is not running, but MiniApp will continue to work');
        });
    } else {
      console.warn('⚠️  TELEGRAM_BOT_TOKEN not set - bot will not run');
    }

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error('❌ Server initialization error:', error);
    process.exit(1);
  }
}

initialize();

export default app;
