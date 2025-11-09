# 🚀 Crypto Ladder - Quick Start

## What You Have

A complete Telegram MiniApp for a smart pyramid system with:
- ✅ Telegram Bot with /start command
- ✅ MiniApp with 4 functional tabs (Home, Partners, Income, Profile)
- ✅ PostgreSQL database schema
- ✅ Complete API backend
- ✅ Star distribution algorithm
- ✅ Referral system with depth-based earning

## One-Time Setup

### 1. Connect Your Neon Database

The database connection string is already configured:
```
postgresql://neondb_owner:npg_9E0jKXaBbpQm@ep-long-dream-ageb5l8j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

The init script will automatically create all tables on first run.

### 2. Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repo
3. Create a new project
4. Set environment variables:
   ```
   TELEGRAM_BOT_TOKEN=8212904290:AAE2-EfWsYZ_kwVLMM4GOJMHkfwd4d2lW8M
   DATABASE_URL=postgresql://neondb_owner:npg_9E0jKXaBbpQm@ep-long-dream-ageb5l8j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   PORT=8080
   NODE_ENV=production
   WEBHOOK_URL=https://cryptoladder-production.up.railway.app/bot/webhook
   ```

5. Railway will automatically:
   - Install dependencies
   - Run database initialization
   - Deploy the app

### 3. Test the Bot

Open Telegram and search for **@cryptoladderbot** and press `/start`

You should see:
- Welcome message
- MiniApp button
- Your referral link

### 4. Access the MiniApp

Click the button or visit: https://cryptoladder-production.up.railway.app/

## How It Works

### User Flow
1. User taps **Open Crypto Ladder** in Telegram bot
2. MiniApp loads their data
3. User **buys a place** (3⭐️) → Gets position in pyramid
4. User **activates daily** (10⭐️) → Earns from referrals
5. User **invites friends** → Gets 0.5⭐️ per friend activation

### Earning System
When any user under you activates (10⭐️ cost):
- Level 1 (direct): 35% (3.5⭐️)
- Level 2: 21% (2.1⭐️)
- Level 3: 14% (1.4⭐️)
- Level 4: 8% (0.8⭐️)
- Level 5: 4% (0.4⭐️)
- Leftover → Creator receives

Plus:
- 0.5⭐️ for each referral's activation
- Bonus depth (up to 5 levels) based on referral count

## Project Structure

```
├── public/              # MiniApp frontend
│   ├── index.html      # UI with 4 tabs
│   └── app.js          # Logic & API calls
│
├── src/
│   ├── server/index.js # Express + Bot handler
│   ├── db/             # Database setup
│   └── services/       # Business logic
│
├── scripts/
│   └── init-db.js      # Automatic on Railway
│
├── Procfile            # Railway config
└── README.md           # Full documentation
```

## Test Locally (Optional)

```bash
# Install dependencies
npm install

# Create .env file with your tokens
echo "TELEGRAM_BOT_TOKEN=your_token" > .env
echo "DATABASE_URL=your_neon_connection" >> .env

# Initialize database
npm run init-db

# Start development server
npm run dev

# Bot will use polling mode
# Access MiniApp at http://localhost:8080
```

## Key Features Implemented

✅ **Telegram Bot**
- /start command
- Referral link generation
- Welcome message

✅ **MiniApp (4 Tabs)**
- 🏠 Home: Balance, status, buy/activate buttons
- 👥 Partners: Referral link, list of direct referrals
- 💸 Income: Earnings, distribution breakdown, history
- ⚙️ Profile: User info, how it works, support

✅ **Backend API**
- User management with auto-creation
- Buy place (3⭐️)
- Daily activation (10⭐️)
- Star distribution across pyramid levels
- Referral tracking and bonuses
- Transaction history
- Leaderboard

✅ **Database**
- Users with pyramid position
- Referral relationships
- Star transactions
- Activation tracking

✅ **Pyramid Mechanics**
- 3-branch tree structure
- Automatic position assignment
- Up to 5 levels of earning
- Depth unlocks with referrals

## Next Steps

1. **Deploy**: Push to GitHub, Railway deploys automatically
2. **Monitor**: Check Railway logs for any issues
3. **Test**: Add test referrals, activate, verify star distribution
4. **Share**: Users can join via your referral link
5. **Support**: Update support link in Profile tab

## Common Issues

**Bot not responding?**
- Check if webhook is set in Railway logs
- Verify TELEGRAM_BOT_TOKEN is correct

**Database errors?**
- Check DATABASE_URL in environment variables
- Ensure SSL is enabled in connection string

**MiniApp shows "Loading..."?**
- Check browser console (F12) for errors
- Verify API_BASE URL matches your Railway domain

**Can't activate?**
- User must buy place first (3⭐️)
- User must have 10⭐️ for activation
- Check last activation time (24h cooldown)

## Support

- Read [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup
- Check [README.md](README.md) for full documentation
- Review server logs: `railway logs`
- Test API endpoints: `curl https://your-domain/api/user/123`

---

**You're all set! 🚀 Your Crypto Ladder is ready to go.**
