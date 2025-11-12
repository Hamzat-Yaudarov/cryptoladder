# CityLadder Testing & Verification Checklist

## Pre-Deployment Testing

### ✅ Backend Functionality

#### Server Health
- [ ] Server starts without errors: `npm start`
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] Server info endpoint works: `GET /`
- [ ] Bot info available: `GET /info`

#### Database
- [ ] PostgreSQL schema initializes automatically
- [ ] All tables created: `users`, `cities`, `houses`, `factories`, `referrals`, `profit_history`, `weekly_rankings`, `transactions`
- [ ] Indexes created for performance
- [ ] SSL connection established with Neon

#### User Authentication
- [ ] User creation on first auth: `POST /api/auth/user`
- [ ] Returning users loaded correctly
- [ ] Telegram user data parsed correctly
- [ ] User profile returns complete data: `GET /api/user/:id`

#### City Management
- [ ] City auto-created for new users
- [ ] Factory can be activated: `POST /api/factory/activate`
- [ ] Factory costs deducted from balance
- [ ] Factory expiration checked: `/api/maintenance/check-factories`
- [ ] City data retrieved: `GET /api/city/:userId`

#### Factory System
- [ ] Activation costs 10 stars
- [ ] Lasts exactly 24 hours
- [ ] Cannot activate without sufficient balance
- [ ] Factory marked inactive after expiration
- [ ] Payout times tracked correctly

#### Profit Distribution
- [ ] Hourly payouts calculated (1/24 of daily)
- [ ] Level 1-5 income correct:
  - L1: 4⭐️ per player
  - L2: 2.5⭐️ per player
  - L3: 1.7⭐️ per player
  - L4: 1⭐️ per player
  - L5: 0.5⭐️ per player
- [ ] Profit history recorded: `GET /api/profit/summary/:userId`
- [ ] Multiple referrals earn simultaneously

#### Referral System
- [ ] Unique referral codes generated
- [ ] Code accepted via endpoint: `POST /api/referral/join`
- [ ] Users assigned to houses by level
- [ ] Duplicate referrals prevented
- [ ] Referral bonuses claimable: `POST /api/referral/claim-bonus`
- [ ] Referral list retrieved: `GET /api/referrals/:userId`

#### Rankings System
- [ ] Weekly rankings calculated: `GET /api/rankings/weekly`
- [ ] Top 5 positions identified
- [ ] Rewards distributed correctly
- [ ] Reset at week boundary

#### Transactions
- [ ] Transactions recorded for all actions
- [ ] Transaction history available: `GET /api/transactions/:userId`
- [ ] Amounts match actual transactions
- [ ] Types correctly labeled

---

### ✅ Frontend (MiniApp) Testing

#### General UI
- [ ] Page loads without errors
- [ ] Telegram Web App initializes
- [ ] Header and colors set correctly
- [ ] Responsive on mobile devices
- [ ] All tabs visible and clickable
- [ ] No console errors
- [ ] Smooth animations and transitions

#### Authentication
- [ ] User automatically authenticated on load
- [ ] User data displayed correctly
- [ ] Profile name shows correctly
- [ ] Telegram ID visible
- [ ] Loading state shows while fetching

#### City Tab
- [ ] Balance displays correctly
- [ ] City level shows
- [ ] House count accurate
- [ ] Resident count matches referrals
- [ ] Referral code displays and can be copied
- [ ] Factory status shows correctly:
  - [ ] Inactive: shows "Activate" button
  - [ ] Active: shows remaining time
- [ ] Activate button disabled when balance < 10
- [ ] Activate button works and updates UI
- [ ] Progress bar fills based on referrals
- [ ] Warning message shows when insufficient funds

#### Residents Tab
- [ ] Income structure displays for all 5 levels
- [ ] Per-level information correct
- [ ] Empty state shows when no residents
- [ ] Resident list loads properly
- [ ] Resident info displays correctly (name, level, balance)
- [ ] Status shows active/inactive correctly

#### Income Tab
- [ ] Last hour/day/week stats display
- [ ] Overall statistics show correctly
- [ ] Total earned displays
- [ ] Daily average calculated
- [ ] Active referrals count correct
- [ ] Factory status shows
- [ ] Transaction history loads
- [ ] Transactions display type, amount, date
- [ ] Info section explains profit system

#### Construction Tab
- [ ] Current city level displays
- [ ] Upgrade cards show for levels 2-5
- [ ] Level requirements display correctly
- [ ] Locked/available/completed states work
- [ ] Unlock rules follow referral counts
- [ ] Rankings display with rewards
- [ ] Pro tips section loads
- [ ] Tips are relevant and helpful

#### Profile Tab
- [ ] User avatar displays (initial)
- [ ] Name and username show
- [ ] Telegram ID displays
- [ ] Statistics cards load:
  - [ ] Total earned
  - [ ] Daily average
  - [ ] Active referrals
  - [ ] Factory status
- [ ] City information displays
- [ ] Weekly rankings show
- [ ] Current user highlighted in rankings
- [ ] Game rules section loads
- [ ] All rule sections readable
- [ ] Footer buttons visible

