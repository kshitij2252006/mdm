'use strict';

function initTracking(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('track', (shipmentId) => {
      Object.keys(socket.rooms).forEach((room) => {
        if (room.startsWith('shipment:')) socket.leave(room);
      });

      socket.join(`shipment:${shipmentId}`);
      console.log(`${socket.id} tracking shipment:${shipmentId}`);
      socket.emit('tracking_started', { shipmentId });
    });

    socket.on('driver_location', async ({ shipmentId, lat, lng, note }) => {
      // Basic server-side validation
      if (!shipmentId || typeof shipmentId !== 'string') return;
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return;
      if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return;

      const trackingSvc = require('../services/trackingService');
      await trackingSvc.pushLocation(shipmentId, {
        lat: parsedLat,
        lng: parsedLng,
        note: typeof note === 'string' ? note.slice(0, 500) : '',
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initTracking };
