# CityLadder 🏙️

**Экономическая игра "Город прибыли"** — Telegram MiniApp где игроки строят города, приглашают жителей и получают звёзды ⭐️ (Telegram Stars).

## 🎮 Игровые механики

### Основная идея
Каждый игрок создаёт свой город, состоящий из домов и завода. Город растёт вверх за счёт приглашённых рефералов, что увеличивает глубину дохода.

### Экономика

#### 💰 Стоимости
- **Создание города**: 3⭐️ (одноразово, даёт 2 дома + 1 завод)
- **Активация завода**: 10⭐️ за 24 часа

#### 📊 Распределение прибыли по уровням

| Уровень | Игроков | Процент | Пример (за 10⭐️) |
|---------|---------|---------|-----------------|
| 1       | до 3    | 40%     | 4⭐️ на человека |
| 2       | до 9    | 25%     | 2.5⭐️ на человека |
| 3       | до 27   | 17%     | 1.7⭐️ на человека |
| 4       | до 81   | 10%     | 1⭐️ на человека |
| 5       | до 243  | 5%      | 0.5⭐️ на человека |

**Важно**: Прибыль выплачивается **каждый час** автоматически.

### 🏗️ Развитие города

Город развивается автоматически при достижении порогов рефералов:

| Уровень | Дома | Уровни дохода | Рефералов |
|---------|------|---------------|-----------|
| 1       | 2    | 1             | 0         |
| 2       | 2    | 2             | 0-14      |
| 3       | 3    | 3             | 15-34     |
| 4       | 4    | 4             | 35-69     |
| 5       | 5    | 5             | 70+       |

### 👥 Реферальная система

- **Приглашение**: Игрок получает реферальную ссылку для приглашения друзей
- **Бонус**: +0.5⭐️ за первую активацию завода реферала
- **Структура**: Рефералы заселяются в города по уровням близости

### 🏆 Еженедельный рейтинг

Каждую неделю начисляются награды за количество приглашённых:

| Место | Награда |
|-------|---------|
| 🥇 1  | 100⭐️   |
| 🥈 2  | 75⭐️    |
| 🥉 3  | 50⭐️    |
| 4     | 25⭐️    |
| 5     | 15⭐️    |

## 📱 Интерфейс MiniApp

### 5 основных вкладок

1. **🏙️ Город** — Баланс, статус завода, кнопка активации
2. **👥 Жители** — Список рефералов, реферальная ссылка, структура города
3. **💸 Доход** — График прибыли, история транзакций, статистика
4. **🏗️ Строительство** — Информация об апгрейдах города, прогресс развития
5. **⚙️ Профиль** — Инфо игрока, еженедельный рейтинг, справка, поддержка

## 🏗️ Архитектура проекта

```
cityladder/
├── server.js                          # Главный entry point
├── package.json                       # Зависимости
├── index.html                         # HTML entry for frontend
│
├── src/
│   ├── server/                        # Backend
│   │   ├── db/
│   │   │   ├── client.js             # PostgreSQL client
│   │   │   └── init.js               # Schema initialization
│   │   ├── bot/
│   │   │   ├── webhook.js            # Bot webhook handler
│   │   │   └── handlers.js           # Bot command handlers
│   │   ├── services/
│   │   │   ├── userService.js        # User management
│   │   │   ├── cityService.js        # City & house management
│   │   │   ├── factoryService.js     # Factory & profit logic
│   │   │   ├── referralService.js    # Referral system
│   │   │   ├── ratingService.js      # Weekly ratings
│   │   │   └── schedulerService.js   # Background tasks
│   │   └── routes/
│   │       ├── bot.js                # Bot webhook routes
│   │       └── api.js                # REST API routes
│   │
│   └── frontend/                      # Frontend MiniApp
│       ├── main.jsx                  # React entry point
│       ├── App.jsx                   # Main app with nav
│       ├── context/
│       │   └── AppContext.js         # Global state
│       ├── tabs/
│       │   ├── CityTab.jsx           # City tab
│       │   ├── CitizensTab.jsx       # Citizens/referrals tab
│       │   ├── IncomeTab.jsx         # Income history tab
│       │   ├── ConstructionTab.jsx   # City upgrades tab
│       │   └── ProfileTab.jsx        # Profile & ratings tab
│       └── styles/
│           ├── global.css            # Global styles
│           ├── App.css               # App layout
│           └── tabs.css              # Tab styles
│
├── Dockerfile                         # Docker config
├── railway.toml                       # Railway config
├── DEPLOYMENT.md                      # Deployment guide
└── README.md                          # This file
```

