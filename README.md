# 🪜 Crypto Ladder - Smart Pyramid with Daily Activation

A Telegram MiniApp that implements a smart pyramid structure where users purchase places, activate daily, and earn stars from their referrals.

## 📋 Project Overview

Crypto Ladder is a social economic system built as a Telegram MiniApp where:

- Users **buy places** in a 3-branched pyramid (costs 3⭐️)
- Users **activate daily** to earn stars from their network (costs 10⭐️)
- Stars are **distributed** across 5 levels of the pyramid
- Users earn **referral bonuses** for direct invitations
- Earning depth increases with more referrals

## 🏗️ Architecture

```
cryptoladder-bot/
├── public/                  # MiniApp frontend
│   ├── index.html          # HTML entry point
│   └── app.js              # React logic & API calls
├── src/
│   ├── server/
│   │   └── index.js        # Express server & bot handler
│   ├── db/
│   │   ├── connection.js   # PostgreSQL connection
│   │   └── schema.sql      # Database schema
│   └── services/
│       ├── userService.js  # User & referral logic
│       └── activationService.js  # Activation & distribution
├── scripts/
│   └── init-db.js          # Database initialization
├── package.json
├── Procfile                # Railway deployment config
├── DEPLOYMENT.md           # Railway setup guide
└── README.md
```

## 🚀 Quick Start

### Local Development

1. **Install dependencies**
```bash
npm install
```

2. **Set environment variables** (create `.env` file)
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
DATABASE_URL=your_neon_connection_string
PORT=8080
```

3. **Initialize database**
```bash
npm run init-db
```

4. **Start server**
```bash
npm run dev
```

The MiniApp will be available at `http://localhost:8080`

### Railway Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 💰 Economic System

### Buying a Place (One-time)
- **Cost**: 3⭐️
- **Reward**: Position in the pyramid
- **Who gets it**: Creator/Admin receives 100%

### Daily Activation
- **Cost**: 10⭐️ per day
- **Payout**: 5⭐️ distributed
- **Distribution**:
  - Level 1 (direct supervisor): 35%
  - Level 2: 21%
  - Level 3: 14%
  - Level 4: 8%
  - Level 5: 4%
  - Leftover: Goes to creator

### Referral Bonus
- **Amount**: 0.5⭐️
- **When**: Every time your referral activates
- **Note**: Bonus doesn't count against distribution

### Earning Depth
Based on referral count:
- 0-14 referrals: 2 levels
- 15-34 referrals: 3 levels
- 35-69 referrals: 4 levels
- 70+ referrals: 5 levels

## 📱 MiniApp Tabs

### 🏠 Home
- Display balance
- Show activation status & countdown
- Buy place button
- Activate button
- Quick stats

### 👥 Partners
- Referral link with copy button
- List of direct referrals
- Current earning depth
- Progress to next tier

### 💸 Income
- Total earnings display
- Distribution breakdown chart
- Recent transactions
- Referral bonus info

### ⚙️ Profile
- User information
- Account status
- How it works guide
- Support link

## 🤖 Telegram Bot

### /start Command
Sends welcome message with MiniApp button

### Referral System
- Format: `/start ref_<telegram_id>`
- Creates referral relationship
- Grants referral bonuses on activation

## 🔌 API Endpoints

### User Data
- `GET /api/user/:telegramId` - Get user profile
- `GET /api/user/:telegramId/referrals` - Get referral list
- `GET /api/user/:telegramId/hierarchy` - Get pyramid structure
- `GET /api/user/:telegramId/transactions` - Get transaction history

### Actions
- `POST /api/user/buy-place` - Purchase place in pyramid
- `POST /api/user/activate` - Activate for the day

### Leaderboard
- `GET /api/leaderboard` - Top 100 users by stars

## 📊 Database Schema

### users
- telegram_id (unique)
- stars (decimal)
- has_bought_place (boolean)
- parent_id (pyramid hierarchy)
- created_at, last_activation

### referrals
- inviter_id
- invited_id
- created_at

### star_transactions
- user_id
- amount
- type (activation_income, referral_bonus, etc)
- source_user_id
- level
- created_at

### activations
- user_id
- activated_at
- expires_at
- is_active

## 🔐 Security Features

- SSL/TLS for all connections
- Database SSL required
- Environment variables for secrets
- User validation via Telegram
- Activation cooldown (24 hours)
- Inactivity freeze after 3 days

## 📈 Pyramid Structure

```
            [Root User]
         /      |      \
    [User1]  [User2]  [User3]
    /|  |     /|  |     /|  |
  [A][B][C] [D][E][F] [G][H][I]
```

- Each user can have up to 3 direct children
- Automatic distribution left-to-right, top-to-bottom
- Users only earn from their own branch

## 🛠️ Development

### Add a New Feature

1. Update database schema in `src/db/schema.sql`
2. Add services in `src/services/`
3. Add API endpoints in `src/server/index.js`
4. Update MiniApp UI in `public/app.js`

### Test Bot Locally

```bash
# Use ngrok for tunnel
ngrok http 8080

# Set webhook to ngrok URL
curl -X POST \
  -F "url=https://your-ngrok-url.ngrok.io/bot/webhook" \
  https://api.telegram.org/bot<TOKEN>/setWebhook
```

## 📞 Support

For issues and questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md)
- Review Railway logs
- Test with [BotFather](https://t.me/BotFather)

## 📄 License

All rights reserved - Crypto Ladder Team
