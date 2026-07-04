const { formatListingAlertText } = require('../utils/format');

let telegramBot = null;

function attachTelegramBot(bot) {
  telegramBot = bot;
}

async function notifyListing(walletEntry, listing) {
  if (!walletEntry.telegramChatId || !telegramBot) return;
  try {
    await telegramBot.telegram.sendMessage(walletEntry.telegramChatId, formatListingAlertText(listing));
  } catch (err) {
    console.error('[notifier] telegram listing alert failed:', err.message);
  }
}

async function notifyPackAlert(walletEntry, pack, alert) {
  if (!walletEntry.telegramChatId || !telegramBot) return;
  const text = [
    `📈 Pack EV Alert`,
    ``,
    `${pack.name} EV ratio is now ${pack.evRatio}x`,
    `(threshold: ≥${alert.aboveRatio}x)`,
    ``,
    `💰 Price: ${pack.priceUsdt} USDT`,
    `📊 EV: $${pack.evUsd}`,
  ].join('\n');
  try {
    await telegramBot.telegram.sendMessage(walletEntry.telegramChatId, text);
  } catch (err) {
    console.error('[notifier] pack alert send failed:', err.message);
  }
}

module.exports = { attachTelegramBot, notifyListing, notifyPackAlert };
