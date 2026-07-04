const fs = require('fs');
const path = require('path');
const config = require('../config');

let cache = null;

function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(config.STORE_PATH, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') cache = {};
    else throw err;
  }
  return cache;
}

function persist() {
  fs.mkdirSync(path.dirname(config.STORE_PATH), { recursive: true });
  fs.writeFileSync(config.STORE_PATH, JSON.stringify(cache, null, 2));
}

function ensureWallet(wallet) {
  const data = load();
  if (!data[wallet]) data[wallet] = { telegramChatId: null, watches: [] };
  return data[wallet];
}

function getWallet(wallet) {
  return load()[wallet] || null;
}

function linkTelegram(wallet, chatId) {
  const entry = ensureWallet(wallet);
  entry.telegramChatId = String(chatId);
  persist();
  return entry;
}

function addWatch(wallet, criteria) {
  const entry = ensureWallet(wallet);
  const watch = { id: `wl_${Date.now()}`, ...criteria };
  entry.watches.push(watch);
  persist();
  return watch;
}

function removeWatch(wallet, watchId) {
  const entry = ensureWallet(wallet);
  const before = entry.watches.length;
  entry.watches = entry.watches.filter((w) => w.id !== watchId);
  persist();
  return entry.watches.length < before;
}

function getAllWallets() {
  return load();
}

module.exports = {
  ensureWallet,
  getWallet,
  linkTelegram,
  addWatch,
  removeWatch,
  getAllWallets,
};