'use strict';
require('dotenv').config();

let redis = null;

if (process.env.REDIS_URL) {
  const Redis = require('ioredis');
  redis = new Redis(process.env.REDIS_URL);

  redis.on('connect', () => console.log('Redis connected'));
  redis.on('error', (err) => console.warn('Redis error (non-fatal):', err.message));
} else {
  console.log('Redis not configured — caching disabled (set REDIS_URL in .env to enable)');
}

const cache = {
  async get(key) {
    if (!redis) return null;
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  },

  async set(key, value, ttlSeconds = 60) {
    if (!redis) return;
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  },

  async del(key) {
    if (!redis) return;
    await redis.del(key);
  },
};

module.exports = cache;
