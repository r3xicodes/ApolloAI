// Demo login endpoint for Vercel serverless deployment.
// Stateless: authenticates only when user info is supplied client-side. Replace with DB-backed auth for production.
const { Redis } = require('@upstash/redis');
const { comparePassword, signToken } = require('./_auth');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: 'email and password required' });

    // If Redis configured, try to validate against stored users
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
        const raw = await redis.get('apolloai:users');
        const users = raw ? JSON.parse(raw) : [];
        const user = users.find(u => u.email === email);
        if (user && comparePassword(password, user.password)) {
          const safe = Object.assign({}, user);
          delete safe.password;
          const token = signToken({ id: user.id, email: user.email, role: user.role });
          return res.json({ ok: true, user: safe, token });
        }
      } catch (err) {
        console.warn('Redis read users failed:', err);
      }
    }

    // Fallback demo response — in production, use secure auth
    const demoUser = { id: Date.now(), email, firstName: '', lastName: '', role: 'student' };
    const token = signToken({ id: demoUser.id, email: demoUser.email, role: demoUser.role });
    return res.json({ ok: true, user: demoUser, token });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
};
