const renaissClient = require('./renaissClient');
const store = require('./store');
const notifier = require('./notifier');
const config = require('../config');
const { normalizeListing } = require('../utils/format');

let seenTokenIds = new Set();
let initialized = false;
let latestSnapshot = [];

function matchesWatch(listing, watch) {
  const norm = normalizeListing(listing);
  if (watch.set && norm.set && watch.set.toLowerCase() !== norm.set.toLowerCase()) return false;
  if (watch.gradeMin && (norm.gradeNumber === null || norm.gradeNumber < watch.gradeMin)) return false;
  if (watch.priceMax && (norm.askPriceUSDT === null || norm.askPriceUSDT > watch.priceMax)) return false;
  return true;
}

async function pollOnce() {
  let listings;
  try {
    listings = await renaissClient.getMarketplaceListings({ limit: config.MARKETPLACE_POLL_LIMIT });
  } catch (err) {
    console.error('[poller] fetch failed:', err.message);
    return;
  }

  if (!Array.isArray(listings)) {
    console.error('[poller] unexpected response shape, skipping tick');
    return;
  }

  latestSnapshot = listings;

  if (!initialized) {
    for (const l of listings) {
      const { tokenId } = normalizeListing(l);
      if (tokenId) seenTokenIds.add(tokenId);
    }
    initialized = true;
    console.log(`[poller] initialized with ${seenTokenIds.size} listings`);
    return;
  }

  const newListings = listings.filter((l) => {
    const { tokenId } = normalizeListing(l);
    return tokenId && !seenTokenIds.has(tokenId);
  });

  if (newListings.length === 0) return;

  const allWallets = store.getAllWallets();

  for (const listing of newListings) {
    const { tokenId } = normalizeListing(listing);
    seenTokenIds.add(tokenId);

    for (const [wallet, entry] of Object.entries(allWallets)) {
      const matched = entry.watches.some((w) => matchesWatch(listing, w));
      if (matched) await notifier.notifyListing(entry, listing);
    }
  }

  console.log(`[poller] tick complete — ${newListings.length} new listing(s)`);
}

function startPolling(intervalMs) {
  pollOnce();
  return setInterval(pollOnce, intervalMs);
}

function getLatestSnapshot() {
  return latestSnapshot;
}

module.exports = { startPolling, pollOnce, getLatestSnapshot };
