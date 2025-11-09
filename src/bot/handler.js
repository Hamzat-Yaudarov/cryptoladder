import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { getOrCreateUser, buyPlace, addReferral } from '../services/userService.js';

const stringSession = new StringSession('');

export async function handleStart(bot, message) {
  const userId = message.from.id;
  const userData = {
    username: message.from.username,
    first_name: message.from.first_name,
    last_name: message.from.last_name
  };

  // Get or create user
  const user = await getOrCreateUser(userId, userData);

  // Handle referral
  const args = message.text.split(' ');
  if (args.length > 1) {
    const refCode = args[1];
    const referrer = await getOrCreateUser(parseInt(refCode.split('_')[1]), {});
    if (referrer && referrer.id !== user.id) {
      await addReferral(referrer.id, user.id);
    }
  }

  const miniAppUrl = `https://cryptoladder-production.up.railway.app/?tgWebAppData=${encodeURIComponent(message.from.id)}`;

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
}

export async function handleReferralStart(bot, message) {
  const userId = message.from.id;
  const userData = {
    username: message.from.username,
    first_name: message.from.first_name,
    last_name: message.from.last_name
  };

  const user = await getOrCreateUser(userId, userData);

  const args = message.text.split(' ');
  if (args.length > 1) {
    const refCode = args[1];
    try {
      const referrerTgId = parseInt(refCode.replace('ref_', ''));
      const referrer = await getOrCreateUser(referrerTgId, {});
      
      if (referrer && referrer.id !== user.id) {
        await addReferral(referrer.id, user.id);
      }
    } catch (err) {
      console.log('Invalid referral code');
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
    `🪜 You were invited! Start with your first purchase.\n\n` +
    `💎 Your Referral Link: https://t.me/cryptoladderbot/miniapp?startapp=ref_${userId}\n\n` +
    `Click the button below to open the MiniApp:`,
    { reply_markup: keyboard }
  );
}
