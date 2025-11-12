import axios from 'axios';

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';
const BOT_TOKEN = process.env.BOT_TOKEN;

class TelegramBotAPI {
  constructor(token) {
    this.token = token;
    this.baseUrl = `${TELEGRAM_API_URL}${token}`;
  }

  /**
   * Send a text message
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Edit a message
   */
  async editMessage(chatId, messageId, text, options = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/editMessageText`, {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Error editing message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send inline keyboard buttons
   */
  async sendInlineKeyboard(chatId, text, buttons) {
    try {
      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error sending inline keyboard:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send reply keyboard buttons
   */
  async sendReplyKeyboard(chatId, text, buttons) {
    try {
      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: buttons,
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error sending reply keyboard:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(chatId, messageId) {
    try {
      const response = await axios.post(`${this.baseUrl}/deleteMessage`, {
        chat_id: chatId,
        message_id: messageId,
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Answer callback query
   */
  async answerCallbackQuery(callbackQueryId, text, options = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId,
        text,
        show_alert: options.show_alert || false,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Error answering callback query:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user profile photos
   */
  async getUserProfilePhotos(userId) {
    try {
      const response = await axios.get(`${this.baseUrl}/getUserProfilePhotos`, {
        params: {
          user_id: userId,
          limit: 1,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user profile photos:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get file info
   */
  async getFile(fileId) {
    try {
      const response = await axios.get(`${this.baseUrl}/getFile`, {
        params: {
          file_id: fileId,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting file:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get chat info
   */
  async getChat(chatId) {
    try {
      const response = await axios.get(`${this.baseUrl}/getChat`, {
        params: {
          chat_id: chatId,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting chat:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get me (bot info)
   */
  async getMe() {
    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      return response.data;
    } catch (error) {
      console.error('Error getting bot info:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Set webhook
   */
  async setWebhook(url, options = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/setWebhook`, {
        url,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Error setting webhook:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook() {
    try {
      const response = await axios.post(`${this.baseUrl}/deleteWebhook`);
      return response.data;
    } catch (error) {
      console.error('Error deleting webhook:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get webhook info
   */
  async getWebhookInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/getWebhookInfo`);
      return response.data;
    } catch (error) {
      console.error('Error getting webhook info:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new TelegramBotAPI(BOT_TOKEN);
