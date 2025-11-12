import express from 'express';
import botService from '../services/botService.js';
import { getOrCreateUser, getUserProfile } from '../services/userService.js';
import { getCityData, activateFactory } from '../services/cityService.js';
import { getUserReferrals } from '../services/referralService.js';
import { buildInlineKeyboard } from '../utils/helpers.js';

const router = express.Router();

const BOT_USERNAME = process.env.BOT_USERNAME || 'cryptoladderbot';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://cryptoladder-production.up.railway.app';

/**
 * Handle Telegram webhook updates
 */
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Handle text messages
 */
async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text;
  const from = message.from;
  
  // Create/get user
  const user = await getOrCreateUser(from);
  
  if (text === '/start') {
    return await handleStart(chatId, from);
  }
  
  if (text === '/city') {
    return await handleCityCommand(chatId, user.telegram_id);
  }
  
  if (text === '/referrals') {
    return await handleReferralsCommand(chatId, user.telegram_id);
  }
  
  if (text === '/help') {
    return await handleHelpCommand(chatId);
  }
  
  // Default response
  await botService.sendMessage(
    chatId,
    `<b>👋 Hello, ${from.first_name}!</b>\n\n` +
    `Use the buttons below to play CityLadder:\n\n` +
    `<b>Commands:</b>\n` +
    `/start - Welcome message\n` +
    `/city - City information\n` +
    `/referrals - Your referrals\n` +
    `/help - Help and rules\n`,
    buildInlineKeyboard([[
      {
        text: '🎮 Open Game',
        web_app: { url: `${WEBAPP_URL}?user=${from.id}` },
      },
    ]])
  );
}

/**
 * Handle /start command
 */
async function handleStart(chatId, from) {
  const user = await getOrCreateUser(from);
  
  const welcomeText = `<b>🌆 Welcome to CityLadder!</b>\n\n` +
    `Build your city, invite friends, and earn <b>Telegram Stars ⭐️</b>\n\n` +
    `<b>How to Play:</b>\n` +
    `1️⃣ Build your city with houses\n` +
    `2️⃣ Start your factory to earn stars\n` +
    `3️⃣ Invite friends and become a megacity\n` +
    `4️⃣ Earn passive income from your residents\n\n` +
    `<b>Click below to open the game:</b>`;
  
  await botService.sendMessage(
    chatId,
    welcomeText,
    buildInlineKeyboard([[
      {
        text: '🎮 Play CityLadder',
        web_app: { url: `${WEBAPP_URL}?user=${from.id}` },
      },
    ]])
  );
}

/**
 * Handle /city command
 */
async function handleCityCommand(chatId, userId) {
  try {
    const profile = await getUserProfile(userId);
    
    if (!profile) {
      await botService.sendMessage(chatId, '❌ City not found');
      return;
    }
    
    const city = profile.city;
    const factoryStatus = city.is_factory_active 
      ? `✅ Active (expires in ${Math.floor((new Date(city.factory_expires_at) - new Date()) / 3600000)} hours)`
      : '❌ Inactive';
    
    const cityText = `<b>🏙 ${profile.first_name}'s City</b>\n\n` +
      `<b>City Level:</b> ${city.level}\n` +
      `<b>Total Houses:</b> ${city.total_houses}\n` +
      `<b>Balance:</b> ${city.balance.toFixed(2)}⭐️\n` +
      `<b>Referral Code:</b> <code>${city.referral_code}</code>\n\n` +
      `<b>Factory Status:</b> ${factoryStatus}\n` +
      `<b>Active Residents:</b> ${profile.referral_count}\n\n` +
      `<b>Want to expand your city?</b> Open the game!`;
    
    await botService.sendMessage(
      chatId,
      cityText,
      buildInlineKeyboard([[
        {
          text: '🎮 Open Game',
          web_app: { url: `${WEBAPP_URL}?user=${userId}` },
        },
      ]])
    );
  } catch (error) {
    console.error('City command error:', error);
    await botService.sendMessage(chatId, '❌ Error fetching city data');
  }
}

/**
 * Handle /referrals command
 */