#### Tab Navigation
- [ ] All 5 tabs clickable
- [ ] Active tab highlighted
- [ ] Content switches smoothly
- [ ] No duplicate renders
- [ ] Scroll position preserved per tab

---

### ✅ Telegram Bot Testing

#### Commands
- [ ] `/start` sends welcome message
- [ ] `/start` includes MiniApp button
- [ ] `/city` shows current city status
- [ ] `/city` displays correct balance
- [ ] `/city` shows factory status
- [ ] `/referrals` lists referrals
- [ ] `/referrals` shows referral count
- [ ] `/help` displays game rules
- [ ] `/help` includes all rule sections

#### Messages
- [ ] Inline keyboard buttons work
- [ ] Web app button opens MiniApp
- [ ] Bot responds to unknown commands

#### Webhook
- [ ] Webhook URL set correctly
- [ ] Updates received properly
- [ ] No duplicate updates
- [ ] Updates processed without errors

---

### ✅ Integration Testing

#### User Journey
1. [ ] New user opens MiniApp
   - [ ] User created in database
   - [ ] City created automatically
   - [ ] Initial 2 houses created
   - [ ] Factory marked inactive
   - [ ] Referral code assigned

2. [ ] User activates factory
   - [ ] Balance deducted 10⭐️
   - [ ] Factory marked active
   - [ ] Expiration time set to 24h
   - [ ] Transaction recorded

3. [ ] User invites friend
   - [ ] Friend joins via code
   - [ ] Friend assigned to house
   - [ ] Referral relationship created
   - [ ] Earning starts when friend activates

4. [ ] Income distribution
   - [ ] Hourly payout triggered
   - [ ] Correct amount added to balance
   - [ ] Transaction recorded
   - [ ] Multiple users paid simultaneously

5. [ ] Factory expires
   - [ ] Expiration checked
   - [ ] Factory marked inactive
   - [ ] Payouts stop
   - [ ] Can reactivate

#### Data Consistency
- [ ] Balance matches sum of transactions
- [ ] Referral count matches database
- [ ] Factory status consistent across endpoints
- [ ] House count matches database
- [ ] No orphaned records

---

### ✅ Performance Testing

#### Load Testing
- [ ] Server handles 10+ concurrent users
- [ ] API responses within 500ms
- [ ] Database queries complete in <100ms
- [ ] No memory leaks after 1 hour runtime

#### Database
- [ ] Indexes improve query speed
- [ ] Recursive referral tree efficient
- [ ] Batch inserts for profit distribution
- [ ] No N+1 query problems

---

### ✅ Security Testing

#### Authentication
- [ ] Telegram user data verified
- [ ] Invalid tokens rejected
- [ ] Session isolated per user
- [ ] User cannot access others' data

#### Data Protection
- [ ] Database connection encrypted (SSL)
- [ ] No secrets in logs
- [ ] Environment variables protected
- [ ] No SQL injection possible (parameterized queries)

#### Rate Limiting
- [ ] Test before production deployment
- [ ] Implement per IP limits
- [ ] Prevent abuse of factory activation
- [ ] Prevent referral code brute force

---

### ✅ Browser Compatibility

#### Desktop Browsers
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

#### Mobile Browsers (via Telegram)
- [ ] Telegram iOS
- [ ] Telegram Android
- [ ] Responsive layout works

---

## Staging Deployment Checklist

### Before Going Live

- [ ] All tests above pass
- [ ] Environment variables set correctly
- [ ] Database backups enabled
- [ ] Error logging configured
- [ ] Monitoring alerts set up
- [ ] Rate limiting implemented
- [ ] Security headers configured
- [ ] CORS settings correct
- [ ] Dockerfile tested locally
- [ ] Railway deployment tested

### Post-Deployment

- [ ] Monitor logs for errors (first 24h)
- [ ] Check database size growth
- [ ] Verify webhook receives updates
- [ ] Test with real Telegram users
- [ ] Monitor server performance
- [ ] Check API response times
- [ ] Verify scheduled tasks run

---

## Issues Tracker

### Known Issues
- [ ] (none initially)

### Fixed Issues
- [ ] (log fixes here)

### Pending Fixes
- [ ] (log pending items)

---

## Performance Baselines

Record these after initial deployment:

| Metric | Target | Actual |
|--------|--------|--------|
| Server uptime | 99.9% | __ |
| API response time | <500ms | __ |
| Database query time | <100ms | __ |
| Daily active users | - | __ |
| Total registered users | - | __ |
| Total stars distributed/day | - | __ |

---

## Sign-Off

- [ ] All critical tests passing
- [ ] No blocking issues
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Ready for production

**Tester**: _______________  
**Date**: _______________  
**Notes**: ________________________________________________

---

**Running Tests**

```bash
# Start server in development
npm run dev

# In another terminal, run checks
curl http://localhost:8080/api/health
curl http://localhost:8080/

# Test Telegram Bot
# Send /start in Telegram to @cryptoladderbot
```

Good luck! 🚀
