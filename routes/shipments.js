'use strict';
const router      = require('express').Router();
const svc         = require('../services/shipmentService');
const trackingSvc = require('../services/trackingService');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const rows = await svc.getAll({ status, limit, offset });
    res.json({ shipments: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const shipment = await svc.getById(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    const timeline = await svc.getTimeline(shipment.id);
    res.json({ shipment, timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireRole('admin', 'operator'), async (req, res) => {
  try {
    const shipment = await svc.create(req.body);
    res.status(201).json({ shipment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/status', requireRole('admin', 'operator', 'driver'), async (req, res) => {
  try {
    const { status } = req.body;
    const VALID_STATUSES = ['processing', 'in_transit', 'out_for_delivery', 'delivered', 'delayed'];
    if (!status) return res.status(400).json({ error: 'status is required' });
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    await trackingSvc.pushStatusChange(req.params.id, status);
    const shipment = await svc.getById(req.params.id);
    res.json({ shipment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/location', requireRole('admin', 'driver'), async (req, res) => {
  try {
    const { lat, lng, note } = req.body;
    if (lat == null || lng == null) return res.status(400).json({ error: 'lat and lng required' });

    await trackingSvc.pushLocation(req.params.id, { lat, lng, note });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
