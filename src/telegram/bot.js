const { Telegraf } = require('telegraf');
const config = require('../config');
const store = require('../services/store');
const packTracker = require('../services/packTracker');

function createBot() {
  if (!config.BOT_TOKEN) {
    console.warn('[telegram] BOT_TOKEN not set — Telegram integration disabled');
    return null;
  }

  const bot = new Telegraf(config.BOT_TOKEN);

  bot.start((ctx) => {
    const payload = ctx.startPayload;
    if (payload) {
      store.linkTelegram(payload, ctx.chat.id);
      return ctx.replyWithMarkdown(`✅ Linked wallet \`${payload}\` to this chat.\n\nYou'll get alerts here from now on.`);
    }
    ctx.replyWithMarkdown(
      `🃏 *Aether*\n\n` +
      `\`/link <wallet address>\`\n` +
      `\`/watchlist add set=<name> grade=<min> price=<max>\`\n` +
      `\`/packs\`\n` +
      `\`/packalert <slug> <ratio>\``
    );
  });

  bot.command('link', (ctx) => {
    const wallet = ctx.message.text.trim().split(/\s+/)[1];
    if (!wallet) return ctx.reply('❌ Usage: /link <wallet address>');
    store.linkTelegram(wallet, ctx.chat.id);
    ctx.reply(`✅ Linked. Alerts for ${wallet} will be sent here.`);
  });

  bot.command('packs', (ctx) => {
    const packs = packTracker.getLatestPacks();
    if (packs.length === 0) return ctx.reply('No pack data yet — try again shortly.');
    const sorted = [...packs].sort((a, b) => (b.evRatio || 0) - (a.evRatio || 0));
    const lines = sorted.map((p, i) => `${i + 1}. ${p.name} — EV ratio ${p.evRatio}x (price ${p.priceUsdt} USDT, EV $${p.evUsd})`);
    ctx.reply(`📈 Live Pack EV Leaderboard\n\n${lines.join('\n')}`);
  });

  bot.command('packalert', (ctx) => {
    const parts = ctx.message.text.trim().split(/\s+/);
    const slug = parts[1];
    const ratio = Number(parts[2]);
    if (!slug || !ratio) return ctx.reply('Usage: /packalert <slug> <ratio>');

    const allWallets = store.getAllWallets();
    const wallet = Object.keys(allWallets).find((w) => allWallets[w].telegramChatId === String(ctx.chat.id));
    if (!wallet) return ctx.reply('❌ Link a wallet first: /link <wallet address>');

    store.addPackAlert(wallet, { slug, aboveRatio: ratio });
    ctx.reply(`✅ Alert set: ${slug} above ${ratio}x EV ratio`);
  });

  return bot;
}

module.exports = { createBot };
