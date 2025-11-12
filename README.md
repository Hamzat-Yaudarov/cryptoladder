# CityLadder - Telegram MiniApp Game

🌆 **CityLadder** is an economic Telegram MiniApp game where players build cities, invite friends, and earn Telegram Stars through factory production and resident networks.

## Features

### 🎮 Core Gameplay
- **Build Your City**: Expand with houses to increase depth levels
- **Activate Factories**: Run factories to earn passive income (10⭐️/24h)
- **Invite Friends**: Grow your network with referral codes
- **Earn Stars**: Get income from residents at different depth levels

### 📊 Economic System
- **5-Level Income Structure**:
  - Level 1: 3 residents × 4⭐️ = 12⭐️/day
  - Level 2: 9 residents × 2.5⭐️ = 22.5⭐️/day
  - Level 3: 27 residents × 1.7⭐️ = 45.9⭐️/day
  - Level 4: 81 residents × 1⭐️ = 81⭐️/day
  - Level 5: 243 residents × 0.5⭐️ = 121.5⭐️/day

- **Weekly Rankings**:
  - 🥇 Rank 1: 100⭐️
  - 🥈 Rank 2: 75⭐️
  - 🥉 Rank 3: 50⭐️
  - 4-5: 25⭐️ & 15⭐️

### 📱 MiniApp Tabs
1. **🏙 City** - Main dashboard with balance, factory status, referral code
2. **👥 Residents** - View residents by level and income distribution
3. **💸 Income** - Track earnings, transactions, statistics
4. **🏗️ Construction** - Upgrade city levels and view earnings potential
5. **⚙️ Profile** - User info, stats, rankings, game rules

## Architecture

### Backend Stack
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL (Neon)
- **Bot**: Telegram Bot API
- **Hosting**: Railway

### Frontend Stack
- **Framework**: Vanilla JavaScript (no build required)
- **Styling**: CSS3 with CSS variables
- **Telegram Integration**: Telegram Web App SDK

### Project Structure
```
cityladder-bot/
├── server/                    # Backend code
│   ├── index.js              # Main server file
│   ├── db.js                 # Database connection
│   ├── services/             # Business logic
│   │   ├── userService.js
│   │   ├── cityService.js
│   │   ├── profitService.js
│   │   └── referralService.js
│   ├── routes/               # API endpoints
│   │   ├── api.js
│   │   └── bot.js
│   └── utils/
│       └── helpers.js
├── database/
│   └── schema.sql            # PostgreSQL schema
├── public/                   # Frontend (MiniApp)
│   ├── index.html
│   ├── js/
│   │   └── app.js
│   └── styles/
│       ├── app.css
│       └── tabs/             # Tab-specific styles
├── package.json
└── .env.example
```

## Setup & Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL (via Neon)
- Telegram Bot Token
- Railway account (for hosting)

### 1. Clone & Install
```bash
git clone <repo-url>
cd cityladder-bot
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your credentials:
# - BOT_TOKEN: Your Telegram bot token
# - DATABASE_URL: Your Neon PostgreSQL connection string
# - WEBAPP_URL: Your deployed Railway app URL
```

### 3. Database Initialization
The database schema is automatically initialized on server startup via `database/schema.sql`.

### 4. Start Development Server
```bash
npm run dev
```

### 5. Deploy to Railway
```bash
# Railway auto-deploys from git
# Just push your code:
git push origin main
```

### 6. Configure Telegram Webhook
The webhook is automatically set when the server starts. Ensure your Railway URL is set in the environment variables.

## Bot Commands

### `/start`
Welcome message with link to open the MiniApp

### `/city`
Show current city status, balance, and factory info

### `/referrals`
List all your referrals with their stats

### `/help`
Display game rules and how to play

## API Endpoints

### Authentication
- `POST /api/auth/user` - Authenticate Telegram user

### City Management
- `GET /api/city/:userId` - Get city data
- `POST /api/factory/activate` - Activate factory for 24h
- `POST /api/maintenance/check-factories` - Deactivate expired factories

### Income & Profits
- `GET /api/profit/summary/:userId` - Get hourly/daily/weekly profit
- `GET /api/stats/:userId` - Get user statistics
- `POST /api/balance/add` - Add stars (testing)

### Referrals & Rankings
- `GET /api/referrals/:userId` - Get user's referrals
- `POST /api/referral/join` - Join city via code
- `POST /api/referral/claim-bonus` - Claim referral bonus
- `GET /api/rankings/weekly` - Get weekly rankings

### Transactions
- `GET /api/transactions/:userId` - Get transaction history

## Database Schema

### Key Tables
- **users** - Telegram user data
- **cities** - City information per user
- **houses** - House/depth levels
- **factories** - Factory activation status
- **referrals** - Invite relationships
- **profit_history** - Income records
- **weekly_rankings** - Weekly competition data
- **transactions** - Star transactions

## Scheduled Jobs

### Every 10 Minutes
- Check and deactivate expired factories

### Daily (Midnight UTC)
- Distribute weekly ranking rewards

## Development Notes

### Adding a New Tab
1. Create component in `public/components/tabs/NewTab.jsx`
2. Add CSS in `public/styles/tabs/new-tab.css`
3. Update `ui.switchTab()` in `/public/js/app.js`
4. Add tab button in `ui.renderApp()`

### Modifying Database Schema
1. Update `database/schema.sql`
2. The schema is re-run on server restart

### Adding API Endpoints
1. Create route in `server/routes/api.js` or `server/routes/bot.js`
2. Add service logic in `server/services/`
3. Call from frontend via `api.call()`

## Security Notes

⚠️ **Environment Variables**
- Never commit `.env` file
- All secrets are passed via environment variables
- Database connection uses SSL/TLS

⚠️ **Telegram Verification**
- User data is verified via Telegram WebApp SDK
- Bot webhook validates updates from Telegram

⚠️ **Referral System**
- Referral codes are hashed and unique per city
- Prevented duplicate referrals via UNIQUE constraint
- All relationships verified via Telegram ID

## Performance Considerations

### Database
- Indexed on frequently queried columns
- Referral tree uses recursive CTE
- Profit distribution uses batch inserts

### API Rate Limiting
- Should be added before production
- Implement via `express-rate-limit`

### Frontend
- No build step required (faster development)
- CSS is inlined to reduce requests
- Vanilla JS (no framework overhead)

## Troubleshooting

### "Unable to get Telegram user data"
- Ensure you're opening the app via Telegram MiniApp
- Check that `WEBAPP_URL` environment variable is set correctly

### Database Connection Error
- Verify `DATABASE_URL` format
- Check that Neon database is active
- Ensure SSL mode is enabled

### Factory Not Activating
- Check user balance (need 10⭐️)
- Verify city exists for user
- Check database permissions

## Future Enhancements

- [ ] Telegram Stars payment integration
- [ ] City customization/themes
- [ ] Real-time WebSocket updates
- [ ] In-game events/bonuses
- [ ] Leaderboard persistence
- [ ] User achievements/badges
- [ ] Gift system between users
- [ ] Mobile app version

## License

Proprietary - All rights reserved

## Support

Contact the development team for support or feature requests.

---

Built with ❤️ for Telegram
