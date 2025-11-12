import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';
import { UserService } from '../services/userService.js';
import { CityService } from '../services/cityService.js';
import { EconomyService } from '../services/economyService.js';
import { ReferralService } from '../services/referralService.js';

dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN not set. Bot will not run.');
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

// Start command
bot.command('start', async (ctx) => {
  const from = ctx.message.from;
  const args = ctx.message.text.split(' ')[1];
  const referrerId = args ? parseInt(args, 10) : null;

  try {
    // Check if user exists
    let user = await UserService.getUserByTelegramId(from.id);

    if (!user) {
      // Create new user
      user = await UserService.createUser(
        from.id,
        from.username,
        from.first_name,
        from.last_name || '',
        referrerId
      );

      // Process referral if referrer exists
      if (referrerId) {
        const referrer = await UserService.getUserById(referrerId);
        if (referrer) {
          await ReferralService.processReferral(referrerId, user.id);
        }
      }

      // Log activity
      await UserService.logActivity(user.id, 'USER_CREATED', {
        referred_by: referrerId || null,
      });
    }

    // Build message
    const miniappUrl = process.env.MINIAPP_URL;
    const message = `
🌆 Добро пожаловать в CityLadder!

Это экономическая игра, где вы строите свой город и зарабатываете звёзды ⭐️

🎮 Нажмите кнопку ниже, чтобы открыть игру:
    `;

    await ctx.reply(message.trim(), {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🏙️ Открыть игру',
              web_app: { url: miniappUrl },
            },
          ],
        ],
      },
    });
  } catch (error) {
    console.error('Error in /start command:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте ещё раз.');
  }
});

// Help command
bot.command('help', async (ctx) => {
  const message = `
📚 Справ��а по CityLadder

🏙️ Игра:
- Создайте свой город
- Пригласите жителей (реферрефлов)
- Запустите заводы для заработка
- Получайте звёзды ⭐️ от активности

💰 Экономика:
- 🏠 Дома дают уровни дохода
- 🏭 Заводы генерируют п��ибыль
- 👥 Прибыль распределяется по уровням

🎁 На��рады:
- Бонусы за рефереал
- Еженедельный рейтинг
- Специальные события

Открыть игру: /start
    `;
  await ctx.reply(message.trim());
});

// Stats command
bot.command('stats', async (ctx) => {
  try {
    const telegramId = ctx.message.from.id;
    const user = await UserService.getUserByTelegramId(telegramId);

    if (!user) {
      return ctx.reply('Пользователь не найден. Нажмите /start');
    }

    const referralCount = await ReferralService.getReferralCount(user.id);
    const referer = await ReferralService.getReferer(user.id);
    const city = await CityService.getCity(user.id);

    let stats = `
📊 Ваша статистика:

💰 Баланс: ${user.balance} ⭐️
👥 Рефереалы: ${referralCount}
🏙️ Город: Уровень ${city ? city.level : 'нет'}
${referer ? `📍 Приглашен: @${referer.username || 'unknown'}` : ''}
    `;

    await ctx.reply(stats.trim());
  } catch (error) {
    console.error('Error in /stats command:', error);
    await ctx.reply('❌ Произошла ошибка.');
  }
});

// About command
bot.command('about', async (ctx) => {
  const message = `
ℹ️ О CityLadder

CityLadder - это экономическая Telegram MiniApp-иг��а, созданная для развлечения и заработка звёзд.

🎮 Разработчик: CryptoLadder Team
🌐 Сайт: https://cryptoladder.io
💬 Поддержка: @cryptoladder_support

Версия: 1.0.0
    `;
  await ctx.reply(message.trim());
});

// Add fallback methods if token is missing
if (!process.env.TELEGRAM_BOT_TOKEN) {
  bot.launch = async () => {
    console.warn('⚠️  Cannot launch bot: TELEGRAM_BOT_TOKEN not set');
    return Promise.resolve();
  };
  bot.stop = () => {
    console.warn('⚠️  Bot is not running');
  };
}

export default bot;
