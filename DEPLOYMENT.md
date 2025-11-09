# Crypto Ladder - Railway Deployment Guide

## Prerequisites
- Railway account (https://railway.app)
- Telegram Bot Token
- Neon PostgreSQL database
- Git repository

## Environment Variables on Railway

Set these environment variables in your Railway project:

```
TELEGRAM_BOT_TOKEN=8212904290:AAE2-EfWsYZ_kwVLMM4GOJMHkfwd4d2lW8M
DATABASE_URL=postgresql://neondb_owner:npg_9E0jKXaBbpQm@ep-long-dream-ageb5l8j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=8080
NODE_ENV=production
WEBHOOK_URL=https://cryptoladder-production.up.railway.app/bot/webhook
```

## Deployment Steps

### 1. Connect to Railway
```bash
npm install -g @railway/cli
railway login
railway init
```

### 2. Deploy
```bash
git push origin main
```

Railway will automatically:
- Install dependencies with `npm install`
- Run migrations with `npm run init-db`
- Start the server with `npm start`

### 3. Set Environment Variables
1. Go to Railway dashboard
2. Select your project
3. Add environment variables from the list above

### 4. Configure Bot Webhook
The webhook will be automatically set when the server starts.

To manually set or update:
```bash
curl -X POST \
  -F "url=https://cryptoladder-production.up.railway.app/bot/webhook" \
  https://api.telegram.org/bot8212904290:AAE2-EfWsYZ_kwVLMM4GOJMHkfwd4d2lW8M/setWebhook
```

### 5. Add MiniApp to Bot
In BotFather on Telegram:
- `/setmyname` - Set "Crypto Ladder"
- `/setmydescription` - "Smart Pyramid with Daily Activation"
- `/setmyshortdescription` - "Earn stars by activation"
- `/setcommands` - Add `/start` command

## Database Migrations

The `release` phase in Procfile runs:
```bash
node scripts/init-db.js
```

This creates all necessary tables on first deployment.

## Monitoring

View logs in Railway:
```bash
railway logs
```

Monitor database:
```bash
railway run psql
```

## Troubleshooting

### Bot not responding
- Check webhook: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Verify TELEGRAM_BOT_TOKEN is set correctly
- Check Railway logs

### Database connection errors
- Verify DATABASE_URL is correct
- Check Neon database is active
- Ensure SSL mode is enabled

### Port conflicts
- Railway uses dynamic ports
- PORT environment variable is automatically set
- Application must listen on process.env.PORT

## Production Checklist
- [ ] Environment variables configured
- [ ] Database schema initialized
- [ ] Bot webhook set and verified
- [ ] MiniApp URL is accessible
- [ ] Referral links working
- [ ] Test /start command on bot
- [ ] Monitor first few activations
- [ ] Check error logs regularly
