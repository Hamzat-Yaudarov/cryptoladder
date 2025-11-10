import { sendTelegramMessage } from './webhook.js';
import { getOrCreateUser } from '../services/userService.js';
import { query } from '../db/client.js';

export async function handleStart(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const username = message.from.username || '';
  const firstName = message.from.first_name || '';
  const text = message.text || '';

  let referrerId = null;
  if (text.includes(' ')) {
    const refCode = text.split(' ')[1];
    const refMatch = refCode.match(/^ref_(\d+)$/);
    if (refMatch) {
      referrerId = parseInt(refMatch[1], 10);
    }
  }

  try {
    const user = await getOrCreateUser(userId, { username, firstName, referrerId });

    const miniAppUrl = `https://t.me/cryptoladderbot/miniapp`;
    const appLink = `${process.env.WEB_APP_URL}?user_id=${userId}`;

    const buttons = {
      inline_keyboard: [
        [
          {
            text: '🎮 Открыть CityLadder',
            web_app: { url: appLink },
          },
        ],
        [
          {
            text: '📖 Правила игры',
            callback_data: 'rules',
          },
          {
            text: '💬 Поддержка',
            callback_data: 'support',
          },
        ],
      ],
    };

    const welcomeText = `
🏙️ <b>Добро пожаловать в CityLadder!</b>

<b>Экономическая игра, где ты строишь свой город и зарабатываешь Telegram Stars ⭐️</b>

<b>Как играть:</b>
• 🏠 Строй дома в своем городе
• 🏭 Запускай заводы для получения прибыли
• 👥 Приглашай жителей и получай бонусы
• 🎖️ Участвуй в еженедельных рейтингах

<b>Начни прямо сейчас!</b>
    `;

    await sendTelegramMessage(chatId, welcomeText, { reply_markup: buttons });
  } catch (error) {
    console.error('Error in handleStart:', error);
    await sendTelegramMessage(
      chatId,
      '❌ Произошла ошибка. Попробуй позже.'
    );
  }
}

export async function handleCallback(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  try {
    if (data === 'rules') {
      const rulesText = `
<b>📚 Правила CityLadder</b>

<b>1. Создание города</b>
• Стоимость: 3⭐️ (одноразово)
• Получаешь: 2 дома и 1 завод

<b>2. Строительство</b>
• 🏠 Дом: +1 уровень дохода (за рефералов)
• 🏭 Завод: 10⭐️ в сутки (запускает прибыль)

<b>3. Система прибыли</b>
• Заработок зависит от уровней ниже тебя
• 1 уровень: 40% от каждого завода
• 2 уровень: 25%
• И далее до 5 уровня: 5%

<b>4. Рефералы</b>
• За каждого приглашённого: +0.5⭐️ за первый завод
• Чем больше рефералов → выше город → больше прибыль

<b>5. Рейтинг</b>
• Еженедельный рейтинг по кол-ву рефералов
• 1️⃣: 100⭐️ | 2️⃣: 75⭐️ | 3️⃣: 50⭐️ | 4️⃣: 25⭐️ | 5️⃣: 15⭐️

<b>Удачи в стр��ительстве своего мегаполиса! 🌆</b>
      `;

      await sendTelegramMessage(chatId, rulesText);
    } else if (data === 'support') {
      const supportText = `
📧 <b>Служба поддержки</b>

Если у тебя есть вопросы или проблемы, напиши: @cryptoladder_support

💡 <i>Постарайся подробно описать проблему</i>
      `;

      await sendTelegramMessage(chatId, supportText);
    }
  } catch (error) {
    console.error('Error in handleCallback:', error);
  }
}
