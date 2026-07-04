require('dotenv').config();
const path = require('path');

module.exports = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  BOT_TOKEN: process.env.BOT_TOKEN,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // How often the shared poller checks the marketplace, in milliseconds.
  POLL_INTERVAL_MS: parseInt(process.env.POLL_INTERVAL_MS || (3 * 60 * 60 * 1000), 10),
  MARKETPLACE_POLL_LIMIT: parseInt(process.env.MARKETPLACE_POLL_LIMIT || '50', 10),
  
  STORE_PATH: process.env.STORE_PATH || path.join(__dirname, '..', 'data', 'watchlists.json'),

  CLI_TIMEOUT_MS: 20_000,
};