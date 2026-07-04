const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes/api');
const { createBot } = require('./telegram/bot');
const { attachTelegramBot } = require('./services/notifier');
const { startPolling } = require('./services/poller');

const app = express();
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json());
app.use('/api', apiRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(config.PORT, () => {
  console.log(`🃏 Renaiss Radar API listening on port ${config.PORT}`);
});

const bot = createBot();
if (bot) {
  attachTelegramBot(bot);
  bot.launch();
  console.log('🃏 Telegram bot running');
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

startPolling(config.POLL_INTERVAL_MS);
console.log(`[poller] polling every ${config.POLL_INTERVAL_MS / 1000 / 60} minutes`);