const { Redis } = require('@upstash/redis');
const { verifyTokenFromHeader } = require('./_auth');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

    // verify admin
    const auth = req.headers.authorization;
    let payload;
    try {
      payload = verifyTokenFromHeader(auth);
    } catch (err) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    if (payload.role !== 'admin') return res.status(403).json({ ok: false, error: 'forbidden' });

    const { id, email, role } = req.body || {};
    if (!id && !email) return res.status(400).json({ ok: false, error: 'id or email required' });
    if (!role) return res.status(400).json({ ok: false, error: 'role required' });

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
      const raw = await redis.get('apolloai:users');
      const users = raw ? JSON.parse(raw) : [];
      const idx = users.findIndex(u => (id && u.id === id) || (email && u.email === email));
      if (idx === -1) return res.status(404).json({ ok: false, error: 'user not found' });
      users[idx].role = role;
      await redis.set('apolloai:users', JSON.stringify(users));
      const safe = Object.assign({}, users[idx]); delete safe.password;
      return res.json({ ok: true, user: safe });
    }

    return res.status(500).json({ ok: false, error: 'persistence not configured' });
  } catch (err) {
    console.error('update-user error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
};
