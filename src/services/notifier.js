const { formatListingAlertText } = require('../utils/format');

let telegramBot = null;

function attachTelegramBot(bot) {
  telegramBot = bot;
}

async function notifyListing(walletEntry, listing) {
  if (!walletEntry.telegramChatId || !telegramBot) return;
  const cardUrl = listing.tokenId ? `https://www.renaiss.xyz/card/${listing.tokenId}` : null;
  const options = {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  };
  if (cardUrl) {
    options.reply_markup = {
      inline_keyboard: [[{ text: '🔎 View Card', url: cardUrl }]],
    };
  }
  try {
    await telegramBot.telegram.sendMessage(walletEntry.telegramChatId, formatListingAlertText(listing), options);
  } catch (err) {
    console.error('[notifier] telegram listing alert failed:', err.message);
  }
}

async function notifyPackAlert(walletEntry, pack, alert) {
  if (!walletEntry.telegramChatId || !telegramBot) return;
  const text = [
    `🔖 *PACK EV ALERT*`,
    ``,
    `📦 *${pack.name}*`,
    `📈 EV ratio is now *${pack.evRatio}x* (threshold: ≥${alert.aboveRatio}x)`,
    `💰 Price: ${pack.priceUsdt} USDT`,
    `📊 EV: $${pack.evUsd}`,
  ].join('\n');
  try {
    await telegramBot.telegram.sendMessage(walletEntry.telegramChatId, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[notifier] pack alert send failed:', err.message);
  }
}



module.exports = { attachTelegramBot, notifyListing, notifyPackAlert };
