# CityLadder - Telegram MiniApp Economic Game

🏙️ An economic Telegram MiniApp game where players build cities, invite residents, and earn Telegram Stars through factory production and level-based profit distribution.

## 📋 Project Structure

```
cityladder/
├── src/
│   ├── server.js                 # Main Express server & bot launcher
│   ├── db/
│   │   ├── connection.js         # Database connection pool
│   │   ├── schema.sql            # Database schema & tables
│   │   ├── migrate.js            # Database migration script
│   │   └── seed.js               # Database seeding script
│   ├── services/
│   │   ├── userService.js        # User management & activities
│   │   ├── cityService.js        # City & house management
│   │   ��── economyService.js     # Factory & profit distribution
│   │   ├── referralService.js    # Referral & tree management
│   │   └── rankingService.js     # Weekly ranking & rewards
│   ├── api/
│   │   └── routes.js             # REST API endpoints
│   ├── bot/
│   │   └── index.js              # Telegram bot with commands
│   └── middleware/
│       └── auth.js               # Telegram Web App authentication
├── public/
│   ├── index.html                # HTML entry point
│   ├── main.jsx                  # React entry point
│   ├── app.jsx                   # Main App component
│   ├── tabs/
│   │   ├── CityTab.jsx           # City management tab
│   │   ├── ResidentsTab.jsx      # Residents & referrals tab
│   │   ├── IncomeTab.jsx         # Income & history tab
│   │   ├── BuildingTab.jsx       # Building & upgrades tab
│   │   └── ProfileTab.jsx        # Profile & ranking tab
│   └── styles/
│       ├── app.css               # Main app styles
│       └── tabs.css              # Tab-specific styles
├── Dockerfile                     # Container configuration
├── package.json                   # Dependencies & scripts
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (Neon)
- Telegram Bot Token
- Railway account (for deployment)

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Initialize database**
   ```bash
   npm run migrate
   npm run seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The server will start on http://localhost:8080

## 🎮 Game Mechanics

### City Structure
- **Houses**: Each house represents an income level (1 dorm = 1 level)
- **Factory**: Generates daily profit when activated (10 ⭐️/day)
- **Residents**: Invited players occupy houses and generate profit

### Profit Distribution
Profit is distributed by levels when factories are active:

| Level | Max Players | Profit/Player | Total % |
|-------|------------|---------------|---------|
| 1     | 3          | 4 ⭐️         | 40%    |
| 2     | 9          | 2.5 ⭐️       | 25%    |
| 3     | 27         | 1.7 ⭐️       | 17%    |
| 4     | 81         | 1 ⭐️         | 10%    |
| 5     | 243        | 0.5 ⭐️       | 5%     |

### City Upgrades
- **Level 2**: 2 houses (0-14 referrals)
- **Level 3**: 3 houses (15-34 referrals)
- **Level 4**: 4 houses (35-69 referrals)
- **Level 5**: 5 houses (70+ referrals)

### Weekly Ranking
Top 5 players by referral count earn rewards:
- 🥇 1st: 100 ⭐️
- 🥈 2nd: 75 ⭐️
- 🥉 3rd: 50 ⭐️
- 4th: 25 ⭐️
- 5th: 15 ⭐️

## 📱 MiniApp Tabs

### 🏙 City Tab
- Display balance and city level
- Show house structure with residents
- Activate/manage factory
- View city stats

### 👥 Residents Tab
- List of invited referrals
- Referral link for inviting
- Referral statistics
- Level distribution table

### 💸 Income Tab
- Profit history with timestamps
- Income statistics (total, average, count)
- Filter by level
- Profit breakdown chart

### 🏗 Building Tab
- City upgrade opportunities
- Requirements for each level
- Factory management info
- Development path guide

### ⚙️ Profile Tab
- User information
- Weekly ranking status
- Ranking statistics
- Recent activities
- Help & FAQ

## 🔌 API Endpoints

### User
- `GET /api/user/me` - Current user info
- `GET /api/activities` - User activities
- `GET /api/transactions` - Transaction history

### City
- `GET /api/city` - City details
- `POST /api/city/create` - Create new city
- `GET /api/city/structure` - House structure

### Factory
- `GET /api/factory` - Factory status
- `POST /api/factory/activate` - Activate factory for 24h