## 🗄️ Database Schema

### Users
- `id` — Primary key
- `telegram_id` — Telegram ID (unique)
- `username` — Telegram username
- `first_name` — First name
- `referrer_id` — Referrer's user ID
- `created_at` — Account creation date

### Cities
- `id` — Primary key
- `user_id` — Owner user ID (foreign key)
- `level` — City level (1-5)
- `houses` — Number of houses
- `balance` — Star balance
- `created_at`, `updated_at`

### Factories
- `id` — Primary key
- `city_id` — Owner city ID (foreign key)
- `is_active` — Activation status
- `activated_at` — Activation timestamp
- `deactivates_at` — Deactivation timestamp
- `created_at`, `updated_at`

### Referrals
- `id` — Primary key
- `referrer_id` — Referrer user ID (foreign key)
- `referred_id` — Referred user ID (foreign key)
- `level` — Network level depth
- `activated_factory_bonus_claimed` — Bonus claim status
- `created_at`

### Transactions
- `id` — Primary key
- `user_id` — Owner user ID (foreign key)
- `type` — Transaction type
- `amount` — Star amount
- `description` — Details
- `source_user_id` — Source user (for profits)
- `level_income_from` — Income level
- `created_at`

### Weekly Ratings
- `id` — Primary key
- `week_start` — Week start date
- `user_id` — User ID (foreign key)
- `referral_count` — Referral count for week
- `rank` — Weekly rank
- `reward_claimed` — Reward claim status
- `created_at`

## 🔄 Scheduler Tasks

### Profit Processing (Every 1 minute)
1. Find all active factories
2. For each factory owner, traverse referral chain
3. Calculate profit at each level based on percentage
4. Add hourly portion to each referrer's balance
5. Deactivate expired factories

### Rating Updates (Every 1 hour)
1. Count referrals for each user
2. Sort by referral count
3. Update weekly_ratings table
4. Assign ranks 1-∞

### Weekly Rewards (Daily at midnight UTC)
1. Get current week's ratings
2. For top 5, add reward to balance
3. Mark reward as claimed
4. Record transaction

## 🚀 Development

### Local Setup
```bash
npm install
npm run dev
```

Server: http://localhost:8080
Frontend: http://localhost:3001 (via Vite proxy)

### Build for Production
```bash
npm run build
```

Output: `dist/` folder with built frontend

## 📡 API Endpoints

### Authentication
All endpoints require `user_id` parameter (Telegram ID).

### User
- `GET /api/user/profile` — Get user profile

### City
- `GET /api/city/stats` — Get city stats & factories
- `POST /api/city/build-house` — Build house (upgrade city)

### Factory
- `POST /api/factory/activate` — Activate factory for 24h

### Referrals
- `GET /api/referrals` — Get referral list & link

### Income
- `GET /api/transactions` — Get transaction history

### Rating
- `GET /api/rating/weekly` — Get weekly ratings

## 🤖 Telegram Bot

### Commands
- `/start` — Welcome message with MiniApp button
- `callback_query` — Button handlers (rules, support)

### Webhook
- URL: `https://cryptoladder-production.up.railway.app/bot/webhook`
- Method: POST
- Telegram sends updates to this endpoint

## 🔐 Security

- **Bot**: Token in environment variable
- **Database**: SSL/TLS connection required
- **API**: User authentication via Telegram ID
- **Secrets**: Never committed to repository

## 📈 Game Balance

### Economy
- Factory cost (10⭐️) should equal ~10 hours of profit from 1st level
- Profit percentages decrease with depth to prevent infinite loops
- Weekly rewards encourage activity without breaking economy

### Growth
- 1st level: 3 players — easy to fill
- 2nd level: 9 players — encourages sharing
- 3rd level: 27 players — real network effect
- 4th-5th: Exponential growth — aspirational targets

### Anti-Fraud
- Telegram ID validation prevents bot accounts
- Factory requires balance deduction (no free farming)
- Referral structure prevents self-referencing

## 🐛 Troubleshooting

### Factory not activating
- Check if user has balance >= 10⭐️
- Verify city exists in database
- Check for database connection errors

### Profit not showing
- Verify factory is_active = true
- Check deactivates_at > now()
- Ensure referrer has referral records
- Check profit processing in scheduler logs

### Bot not responding
- Verify BOT_TOKEN is correct
- Check webhook URL in Telegram
- Review server logs for errors

## 📞 Support
- Telegram: @cryptoladder_support
- Email: support@cityladder.app (if available)

## 📜 License
Private project — All rights reserved © 2024
