-- SwiftDelivery MySQL schema
-- Run with MySQL Workbench: File -> Open SQL Script -> run with ⚡

CREATE DATABASE IF NOT EXISTS swiftdelivery
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE swiftdelivery;

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin','operator','driver') NOT NULL DEFAULT 'operator',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Shipments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipments (
  id           CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  tracking_id  VARCHAR(100) UNIQUE NOT NULL,
  status       ENUM('processing','in_transit','out_for_delivery','delivered','delayed')
               NOT NULL DEFAULT 'processing',
  origin       VARCHAR(255),
  destination  VARCHAR(255),
  eta          DATETIME,
  driver_id    CHAR(36),
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_shipments_status      (status),
  INDEX idx_shipments_tracking_id (tracking_id),
  INDEX idx_shipments_driver      (driver_id)
);

-- ── Tracking events ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracking_events (
  id          CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  shipment_id CHAR(36)  NOT NULL,
  lat         FLOAT,
  lng         FLOAT,
  note        TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  INDEX idx_events_shipment (shipment_id)
);

-- ── Seed: one admin user (password: admin123) ─────────────────
INSERT IGNORE INTO users (id, email, password, role) VALUES (
  UUID(),
  'admin@swiftdelivery.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpwFAMQuL9m3L2',
  'admin'
);