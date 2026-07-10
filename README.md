# Aether Scanner

Telegram bot + live dashboard for the Renaiss collectibles marketplace, built on the `renaiss` CLI. Aether Scanner delivers personalized alerts and real-time insights so you only see the deals that matter to you.

1. **Personalized marketplace watchlists** — get alerted only for listings matching your own set/grade/price filters, not a global feed of every deal.
2. **Live pack EV tracking** — continuous monitoring of expected-value-per-dollar across active gacha packs, with threshold alerts and a historical chart. 

## Links

- **Telegram Bot**: [https://t.me/aether_scanner_bot](https://t.me/aether_scanner_bot)
- **Live Dashboard**: [https://aether-backend-vs0i.onrender.com/dashboard/](https://aether-backend-vs0i.onrender.com/dashboard/)

## How to Use

Launch the bot with the `/start` command, then:

- **Link / Manage Wallet** — Connect your Renaiss wallet to enable personalized alerts
- **📊 Pack Leaderboard** — View live EV rankings
- **👀 Watchlist** — Add, list, or remove custom filters
- **🚨 Pack Alerts** — Set EV ratio thresholds

**Watchlist Example**:  
`set=Base grade=9 price=500` (any field is optional)

## Architecture

```bash
src/
├── server.js              # Express app entry
├── config.js              # Environment variables + intervals
├── services/
│   ├── renaissClient.js    # Official renaiss CLI integration
│   ├── store.js            # JSON store (wallet-keyed)
│   ├── poller.js           # Marketplace polling + alerts
│   ├── packTracker.js      # EV tracking + history
│   ├── notifier.js         # Telegram notifications
│   └── collectionIndexer.js # Owner address index
├── routes/api.js          # REST endpoints for dashboard
└── telegram/bot.js        # bot interface

public/dashboard/          # Static web dashboard (charts, leaderboard)
data/                      # watchlists.json + pack-history.json

## Quick Setup (Self-Host)

### 1. Clone the repository

```bash
git clone https://github.com/youthisguy/Aether-backend.git
cd Aether-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Telegram Bot Token and any other required configuration.

### 4. Start the server

```bash
npm start
```

---

## Access Points

| Service | URL |
|---------|-----|
| Web Dashboard | http://localhost:3001/dashboard |
| API Health Check | http://localhost:3001/health |

---

## API Routes  

| Method | Route                              | Description |
|--------|------------------------------------|-------------|
| `GET`  | `/api/marketplace`                 | Latest marketplace snapshot |
| `GET`  | `/api/portfolio/:wallet`           | Derived portfolio holdings for a wallet |
| `GET`  | `/api/watchlist/:wallet`           | Get user's saved watchlists |
| `POST` | `/api/watchlist/:wallet`           | Add a new watchlist filter (`{ set, gradeMin, priceMax }`) |
| `DELETE` | `/api/watchlist/:wallet/:watchId` | Remove a watchlist item |
| `GET`  | `/api/packs`                       | Current pack EV leaderboard |
| `GET`  | `/api/packs/history`               | Pack EV historical data (`?slug=` optional) |
| `GET`  | `/api/pack-alerts/:wallet`         | Get user's pack alerts |
| `POST` | `/api/pack-alerts/:wallet`         | Add a new pack EV alert (`{ slug, aboveRatio }`) |
| `DELETE` | `/api/pack-alerts/:wallet/:alertId` | Remove a pack alert |
