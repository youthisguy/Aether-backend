const fs = require('fs');
const path = require('path');
const renaissClient = require('./renaissClient');
const { normalizePack } = require('../utils/format');
const notifier = require('./notifier');
const store = require('./store');

const HISTORY_PATH = path.join(__dirname, '..', '..', 'data', 'pack-history.json');

let history = [];
let latest = [];

function loadHistory() {
  try {
    history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') history = [];
    else throw err;
  }
}

function persistHistory() {
  fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}

async function pollPacksOnce() {
  let rawPacks;
  try {
    rawPacks = await renaissClient.getPacks();
  } catch (err) {
    console.error('[packTracker] fetch failed:', err.message);
    return;
  }

  const timestamp = new Date().toISOString();
  latest = rawPacks.map(normalizePack);
  for (const pack of latest) history.push({ timestamp, ...pack });
  persistHistory();

  const allWallets = store.getAllWallets();
  for (const pack of latest) {
    if (pack.evRatio === null) continue;
    for (const [wallet, entry] of Object.entries(allWallets)) {
      for (const alert of entry.packAlerts || []) {
        if (alert.slug !== pack.slug) continue;
        if (pack.evRatio >= alert.aboveRatio && !alert.firedAt) {
          notifier.notifyPackAlert(entry, pack, alert);
          store.updatePackAlert(wallet, alert.id, { firedAt: timestamp });
        } else if (pack.evRatio < alert.aboveRatio && alert.firedAt) {
          store.updatePackAlert(wallet, alert.id, { firedAt: null });
        }
      }
    }
  }

  console.log(`[packTracker] tick complete — ${latest.length} pack(s) snapshotted`);
}

function startPackPolling(intervalMs) {
  loadHistory();
  pollPacksOnce();
  return setInterval(pollPacksOnce, intervalMs);
}

function getLatestPacks() {
  return latest;
}

function getHistory(slug) {
  return slug ? history.filter((h) => h.slug === slug) : history;
}

module.exports = { startPackPolling, pollPacksOnce, getLatestPacks, getHistory };
