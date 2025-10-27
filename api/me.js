const { Redis } = require('@upstash/redis');
const { verifyTokenFromHeader } = require('./_auth');

module.exports = async (req, res) => {
  try {
    const auth = req.headers.authorization;
    let payload;
    try {
      payload = verifyTokenFromHeader(auth);
    } catch (err) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
      const raw = await redis.get('apolloai:users');
      const users = raw ? JSON.parse(raw) : [];
      const user = users.find(u => u.id === payload.id || u.email === payload.email);
      if (!user) return res.status(404).json({ ok: false, error: 'user not found' });
      const safe = Object.assign({}, user); delete safe.password;
      return res.json({ ok: true, user: safe });
    }

    return res.status(500).json({ ok: false, error: 'persistence not configured' });
  } catch (err) {
    console.error('me error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
};
