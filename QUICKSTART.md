# Crypto Ladder - Quick Start Guide

## What Was Built

A complete Telegram MiniApp ecosystem for a "smart pyramid" game called **Crypto Ladder**, featuring:

✅ **Telegram Bot** - Handles `/start` command and opens the MiniApp
✅ **React MiniApp** - 4-tab interface for gameplay  
✅ **Pyramid System** - 3-level binary tree with automatic position assignment
✅ **Activation Rewards** - Daily 10⭐️ activation earning system
✅ **Referral Program** - Invite friends, earn bonuses, unlock deeper levels
✅ **PostgreSQL Database** - All data stored in Neon
✅ **REST API** - All backend operations via Express
✅ **Production Ready** - Deployable to Railway

## What You Have

```
Crypto Ladder/
├── server/                    # Backend (Node.js/Express)
├── client/                    # Frontend (React/Vite)
├── package.json              # Dependencies & scripts
├── .env                       # Configuration (already set with your credentials)
├── README.md                 # Full documentation
├── DEPLOYMENT.md             # Railway deployment guide
└── ARCHITECTURE.md           # System design & technical details
```

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The server will:
- Start Express API on http://localhost:8080
- Initialize Postgres database automatically
- Launch Telegram bot with polling
- Serve static files

### 3. Test Locally

To test without actual Telegram integration:

1. Go to http://localhost:3001 (Vite dev server)
2. The app initializes with a test Telegram ID (123456789)
3. Navigate through all 4 tabs:
   - 🏠 **Home** - Balance and activation
   - 👥 **Partners** - Referral management  
   - 💸 **Income** - Earnings analytics
   - ⚙️ **Profile** - Rules and settings

### 4. Test with Telegram Bot

1. Search for **@cryptoladderbot** on Telegram
2. Click `/start` command
3. You'll see the greeting message with "Open Crypto Ladder" button
4. Click the button to open the MiniApp

## Deployment to Railway

### Prerequisites
- GitHub repository with this code
- Railway account connected to GitHub
- Neon PostgreSQL database (already configured)

### 1. Push to GitHub
```bash
git add .
git commit -m "Deploy Crypto Ladder"
git push origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select this repository
4. Railway will auto-deploy on push

### 3. Set Environment Variables in Railway

After first deployment, Railway assigns a domain like:
```
cryptoladder-production.up.railway.app
```

Update in Railway dashboard:
```
DATABASE_URL=postgresql://neondb_owner:npg_9E0jKXaBbpQm@ep-long-dream-ageb5l8j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

TELEGRAM_BOT_TOKEN=8212904290:AAE2-EfWsYZ_kwVLMM4GOJMHkfwd4d2lW8M

PORT=8080

NODE_ENV=production

WEB_APP_URL=https://cryptoladder-production.up.railway.app/
```

### 4. Verify Deployment

1. Check Railway logs for "Server running on port 8080"
2. Test bot: Search @cryptoladderbot and click /start
3. Click "Open Crypto Ladder" button
4. MiniApp should load

## Game Mechanics Summary

### Economy
- **Buy Place**: 3⭐️ (one-time, goes to system owner)
- **Daily Activation**: 10⭐️ (earn rewards for 24 hours)
- **Earnings Distribution**: 
  - Level 1: 35%
  - Level 2: 21%
  - Level 3: 14%
  - Level 4: 8%
  - Level 5: 4%
- **Referral Bonus**: 0.5⭐️ per referred player activation

### Pyramid Rules
- Each user can have up to 3 children
- Automatic position assignment
- 5 levels deep based on referral count
- Only active users earn (must activate daily)

### Levels Unlock by Referrals
- 0-14: Access to 2 levels
- 15-34: Access to 3 levels
- 35-69: Access to 4 levels
- 70+: Access to 5 levels

## Project Structure Explained

### Backend Routes

```
POST   /api/auth/init              ← Initialize user
GET    /api/auth/user/:id          ← Get user data

POST   /api/activation/activate    ← Daily activation (10⭐️)
POST   /api/activation/buy-place   ← Buy pyramid spot (3⭐️)
GET    /api/activation/earnings    ← Get earnings stats

GET    /api/pyramid/structure      ← View pyramid tree
GET    /api/pyramid/downline       ← View subordinates
GET    /api/pyramid/referrals      ← View invited players

GET    /health                      ← Health check
```

### Frontend Tabs

1. **Home** (🏠)
   - Balance display
   - Activation status
   - Buy place / Activate buttons
   - Pyramid position info

2. **Partners** (👥)
   - Referral link (copy & share)
   - Level unlock info
   - List of invited players

3. **Income** (💸)
   - Total earnings
   - Breakdown by source
   - Earnings by level
   - System explanation

4. **Profile** (⚙️)
   - User info
   - Account stats
   - Game rules
   - FAQ

## Key Files to Know

### Backend
- `server/index.js` - Express app setup
- `server/bot.js` - Telegram bot
- `server/db.js` - Database schema
- `server/services/userService.js` - User logic
- `server/services/activationService.js` - Game logic

### Frontend  
- `client/src/App.jsx` - Main component
- `client/src/context/UserContext.jsx` - State management
- `client/src/components/tabs/` - Tab components

## Useful Commands

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:migrate  # (If you add migrations later)
```

## Monitoring

### Check Server Status
```bash
curl https://cryptoladder-production.up.railway.app/health
# Response: {"status":"ok"}
```

### View Logs
```bash
# Railway dashboard → Select project → Deployments → View logs
```

### Database Queries
```bash
# Connect directly to Neon (for debugging):
psql 'postgresql://neondb_owner:npg_9E0jKXaBbpQm@ep-long-dream-ageb5l8j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

## Troubleshooting

### "Bot not responding"
→ Check TELEGRAM_BOT_TOKEN is correct
→ Verify bot hasn't been deleted in BotFather
→ Check Railway logs for errors

### "MiniApp not loading"
→ Verify WEB_APP_URL matches your Railway domain
→ Check browser console for errors
→ Ensure CORS is enabled (it is by default)

### "Database connection error"
→ Verify DATABASE_URL is correct
→ Test with: `psql 'your-connection-string'`
→ Check if Neon database is running

### "Balance not updating"
→ Reload page (force refresh with Ctrl+Shift+R)
→ Check API response in browser console
→ Verify user has been initialized with /api/auth/init

## Next Steps

1. ✅ Code is ready - all files created
2. 🚀 Push to GitHub
3. 🏗️ Deploy to Railway  
4. 🤖 Test with @cryptoladderbot
5. 📈 Monitor and scale as needed

## Support Resources

- **README.md** - Full documentation
- **ARCHITECTURE.md** - Technical design details
- **DEPLOYMENT.md** - Detailed deployment guide
- **Railway Docs** - https://railway.app/docs
- **Neon Docs** - https://neon.tech/docs
- **Telegram Bot API** - https://core.telegram.org/bots

## Important Notes

⚠️ **Database Cleanup** (if needed):
If you have issues with old tables in Neon, run:
```sql
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS earnings CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS activations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```
The app will recreate them on next startup.

💡 **Security**:
- Never commit `.env` file with real secrets
- Use Railway environment variables for production
- Telegram WebApp validates requests automatically

🎯 **Game Balance**:
The system is designed to be self-sustaining:
- Creator takes 100% of place purchases (3⭐️)
- Creator takes remaining earnings from daily activations
- Referral bonuses (0.5⭐️) come from creator's share

---

**Status**: ✅ Complete and ready to deploy
**Last Updated**: 2024
**Version**: 1.0.0
