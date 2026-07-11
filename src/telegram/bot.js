const { Telegraf, Markup } = require('telegraf');
const config = require('../config');
const store = require('../services/store');
const packTracker = require('../services/packTracker');

// Tracks what we're waiting on from a given chat (cleared once resolved or /cancel).
// { chatId: { action: 'link' | 'watchlist_add' | 'packalert_ratio', data: {...} } }
const awaiting = new Map();

const WELCOME_MESSAGE =
  `👋 *Welcome to Aether Scanner*\n\n` +
  `🙋 Need help?\n` +
  `• 🌐 [Renaiss Website](https://www.renaiss.xyz/)\n` +
  `• 💬 [Renaiss Discord](https://discord.com/invite/renaiss)`;
  function truncateWallet(address) {
    if (!address) return '🟢 Connect Wallet';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  function getMainMenuMessage(wallet) {
    return (
      `👋 *Welcome to Aether Scanner*\n\n` +
      `Track Renaiss packs, build watchlists, and receive alerts.\n\n` +
  
      `📈 *Pack Leaderboard*\n` +
      `View the latest live EV rankings for all packs.\n\n` +
  
      `🔔 *Watchlist*\n` +
      `Create filters for cards you're interested in.\n\n` +
 
      `🚨 *Pack Alerts*\n` +
      `Get notified when a pack's EV ratio exceeds your chosen value.\n\n` +

      `${wallet ? '' : '❌ _Link your wallet to enable watchlists and alerts._\n'}` +
  
      `🙋 *Some useful links*\n` +
      `> 🌐 [Renaiss Website](https://www.renaiss.xyz/)\n` +
      `> 💬 [Renaiss Discord](https://discord.com/invite/renaiss)`
    );
  }

  function mainMenu(wallet) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(
          truncateWallet(wallet),
          'menu:link'
        ),
      ],
      [Markup.button.callback('📈 Pack leaderboard', 'menu:packs')],
      [Markup.button.callback('🔔 Watchlist', 'menu:watchlist')],
      [Markup.button.callback('🚨 Pack alerts', 'menu:packalerts')],
    ]);
  }

function watchlistMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ Add watch', 'watchlist:add')],
    [Markup.button.callback('📋 View / remove watches', 'watchlist:list')],
    [Markup.button.callback('⬅️ Back', 'menu:main')],
  ]);
}

function packAlertMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ Add pack alert', 'packalert:add')],
    [Markup.button.callback('📋 View / remove alerts', 'packalert:list')],
    [Markup.button.callback('⬅️ Back', 'menu:main')],
  ]);
}

function packSlugMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Eden Pack', 'packalert:slug:eden-pack')],
    [Markup.button.callback('OMEGA', 'packalert:slug:omega')],
    [Markup.button.callback('RenaCrypt Pack', 'packalert:slug:renacrypt-pack')],
    [Markup.button.callback('⬅️ Back', 'menu:packalerts')],
  ]);
}

function getWalletForChat(chatId) {
  const allWallets = store.getAllWallets();
  return Object.keys(allWallets).find((w) => allWallets[w].telegramChatId === String(chatId));
}

const setAwaiting = (chatId, action, data = {}) => awaiting.set(String(chatId), { action, data });
const clearAwaiting = (chatId) => awaiting.delete(String(chatId));
const getAwaiting = (chatId) => awaiting.get(String(chatId));

