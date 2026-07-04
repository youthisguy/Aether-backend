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
  if (!data[wallet]) data[wallet] = { telegramChatId: null, watches: [], packAlerts: [] };
  if (!data[wallet].packAlerts) data[wallet].packAlerts = [];
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

function addPackAlert(wallet, { slug, aboveRatio }) {
  const entry = ensureWallet(wallet);
  const alert = { id: `pa_${Date.now()}`, slug, aboveRatio, firedAt: null };
  entry.packAlerts.push(alert);
  persist();
  return alert;
}

function updatePackAlert(wallet, alertId, patch) {
  const entry = ensureWallet(wallet);
  const alert = entry.packAlerts.find((a) => a.id === alertId);
  if (alert) Object.assign(alert, patch);
  persist();
}

function removePackAlert(wallet, alertId) {
  const entry = ensureWallet(wallet);
  const before = entry.packAlerts.length;
  entry.packAlerts = entry.packAlerts.filter((a) => a.id !== alertId);
  persist();
  return entry.packAlerts.length < before;
}

function getAllWallets() {
  return load();
}

module.exports = {
  ensureWallet, getWallet, linkTelegram, addWatch, removeWatch,
  addPackAlert, updatePackAlert, removePackAlert, getAllWallets,
};
