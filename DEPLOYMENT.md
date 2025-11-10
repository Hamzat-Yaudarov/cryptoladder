# CityLadder - Deployment Guide

## Prerequisites
- Railway account (railway.app)
- Telegram Bot Token (already created: @cryptoladderbot)
- Neon PostgreSQL database (already set up)

## Environment Variables Required

The following environment variables must be set in Railway:

```
BOT_TOKEN=8212904290:AAE2-EfWsYZ_kwVLMM4GOJMHkfwd4d2lW8M
BOT_USERNAME=cryptoladderbot
DATABASE_URL=postgresql://neondb_owner:npg_9E0jKXaBbpQm@ep-long-dream-ageb5l8j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
WEB_APP_URL=https://cryptoladder-production.up.railway.app
PORT=8080
NODE_ENV=production
```

## Deployment Steps

### 1. Connect Railway to GitHub
1. Go to railway.app and sign in
2. Create a new project
3. Connect your GitHub repository
4. Select the CityLadder project

### 2. Configure Environment Variables
1. Go to project settings
2. Add all environment variables listed above
3. Make sure DATABASE_URL is set correctly

### 3. Deploy
1. Railway will automatically build and deploy when you push to main
2. The Dockerfile will be used for the build process
3. The app will run on port 8080

### 4. Verify Deployment
1. Check the deployment logs in Railway dashboard
2. Visit https://cryptoladder-production.up.railway.app/health
3. You should see: `{"status":"ok","timestamp":"..."}`

### 5. Configure Telegram Bot
The bot webhook should be automatically configured at server startup.

To manually verify:
```bash
curl https://api.telegram.org/bot8212904290:AAE2-EfWsYZ_kwVLMM4GOJMHkfwd4d2lW8M/getWebhookInfo
```

## Testing the MiniApp

### Local Testing
1. Run `npm install`
2. Run `npm run dev`
3. The server will run on http://localhost:8080
4. The frontend will be available at http://localhost:3001

### Production Testing
1. Open Telegram
2. Search for @cryptoladderbot
3. Press /start
4. Click "🎮 Открыть CityLadder"
5. The MiniApp should open in fullscreen

## Monitoring

### Check Database Connection
```bash
psql 'postgresql://neondb_owner:npg_9E0jKXaBbpQm@ep-long-dream-ageb5l8j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require'
```

### View Server Logs
In Railway dashboard, go to Deployments > Logs

### Check Active Factories
```sql
SELECT f.id, c.user_id, f.is_active, f.deactivates_at 
FROM factories f 
JOIN cities c ON f.city_id = c.id 
WHERE f.is_active = TRUE;
```

## Troubleshooting

### Bot not responding
1. Check DATABASE_URL in environment variables
2. Verify BOT_TOKEN is correct
3. Check server logs for errors

### MiniApp not loading
1. Check WEB_APP_URL is correct in environment
2. Verify port 8080 is open
3. Check CORS settings in backend

### Profit not distributing
1. Verify factories are active in database
2. Check scheduler is running (see logs)
3. Verify referral relationships exist

## Performance Optimization

### Database Queries
- All heavy queries are indexed
- Connection pooling is configured
- Query timeouts are set to 1000ms

### Frontend
- Built with Vite for fast loading
- CSS is optimized with shorthand properties
- Images and assets are minimized

### Scheduler
- Profit processing: Every 1 minute
- Rating updates: Every 1 hour
- Weekly rewards: Daily at midnight UTC

## Security

### Bot Security
- All updates come from official Telegram servers
- Token is stored in environment variables
- No sensitive data is logged

### Database Security
- SSL/TLS connection is required (sslmode=require)
- Channel binding is enabled
- Passwords are stored as environment variables

### API Security
- User authentication via Telegram user_id
- All requests must include user_id parameter
- CORS is enabled only from Telegram origins

## Scaling

If the game grows:

1. **Database**: Neon can auto-scale
   - Add read replicas for heavy queries
   - Archive old transactions monthly

2. **Backend**: Deploy multiple instances
   - Use Railway load balancing
   - Scheduler will run on one instance (add locking)

3. **Frontend**: Use CDN
   - CloudFlare integration with Railway
   - Cache static assets

## Rollback

If deployment fails:
1. Go to Railway dashboard
2. Select previous deployment
3. Click "Redeploy"
4. Server will restart with previous version
