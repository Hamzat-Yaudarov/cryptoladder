import express from 'express';
import { Telegraf } from 'telegraf';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

const bot = new Telegraf(BOT_TOKEN);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../dist')));

// User data storage (in-memory for demo, use database in production)
const usersDb = {};

function loadUserData(userId) {
  if (!usersDb[userId]) {
    usersDb[userId] = {
      userId,
      username: '',
      dimensionLevel: 1,
      soulEnergy: 100,
      crystals: 0,
      soulCards: [],
      abilities: [],
      dimensions: { unlocked: [1], current: 1 },
      lastDailyClaimTime: 0,
      createdAt: Date.now()
    };
  }
  return usersDb[userId];
}

// REST API Routes
app.post('/api/user/:userId', (req, res) => {
  try {
    const userData = loadUserData(req.params.userId);
    res.json(userData);
  } catch (error) {
    console.error('Ошибка в /api/user:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

app.post('/api/user/:userId/claim-daily', (req, res) => {
  const userData = loadUserData(req.params.userId);
  const now = Date.now();
  const lastClaim = userData.lastDailyClaimTime;
  
  if (now - lastClaim < 86400000) {
    return res.status(400).json({ error: 'Already claimed today' });
  }
  
  const bonus = Math.floor(Math.random() * 50) + 30;
  userData.soulEnergy += bonus;
  userData.crystals += 10;
  userData.lastDailyClaimTime = now;
  
  res.json({
    soulEnergy: userData.soulEnergy,
    crystals: userData.crystals,
    bonusEnergy: bonus
  });
});

app.post('/api/user/:userId/action', (req, res) => {
  const { action } = req.body;
  const userData = loadUserData(req.params.userId);
  
  const actions = {
    meditate: { energyCost: 10, reward: 5, message: 'Медитируешь в другом измерении...' },
    explore: { energyCost: 20, reward: 15, message: 'Исследуешь неизведанный мир...' },
    summon: { energyCost: 30, reward: 25, message: 'Вызываешь сущность из другого измерения...' }
  };
  
  const act = actions[action];
  if (!act || userData.soulEnergy < act.energyCost) {
    return res.status(400).json({ error: 'Not enough energy' });
  }
  
  userData.soulEnergy -= act.energyCost;
  const gained = Math.floor(Math.random() * 10) + act.reward;
  userData.crystals += gained;
  
  res.json({
    action,
    message: act.message,
    gained,
    soulEnergy: userData.soulEnergy,
    crystals: userData.crystals
  });
});

app.post('/api/user/:userId/unlock-dimension', (req, res) => {
  const userData = loadUserData(req.params.userId);
  
  if (userData.dimensionLevel >= userData.dimensions.unlocked.length) {
    const nextDim = userData.dimensions.unlocked.length + 1;
    userData.dimensions.unlocked.push(nextDim);
    res.json({ newDimension: nextDim });
  } else {
    res.status(400).json({ error: 'Already unlocked' });
  }
});

app.post('/api/user/:userId/draw-card', (req, res) => {
  const userData = loadUserData(req.params.userId);
  const cardRarities = ['common', 'common', 'rare', 'epic'];
  const cardNames = {
    common: ['Звездная пыль', 'Лунный луч', 'Ночной ветер'],
    rare: ['Драконий огонь', 'Ледяная душа', 'Золотой щит'],
    epic: ['Абсолютный хаос', 'Вечная мудрость', 'Космическое разрушение']
  };
  
  const rarity = cardRarities[Math.floor(Math.random() * cardRarities.length)];
  const names = cardNames[rarity];
  const card = {
    id: Math.random().toString(36),
    name: names[Math.floor(Math.random() * names.length)],
    rarity,
    power: Math.floor(Math.random() * 100) + 1
  };
  
  userData.soulCards.push(card);
  res.json(card);
});

// Telegram Bot Commands
bot.start(async (ctx) => {
  console.log(`👤 User started: ${ctx.from.id}`);
  const webAppUrl = WEBAPP_URL;

  try {
    await ctx.reply(
      '✨ Добро пожаловать в **Измерение Ани** ✨\n\n' +
      '_Здесь каждый пользователь - путешественник между мирами..._\n\n' +
      '🌀 Откройте приложение и начните исследовать свой космический потенциал!',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🌌 Открыть Измерение',
              web_app: { url: webAppUrl }
            }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('Error in start command:', error.message);
  }
});

bot.command('stats', async (ctx) => {
  console.log(`📊 Stats requested by: ${ctx.from.id}`);
  const userData = loadUserData(ctx.from.id);
  try {
    await ctx.reply(
      `📊 **Ваша Статистика в Измерении Ани**\n\n` +
      `⚡ Уровень Измерения: ${userData.dimensionLevel}\n` +
      `🔮 Энергия Души: ${userData.soulEnergy}\n` +
      `💎 Кристаллы: ${userData.crystals}\n` +
      `🃏 Собрано карт: ${userData.soulCards.length}\n` +
      `🌍 Разблокировано измерений: ${userData.dimensions.unlocked.length}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error in stats command:', error.message);
  }
});

bot.command('about', async (ctx) => {
  console.log(`❤️ About requested by: ${ctx.from.id}`);
  try {
    await ctx.reply(
      `❤️ **Об Ане и её Измерении**\n\n` +
      `Аня - мистическая сущность, живущая между мирами. ` +
      `Каждый пользователь этого приложения становится её спутником в путешествии через бесконечные измерения.\n\n` +
      `🎭 Её стиль общения: загадочный, немного мемный, полный нежной иронии.\n` +
      `💫 Её мир: где магия встречается с киберпанком, а судьба танцует с технологией.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error in about command:', error.message);
  }
});

// Обработчик для всех остальных сообщений
bot.on('message', async (ctx) => {
  console.log(`💬 Message from ${ctx.from.id}: ${ctx.message.text}`);
  try {
    await ctx.reply('✨ Аня внимательно слушает... Используйте /start, /stats или /about');
  } catch (error) {
    console.error('Error handling message:', error.message);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Webhook handler for production
app.post('/webhook', express.json(), async (req, res) => {
  console.log('📥 Webhook received');
  try {
    await bot.handleUpdate(req.body);
    console.log('✅ Update handled');
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(500).json({ error: 'Failed to process update' });
  }
});

// SPA fallback: all GET requests go to index.html
app.get('*', (req, res) => {
  const indexPath = join(__dirname, '../dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(404).json({ error: 'Not found' });
    }
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  setTimeout(async () => {
    try {
      console.log(`📌 NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`📌 BOT_TOKEN: ${BOT_TOKEN ? '✓ Set' : '✗ Missing'}`);
      console.log(`📌 WEBAPP_URL: ${WEBAPP_URL || '✗ Missing'}`);

      if (process.env.NODE_ENV === 'production') {
        if (!WEBAPP_URL) {
          console.error('❌ WEBAPP_URL not set in production mode');
          return;
        }
        const webhookUrl = `${WEBAPP_URL}/webhook`;
        console.log(`🔗 Setting webhook to: ${webhookUrl}`);

        await bot.telegram.setWebhook(webhookUrl);
        console.log(`✅ Webhook successfully set`);
        console.log(`🤖 Bot ready for webhook updates`);
      } else {
        console.log('🤖 Launching bot in polling mode...');
        await bot.launch();
        console.log('✅ Bot launched successfully');
      }
    } catch (error) {
      console.error('❌ Error initializing bot:', error.message);
      console.error(error);
    }
  }, 1000);
});

process.once('SIGINT', () => {
  console.log('Stopping bot...');
  bot.stop('SIGINT');
  server.close(() => process.exit(0));
});

process.once('SIGTERM', () => {
  console.log('Stopping bot...');
  bot.stop('SIGTERM');
  server.close(() => process.exit(0));
});
