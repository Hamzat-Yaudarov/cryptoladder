import { Telegraf, Markup } from 'telegraf';
import { createOrUpdateUser, getUser, addReferral } from '../services/userService.js';

const bot = new Telegraf(process.env.BOT_TOKEN);
const WEBAPP_URL = process.env.WEBAPP_URL;

// Middleware to handle user creation/update
bot.use(async (ctx, next) => {
  try {
    if (ctx.from) {
      await createOrUpdateUser(ctx.from.id, {
        username: ctx.from.username,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name
      });
    }
  } catch (error) {
    console.error('Error updating user:', error);
  }
  return next();
});

// Start command
bot.start(async (ctx) => {
  const referrerId = ctx.startPayload;

  try {
    if (referrerId && ctx.from) {
      const existing = await getUser(ctx.from.id);
      if (existing && !existing.referrer_id) {
        try {
          await addReferral(ctx.from.id, referrerId);
          console.log(`Assigned referrer ${referrerId} to user ${ctx.from.id}`);
        } catch (err) {
          console.warn('Failed to assign referrer:', err.message);
        }
      }
    }
  } catch (err) {
    console.error('Error handling referral on start:', err);
  }

  const messageText = `🏙️ <b>Добр�� пожаловать в CityLadder!</b>\n\n\nЭто экономическая игра на Telegram, где в��:\n✨ Строите собственный город\n👥 Приглашаете жителей и получаете прибыль\n🏭 Запускаете заводы и получаете звёзды ⭐️\n🎯 Соревнуетесь с другими игроками\n\n<b>Начните прямо сейчас и начните зарабатывать!</b>`;

  ctx.replyWithHTML(
    messageText,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🚀 Открыть игру', `${WEBAPP_URL}?startApp=1${referrerId ? `&ref=${referrerId}` : ''}`)]
    ])
  );
});

// Help command
bot.help((ctx) => {
  const helpText = `<b>Помощь - CityLadder</b>

Команды:
/start - Начать игру
/help - Показать эту справку
/rules - Правила игры

Нужна помощь? Напишите в поддержку через приложение!`;

  ctx.replyWithHTML(helpText);
});

// Rules command
bot.command('rules', (ctx) => {
  const rulesText = `<b>📖 Правила CityLadder</b>

1. <b>Создание города</b>
   💰 Стоит 3⭐️ (один раз)
   🏠 Получаете 2 дома и 1 завод

2. <b>Управление городом</b>
   🏠 Дома = уровни получения дохода
   🏭 Завод запускае��ся на 24 часа

3. <b>Заработок</b>
   ✅ Запустите завод (10⭐️/сутки)
   👥 Приглашайте жителей
   💸 Получайте прибыль от их активности

4. <b>Рейтинг</b>
   🥇 Топ 5 игроков получают награды
   📅 Обновляется каждую неделю

Удачи в игре! 🎮`;

  ctx.replyWithHTML(rulesText);
});

// Catch all other messages
bot.on('message', (ctx) => {
  ctx.reply('Используйте команду /help для информации или откройте приложение ниже:',
    Markup.inlineKeyboard([
      [Markup.button.webApp('🎮 Открыть CityLadder', `${WEBAPP_URL}?startApp=1`)]
    ])
  );
});

export default bot;
