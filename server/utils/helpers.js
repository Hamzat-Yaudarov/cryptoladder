import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generate a unique referral code
 */
export function generateReferralCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

/**
 * Generate a unique UUID
 */
export function generateUUID() {
  return uuidv4();
}

/**
 * Verify Telegram webhook signature
 * https://core.telegram.org/bots/webhooks
 */
export function verifyTelegramSignature(req, botToken) {
  const signature = req.headers['x-telegram-bot-api-secret-header'];
  
  if (!signature) {
    return false;
  }
  
  const secretKey = crypto
    .createHash('sha256')
    .update(botToken)
    .digest();
  
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  return signature === expectedSignature;
}

/**
 * Calculate city level based on referral count
 */
export function calculateCityLevelFromReferrals(referralCount) {
  if (referralCount < 15) return 1;
  if (referralCount < 35) return 2;
  if (referralCount < 70) return 3;
  if (referralCount < 100) return 4;
  return 5;
}

/**
 * Format date to readable string
 */
export function formatDate(date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format stars amount (currency)
 */
export function formatStars(amount) {
  return `${parseFloat(amount).toFixed(2)}⭐️`;
}

/**
 * Calculate time remaining until factory expires
 */
export function getTimeRemaining(expiresAt) {
  const now = new Date();
  const expireDate = new Date(expiresAt);
  const diff = expireDate - now;
  
  if (diff < 0) return '0h';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

/**
 * Validate email (basic)
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Sanitize string input
 */
export function sanitizeInput(str) {
  return str?.toString().trim().substring(0, 255) || '';
}

/**
 * Delay execution (for testing/retries)
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Build Telegram bot command keyboard
 */
export function buildKeyboard(buttons) {
  return {
    reply_markup: {
      keyboard: buttons,
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };
}

/**
 * Build inline keyboard
 */
export function buildInlineKeyboard(buttons) {
  return {
    reply_markup: {
      inline_keyboard: buttons,
    },
  };
}
