# CityLadder - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Configure Environment Variables

Open your Railway project settings and add these environment variables:

```
BOT_TOKEN=8212904290:AAE2-EfWsYZ_kwVLMM4GOJMHkfwd4d2lW8M
BOT_USERNAME=cryptoladderbot
WEBAPP_URL=https://cryptoladder-production.up.railway.app
DATABASE_URL=postgresql://neondb_owner:npg_9E0jKXaBbpQm@ep-long-dream-ageb5l8j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NODE_ENV=production
PORT=8080
```

### Step 2: Initialize Database

The database schema automatically initializes on first server startup. No manual setup needed!

### Step 3: Deploy

Push your code to Railway:

```bash
git push origin main
```

Railway will automatically:
1. Install dependencies (`npm install`)
2. Start the server (`npm start`)
3. Initialize the database
4. Set up the Telegram webhook

### Step 4: Open MiniApp

Click this link to open the game:
**https://t.me/cryptoladderbot/miniapp**

---

## 🎮 How It Works

### For Players

1. **Open the App** → Click the link above or use `/start` command in Telegram
2. **Activate Factory** → Costs 10⭐️ to run for 24 hours
3. **Invite Friends** → Share your referral code
4. **Earn Stars** → Get income from residents' factory activity
5. **Climb Ranks** → Top 5 referrers earn weekly bonuses

### Income Examples

- **1 resident at Level 1**: 4⭐️/day
- **3 residents at Level 1**: 12⭐️/day
- **9 residents at Level 2**: 22.5⭐️/day
- **27 residents at Level 3**: 45.9⭐️/day

### City Levels

- **Level 1**: 2 houses (default) → Up to 3 referrals
- **Level 2**: 3 houses → 4-14 referrals
- **Level 3**: 4 houses → 15-34 referrals
- **Level 4**: 5 houses → 35-69 referrals
- **Level 5**: 6 houses → 70+ referrals

---

## 🤖 Telegram Bot Commands

### `/start`
Opens the MiniApp with welcome message

### `/city`
Shows your city status:
- Current level
- Number of houses
- Balance
- Factory status

### `/referrals`
Lists all your referrals with their:
- Names
- House levels
- Current balance

### `/help`
Displays complete game rules and income structure

---

## 📊 Dashboard Overview

### 🏙 City Tab
- View current balance
- Activate/check factory status
- See your referral code
- Track progress to next level

### 👥 Residents Tab
- View all referrals
- See income distribution by level
- Check resident statuses

### 💸 Income Tab
- Daily/weekly income tracking
- Transaction history
- Overall statistics

### 🏗️ Construction Tab
- View city upgrade paths
- See referral requirements
- Check weekly ranking rewards

### ⚙️ Profile Tab
- Personal statistics
- City information
- Game rules reference

---

## 🔧 Development & Customization

### Starting Local Server
```bash
npm run dev
```
Server runs on `http://localhost:8080`

### Viewing Database
Connect to your Neon database:
```bash
psql 'postgresql://user:pass@host/neondb?sslmode=require'
```

### Modifying Game Economics
Edit these files to change:
- **Costs/Rewards**: `server/services/profitService.js`
- **Upgrade Requirements**: `server/services/cityService.js`
- **Referral Bonuses**: `server/services/referralService.js`

### Deploying Updates
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Railway auto-deploys within seconds!

---

## ⚠️ Important Notes

### Security
- ✅ Bot token is secure (in Railway environment variables)
- ✅ Database uses SSL/TLS encryption
- ✅ User data verified via Telegram SDK
- ✅ Referrals prevented with UNIQUE constraints

### Rate Limiting
- Currently unlimited (add `express-rate-limit` for production)
- Recommended: 100 requests/minute per IP

### Monitoring
- Check Railway logs for errors
- Monitor database performance (Neon dashboard)
- Track bot webhook status

---

## 🚨 Troubleshooting

### "Cannot connect to database"
→ Verify `DATABASE_URL` in Railway settings
→ Check that Neon project is active

### "User data not found"
→ Ensure opening via Telegram MiniApp link
→ Not from web browser directly

### "Factory not activating"
→ Check user has 10⭐️ balance
→ Verify city was created (should be automatic)

### "Webhook not working"
→ Check `WEBAPP_URL` matches Railway domain
→ Verify Bot token is correct

---

## 📈 Next Steps

1. **Test with Friends**
   - Share bot link: https://t.me/cryptoladderbot
   - Have them activate factories
   - Monitor earnings

2. **Add Features**
   - Telegram Stars payment integration
   - More cosmetics/themes
   - Events/seasonal bonuses
   - Leaderboard persistence

3. **Monitor Performance**
   - Check Rails logs regularly
   - Monitor database load
   - Track user retention

4. **Promote**
   - Share referral link
   - Post in gaming communities
   - Create content/guides

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review `README.md` for details
3. Check Railway logs for errors
4. Contact development team

---

**Happy City Building! 🌆**
