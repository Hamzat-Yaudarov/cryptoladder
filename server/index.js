import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { initializeDatabase } from './db.js';
import { checkAndDeactivateExpiredFactories } from './services/cityService.js';
import { distributeWeeklyRewards } from './services/referralService.js';
import apiRoutes from './routes/api.js';
import botRoutes, { initializeWebhook } from './routes/bot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// STATIC FILES (Frontend MiniApp)
// ============================================================================

app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api', apiRoutes);
app.use('/bot', botRoutes);

// ============================================================================
// HEALTH CHECK & INFO
// ============================================================================

app.get('/', (req, res) => {
  res.json({
    name: 'CityLadder Bot & MiniApp',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/info', (req, res) => {
  res.json({
    bot_username: process.env.BOT_USERNAME,
    webapp_url: process.env.WEBAPP_URL,
    api_version: 'v1',
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// ============================================================================
// STARTUP
// ============================================================================

async function startup() {
  try {
    console.log('🚀 Starting CityLadder Bot & MiniApp...');
    
    // Initialize database
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, async () => {
      console.log(`✅ Server running on port ${PORT}`);
      
      // Initialize bot webhook
      await initializeWebhook();
      
      // Schedule maintenance tasks
      scheduleMaintenanceTasks();
    });
  } catch (error) {
    console.error('❌ Startup error:', error);
    process.exit(1);
  }
}

// ============================================================================
// SCHEDULED TASKS
// ============================================================================

function scheduleMaintenanceTasks() {
  // Check expired factories every 10 minutes
  setInterval(async () => {
    try {
      await checkAndDeactivateExpiredFactories();
    } catch (error) {
      console.error('Error in factory maintenance task:', error);
    }
  }, 10 * 60 * 1000);
  
  // Distribute weekly rewards every day at midnight UTC
  setInterval(async () => {
    try {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() < 1) {
        await distributeWeeklyRewards();
      }
    } catch (error) {
      console.error('Error in weekly rewards task:', error);
    }
  }, 60 * 1000);
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// ============================================================================
// START
// ============================================================================

startup();
