const express = require('express');
const store = require('../services/store');
const poller = require('../services/poller');
const indexer = require('../services/collectionIndexer');
const packTracker = require('../services/packTracker');

const router = express.Router();

router.get('/marketplace', (req, res) => res.json(poller.getLatestSnapshot()));

router.get('/portfolio/:wallet', (req, res) => res.json(indexer.getPortfolio(req.params.wallet)));
router.get('/sync-status', (req, res) => res.json(indexer.getSyncStatus()));
router.post('/admin/sync', async (req, res) => {
  indexer.runFullSync();
  res.json({ started: true });
});

router.get('/watchlist/:wallet', (req, res) => {
  const entry = store.getWallet(req.params.wallet);
  res.json(entry ? entry.watches : []);
});

router.post('/watchlist/:wallet', (req, res) => {
  const { set, gradeMin, priceMax } = req.body || {};
  if (!set && !gradeMin && !priceMax) {
    return res.status(400).json({ error: 'At least one filter (set, gradeMin, priceMax) required' });
  }
  res.status(201).json(store.addWatch(req.params.wallet, { set, gradeMin, priceMax }));
});

router.delete('/watchlist/:wallet/:watchId', (req, res) => {
  res.json({ removed: store.removeWatch(req.params.wallet, req.params.watchId) });
});

router.post('/link-telegram/:wallet', (req, res) => {
  const { chatId } = req.body || {};
  if (!chatId) return res.status(400).json({ error: 'chatId required' });
  res.json(store.linkTelegram(req.params.wallet, chatId));
});

router.get('/packs', (req, res) => res.json(packTracker.getLatestPacks()));
router.get('/packs/history', (req, res) => res.json(packTracker.getHistory(req.query.slug)));

router.get('/pack-alerts/:wallet', (req, res) => {
  const entry = store.getWallet(req.params.wallet);
  res.json(entry ? entry.packAlerts : []);
});

router.post('/pack-alerts/:wallet', (req, res) => {
  const { slug, aboveRatio } = req.body || {};
  if (!slug || !aboveRatio) return res.status(400).json({ error: 'slug and aboveRatio required' });
  res.status(201).json(store.addPackAlert(req.params.wallet, { slug, aboveRatio: Number(aboveRatio) }));
});

router.delete('/pack-alerts/:wallet/:alertId', (req, res) => {
  res.json({ removed: store.removePackAlert(req.params.wallet, req.params.alertId) });
});

module.exports = router;
