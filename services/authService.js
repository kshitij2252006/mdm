'use strict';
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
require('dotenv').config();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register({ email, password, role = 'operator' }) {
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) throw new Error('Email already registered');

  const hash = await bcrypt.hash(password, 12);
  await db.query(
    'INSERT INTO users (id, email, password, role) VALUES (UUID(), ?, ?, ?)',
    [email, hash, role]
  );

  const [rows] = await db.query(
    'SELECT id, email, role FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return { user: rows[0], token: signToken(rows[0]) };
}

async function login({ email, password }) {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const user = rows[0];

  if (!user) throw new Error('Invalid email or password');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid email or password');

  const { password: _pw, ...safeUser } = user;
  return { user: safeUser, token: signToken(safeUser) };
}

module.exports = { register, login };
