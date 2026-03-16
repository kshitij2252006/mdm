'use strict';
const db    = require('../config/db');
const cache = require('../config/redis');

async function getAll({ status, limit = 50, offset = 0 }) {
  const cacheKey = `shipments:list:${status || 'all'}:${limit}:${offset}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  let query = 'SELECT * FROM shipments';
  const vals = [];

  if (status) {
    query += ' WHERE status = ?';
    vals.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  vals.push(Number(limit), Number(offset));

  const [rows] = await db.query(query, vals);
  await cache.set(cacheKey, rows, 30);
  return rows;
}

async function getById(id) {
  const [rows] = await db.query(
    `SELECT s.*, u.email AS driver_email
     FROM shipments s
     LEFT JOIN users u ON s.driver_id = u.id
     WHERE s.id = ? OR s.tracking_id = ?`,
    [id, id]
  );
  return rows[0] || null;
}

async function create({ tracking_id, origin, destination, eta, driver_id }) {
  await db.query(
    `INSERT INTO shipments (id, tracking_id, origin, destination, eta, driver_id)
     VALUES (UUID(), ?, ?, ?, ?, ?)`,
    [tracking_id, origin, destination, eta, driver_id]
  );
  await cache.del('shipments:list:all:50:0');
  return getById(tracking_id);
}

async function updateStatus(id, status) {
  await db.query(
    `UPDATE shipments SET status = ? WHERE id = ? OR tracking_id = ?`,
    [status, id, id]
  );
  return getById(id);
}

async function getTimeline(shipmentId) {
  const [rows] = await db.query(
    `SELECT * FROM tracking_events
     WHERE shipment_id = ?
     ORDER BY created_at ASC`,
    [shipmentId]
  );
  return rows;
}

async function addTimelineEvent(shipmentId, { lat, lng, note }) {
  await db.query(
    `INSERT INTO tracking_events (id, shipment_id, lat, lng, note)
     VALUES (UUID(), ?, ?, ?, ?)`,
    [shipmentId, lat, lng, note]
  );
  const [rows] = await db.query(
    `SELECT * FROM tracking_events
     WHERE shipment_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [shipmentId]
  );
  return rows[0] || null;
}

async function getSummaryStats() {
  const [rows] = await db.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'in_transit') AS in_transit,
      SUM(status = 'delivered' AND created_at >= NOW() - INTERVAL 1 DAY) AS delivered_today,
      SUM(status = 'delayed') AS delayed
    FROM shipments
  `);
  return rows[0];
}

module.exports = { getAll, getById, create, updateStatus, getTimeline, addTimelineEvent, getSummaryStats };
