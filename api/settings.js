const { Redis } = require('@upstash/redis');
const { verifyTokenFromHeader } = require('./_auth');

module.exports = async (req, res) => {
  try {
    const method = req.method;
    const auth = req.headers.authorization;
    let payload;
    try { payload = verifyTokenFromHeader(auth); } catch (err) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return res.status(500).json({ ok: false, error: 'persistence not configured' });
    }

    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    const key = `apolloai:settings:${payload.id}`;

    if (method === 'GET') {
      const raw = await redis.get(key);
      const settings = raw ? JSON.parse(raw) : {};
      return res.json({ ok: true, settings });
    }

    if (method === 'POST') {
      const body = req.body || {};
      await redis.set(key, JSON.stringify(body));
      return res.json({ ok: true, settings: body });
    }

    return res.status(405).json({ ok: false, error: 'method not allowed' });
  } catch (err) { console.error('settings error', err); res.status(500).json({ ok: false, error: String(err) }); }
};
