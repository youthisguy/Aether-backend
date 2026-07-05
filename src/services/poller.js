const renaissClient = require('./renaissClient');
const store = require('./store');
const notifier = require('./notifier');
const config = require('../config');
const { normalizeListing } = require('../utils/format');

let seenTokenIds = new Set();
let initialized = false;
let latestSnapshot = [];

// listing here is already normalized (see pollOnce) — do not re-normalize
function matchesWatch(listing, watch) {
  if (watch.set && listing.set && watch.set.toLowerCase() !== listing.set.toLowerCase()) return false;
  if (watch.gradeMin && (listing.gradeNumber === null || listing.gradeNumber < watch.gradeMin)) return false;
  if (watch.priceMax && (listing.askPriceUSDT === null || listing.askPriceUSDT > watch.priceMax)) return false;
  return true;
}

async function pollOnce() {
  let listings;
  try {
    listings = await renaissClient.getMarketplaceListings({ listed: true, limit: config.MARKETPLACE_POLL_LIMIT });
  } catch (err) {
    console.error('[poller] fetch failed:', err.message);
    return;
  }

  if (!Array.isArray(listings)) {
    console.error('[poller] unexpected response shape, skipping tick');
    return;
  }

  latestSnapshot = listings.map(normalizeListing);

  if (!initialized) {
    for (const l of latestSnapshot) {
      if (l.tokenId) seenTokenIds.add(l.tokenId);
    }
    initialized = true;
    console.log(`[poller] initialized with ${seenTokenIds.size} listings`);
    return;
  }

  const newListings = latestSnapshot.filter((l) => l.tokenId && !seenTokenIds.has(l.tokenId));
  if (newListings.length === 0) return;

  const allWallets = store.getAllWallets();

  for (const listing of newListings) {
    seenTokenIds.add(listing.tokenId);
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
