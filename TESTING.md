# 🧪 Crypto Ladder - Testing Guide

## Pre-Deployment Testing

### 1. Database Connection Test

```bash
npm run init-db
```

Expected output:
```
📦 Initializing database schema...
✅ Database schema initialized
✅ Root admin user created
📊 Tables: activations, referrals, star_transactions, users
```

### 2. Local Server Test

```bash
npm run dev
```

Expected output:
```
🚀 Server running on port 8080
📱 MiniApp: http://localhost:8080
📡 Bot: Polling mode (development)
✅ Crypto Ladder is ready!
```

### 3. API Endpoint Tests

```bash
# Test user creation/fetch
curl http://localhost:8080/api/user/123456789

# Test leaderboard
curl http://localhost:8080/api/leaderboard
```

## Post-Deployment Testing (Railway)

### 1. Check Bot is Responding

```bash
# Verify webhook
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo

# Should show:
# "ok": true,
# "result": {
#   "url": "https://cryptoladder-production.up.railway.app/bot/webhook",
#   "has_custom_certificate": false,
#   "pending_update_count": 0
# }
```

### 2. Test /start Command

1. Open Telegram
2. Search for @cryptoladderbot
3. Press /start
4. Verify you see:
   - Welcome message
   - "Open Crypto Ladder" button
   - Your referral link

### 3. Test MiniApp Opening

1. Click "Open Crypto Ladder" button
2. Verify MiniApp loads with 4 tab buttons at bottom
3. Check that your Telegram user data is displayed

## Functional Testing Checklist

### Home Tab (🏠)
- [ ] User balance shows (starts at 0)
- [ ] Status shows "Inactive"
- [ ] "Buy Place" button visible
- [ ] Buy button disabled if stars < 3
- [ ] "Quick Stats" shows referral count

### Buying a Place

```bash
# Test via API
curl -X POST http://localhost:8080/api/user/buy-place \
  -H "Content-Type: application/json" \
  -d '{"telegramId": "123456789", "parentId": null}'
```

In MiniApp:
- [ ] User balance decreases by 3
- [ ] "Buy Place" button replaced with "Activate Now"
- [ ] User receives position confirmation

### Activation Flow

```bash
# Test via API
curl -X POST http://localhost:8080/api/user/activate \
  -H "Content-Type: application/json" \
  -d '{"telegramId": "123456789"}'
```

In MiniApp:
- [ ] User balance decreases by 10
- [ ] Status changes to "Active"
- [ ] Expiration time shown
- [ ] "Activate Now" button disabled

### Partners Tab (👥)
- [ ] Referral link displayed correctly
- [ ] Copy button works
- [ ] Earning depth shown (2 levels initially)
- [ ] Can see list of referrals (empty initially)

### Income Tab (💸)
- [ ] Shows distribution percentages
- [ ] Referral bonus explained
- [ ] Transaction history (empty initially)

### Profile Tab (⚙️)
- [ ] User info displayed
- [ ] "How it works" section visible
- [ ] Support link functional

## Star Distribution Test Scenario

### Setup
1. Create root user (admin)
2. Create user A (reports to root)
3. Create user B (reports to A)
4. Create user C (reports to B)

### Test
1. User C activates (10⭐️ cost)
2. Verify distribution:
   - B gets 3.5⭐️ (35% of 5)
   - A gets 2.1⭐️ (21% of 5)
   - Root gets 4.4⭐️ (remaining + creator portion)

```bash
# Check transactions
curl http://localhost:8080/api/user/A_ID/transactions
```

Expected:
```json
{
  "transactions": [
    {
      "user_id": "A_ID",
      "amount": 2.1,
      "type": "activation_income",
      "level": 2
    }
  ]
}
```

## Referral System Test

### Setup
1. Create user A (referrer)
2. User B joins via A's referral link `/start ref_A_ID`

### Test
1. Create referral in database
2. User B buys place
3. User B activates
4. Verify A gets 0.5⭐️ referral bonus

```bash
# Check referrals
curl http://localhost:8080/api/user/A_ID/referrals
```

Expected:
```json
{
  "referrals": [
    {
      "id": "B_ID",
      "stars": 90,
      "first_name": "User B"
    }
  ]
}
```

## Pyramid Structure Test

### Verify Tree Structure

```bash
# Get hierarchy
curl http://localhost:8080/api/user/ROOT_ID/hierarchy
```

Expected structure:
```
Root
├── User 1
│   ├── User 2
│   ├── User 3
│   └── User 4
├── User 5
│   ├── User 6
│   ├── User 7
│   └── User 8
└── User 9
    ├── User 10
    ├── User 11
    └── User 12
```

Max 3 direct children per user.

## Edge Cases to Test

### 1. Insufficient Stars
```bash
curl -X POST http://localhost:8080/api/user/buy-place \
  -H "Content-Type: application/json" \
  -d '{"telegramId": "123456789"}'
```
Expected: "Insufficient stars" error

### 2. Already Active
Try to activate twice without waiting 24 hours.
Expected: "Already active" error

### 3. No Place Bought
Try to activate without buying place first.
Expected: "Must buy place first" error

### 4. User Not Found
Create endpoint will auto-create. Test:
```bash
curl http://localhost:8080/api/user/999999999999999999
```
Should create and return new user

## Performance Testing

### Load Test
```bash
# Test multiple concurrent users
for i in {1..10}; do
  curl http://localhost:8080/api/user/$i &
done
```

All requests should complete without errors.

### Database Performance
Check query times in logs:
```
railway logs | grep "query"
```

Should be < 100ms for typical operations.

## Monitoring Commands

### Railway Logs
```bash
# Real-time logs
railway logs -f

# Last 100 lines
railway logs -n 100

# Specific component
railway logs | grep "error"
```

### Database Health
```bash
railway run psql

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname = 'public';

# Check connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

# Exit psql
\q
```

### Check Webhook Status
```bash
curl -s https://api.telegram.org/bot<TOKEN>/getWebhookInfo | jq .
```

## Known Test Cases

### TC-001: User Creation
```
When: User visits MiniApp with new ID
Then: User auto-created with 0 stars
Expected: GET /api/user/{id} returns user with has_bought_place=false
```

### TC-002: Buy Place
```
When: User with 3+ stars clicks buy place
Then: 3 stars deducted, has_bought_place=true
Expected: Stars decreased by 3, place purchased
```

### TC-003: Daily Activation
```
When: User with 10+ stars and place buys clicks activate
Then: 10 stars deducted, active status set
Expected: Activation active for 24 hours, stars distributed
```

### TC-004: Star Distribution
```
When: User in level 3 activates
Then: Direct supervisor gets 3.5, level 2 gets 2.1, etc
Expected: Transaction history shows distribution
```

### TC-005: Referral Join
```
When: New user joins via /start ref_<id>
Then: Referral relationship created
Expected: Referrer can see invitee in partners tab
```

## Debug Mode

Enable more detailed logging:

```bash
# In .env or Railway variables
DEBUG=*
LOG_LEVEL=debug
```

Check logs for detailed operation traces:
```bash
railway logs | grep "Debug"
```

---

**All tests passing? Your Crypto Ladder is ready for production! 🎉**
