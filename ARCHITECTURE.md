# Crypto Ladder Architecture & Design Documentation

## System Overview

Crypto Ladder is a multi-tier application built with:
- **Backend**: Node.js/Express REST API + Telegram Bot
- **Frontend**: React SPA with Telegram WebApp SDK
- **Database**: PostgreSQL (Neon) for data persistence
- **Deployment**: Railway (Docker-based cloud platform)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    TELEGRAM USERS                               │
├────────────────────────────────────────────────────��────────────┤
│  /start Command  │  MiniApp Button  │  Inline Keyboard Links   │
└────────┬─────────────────────────┬──────────────────────────────┘
         │                         │
    ┌────▼─────┐           ┌──────▼──────┐
    │   BOT    │           │  MINIAPP    │
    │(Telegraf)│           │   (React)   │
    └────┬─────┘           └──────┬──────┘
         │                        │
         └────────────┬───────────┘
                      │
         ┌────────────▼────────────┐
         │   EXPRESS SERVER        │
         │   (Node.js)             │
         ├───────────────────────┤
         │  REST API Routes:     │
         │  - /api/auth          │
         │  - /api/activation    │
         │  - /api/pyramid       │
         │  - /health            │
         └────────────┬──────────┘
                      │
         ┌────────────▼────────────┐
         │  PostgreSQL Database    │
         │  (Neon)                 │
         ├───────────────────────┤
         │  Tables:              │
         │  - users              │
         │  - activations        │
         │  - referrals          │
         │  - earnings           │
         │  - purchases          │
         └────────────────────────┘
```

## Backend Architecture

### Server Structure (server/)

```
server/
├── index.js                    # Express app setup & server startup
├── bot.js                      # Telegram bot initialization
├── db.js                       # Database connection & schema
├── services/
│   ├── userService.js          # User & pyramid management
│   └── activationService.js    # Activation & earnings logic
└── routes/
    ├── auth.js                 # Authentication endpoints
    ├── activation.js           # Game mechanics
    └── pyramid.js              # Referral & structure data
```

### Key Components

#### 1. Server (index.js)
- Initializes Express application
- Configures middleware (CORS, JSON parsing)
- Launches Telegram bot
- Serves static files from client/dist
- Implements health check endpoint

#### 2. Database (db.js)
- Manages PostgreSQL connection pooling
- Initializes database schema on startup
- Provides query wrapper with logging
- Handles connection errors gracefully

#### 3. Services

**userService.js** - User and pyramid management
- `getOrCreateUser()` - Initialize new users
- `assignParentAndPosition()` - Place user in pyramid
- `getUserWithStats()` - Fetch user with aggregated data
- `getUserPyramidStructure()` - Get tree structure
- `getDownlineUsers()` - Fetch all subordinates
- `addReferral()` - Track referral relationships
- `getReferralsList()` - Paginated referral list

**activationService.js** - Game mechanics and earnings
- `activateUser()` - Daily 10⭐️ activation
- `distributeEarnings()` - Distribute earnings to upline
- `claimReferralBonus()` - 0.5⭐️ per referral activation
- `buyPlace()` - 3⭐️ purchase of pyramid position
- `getEarningsStats()` - Analytics data
- `getMaxLevelsForUser()` - Determine accessible levels

### API Endpoints

#### Authentication
```
POST /api/auth/init
Body: { telegramId, referrerId? }
Response: { success, user: {...} }

GET /api/auth/user/:telegramId
Response: User with stats
```

#### Activation & Economy
```
POST /api/activation/activate/:userId
Response: { success, activationCost, user }

POST /api/activation/buy-place/:userId
Response: { success, purchaseCost, user }

GET /api/activation/earnings/:userId
Response: { success, earnings: {...} }
```

#### Pyramid & Referrals
```
GET /api/pyramid/structure/:userId?depth=3
Response: { success, structure: [...] }

GET /api/pyramid/downline/:userId?maxLevel=5
Response: { success, downline: [...] }

GET /api/pyramid/referrals/:userId?limit=100&offset=0
Response: { success, referrals: [...], total: number }
```

#### Health
```
GET /health
Response: { status: "ok" }
```

## Database Schema

### users table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,        -- Telegram user ID
  username VARCHAR(255),                     -- Telegram username
  first_name VARCHAR(255),                   -- User's first name
  last_name VARCHAR(255),                    -- User's last name
  balance DECIMAL(18, 2) DEFAULT 0,          -- ⭐️ balance
  parent_id INTEGER REFERENCES users(id),    -- Parent in pyramid
  position_in_parent INTEGER,                -- Position 1-3 under parent
  is_active BOOLEAN DEFAULT FALSE,           -- Active status
  last_activation TIMESTAMP,                 -- Last activation time
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### activations table
```sql
CREATE TABLE activations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  activation_date TIMESTAMP DEFAULT NOW(),
  expiry_date TIMESTAMP,                     -- Expires after 24h
  stars_spent INTEGER DEFAULT 10,            -- Cost of activation
  created_at TIMESTAMP DEFAULT NOW()
);
```

### referrals table
```sql
CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL REFERENCES users(id),
  referred_id INTEGER NOT NULL REFERENCES users(id),
  is_first_activation_bonus_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);