function createBot() {
  if (!config.BOT_TOKEN) {
    console.warn('[telegram] BOT_TOKEN not set — Telegram integration disabled');
    return null;
  }

  const bot = new Telegraf(config.BOT_TOKEN);

  // ---- /start (handles deep-link wallet payload from the webapp too) ----
  bot.start((ctx) => {
    const payload = ctx.startPayload;
  
    if (payload) {
      store.linkTelegram(payload, ctx.chat.id);
      clearAwaiting(ctx.chat.id);
  
      return ctx.replyWithMarkdown(
        `✅ Linked wallet \`${payload}\` to this chat.\n\n` +
        getMainMenuMessage(payload),
        mainMenu(payload)
      );
    }
  
    const wallet = getWalletForChat(ctx.chat.id);
  
    ctx.replyWithMarkdown(
      getMainMenuMessage(wallet),
      mainMenu(wallet)
    );
  });
  
  bot.action('menu:main', async (ctx) => {
    await ctx.answerCbQuery();
  
    const wallet = getWalletForChat(ctx.chat.id);
  
    await ctx.editMessageText(
      getMainMenuMessage(wallet),
      {
        parse_mode: 'Markdown',
        ...mainMenu(wallet)
      }
    );
  });

  bot.command('cancel', (ctx) => {
    clearAwaiting(ctx.chat.id);
    ctx.reply('Cancelled.');
  });

  // ---- main menu ----
  bot.action('menu:main', async (ctx) => {
    await ctx.answerCbQuery();
  
    const wallet = getWalletForChat(ctx.chat.id);
  
    await ctx.editMessageText(
      getMainMenuMessage(wallet),
      {
        parse_mode: 'Markdown',
        ...mainMenu(wallet),
      }
    );
  });

  bot.action('menu:link', async (ctx) => {
    await ctx.answerCbQuery();
    setAwaiting(ctx.chat.id, 'link');
    ctx.reply('Send the wallet address you want to link.');
  });

  bot.action('menu:packs', async (ctx) => {
    await ctx.answerCbQuery();
    const packs = packTracker.getLatestPacks();
    if (packs.length === 0) return ctx.reply('No pack data yet — try again shortly.');
    const sorted = [...packs].sort((a, b) => (b.evRatio || 0) - (a.evRatio || 0));
    const lines = sorted.map((p, i) => `${i + 1}. ${p.name} — EV ratio ${p.evRatio}x (price ${p.priceUsdt} USDT, EV $${p.evUsd})`);
    ctx.reply(`📈 Live Pack EV Leaderboard\n\n${lines.join('\n')}`);
  });

  bot.action('menu:watchlist', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.editMessageText('Watchlist:', watchlistMenu());
  });

  bot.action('menu:packalerts', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.editMessageText('Pack alerts:', packAlertMenu());
  });

  // ---- watchlist ----
  bot.action('watchlist:add', async (ctx) => {
    await ctx.answerCbQuery();
    const wallet = getWalletForChat(ctx.chat.id);
    if (!wallet) return ctx.reply('❌ Link a wallet first.', mainMenu(null));
    setAwaiting(ctx.chat.id, 'watchlist_add');
    ctx.replyWithMarkdown(
      'Send your watch filter in this format: \n`set=Base grade=9 price=500`\n\nAny field can be left out (e.g. just `grade=9`).'
    );
  });

  bot.action('watchlist:list', async (ctx) => {
    await ctx.answerCbQuery();
    const wallet = getWalletForChat(ctx.chat.id);
    if (!wallet) return ctx.reply('❌ Link a wallet first.', mainMenu(null));
    const watches = store.getWatchlist(wallet);
    if (!watches.length) return ctx.reply('No watches yet.', watchlistMenu());
    const buttons = watches.map((w) => [
      Markup.button.callback(
        `❌ ${w.set || 'any set'} · grade≥${w.gradeMin || '-'} · price≤${w.priceMax || '-'}`,
        `watchlist:remove:${w.id}`
      ),
    ]);
    buttons.push([Markup.button.callback('⬅️ Back', 'menu:watchlist')]);
    ctx.reply('Tap a watch to remove it:', Markup.inlineKeyboard(buttons));
  });

  bot.action(/watchlist:remove:(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const wallet = getWalletForChat(ctx.chat.id);
    if (!wallet) return;
    store.removeWatch(wallet, ctx.match[1]);
    ctx.reply('✅ Removed.', watchlistMenu());
  });

  // ---- pack alerts ----
  bot.action('packalert:add', async (ctx) => {
    await ctx.answerCbQuery();
    const wallet = getWalletForChat(ctx.chat.id);
    if (!wallet) return ctx.reply('❌ Link a wallet first.', mainMenu(null));
    ctx.editMessageText('Which pack?', packSlugMenu());
  });

  bot.action(/packalert:slug:(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const wallet = getWalletForChat(ctx.chat.id);
    if (!wallet) return ctx.reply('❌ Link a wallet first.', mainMenu(null));
    const slug = ctx.match[1];
    setAwaiting(ctx.chat.id, 'packalert_ratio', { slug });
    ctx.replyWithMarkdown(`Send the EV ratio to alert above for *${slug}* (e.g. \`1.2\`):`);
  });

  bot.action('packalert:list', async (ctx) => {
    await ctx.answerCbQuery();
    const wallet = getWalletForChat(ctx.chat.id);
    if (!wallet) return ctx.reply('❌ Link a wallet first.', mainMenu(null));
    const alerts = store.getPackAlerts(wallet);
    if (!alerts.length) return ctx.reply('No pack alerts yet.', packAlertMenu());
    const buttons = alerts.map((a) => [
      Markup.button.callback(`❌ ${a.slug} ≥ ${a.aboveRatio}x`, `packalert:remove:${a.id}`),
    ]);
    buttons.push([Markup.button.callback('⬅️ Back', 'menu:packalerts')]);
    ctx.reply('Tap an alert to remove it:', Markup.inlineKeyboard(buttons));
  });

  bot.action(/packalert:remove:(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const wallet = getWalletForChat(ctx.chat.id);
    if (!wallet) return;
    store.removePackAlert(wallet, ctx.match[1]);
    ctx.reply('✅ Removed.', packAlertMenu());
  });

  // ---- resolves whatever text input is currently pending ----
  bot.on('text', async (ctx) => {
    const pending = getAwaiting(ctx.chat.id);
    if (!pending) return; // no prompt pending, ignore stray text
    const text = ctx.message.text.trim();

    if (pending.action === 'link') {
      clearAwaiting(ctx.chat.id);
      if (!text) return ctx.reply('❌ That did not look like a wallet address. Try again with /start.');
      store.linkTelegram(text, ctx.chat.id);
      return ctx.replyWithMarkdown(
        `✅ Linked wallet \`${text}\` to this chat.`,
        mainMenu(text)
      );
    }

    if (pending.action === 'watchlist_add') {
      clearAwaiting(ctx.chat.id);
      const wallet = getWalletForChat(ctx.chat.id);
      if (!wallet) return ctx.reply('❌ Link a wallet first.', mainMenu(null));
      const setMatch = text.match(/set=(\S+)/i);
      const gradeMatch = text.match(/grade=([\d.]+)/i);
      const priceMatch = text.match(/price=([\d.]+)/i);
      store.addWatch(wallet, {
        set: setMatch ? setMatch[1] : undefined,
        gradeMin: gradeMatch ? Number(gradeMatch[1]) : undefined,
        priceMax: priceMatch ? Number(priceMatch[1]) : undefined,
      });
      return ctx.reply('✅ Watch added.', watchlistMenu());
    }

    if (pending.action === 'packalert_ratio') {
      clearAwaiting(ctx.chat.id);
      const wallet = getWalletForChat(ctx.chat.id);
      if (!wallet) return ctx.reply('❌ Link a wallet first.', mainMenu(null));
      const ratio = Number(text);
      if (!ratio) return ctx.reply('❌ That does not look like a number. Try again from the menu.', packAlertMenu());
      store.addPackAlert(wallet, { slug: pending.data.slug, aboveRatio: ratio });
      return ctx.reply(`✅ Alert set: ${pending.data.slug} above ${ratio}x EV ratio`, packAlertMenu());
    }
  });

  return bot;
}
 

module.exports = { createBot };