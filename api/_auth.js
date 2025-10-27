const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || process.env.VERCEL_JWT_SECRET || 'dev-secret-change-me';
const JWT_EXP = process.env.JWT_EXP || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXP });
}

function verifyTokenFromHeader(authHeader) {
  if (!authHeader) throw new Error('missing auth header');
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') throw new Error('invalid auth header');
  const token = parts[1];
  return jwt.verify(token, JWT_SECRET);
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hashed) {
  return bcrypt.compareSync(password, hashed);
}

module.exports = { signToken, verifyTokenFromHeader, hashPassword, comparePassword };
