# Deployment Guide - Crypto Ladder

## Prerequisites

Before deploying to Railway, ensure you have:

1. **GitHub Repository** - The code must be pushed to a GitHub repository
2. **Neon Database** - PostgreSQL database with connection string
3. **Telegram Bot Token** - From BotFather
4. **Railway Account** - Connected to your GitHub

## Database Setup (Neon)

If you're starting fresh with Neon:

### Option 1: Automatic Schema Creation (Recommended)

The application will automatically create all tables on first run. Just ensure your DATABASE_URL is set correctly.

### Option 2: Manual Database Cleanup

If you have an old database with conflicting tables:

```sql
-- Connect to your Neon database and run:
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS earnings CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS activations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

Then the app will recreate them with the correct schema.

## Railway Deployment Steps

### 1. Push Code to GitHub

```bash
# Ensure your project is committed
git add .
git commit -m "Deploy Crypto Ladder MiniApp"
git push origin main
```

### 2. Create New Project on Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account and select this repository

### 3. Configure Environment Variables

In the Railway dashboard, set the following variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_9E0jKXaBbpQm@ep-long-dream-ageb5l8j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

TELEGRAM_BOT_TOKEN=8212904290:AAE2-EfWsYZ_kwVLMM4GOJMHkfwd4d2lW8M

PORT=8080

NODE_ENV=production

WEB_APP_URL=https://YOUR_RAILWAY_APP_DOMAIN.up.railway.app/
```

**Note**: Replace `YOUR_RAILWAY_APP_DOMAIN` with your actual Railway app domain (Railway will assign this automatically after first deployment).

### 4. Configure Build Command

In Railway project settings:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 5. Deploy

Railway will automatically deploy when you push to GitHub. Monitor the deployment logs in the Railway dashboard.

### 6. Get Your Public URL

Once deployed, Railway assigns a public URL. Update:

1. Your `.env` file locally: `WEB_APP_URL=https://your-assigned-domain.up.railway.app/`
2. Push the changes
3. Telegram bot will use this URL to open the MiniApp

## Telegram Bot Setup

### 1. Set Webhook (if needed)

The bot is configured to work with polling by default. For production, you can configure a webhook:

```bash
curl -X POST https://api.telegram.org/bot{TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url":"https://YOUR_RAILWAY_DOMAIN/webhook/{TOKEN}"}'
```

### 2. Test the Bot

1. Open Telegram and search for `@cryptoladderbot`
2. Click `/start`
3. You should see a greeting message with the MiniApp button
4. Click the button to open the MiniApp

## Monitoring

### View Logs

In Railway dashboard:
- Click on your project
- Select "Deployments"
- Click on the latest deployment
- View real-time logs

### Health Check

The app exposes a health check endpoint:
```
GET https://your-domain/health
```

Response: `{"status": "ok"}`

## Troubleshooting

### Database Connection Issues

**Error**: `error: column "referrer_id" does not exist`

**Solution**: 
- You likely have an old table schema in your database
- Either drop and recreate tables (see "Manual Database Cleanup" above)
- Or contact Neon to reset your database

### Bot Not Responding

1. Check that `TELEGRAM_BOT_TOKEN` is correct in Railway
2. Verify bot hasn't been deleted in BotFather
3. Check Railway logs for errors

### MiniApp Not Loading

1. Verify `WEB_APP_URL` is correct and matches your Railway domain
2. Check if Railway domain is accessible: `curl https://your-domain/`
3. Verify CORS is enabled (it is by default in our setup)

### Referral Links Not Working

The referral system uses the format: `https://t.me/cryptoladderbot/miniapp?start={telegramId}`

Ensure:
- Telegram bot is started with `/start` command
- MiniApp is properly linked in BotFather settings

## Performance Optimization

### Railway Recommendations

1. **Memory**: Minimum 512 MB recommended
2. **Replicas**: Start with 1 replica; increase if needed
3. **Auto-deploy**: Enable for automatic deployments on push

### Database Optimization

The application includes indexes on:
- `users.telegram_id`
- `users.parent_id`
- `activations.user_id`
- `referrals.referrer_id`
- `earnings.user_id`

These ensure fast queries for the most common operations.

## Backup & Recovery

### Neon Backups

Neon automatically backs up your database. To restore:
1. Go to Neon Console
2. Select your project
3. Use the restore function from backups

### Manual Export

```bash
pg_dump "YOUR_DATABASE_URL" > backup.sql
```

## Scaling Considerations

### When to Scale

- **Database**: Increase if user count exceeds 10,000
- **App Server**: Increase replicas if response times exceed 500ms
- **Bot**: Polling works well up to ~100,000 users; consider webhook for larger scale

### Database Optimization

For production with many users:

```sql
-- Add additional indexes if needed
CREATE INDEX idx_earnings_created_at ON earnings(created_at DESC);
CREATE INDEX idx_activations_expiry ON activations(expiry_date);
```

## Security Checklist

- ✅ Environment variables set securely (not in code)
- ✅ Database uses SSL/TLS connection
- ✅ Bot token stored as environment variable
- ✅ CORS enabled for trusted origins only
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (using parameterized queries)
- ✅ Rate limiting can be added if needed

## Support

For issues:
1. Check Railway logs
2. Verify all environment variables are set
3. Test database connection with: `psql YOUR_DATABASE_URL`
4. Check Telegram bot status in BotFather

---

**Deployment Date**: [Update with your date]
**Status**: [Active/Testing]
**Last Updated**: 2024
