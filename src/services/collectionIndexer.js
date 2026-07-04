const renaissClient = require('./renaissClient');
const { normalizeListing } = require('../utils/format');

let ownerIndex = new Map();  
let lastSyncAt = null;
let syncInProgress = false;

async function runFullSync({ pageSize = 100, maxPages = 50 } = {}) {
  if (syncInProgress) {
    console.warn('[indexer] sync already in progress, skipping');
    return;
  }
  syncInProgress = true;
  const newIndex = new Map();
  let offset = 0;
  let pagesFetched = 0;

  try {
    while (pagesFetched < maxPages) {
      const raw = await renaissClient.getMarketplaceListingsRaw({ limit: pageSize, offset });
      const items = raw.collection || [];
      for (const item of items) {
        const norm = normalizeListing(item);
        if (!norm.ownerAddress) continue;
        const key = norm.ownerAddress.toLowerCase();
        if (!newIndex.has(key)) newIndex.set(key, []);
        newIndex.get(key).push(norm);
      }
      pagesFetched++;
      const hasMore = raw.pagination && raw.pagination.hasMore;
      offset += pageSize;
      if (!hasMore) break;
    }
    ownerIndex = newIndex;
    lastSyncAt = new Date();
    console.log(`[indexer] full sync complete — ${pagesFetched} page(s), ${ownerIndex.size} unique owner(s)`);
  } catch (err) {
    console.error('[indexer] full sync failed:', err.message);
  } finally {
    syncInProgress = false;
  }
}

function getPortfolio(walletAddress) {
  const holdings = ownerIndex.get(walletAddress.toLowerCase()) || [];
  const totalFmvUSD = holdings.reduce((sum, h) => sum + (h.fmvPriceUSD || 0), 0);
  const totalAskUSDT = holdings.reduce((sum, h) => sum + (h.askPriceUSDT || 0), 0);
  return {
    wallet: walletAddress,
    holdingsCount: holdings.length,
    totalFmvUSD,
    totalAskUSDT,
    holdings,
    indexedAsOf: lastSyncAt,
    note: lastSyncAt
      ? 'Portfolio derived from indexed marketplace data — may not reflect holdings never seen in a marketplace sync.'
      : 'No sync has run yet — index is empty.',
  };
}

function getSyncStatus() {
  return { lastSyncAt, syncInProgress, ownersIndexed: ownerIndex.size };
}

module.exports = { runFullSync, getPortfolio, getSyncStatus };