### Income
- `GET /api/income/history` - Profit history & stats

### Referrals
- `GET /api/referrals` - List referrals
- `GET /api/referrals/link` - Referral link
- `GET /api/referrals/tree` - Referral tree

### Ranking
- `GET /api/ranking/weekly` - Weekly ranking
- `GET /api/ranking/me` - User ranking status
- `POST /api/ranking/claim-reward` - Claim weekly reward

### Building
- `GET /api/building/upgrades` - Available upgrades
- `POST /api/building/upgrade` - Upgrade city

## 🤖 Telegram Bot Commands

- `/start` - Welcome message with MiniApp link
- `/help` - Game instructions
- `/stats` - Quick player statistics
- `/about` - About the game

## 🗄️ Database Schema

### Tables
- **users**: Player accounts with Telegram IDs
- **cities**: City data with levels and houses
- **houses**: Individual house slots with residents
- **factories**: Factory activation status
- **profit_distributions**: Income history
- **weekly_rankings**: Weekly leaderboard
- **activity_logs**: Player actions
- **transactions**: Balance changes

## 🔐 Authentication

Uses Telegram Web App validation:
1. Client gets `initData` from Telegram SDK
2. Sends in `Authorization: Bearer {initData}` header
3. Server validates hash with bot token
4. Creates/updates user in database

## 📦 Dependencies

- **express**: Web framework
- **telegraf**: Telegram bot framework
- **pg**: PostgreSQL driver
- **cors**: Cross-origin requests
- **body-parser**: Request parsing
- **uuid**: ID generation
- **dotenv**: Environment variables

## 🚢 Deployment to Railway

1. **Connect Git repository**
   ```bash
   git remote add railway <railway-git-url>
   git push railway main
   ```

2. **Environment Variables**
   - `DATABASE_URL`: Neon PostgreSQL connection
   - `TELEGRAM_BOT_TOKEN`: Bot token
   - `PORT`: 8080

3. **Post-deployment**
   - Run migrations: `npm run migrate`
   - Optional seed: `npm run seed`

## 🛠️ Configuration

### Environment Variables
```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_BOT_USERNAME=...
WEB_APP_URL=https://...
MINIAPP_URL=https://...
CITY_CREATION_COST=3
FACTORY_DAILY_COST=10
REFERRAL_BONUS=0.5
WEEKLY_RANK_REWARD_1=100
WEEKLY_RANK_REWARD_2=75
WEEKLY_RANK_REWARD_3=50
WEEKLY_RANK_REWARD_4=25
WEEKLY_RANK_REWARD_5=15
```

## 📊 Game Flow

1. **Create Account**: User opens bot link → Creates account with Telegram ID
2. **Create City**: Costs 3 ⭐️ → Get 2 houses + 1 factory
3. **Invite Friends**: Share referral link → Friends become residents
4. **Activate Factory**: Costs 10 ⭐️/day → Start earning profit
5. **Earn Income**: Profit from resident factories distributed by levels
6. **Upgrade City**: Based on referral count → Get more houses & levels
7. **Weekly Ranking**: Top 5 by referrals → Claim rewards

## 🔄 Profit Calculation

```
Total Daily Profit = 10 ⭐️ (per active factory)

Distribution:
- Level 1: 10 * 40% / 3 players = 4 ⭐️ per player
- Level 2: 10 * 25% / 9 players = 2.5 ⭐️ per player
- Level 3: 10 * 17% / 27 players = 1.7 ⭐️ per player
- Level 4: 10 * 10% / 81 players = 1 ⭐️ per player
- Level 5: 10 * 5% / 243 players = 0.5 ⭐️ per player

Hourly: Daily profit / 24
```

## 🐛 Debugging

Enable logging by checking console output. Each service logs important events:
- Database migrations
- User creation/updates
- Factory activations
- Profit distributions
- Ranking calculations

## 📝 Notes

- All balances are in Telegram Stars (⭐️)
- Profit distribution runs hourly
- Weekly ranking resets every Monday
- Factories expire after 24 hours of activation
- Referral bonuses are 0.5 ⭐️ per first activation

## 📄 License

MIT License - See LICENSE file for details

## 👥 Support

For issues or questions:
- Check `/help` in Telegram bot
- Review in-app help section
- Contact development team

---

**Made with ❤️ for CityLadder Players**