```

### earnings table
```sql
CREATE TABLE earnings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  earned_from_id INTEGER REFERENCES users(id),
  level INTEGER,                             -- Tree level (1-5)
  amount DECIMAL(18, 2),                     -- Amount earned
  type VARCHAR(50),                          -- activation|referral_bonus|system
  created_at TIMESTAMP DEFAULT NOW()
);
```

### purchases table
```sql
CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  stars_spent INTEGER DEFAULT 3,             -- Cost of place
  purchase_date TIMESTAMP DEFAULT NOW()
);
```

## Frontend Architecture

### Structure (client/src/)

```
client/src/
├── main.jsx                    # React entry point
├── App.jsx                     # Main component with tab router
├── App.css                     # Global styles
├── context/
│   └── UserContext.jsx         # State management
└── components/
    ├── tabs/
    │   ├── Home.jsx            # Main dashboard
    │   ├── Partners.jsx        # Referral management
    │   ├── Income.jsx          # Earnings analytics
    │   └── Profile.jsx         # User settings
    └── styles/
        ├── Home.css
        ├── Partners.css
        ├── Income.css
        └── Profile.css
```

### Key Components

#### UserContext (context/UserContext.jsx)
Manages global user state:
- User data from API
- Loading state
- Authentication status
- Methods to refresh user data

#### App (App.jsx)
- Tab navigation system
- Routes between 4 main tabs
- Loading fallback

#### Tabs

**Home.jsx**
- Balance display
- Activation status
- Quick actions (activate, buy place)
- Pyramid position info

**Partners.jsx**
- Referral link management
- Share functionality
- Referral list with stats
- Level unlock information

**Income.jsx**
- Total earnings display
- Income breakdown by type
- Level-by-level statistics
- System explanation

**Profile.jsx**
- User profile information
- Account statistics
- Game rules
- Earning system details
- FAQ section

## Business Logic

### Pyramid Structure

**Rules**:
- Binary tree with 3 children per parent
- Automatic position assignment (left-to-right, top-to-bottom)
- Each user has at most 1 parent
- Users only earn from their own branch

**Example**:
```
        User A
       / | \
      B  C  D
     /|\ |\ |\
    E F G H I J
```

User B earns from E, F, G and their descendants.
User A earns from everyone.

### Activation & Earnings

**Flow**:
1. User activates (10⭐️ cost)
2. 5⭐️ distributed among upline by levels
3. 5⭐️ goes to system (creator)
4. Remaining goes to creator

**Distribution** (for 5⭐️):
```
Level 1: 35% = 1.75⭐️
Level 2: 21% = 1.05⭐️
Level 3: 14% = 0.70⭐️
Level 4: 8%  = 0.40⭐️
Level 5: 4%  = 0.20⭐️
       ─────────────
       Total: 4.10⭐️
Remainder to creator: 0.90⭐️
```

**Conditions**:
- Only active users receive earnings
- Max 5 levels based on referral count
- Activation valid for 24 hours

### Referral System

**Tracking**:
- Each referral creates unique record
- Bonus claimed flag prevents double payment
- Bonus: 0.5⭐️ per first activation

**Level Unlocks**:
```
0-14 referrals  → 2 levels
15-34 referrals → 3 levels
35-69 referrals → 4 levels
70+ referrals   → 5 levels
```

## Security Considerations

### Data Protection
- Telegram WebApp validates request
- Database uses SSL/TLS
- Parameters are sanitized
- SQL injection prevented via parameterized queries

### State Management
- User data only cached client-side
- Server authoritative for balance
- No sensitive data in localStorage
- CORS properly configured

### Rate Limiting
- No explicit rate limiting (can be added)
- Database constraints prevent double activation
- Unique constraints on referrals

## Performance Optimizations

### Database
- Indexes on frequently queried columns
- Connection pooling for reuse
- Query result logging for debugging

### Frontend
- React component code-splitting
- CSS-in-JS for critical styles
- Vite for fast bundling
- Gzip compression enabled

### API
- Express static file serving
- JSON response compression
- Efficient query patterns

## Development Workflow

### Local Development

1. Start server: `npm run dev`
2. Vite proxy handles /api calls
3. Hot reload on file changes
4. Database syncs automatically

### Production Build

1. Run: `npm run build`
2. Creates optimized bundle
3. Vite outputs to `client/dist/`
4. Express serves static files

### Testing Locally

1. Start bot with `/start`
2. Click MiniApp button
3. Test all 4 tabs
4. Verify activation and earnings

## Deployment Pipeline

1. **Development** → Push to GitHub
2. **Railway** → Automatic build & deploy
3. **Database** → Schema auto-initialization
4. **Bot** → Starts with polling
5. **MiniApp** → Accessible via Telegram

## Error Handling

### Client-side
- Try-catch on API calls
- User-friendly error messages
- Loading states for async operations

### Server-side
- Database error logging
- Request validation
- Graceful error responses
- 500 error fallback

### Database
- Connection pooling prevents timeouts
- Constraints prevent invalid data
- Indexes ensure query performance

## Future Enhancements

1. **Webhook Bot** - Replace polling with webhook
2. **Advanced Analytics** - More detailed reports
3. **Leaderboards** - Top earners display
4. **Auto-payout** - Automatic balance distribution
5. **Game Events** - Seasonal bonuses
6. **Mobile App** - Native iOS/Android apps
7. **Multi-language** - i18n support
8. **Admin Dashboard** - System monitoring

## Monitoring & Debugging

### Health Checks
- `/health` endpoint
- Bot polling status
- Database connectivity

### Logging
- Server console logs all queries
- Duration tracking for performance
- Error stack traces for debugging

### Metrics to Monitor
- Active users
- Total earnings distributed
- Activation rate
- Database query performance

---

**Last Updated**: 2024
**Status**: Production Ready
