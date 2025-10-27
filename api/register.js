// Demo register endpoint for Vercel serverless deployment.
// Stateless: does not persist users. For production, wire to a DB (Supabase, Fauna, Upstash, etc.).
const { Redis } = require('@upstash/redis');
const { hashPassword, signToken } = require('./_auth');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

    const { email, password, firstName, lastName, role } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: 'email and password required' });
    // Hash password
    const hashed = hashPassword(password);
    const user = { id: Date.now(), email, password: hashed, firstName, lastName, role: role || 'student', createdAt: new Date().toISOString() };

    // Persist user to Redis if configured
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
        const raw = await redis.get('apolloai:users');
        const users = raw ? JSON.parse(raw) : [];
        users.push(user);
        await redis.set('apolloai:users', JSON.stringify(users));
      } catch (err) {
        console.warn('Redis persist user failed:', err);
      }
    }

    const safe = Object.assign({}, user);
    delete safe.password;
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return res.json({ ok: true, user: safe, token });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
};
