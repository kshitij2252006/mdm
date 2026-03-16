'use strict';
const router = require('express').Router();
const svc    = require('../services/shipmentService');
const cache  = require('../config/redis');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', async (req, res) => {
  try {
    const cached = await cache.get('analytics:summary');
    if (cached) return res.json(cached);

    const stats = await svc.getSummaryStats();
    await cache.set('analytics:summary', stats, 60);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
