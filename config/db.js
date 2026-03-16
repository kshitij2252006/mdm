'use strict';
const mysql = require('mysql2/promise');
require('dotenv').config({ override: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

pool.query('SELECT 1').then(() => {
  console.log('MySQL connected');
}).catch((err) => {
  console.error('MySQL connection failed:', err.message);
  console.error('Check your DB_* values in .env');
});

module.exports = pool;
