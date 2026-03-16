'use strict';
const shipmentSvc = require('./shipmentService');

let _io = null;

function init(io) {
  _io = io;
}

async function pushLocation(shipmentId, { lat, lng, note = '' }) {
  await shipmentSvc.addTimelineEvent(shipmentId, { lat, lng, note });

  if (_io) {
    _io.to(`shipment:${shipmentId}`).emit('location', {
      shipmentId,
      lat,
      lng,
      note,
      timestamp: new Date().toISOString(),
    });
  }
}

async function pushStatusChange(shipmentId, status) {
  await shipmentSvc.updateStatus(shipmentId, status);

  if (_io) {
    _io.to(`shipment:${shipmentId}`).emit('status', {
      shipmentId,
      status,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = { init, pushLocation, pushStatusChange };
