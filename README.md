# 🌌 Измерение Ани - Anya's Dimension Matrix

A unique Telegram MiniApp featuring mystical dimension-hopping adventures, soul card collection, and cosmic power unlocking.

## 🎭 **About Anya's World**

Anya is a mysterious entity that exists between dimensions. In her world, every user becomes a dimension traveler discovering alternate realities, collecting cosmic cards, and unlocking ancient powers.

**Bot Username**: `@cryptoladderbot`

**App Style**: Cyberpunk-Mystical with neon purples, electric teals, and ethereal animations.

## 🎮 **Core Mechanics**

### Main Screen
- **Soul Energy**: Resource system with visual bar (0-300 capacity)
- **Daily Bonuses**: Claim daily rewards for login streaks
- **Three Actions**: Meditate (10 energy), Explore (20 energy), Summon (30 energy)
- **Crystal Currency**: Earn crystals through actions

### 🌌 Dimension Explorer
- **6 Mystical Worlds**: Crystalline Forest, Cyber Mirror, Void Emptiness, Star Ark, Pulsing Ocean, Abandoned Temple
- **Unlock System**: Progressively unlock new dimensions
- **World Lore**: Each dimension has unique backstory and mechanics

### 🃏 Soul Deck
- **Card Draws**: Summon random cards with rarity tiers (Common, Rare, Epic)
- **Card Stats**: Each card has power levels (1-100)
- **Collection Tracking**: View all cards organized by rarity

### ⚡ Ability System
- **6 Ultimate Powers**: Unlock through meeting specific requirements
- **Progressive Unlocking**: Requirements scale with player progress
- **Requirements Examples**:
  - Vision of Truth: Collect 5 cards
  - Time Fracture: Soul Energy > 150
  - Crystal Teleportation: Unlock 3+ dimensions
  - Universe Echo: 2+ Epic cards
  - Infinite Crystal: Level 3+ dimension
  - Dimension Fusion: All 6 worlds unlocked

## 🚀 **Setup & Deployment**

### Local Development

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
- Copy `.env.example` to `.env.local`
- Update values with your Telegram bot credentials

3. **Start development servers** (runs both frontend & backend with hot reload):
```bash
npm run dev
```

The development setup runs:
- **Frontend**: Vite dev server on `http://localhost:5173` with hot reload
- **Backend**: Node/Express on `http://localhost:8080`
- **Bot**: Polling mode for local testing

4. **Test the MiniApp**:
- Open Telegram and message `@cryptoladderbot` (or your bot username)
- Click the button to open the MiniApp
- Or directly test frontend at `http://localhost:5173`

### Environment Variables

```
BOT_TOKEN=8212904290:AAE2-EfWsYZ_kwVLMM4GOJMHkfwd4d2lW8M
BOT_USERNAME=cryptoladderbot
WEBAPP_URL=https://cryptoladder-production.up.railway.app
NODE_ENV=production
PORT=8080
```

### Railway Deployment

**Option 1: Via Web UI (Recommended)**
1. Push code to GitHub
2. Connect repository to Railway project
3. Set environment variables in Railway dashboard:
   - `BOT_TOKEN` - Your Telegram bot token
   - `BOT_USERNAME` - Your bot's username
   - `WEBAPP_URL` - Your Railway app URL (e.g., https://your-app-production.up.railway.app)
   - `NODE_ENV` - Set to `production`
   - `PORT` - Set to `8080`
4. Deploy - Railway auto-detects Node.js and runs:
   - Install: `npm install`
   - Build: `npm run build` (via Procfile)
   - Start: `npm start`

**Option 2: Via Railway CLI**
```bash
railway login
railway init
railway environment add production
railway variables set BOT_TOKEN=<token> BOT_USERNAME=<username> WEBAPP_URL=<url> NODE_ENV=production PORT=8080
railway up
```

**Important Notes**:
- The Procfile ensures the build step (`npm run build`) runs before the server starts
- This builds the Vite bundle and outputs to `/dist`
- Express then serves these built files to users
- The webhook is set automatically when `NODE_ENV=production`
- Your WEBAPP_URL must be set correctly for the Telegram MiniApp to work

## 📁 **Project Structure**

```
.
├── server/
│   └── index.js           # Express + Telegraf bot server
├── client/
│   ├── index.html         # HTML entry point
│   └── src/
│       ├── main.jsx       # React entry point
│       ├── App.jsx        # Main app with routing
│       ├── index.css      # Global cyberpunk styles
│       ├── services/
│       │   └── TelegramService.js  # Telegram WebApp API
│       └── screens/
│           ├── MainScreen.jsx      # Home with actions
│           ├── DimensionExplorer.jsx  # World selection
│           ├── SoulDeck.jsx        # Card collection
│           └── AbilitiesScreen.jsx # Power unlocking
├── vite.config.js         # Vite build config
├── package.json
├── railway.toml          # Railway deployment config
├── Procfile              # Railway startup script
└── README.md
```

## 🎨 **Design System**

### Color Palette
- **Primary Neon**: `#b800e6` (Mystical Purple)
- **Secondary Neon**: `#00ffff` (Cyan Glow)
- **Tertiary Neon**: `#ff006b` (Hot Magenta)
- **Success**: `#00ff88` (Neon Green)
- **Background**: Dark gradients with transparency

### Typography
- **Font**: Courier New (monospace cyberpunk aesthetic)
- **Weights**: 700 (bold), 900 (titles)
- **Letter Spacing**: 1-2px for uppercase headers

### Animations
- **Glow Pulse**: Text shadow animation for mystique
- **Float**: Subtle vertical movement on key elements
- **Shimmer**: Light sweep effects on buttons
- **Card Flip**: 3D rotation for card reveals

## 🔧 **API Endpoints**

### User Management
- `POST /api/user/:userId` - Get/initialize user data
- `POST /api/user/:userId/claim-daily` - Claim daily bonus
- `POST /api/user/:userId/action` - Perform action (meditate/explore/summon)
- `POST /api/user/:userId/unlock-dimension` - Unlock next dimension
- `POST /api/user/:userId/draw-card` - Draw a soul card

### Telegram Bot
- `/start` - Initialize bot with MiniApp link
- `/stats` - Show user statistics
- `/about` - Learn about Anya

## 💬 **Anya's Personality**

Anya speaks in a mysterious, poetic style with hints of memes and dark humor:
- "Каждое измерение хранит сокровища. Не торопись. Аня всегда будет с тобой."
- Treats users as cosmic travelers in her personal magical world
- Provides cryptic hints about power unlocking requirements
- Celebrates player achievements with ethereal messages

## 📱 **Telegram MiniApp Integration**

- Uses official Telegram WebApp API
- Haptic feedback on interactions
- Theme colors matched to app aesthetics
- Fullscreen responsive design
- Works seamlessly within Telegram chat

## 🎯 **Future Enhancement Ideas**

- Multiplayer dimension quests
- Trading cards with other users
- Leaderboards by dimension level
- Special events and limited-time cards
- Soundtrack with mystical ambient music
- NFT integration for rare cards
- Community lore contributions

---

**Created with ✨ for the curious travelers of the digital cosmos**