async function handleReferralsCommand(chatId, userId) {
  try {
    const referrals = await getUserReferrals(userId);
    
    if (referrals.length === 0) {
      await botService.sendMessage(
        chatId,
        `<b>👥 No Referrals Yet</b>\n\n` +
        `Invite friends to join your city and start earning passive income!\n\n` +
        `Share your unique referral code in the game.`,
        buildInlineKeyboard([[
          {
            text: '🎮 Open Game',
            web_app: { url: `${WEBAPP_URL}?user=${userId}` },
          },
        ]])
      );
      return;
    }
    
    let refText = `<b>👥 Your Referrals (${referrals.length})</b>\n\n`;
    
    referrals.slice(0, 10).forEach((ref, index) => {
      refText += `${index + 1}. <b>${ref.first_name || 'Anonymous'}</b> (@${ref.username || 'unknown'})\n` +
        `   Level: ${ref.house_level} | Balance: ${ref.balance?.toFixed(2) || '0.00'}⭐️\n\n`;
    });
    
    if (referrals.length > 10) {
      refText += `... and ${referrals.length - 10} more`;
    }
    
    await botService.sendMessage(
      chatId,
      refText,
      buildInlineKeyboard([[
        {
          text: '🎮 Open Game',
          web_app: { url: `${WEBAPP_URL}?user=${userId}` },
        },
      ]])
    );
  } catch (error) {
    console.error('Referrals command error:', error);
    await botService.sendMessage(chatId, '❌ Error fetching referrals');
  }
}

/**
 * Handle /help command
 */
async function handleHelpCommand(chatId) {
  const helpText = `<b>📖 CityLadder Help & Rules</b>\n\n` +
    `<b>Game Basics:</b>\n` +
    `🏠 <b>Houses</b> - Determine your city depth (income levels)\n` +
    `🏭 <b>Factory</b> - Generates daily income. Costs 10⭐️ to activate for 24h\n` +
    `👥 <b>Residents</b> - Friends who joined your city\n\n` +
    `<b>Income System:</b>\n` +
    `Level 1: 3 residents × 4⭐️ each = 12⭐️/day\n` +
    `Level 2: 9 residents × 2.5⭐️ each = 22.5⭐️/day\n` +
    `Level 3: 27 residents × 1.7⭐️ each = 45.9⭐️/day\n` +
    `Level 4: 81 residents × 1⭐️ each = 81⭐️/day\n` +
    `Level 5: 243 residents × 0.5⭐️ each = 121.5⭐️/day\n\n` +
    `<b>Referrals:</b>\n` +
    `• Share your code to invite friends\n` +
    `• Get 0.5⭐️ bonus when they activate factory\n` +
    `• Earn from their daily factory income\n\n` +
    `<b>Weekly Rankings:</b>\n` +
    `🥇 Rank 1: 100⭐️\n🥈 Rank 2: 75⭐️\n🥉 Rank 3: 50⭐️\n4th: 25⭐️\n5th: 15⭐️\n\n` +
    `<b>Questions?</b> Use /start to open the game!`;
  
  await botService.sendMessage(
    chatId,
    helpText,
    buildInlineKeyboard([[
      {
        text: '🎮 Open Game',
        web_app: { url: WEBAPP_URL },
      },
    ]])
  );
}

/**
 * Handle callback queries (button clicks)
 */
async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const queryId = callbackQuery.id;
  
  // Just acknowledge the callback
  await botService.answerCallbackQuery(queryId, '✅ Loading game...', {
    show_alert: false,
  });
}

/**
 * Initialize webhook (run once on startup)
 */
export async function initializeWebhook() {
  try {
    const webhookUrl = `${process.env.WEBHOOK_URL || process.env.WEBAPP_URL}/bot/webhook`;
    
    await botService.setWebhook(webhookUrl);
    console.log(`✅ Webhook set to: ${webhookUrl}`);
    
    const botInfo = await botService.getMe();
    console.log(`✅ Bot ready: ${botInfo.result.first_name} (@${botInfo.result.username})`);
  } catch (error) {
    console.error('Webhook initialization error:', error);
  }
}

export default router;
