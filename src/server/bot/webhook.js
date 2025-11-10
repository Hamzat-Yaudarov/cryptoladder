import axios from 'axios';

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;
const WEBHOOK_URL = `${WEB_APP_URL}/bot/webhook`;

if (!BOT_TOKEN) {
  console.error('❌ ОШИБКА: BOT_TOKEN не установлен в переменных окружения');
  console.error('   Установи переменные в Railway Dashboard:');
  console.error('   BOT_TOKEN=8212904290:AAE2-EfWsYZ_kwVLMM4GOJMHkfwd4d2lW8M');
}

export async function setupBotWebhook() {
  try {
    if (!BOT_TOKEN) {
      throw new Error('BOT_TOKEN не установлен');
    }
    // Remove old webhook
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);

    // Set new webhook
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        url: WEBHOOK_URL,
        allowed_updates: ['message', 'callback_query'],
      }
    );

    if (response.data.ok) {
      console.log('✅ Bot webhook set to:', WEBHOOK_URL);
    } else {
      throw new Error(response.data.description);
    }
  } catch (error) {
    console.error('⚠️ Could not set webhook:', error.message);
  }
}

export async function sendTelegramMessage(chatId, text, options = {}) {
  try {
    if (!BOT_TOKEN) {
      throw new Error('BOT_TOKEN не установлен в переменных окружения');
    }
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...options,
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send message:', error.message);
    throw error;
  }
}

export async function editTelegramMessage(chatId, messageId, text, options = {}) {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`,
      {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        ...options,
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Failed to edit message:', error.message);
  }
}
