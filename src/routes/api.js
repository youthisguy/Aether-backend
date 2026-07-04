const express = require('express');
const store = require('../services/store');
const renaissClient = require('../services/renaissClient');
const poller = require('../services/poller');

const router = express.Router();

// GET /api/marketplace — current snapshot for the dashboard feed
router.get('/marketplace', (req, res) => {
  res.json(poller.getLatestSnapshot());
});

// GET /api/portfolio/:wallet — read-only lookup
router.get('/portfolio/:wallet', (req, res) => {
    res.json(indexer.getPortfolio(req.params.wallet));
  });

  router.get('/sync-status', (req, res) => {
    res.json(indexer.getSyncStatus());
  });

  router.post('/admin/sync', async (req, res) => {
    indexer.runFullSync(); 
    res.json({ started: true });
  });

// GET /api/watchlist/:wallet
router.get('/watchlist/:wallet', (req, res) => {
  const entry = store.getWallet(req.params.wallet);
  res.json(entry ? entry.watches : []);
});

// POST /api/watchlist/:wallet  body: { set, gradeMin, priceMax }
router.post('/watchlist/:wallet', (req, res) => {
  const { set, gradeMin, priceMax } = req.body || {};
  if (!set && !gradeMin && !priceMax) {
    return res.status(400).json({ error: 'At least one filter (set, gradeMin, priceMax) required' });
  }
  const watch = store.addWatch(req.params.wallet, { set, gradeMin, priceMax });
  res.status(201).json(watch);
});

// DELETE /api/watchlist/:wallet/:watchId
router.delete('/watchlist/:wallet/:watchId', (req, res) => {
  const removed = store.removeWatch(req.params.wallet, req.params.watchId);
  res.json({ removed });
});

// POST /api/link-telegram/:wallet  body: { chatId }

router.post('/link-telegram/:wallet', (req, res) => {
  const { chatId } = req.body || {};
  if (!chatId) return res.status(400).json({ error: 'chatId required' });
  const entry = store.linkTelegram(req.params.wallet, chatId);
  res.json(entry);
});

module.exports = router;