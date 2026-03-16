(function () {
  const IS_LOCAL_BROWSER = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
  const IS_LIVE_SERVER = IS_LOCAL_BROWSER && window.location.port !== '3000';
  const API_BASE = window.API_BASE || (IS_LIVE_SERVER ? 'http://localhost:3000/api' : '/api');
  const SOCKET_URL = window.SOCKET_URL || (IS_LIVE_SERVER ? 'http://localhost:3000' : window.location.origin);
  const LOCAL_SHIPMENTS_KEY = 'swift_local_shipments';

  function getToken() {
    return localStorage.getItem('token') || '';
  }

  function setToken(token) {
    if (token) localStorage.setItem('token', token);
  }

  function readLocalShipments() {
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_SHIPMENTS_KEY) || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch (_err) {
      return [];
    }
  }

  function writeLocalShipments(shipments) {
    localStorage.setItem(LOCAL_SHIPMENTS_KEY, JSON.stringify(shipments));
  }

  function buildLocalSummary(shipments) {
    return shipments.reduce((summary, shipment) => {
      summary.total += 1;
      if (shipment.status === 'in_transit' || shipment.status === 'transit') summary.in_transit += 1;
      if (shipment.status === 'delivered') summary.delivered_today += 1;
      if (shipment.status === 'delayed') summary.delayed += 1;
      return summary;
    }, { total: 0, in_transit: 0, delivered_today: 0, delayed: 0 });
  }

  function filterLocalShipments(params) {
    const allShipments = readLocalShipments().sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0));
    const status = params && params.status ? params.status : '';
    const limit = Number(params && params.limit != null ? params.limit : allShipments.length || 50);
    const offset = Number(params && params.offset != null ? params.offset : 0);

    const filtered = status ? allShipments.filter((shipment) => shipment.status === status) : allShipments;
    return filtered.slice(offset, offset + limit);
  }

  async function request(path, options) {
    const token = getToken();
    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      options && options.headers ? options.headers : {}
    );

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, Object.assign({}, options, { headers }));
    let payload = null;
    try {
      payload = await res.json();
    } catch (_err) {
      payload = null;
    }

    if (!res.ok) {
      const message = payload && payload.error ? payload.error : `HTTP ${res.status}`;
      throw new Error(message);
    }

    return payload;
  }

  const AuthAPI = {
    async login(email, password) {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      return data;
    },

    async register(email, password, role) {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      setToken(data.token);
      return data;
    },

    async me() {
      return request('/auth/me', { method: 'GET' });
    },
  };

  const ShipmentsAPI = {
    async getAll(params) {
      try {
        const query = new URLSearchParams(params || {}).toString();
        const data = await request(`/shipments${query ? `?${query}` : ''}`, { method: 'GET' });
        return data;
      } catch (_err) {
        return { shipments: filterLocalShipments(params || {}) };
      }
    },

    async getById(id) {
      try {
        const data = await request(`/shipments/${encodeURIComponent(id)}`, { method: 'GET' });
        return data;
      } catch (_err) {
        const shipment = readLocalShipments().find((item) => item.id === id || item.tracking_id === id) || null;
        return { shipment, timeline: shipment && Array.isArray(shipment.timeline) ? shipment.timeline : [] };
      }
    },

    async create(payload) {
      try {
        const data = await request('/shipments', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        return data;
      } catch (_err) {
        const now = new Date().toISOString();
        const trackingId = payload.tracking_id || `SW-${Date.now()}`;
        const shipment = {
          id: trackingId,
          tracking_id: trackingId,
          origin: payload.origin,
          destination: payload.destination,
          eta: payload.eta,
          driver_id: payload.driver_id || '',
          service: payload.service || 'Standard Express',
          status: 'processing',
          created_at: now,
          timeline: [
            {
              status: 'processing',
              note: 'Shipment created locally',
              created_at: now,
            },
          ],
        };
        const shipments = readLocalShipments();
        shipments.unshift(shipment);
        writeLocalShipments(shipments);
        return { shipment, local: true };
      }
    },
  };

  const AnalyticsAPI = {
    async getSummary() {
      try {
        return await request('/analytics/summary', { method: 'GET' });
      } catch (_err) {
        return buildLocalSummary(readLocalShipments());
      }
    },
  };

  const Tracking = {
    watch(shipmentId, onLocation) {
      if (typeof io === 'undefined') {
        throw new Error('socket.io not loaded');
      }

      const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
      socket.emit('track', shipmentId);
      socket.on('location', function (payload) {
        if (typeof onLocation === 'function') {
          onLocation(payload);
        }
      });
      return socket;
    },
  };

  window.AuthAPI = AuthAPI;
  window.ShipmentsAPI = ShipmentsAPI;
  window.AnalyticsAPI = AnalyticsAPI;
  window.Tracking = Tracking;
})();
