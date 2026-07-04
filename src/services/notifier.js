const { formatListingAlertText } = require('../utils/format');

let telegramBot = null;

function attachTelegramBot(bot) {
  telegramBot = bot;
}

async function notifyListing(walletEntry, listing) {
  if (walletEntry.telegramChatId && telegramBot) {
    try {
      await telegramBot.telegram.sendMessage(
        walletEntry.telegramChatId,
        formatListingAlertText(listing)
      );
    } catch (err) {
      console.error('[notifier] telegram send failed:', err.message);
    }
  }
}

module.exports = { attachTelegramBot, notifyListing };