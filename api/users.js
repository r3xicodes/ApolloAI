const { Redis } = require('@upstash/redis');
const { verifyTokenFromHeader } = require('./_auth');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });

    // require admin
    const auth = req.headers.authorization;
    let payload;
    try {
      payload = verifyTokenFromHeader(auth);
    } catch (err) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    if (payload.role !== 'admin') return res.status(403).json({ ok: false, error: 'forbidden' });

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
        const raw = await redis.get('apolloai:users');
        const users = raw ? JSON.parse(raw) : [];
        // remove passwords
        const safe = users.map(u => { const s = Object.assign({}, u); delete s.password; return s; });
        return res.json(safe);
      } catch (err) {
        console.warn('Redis read users failed:', err);
      }
    }

    return res.json([]);
  } catch (err) {
    console.error('users error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
};
