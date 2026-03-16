/* ============================================================
   data.js — SwiftDelivery mock data
   Single source of truth. Replace with API calls in production.
   ============================================================ */

const DATA = {

  stats: {
    activeShipments: 0,
    activeChange: '0%',
    deliveredToday: 0,
    deliveredGoal: 0,
    inTransit: 0,
    issues: 0,
  },

  recentShipments: [],

  liveTracking: [],

  trackingDetail: {
    id: '',
    status: 'processing',
    statusLabel: 'No Active Shipment',
    title: 'No shipment selected yet',
    eta: '--',
    origin: { name: 'No origin yet', address: 'Create or open a shipment to see route details.' },
    dest:   { name: 'No destination yet', address: 'Tracking details will appear here.' },
    mapLegend: { origin: 'Origin unavailable', active: 'Destination unavailable' },
    coords: null,
    courier: {
      name: 'No courier assigned',
      rating: '--',
      reviews: '0 deliveries',
      avatar: 'https://i.pravatar.cc/80?img=7',
    },
    pkg: {
      weight: '--',
      dimensions: '--',
      service: 'Not assigned',
    },
    timeline: [],
  },

  shipments: [],

  analytics: {
    kpis: [
      { label: 'Success Rate',     value: '0%', sub: 'No completed deliveries yet', subClass: '', icon: 'check_circle', iconClass: 'green', theme: 'light' },
      { label: 'Avg Transit Time', value: '0h', sub: 'No shipment timing data yet', subClass: '', icon: 'schedule', iconClass: '', theme: 'dark' },
      { label: 'Active Fleet',     value: '0', sub: 'No vehicles currently active', subClass: '', icon: 'local_shipping', iconClass: 'accent', theme: 'light' },
      { label: 'Carbon Offset',    value: '0t', sub: 'No sustainability data yet', subClass: '', icon: 'eco', iconClass: 'green', theme: 'light' },
    ],
    barChart: [
      { day: 'Mon', pct: 0 },
      { day: 'Tue', pct: 0 },
      { day: 'Wed', pct: 0 },
      { day: 'Thu', pct: 0 },
      { day: 'Fri', pct: 0 },
      { day: 'Sat', pct: 0 },
      { day: 'Sun', pct: 0 },
    ],
    routes: [],
  },
};
