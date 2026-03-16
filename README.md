# SwiftDelivery

A full-stack delivery tracking dashboard — Node.js REST API with Socket.IO real-time updates, MySQL database, and a multi-page HTML/CSS/JS frontend.

---

## Project structure

```
swiftdelivery/
│
├── server.js               ← Express + Socket.IO entry point
├── schema.sql              ← MySQL schema + seed data
├── .env                    ← Environment variables (never commit this)
├── .env.example            ← Safe template to share with teammates
├── package.json
│
├── config/
│   ├── db.js               ← MySQL connection pool
│   └── redis.js            ← Optional Redis cache
│
├── middleware/
│   └── auth.js             ← JWT protect + requireRole guards
│
├── routes/
│   ├── auth.js             ← POST /api/auth/register|login, GET /api/auth/me
│   ├── shipments.js        ← CRUD + status update + location push
│   └── analytics.js        ← GET /api/analytics/summary
│
├── services/
│   ├── authService.js      ← bcrypt + JWT logic
│   ├── shipmentService.js  ← DB queries, cache layer
│   └── trackingService.js  ← Real-time location + status broadcast
│
├── sockets/
│   └── tracking.js         ← Socket.IO event handlers
│
├── HTML/
│   ├── index.html          ← Dashboard overview
│   ├── tracking.html       ← Live map + shipment timeline
│   ├── shipments.html      ← Shipment ledger table
│   └── analytics.html      ← KPIs, bar chart, route efficiency
│
├── Css/
│   ├── base.css            ← Design tokens, sidebar, topbar, shared components
│   ├── dashboard.css
│   ├── tracking.css
│   ├── shipments.css
│   └── analytics.css
│
└── js/
    ├── api.js              ← Fetch wrapper + AuthAPI / ShipmentsAPI / AnalyticsAPI
    ├── data.js             ← Mock data fallback (used when API is unavailable)
    └── ui.js               ← Shared sidebar + topbar renderer
```

---

## Quick start

### 1 — Prerequisites

- Node.js 18+
- MySQL 8+

### 2 — Clone & install

```bash
git clone <repo-url>
cd swiftdelivery
npm install
```

### 3 — Create the database

In MySQL Workbench (or any MySQL client) run:

```sql
SOURCE schema.sql;
```

This creates the `swiftdelivery` database, all tables, and a seed admin user.

### 4 — Configure environment

Copy the example file and fill in your values:

```bash
copy .env.example .env
```

Edit `.env`:

```
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=swiftdelivery

JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d

# REDIS_URL=redis://localhost:6379   ← uncomment if you have Redis

CLIENT_URL=http://localhost:5500
```

> **Important:** `JWT_SECRET` must be a long random string in production. Never commit `.env`.

### 5 — Start the server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

API is available at `http://localhost:3000`  
Frontend: open `index.html` (or `HTML/index.html`) in a browser or via Live Server.

---

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user profile |
| GET | `/api/shipments` | JWT | List shipments (filter by status, limit, offset) |
| GET | `/api/shipments/:id` | JWT | Get shipment + timeline |
| POST | `/api/shipments` | admin/operator | Create shipment |
| PATCH | `/api/shipments/:id/status` | admin/operator/driver | Update status |
| POST | `/api/shipments/:id/location` | admin/driver | Push GPS location |
| GET | `/api/analytics/summary` | JWT | Live KPI totals |
| GET | `/health` | — | Health check |

---

## User roles

| Role | Permissions |
|------|-------------|
| `admin` | All operations |
| `operator` | Create shipments, update status |
| `driver` | Update status, push location |

Seed admin credentials (password: `admin123`):
```
email: admin@swiftdelivery.com
```

---

## Real-time (Socket.IO)

Clients connect to the same port as the REST API.

| Event (emit) | Payload | Description |
|---|---|---|
| `track` | `shipmentId` | Join room for a shipment |
| `driver_location` | `{ shipmentId, lat, lng, note }` | Push GPS from driver |

| Event (receive) | Payload | Description |
|---|---|---|
| `location` | `{ shipmentId, lat, lng, note, timestamp }` | New GPS point |
| `status` | `{ shipmentId, status, timestamp }` | Status changed |

---

## Design system

All design tokens (colors, spacing, radius, fonts) live in the `:root` block of `Css/base.css`.  
Change them once — every page updates automatically.

- `--c-primary` — dark navy (sidebar, buttons)
- `--c-accent` — orange (highlights, CTAs)
- `--c-green` — mint green (success states)
- `--s-*` — surface scale (background layers)

## How to run

Open `index.html` in any modern browser. No server, no build step needed.
