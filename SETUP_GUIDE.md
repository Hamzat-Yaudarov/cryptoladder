# CityLadder - Setup & Deployment Guide

## 🎯 Prerequisites

Before starting, you'll need:
- Node.js 18 or higher
- PostgreSQL database (Neon)
- Telegram Bot account
- Railway account for deployment
- Git

## 🔧 Step 1: Local Setup

### 1.1 Clone & Install
```bash
git clone <your-repo>
cd cityladder
npm install
```

### 1.2 Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL=postgresql://neondb_owner:npg_9E0jKXaBbpQm@ep-long-dream-ageb5l8j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
TELEGRAM_BOT_TOKEN=8212904290:AAE2-EfWsYZ_kwVLMM4GOJMHkfwd4d2lW8M
TELEGRAM_BOT_USERNAME=cryptoladderbot
WEB_APP_URL=https://cryptoladder-production.up.railway.app
MINIAPP_URL=https://t.me/cryptoladderbot/miniapp
```

### 1.3 Initialize Database
```bash
npm run migrate
npm run seed
```

### 1.4 Start Development Server
```bash
npm run dev
```

Server will run at `http://localhost:8080`

## 🚀 Step 2: Railway Deployment

### 2.1 Connect to Railway
```bash
railway login
railway link  # Link to your Railway project
```

### 2.2 Set Environment Variables
```bash
railway variables set DATABASE_URL "postgresql://..."
railway variables set TELEGRAM_BOT_TOKEN "8212904290:AAE2-..."
railway variables set TELEGRAM_BOT_USERNAME "cryptoladderbot"
railway variables set WEB_APP_URL "https://cryptoladder-production.up.railway.app"
railway variables set MINIAPP_URL "https://t.me/cryptoladderbot/miniapp"
```

### 2.3 Deploy
```bash
git push railway main
```

### 2.4 Run Migrations on Production
```bash
railway run npm run migrate
```

## 📱 Step 3: Telegram Bot Setup

### 3.1 Create Bot
1. Open Telegram and find @BotFather
2. Send `/newbot`
3. Enter bot name: "CityLadder" (or your choice)
4. Enter bot username: "cryptoladderbot"
5. Copy the token provided

### 3.2 Configure WebApp
1. Send `/mybots` to @BotFather
2. Select your bot
3. Edit "Bot Settings"
4. Set Web App URL: `https://cryptoladder-production.up.railway.app`

### 3.3 Register Commands
Send to @BotFather:
```
/setcommands

start - Start the game and open MiniApp
help - Show game rules and commands
stats - Display your statistics
about - Information about the game
```

## 🎮 Testing the Game

### Test User Flow:
1. Open Telegram and search for your bot (@cryptoladderbot)
2. Tap `/start` or press the button
3. Tap "🏙️ Открыть игру" to open the MiniApp

### Test Features:
- Create a city (costs 3 ⭐️)
- Activate factory (costs 10 ⭐️/day)
- Copy referral link
- Invite a friend with the link
- Check profit distribution

## 🔍 Debugging

### View Server Logs
```bash
railway logs
```

### Check Database
```bash
psql your_connection_string
SELECT * FROM users;
SELECT * FROM cities;
```

### Test API Endpoints
```bash
# Get user info
curl -H "Authorization: Bearer <initData>" \
  https://cryptoladder-production.up.railway.app/api/user/me

# Get city info
curl -H "Authorization: Bearer <initData>" \
  https://cryptoladder-production.up.railway.app/api/city
```

## 📊 Database Management

### Backup Database
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Reset Database
```bash
npm run migrate  # Recreates all tables
npm run seed     # Adds test data
```

## 🛠️ Common Issues

### Issue: Database Connection Failed
**Solution:**
1. Check DATABASE_URL in .env
2. Verify Neon database is running
3. Check firewall rules allow PostgreSQL

### Issue: Bot Token Invalid
**Solution:**
1. Get new token from @BotFather
2. Update TELEGRAM_BOT_TOKEN in .env
3. Restart server

### Issue: MiniApp Not Loading
**Solution:**
1. Check WEB_APP_URL is accessible
2. Clear Telegram cache
3. Check browser console for errors

### Issue: Migrations Fail
**Solution:**
1. Check database connection
2. Delete tables manually if stuck
3. Run migrations again

## 📈 Performance Optimization

### Database Indexes
Indexes are created automatically in schema.sql

### Caching
Implement Redis for:
- User profile data
- City information
- Referral tree caching

### Rate Limiting
Add rate limiting for factory activation:
```javascript
// In routes.js
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});
app.post('/api/factory/activate', limiter, ...);
```

## 🔐 Security Checklist

- [ ] Environment variables not committed
- [ ] Database credentials secured
- [ ] Bot token never exposed in logs
- [ ] HTTPS enabled
- [ ] Telegram data validation working
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using parameterized queries)
- [ ] CORS properly configured

## 📱 Mobile Optimization

The MiniApp is optimized for:
- iPhone (iOS 13+)
- Android (5.0+)
- Large and small screens
- Portrait and landscape

## 🚀 Advanced Configuration

### Custom Port
```env
PORT=3000
```

### Enable Debug Logging
```bash
DEBUG=* npm run dev
```

### Database Connection Pooling
Adjust in `src/db/connection.js`:
```javascript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 📝 Monitoring

### Set Up Error Monitoring (Sentry)
```bash
npm install @sentry/node
```

### Log Transactions
All transactions are logged in `transactions` table
Query with:
```sql
SELECT * FROM transactions WHERE created_at > NOW() - INTERVAL '1 day';
```

## 🎯 Next Steps

1. ✅ Deploy to Railway
2. ✅ Test all game features
3. ✅ Configure Telegram bot commands
4. ✅ Set up monitoring/logging
5. ✅ Launch to users
6. Monitor user growth
7. Implement additional features
8. Add more game events/seasons

## 📞 Support

- Documentation: See README.md
- API Reference: See routes.js
- Database Schema: See src/db/schema.sql

---

**Congratulations!** Your CityLadder game is ready to launch! 🎉
