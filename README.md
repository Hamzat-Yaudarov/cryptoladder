# Crypto Ladder 🪜

A revolutionary Telegram MiniApp featuring a smart pyramid system with daily activation rewards.

## Project Overview

Crypto Ladder is a social economic MiniApp system where players can:
- 💰 Earn ⭐️ (stars) from players below them in the pyramid structure
- 👥 Invite friends and get referral bonuses
- 📈 Build their own downline and unlock deeper income levels

### Key Features

✅ **Pyramid Structure**
- Ternary tree structure (each player can have up to 3 direct subordinates)
- Automatic distribution of players in pyramid
- Income only from your direct branch

✅ **Daily Activation System**
- Players pay 10⭐️ daily to receive earnings
- Distribution: Levels 1-5 get 35%, 21%, 14%, 8%, 4% respectively
- Remaining goes to the system owner

✅ **Referral System**
- Each player gets a unique referral link
- 0.5⭐��� bonus for each referred player's first activation
- Bonus repeats with each subsequent activation
- Referral depth depends on number of invited players

✅ **MiniApp Interface**
- 🏠 **Home**: Balance, activation status, pyramid position
- 👥 **Partners**: Referral management and level information
- 💸 **Income**: Earnings statistics and breakdown by levels
- ⚙️ **Profile**: Settings, rules, and help

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Neon)
- **Bot Framework**: Telegraf
- **Frontend**: React + Vite
- **Deployment**: Railway

## Setup Instructions

### Prerequisites
- Node.js 16+
- PostgreSQL database (Neon)
- Telegram Bot Token

### 1. Clone and Install

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@host/database
TELEGRAM_BOT_TOKEN=your_bot_token
PORT=8080
NODE_ENV=production
WEB_APP_URL=https://your-domain.com/
```

### 3. Initialize Database

The database schema is automatically created on first run. The server will initialize tables for:
- Users (with pyramid structure)
- Activations
- Referrals
- Earnings
- Purchases

### 4. Local Development

Start both server and frontend:

```bash
npm run dev
```

The dev server will:
- Run Express backend on port 8080
- Start Vite dev server with hot reload
- Proxy API calls to the backend

### 5. Build for Production

```bash
npm run build
```

This creates optimized builds for both server and frontend.

## Project Structure

```
├── server/
│   ├── index.js              # Main server file
│   ├── bot.js                # Telegram bot setup
│   ├── db.js                 # Database connection & schema
│   ├── services/
│   │   ├── userService.js    # User & pyramid logic
│   │   └── activationService.js  # Activation & earnings
│   └── routes/
│       ├── auth.js           # Authentication endpoints
│       ├── activation.js     # Activation & purchase endpoints
│       └── pyramid.js        # Pyramid & referral endpoints
├── client/
│   ├── src/
│   │   ├── main.jsx          # React entry point
│   │   ├── App.jsx           # Main app component
│   │   ├── context/
│   │   │   └── UserContext.jsx   # User state management
│   │   └── components/
│   │       ├── tabs/         # Tab components
│   │       │   ├── Home.jsx
│   │       │   ├── Partners.jsx
│   │       │   ├── Income.jsx
│   │       │   └── Profile.jsx
│   │       └── styles/       # Component styles
│   └── index.html
├── vite.config.js
├── package.json
└── .env.example
```

## API Endpoints

### Authentication
- `POST /api/auth/init` - Initialize new user
- `GET /api/auth/user/:telegramId` - Get user data

### Activation
- `POST /api/activation/activate/:userId` - Daily activation
- `POST /api/activation/buy-place/:userId` - Buy pyramid place
- `GET /api/activation/earnings/:userId` - Get earnings stats

### Pyramid
- `GET /api/pyramid/structure/:userId` - Get pyramid structure
- `GET /api/pyramid/downline/:userId` - Get downline users
- `GET /api/pyramid/referrals/:userId` - Get referral list

## Deployment to Railway

### 1. Push to Git
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Railway Configuration

Create a `railway.json` in root:
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false
  }
}
```

### 3. Set Environment Variables on Railway
- `DATABASE_URL` - Your Neon database connection string
- `TELEGRAM_BOT_TOKEN` - Your bot token
- `PORT` - Set to 8080
- `WEB_APP_URL` - Your Railway app domain

### 4. Deploy
Push to the Railway-connected repository, and it will automatically deploy.

## Neon Database Connection

The project uses Neon PostgreSQL. Your connection string format:
```
postgresql://user:password@ep-xxx.c-2.eu-central-1.aws.neon.tech/database?sslmode=require&channel_binding=require
```

Set this as your `DATABASE_URL` environment variable.

## Telegram Bot Commands

The bot responds to:
- `/start` - Shows greeting and opens MiniApp button
- `/help` - Shows game rules and earning system

## Economics Summary

### Purchase
- **Cost**: 3⭐️ per place
- **Goes to**: System owner (100%)

### Daily Activation
- **Cost**: 10⭐️
- **Distribution of 5⭐️ among referrer tree**:
  - Level 1: 35% (1.75⭐️)
  - Level 2: 21% (1.05⭐️)
  - Level 3: 14% (0.7⭐️)
  - Level 4: 8% (0.4⭐️)
  - Level 5: 4% (0.2⭐️)
  - Remaining: Goes to system owner

### Referral Bonuses
- **Amount**: 0.5⭐️ per referred player activation
- **Frequency**: Each time referred player activates
- **Unlocks levels**: Based on referral count
  - 0-14: 2 levels
  - 15-34: 3 levels
  - 35-69: 4 levels
  - 70+: 5 levels

## Important Notes

⚠️ **Anti-Fraud Measures**
- Can only activate if placed in pyramid
- Can't activate twice in 24 hours
- Inactive players (>3 days) have frozen branches
- Only active players receive earnings

🔒 **Security**
- Telegram WebApp validation
- Database connection over SSL/TLS
- Environment variables for sensitive data
- Input validation on all endpoints

## Support & License

For issues or questions, please contact the project maintainers.

---

**Crypto Ladder © 2024** - A decentralized earning platform
