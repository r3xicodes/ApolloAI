const { Redis } = require('@upstash/redis');
const { verifyTokenFromHeader } = require('./_auth');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

    const auth = req.headers.authorization;
    let payload;
    try { payload = verifyTokenFromHeader(auth); } catch (err) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const body = req.body || {};
    const allowed = ['firstName', 'lastName', 'institution', 'major'];
    const updates = {};
    for (const k of allowed) if (k in body) updates[k] = body[k];

    if (Object.keys(updates).length === 0) return res.status(400).json({ ok: false, error: 'no updatable fields provided' });

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
      const raw = await redis.get('apolloai:users');
      const users = raw ? JSON.parse(raw) : [];
      const idx = users.findIndex(u => u.id === payload.id || u.email === payload.email);
      if (idx === -1) return res.status(404).json({ ok: false, error: 'user not found' });
      for (const k in updates) users[idx][k] = updates[k];
      await redis.set('apolloai:users', JSON.stringify(users));
      const safe = Object.assign({}, users[idx]); delete safe.password;
      return res.json({ ok: true, user: safe });
    }

    return res.status(500).json({ ok: false, error: 'persistence not configured' });
  } catch (err) { console.error('update-profile error', err); res.status(500).json({ ok: false, error: String(err) }); }
};
