# Aether Scanner

Telegram bot + live dashboard for the Renaiss collectibles marketplace, built on the `renaiss` CLI.

1. **Personalized marketplace watchlists** — get alerted only for listings matching your own set/grade/price filters, not a global feed of every deal.
2. **Live pack EV tracking** — continuous monitoring of expected-value-per-dollar across active gacha packs, with threshold alerts and a historical chart. Existing community tools track pulls *after* you open a pack; Aether tracks the odds *before* you do, and how they move over time.

## Architecture

```
src/
├── server.js              Express app entry — wires API, bot, both pollers
├── config.js               env vars + tunable intervals
├── services/
│   ├── renaissClient.js    only file that calls the renaiss CLI
│   ├── store.js            JSON persistence, keyed by wallet address
│   ├── poller.js            marketplace polling + listing-match alerts
│   ├── packTracker.js       pack EV polling, history log, threshold alerts
│   ├── notifier.js          Telegram alert delivery
│   └── collectionIndexer.js owner-address index 
├── routes/api.js           REST endpoints for the dashboard
└── telegram/bot.js         /link, /watchlist, /packs, /packalert
public/dashboard/           static dashboard — ticker, leaderboard, EV chart
data/                       watchlists.json, pack-history.json  
```

## Setup

```bash
npm install
cp .env.example .env
# fill in BOT_TOKEN
npm start
```

Dashboard: `http://localhost:3001/dashboard`
API health check: `http://localhost:3001/health`

## Commands (Telegram)

| Command | Does |
|---|---|
| `/start` | intro + command list |
| `/link <wallet>` | ties this chat to a wallet for alert delivery |
| `/watchlist add set=<name> grade=<min> price=<max>` | add a marketplace filter (any combo of the three) |
| `/watchlist list` / `/watchlist remove <id>` | manage watches |
| `/packs` | live pack EV leaderboard |
| `/packalert <slug> <ratio>` | alert when a pack's EV ratio crosses above `<ratio>` |

## API

| Route | Returns |
|---|---|
| `GET /api/marketplace` | latest polled marketplace snapshot |
| `GET /api/watchlist/:wallet` | that wallet's saved watches |
| `POST /api/watchlist/:wallet` | add a watch — body `{set, gradeMin, priceMax}` |
| `GET /api/packs` | latest pack EV snapshot |
| `GET /api/packs/history` | full EV time series (optional `?slug=`) |
| `POST /api/pack-alerts/:wallet` | add a threshold alert — body `{slug, aboveRatio}` |
| `GET /api/portfolio/:wallet` | derived holdings from marketplace owner index (see limitations) |
