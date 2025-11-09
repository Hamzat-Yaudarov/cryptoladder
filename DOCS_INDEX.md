# 📚 Crypto Ladder - Documentation Index

## Quick Navigation

### 🚀 Getting Started
- **[QUICKSTART.md](./QUICKSTART.md)** - Start here! 30-minute setup guide
- **[README.md](./README.md)** - Full project documentation

### 🏗️ Architecture & Design
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system design
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Executive summary

### 🚢 Deployment
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Railway deployment guide
- **[railway.json](./railway.json)** - Railway configuration

### 📝 Code Structure
- **server/** - Backend (Node.js/Express)
  - `index.js` - Server setup
  - `bot.js` - Telegram bot
  - `db.js` - Database
  - `services/` - Business logic
  - `routes/` - API endpoints
- **client/** - Frontend (React/Vite)
  - `src/main.jsx` - React entry
  - `src/App.jsx` - Main component
  - `src/context/` - State management
  - `src/components/` - UI components

### ⚙️ Configuration
- **.env** - Environment variables (secrets)
- **.env.example** - Template
- **package.json** - Dependencies
- **vite.config.js** - Frontend build config

---

## Reading Guide by Role

### 👨‍💼 Project Manager / Product Owner
1. Start with [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
2. Read [README.md](./README.md) - Overview section
3. Check [QUICKSTART.md](./QUICKSTART.md) - How to test locally

### 👨‍💻 Developer (First Time)
1. Read [QUICKSTART.md](./QUICKSTART.md) - Full guide
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand system
3. Check [README.md](./README.md) - Detailed info
4. Review code in `server/` and `client/` folders

### 🚀 DevOps / Deployment Engineer
1. Start with [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Check [railway.json](./railway.json) - Configuration
3. Review environment variables in [.env.example](./.env.example)
4. Monitor with Railway dashboard

### 🐛 Debugger / Troubleshooter
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) - Troubleshooting section
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
3. Check database schema in `server/db.js`
4. Review API endpoints in `server/routes/`

---

## Quick Reference

### API Endpoints

**Auth**
- `POST /api/auth/init` - Initialize user
- `GET /api/auth/user/:id` - Get user data

**Game**
- `POST /api/activation/activate/:userId` - Daily activation (10⭐️)
- `POST /api/activation/buy-place/:userId` - Buy spot (3⭐️)
- `GET /api/activation/earnings/:userId` - Earnings stats

**Pyramid**
- `GET /api/pyramid/structure/:userId` - View tree
- `GET /api/pyramid/downline/:userId` - View subordinates
- `GET /api/pyramid/referrals/:userId` - View referrals

**System**
- `GET /health` - Health check

### Database Tables

| Table | Purpose | Key Columns |
|-------|---------|------------|
| users | User profiles & pyramid | id, telegram_id, parent_id, balance |
| activations | Daily activations | id, user_id, activation_date, expiry_date |
| referrals | Referral tracking | referrer_id, referred_id |
| earnings | Income records | user_id, earned_from_id, level, amount |
| purchases | Place purchases | user_id, stars_spent, purchase_date |

### Game Mechanics

**Economy**
- Purchase: 3⭐️ (100% to owner)
- Activation: 10⭐️ per day
- Referral bonus: 0.5⭐️ per activation

**Activation Distribution (5⭐️)**
- Level 1: 35% (1.75⭐️)
- Level 2: 21% (1.05⭐️)
- Level 3: 14% (0.70⭐️)
- Level 4: 8% (0.40⭐️)
- Level 5: 4% (0.20⭐️)
- Remainder: System owner

**Level Unlock**
- 0-14 referrals → 2 levels
- 15-34 referrals → 3 levels
- 35-69 referrals → 4 levels
- 70+ referrals → 5 levels

### Commands

```bash
# Development
npm install          # Install dependencies
npm run dev         # Start dev server

# Production
npm run build       # Build frontend
npm start          # Start production server
```

### Environment Variables

```
DATABASE_URL=postgresql://...   # Neon connection
TELEGRAM_BOT_TOKEN=...          # Bot token
PORT=8080                       # Server port
NODE_ENV=production             # Environment
WEB_APP_URL=https://...         # MiniApp URL
```

---

## Document Descriptions

### QUICKSTART.md
**Length**: ~5 min read  
**Audience**: Everyone  
**Purpose**: Get running in 30 minutes
- What was built
- Local development
- Testing
- Deployment overview

### README.md  
**Length**: ~15 min read  
**Audience**: Developers  
**Purpose**: Complete reference
- Features overview
- Tech stack
- Setup instructions
- API documentation
- Deployment guide
- Economics summary

### ARCHITECTURE.md
**Length**: ~30 min read  
**Audience**: Developers, Architects  
**Purpose**: Understand system design
- System overview
- Component breakdown
- Database schema
- Business logic
- Security measures
- Performance optimizations
- Error handling

### DEPLOYMENT.md
**Length**: ~20 min read  
**Audience**: DevOps, Deployment Engineers  
**Purpose**: Deploy to production
- Prerequisites
- Step-by-step guide
- Environment setup
- Telegram bot setup
- Monitoring
- Troubleshooting
- Scaling guidelines

### PROJECT_SUMMARY.md
**Length**: ~25 min read  
**Audience**: Project managers, stakeholders  
**Purpose**: Complete project overview
- Executive summary
- What was delivered
- File structure
- Technology stack
- Metrics
- Status checklist
- Next steps

---

## Common Tasks

### I want to...

**...start developing**
→ Read [QUICKSTART.md](./QUICKSTART.md) → Run `npm install && npm run dev`

**...deploy to production**
→ Read [DEPLOYMENT.md](./DEPLOYMENT.md) → Push to GitHub → Railway auto-deploys

**...understand the architecture**
→ Read [ARCHITECTURE.md](./ARCHITECTURE.md) → Review code in `server/` and `client/`

**...fix a bug**
→ Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting → Review relevant code → Check logs

**...add a new feature**
→ Review [ARCHITECTURE.md](./ARCHITECTURE.md) → Study similar feature → Follow patterns

**...monitor production**
→ Go to Railway dashboard → Check logs → Use `/health` endpoint

**...understand the game**
→ Read game mechanics in [README.md](./README.md) or [QUICKSTART.md](./QUICKSTART.md)

**...connect database**
→ Use connection string from `.env` → Or check [DEPLOYMENT.md](./DEPLOYMENT.md) database section

---

## Important Files

### Must Read First
1. [QUICKSTART.md](./QUICKSTART.md) - Get started
2. [.env.example](./.env.example) - Understand configuration

### Before Deploying
1. [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand what you're deploying

### For Reference
1. [README.md](./README.md) - Complete documentation
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
3. [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Overview

### Code Files
1. **Backend**: `server/index.js` → `server/db.js` → `server/services/`
2. **Frontend**: `client/src/main.jsx` → `client/src/App.jsx` → `client/src/components/`

---

## Version Information

- **Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: November 2024
- **Build Status**: ✅ Successful
- **Documentation**: ✅ Complete

---

## Quick Links

| Item | Link |
|------|------|
| GitHub | [Your Repository URL] |
| Railway | https://railway.app |
| Neon Database | https://neon.tech |
| Telegram Bot API | https://core.telegram.org/bots |
| React Docs | https://react.dev |
| Express Docs | https://expressjs.com |

---

## Support & Questions

**Technical Issues**
→ Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section

**Architecture Questions**
→ Review [ARCHITECTURE.md](./ARCHITECTURE.md)

**Deployment Questions**
→ Read [DEPLOYMENT.md](./DEPLOYMENT.md)

**Getting Started**
→ Follow [QUICKSTART.md](./QUICKSTART.md)

**General Information**
→ Read [README.md](./README.md)

---

**Last Updated**: November 2024  
**Project Status**: ✅ Complete and Ready to Deploy
