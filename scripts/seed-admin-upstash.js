#!/usr/bin/env node
/**
 * One-time script to seed an admin user into Upstash Redis for the serverless API.
 * Usage (PowerShell):
 *   $env:UPSTASH_REDIS_REST_URL='https://...'
 *   $env:UPSTASH_REDIS_REST_TOKEN='...'
 *   $env:JWT_SECRET='your-jwt-secret'
 *   node scripts/seed-admin-upstash.js --email admin@apollo.local --password secret123 --first Site --last Admin
 */

const { Redis } = require('@upstash/redis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function usageAndExit() {
  console.log('Usage: node scripts/seed-admin-upstash.js --email <email> --password <password> [--first <firstName>] [--last <lastName>]');
  process.exit(1);
}

const argv = require('minimist')(process.argv.slice(2));
const email = argv.email;
const password = argv.password;
const firstName = argv.first || 'Site';
const lastName = argv.last || 'Admin';

if (!email || !password) usageAndExit();

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const jwtSecret = process.env.JWT_SECRET;

if (!url || !token || !jwtSecret) {
  console.error('Missing required environment variables. Set UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, and JWT_SECRET');
  process.exit(2);
}

(async () => {
  try {
    const redis = new Redis({ url, token });

    // read existing users
    const raw = await redis.get('apolloai:users');
    const users = raw ? JSON.parse(raw) : [];

    if (users.find(u => u.email === email)) {
      console.log('User already exists with that email. Aborting.');
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now(),
      email,
      password: hashed,
      firstName,
      lastName,
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    users.push(user);
    await redis.set('apolloai:users', JSON.stringify(users));

    const safe = Object.assign({}, user);
    delete safe.password;
    const tokenJwt = jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '30d' });

    console.log('Admin user seeded successfully.');
    console.log('Safe user object:', safe);
    console.log('Admin JWT (store this securely):', tokenJwt);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();
