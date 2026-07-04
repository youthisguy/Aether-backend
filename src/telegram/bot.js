const { Telegraf } = require('telegraf');
const config = require('../config');
const store = require('../services/store');

function createBot() {
  if (!config.BOT_TOKEN) {
    console.warn('[telegram] BOT_TOKEN not set — Telegram integration disabled');
    return null;
  }

  const bot = new Telegraf(config.BOT_TOKEN);

  bot.command('start', (ctx) => ctx.replyWithMarkdown(
    `🃏 *Aether*\n\n` +
    `Link your wallet to get marketplace alerts here:\n` +
    `\`/link <wallet address>\`\n\n` +
    `Manage watchlists and view your portfolio on the dashboard.`
  ));

  bot.command('link', (ctx) => {
    const wallet = ctx.message.text.trim().split(/\s+/)[1];
    if (!wallet) return ctx.reply('❌ Usage: /link <wallet address>');
    store.linkTelegram(wallet, ctx.chat.id);
    ctx.reply(`✅ Linked. Alerts for ${wallet} will be sent here.`);
  });

  return bot;
}

module.exports = { createBot };