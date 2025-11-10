import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './src/server/db/init.js';
import { setupBotWebhook } from './src/server/bot/webhook.js';
import botRouter from './src/server/routes/bot.js';
import apiRouter from './src/server/routes/api.js';
import { startScheduler } from './src/server/services/schedulerService.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Полностью отключаем кэширование для всех ответов
app.use((req, res, next) => {
  // Удаляем заголовки которые могут привести к кэшированию
  res.removeHeader('ETag');
  res.removeHeader('Last-Modified');

  // Устанавливаем антикэш заголовки
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '-1');
  res.set('Surrogate-Control', 'no-store');

  next();
});

app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: 0,
  etag: false,
  lastModified: false,
}));
app.use('/api', apiRouter);
app.use('/bot', botRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      res.status(500).send('Error loading app');
    }
  });
});

async function start() {
  try {
    await initDatabase();
    console.log('✅ Database initialized');

    await setupBotWebhook();
    console.log('✅ Bot webhook setup complete');

    startScheduler();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Web App URL: ${process.env.WEB_APP_URL}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
