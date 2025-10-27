const { generateSlotsWithOptionalLLM } = require('../ai/planner');
const { Redis } = require('@upstash/redis');

// Vercel serverless function: /api/suggest
module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

    const { assignment, userProfile, existingAssignments } = req.body || {};
    if (!assignment) return res.status(400).json({ ok: false, error: 'assignment required' });

    // If Redis is configured, load existing assignments to give the planner some context
    let existing = existingAssignments || [];
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
        const raw = await redis.get('apolloai:assignments');
        existing = raw ? JSON.parse(raw) : existing;
      } catch (err) {
        console.warn('Redis read failed:', err);
      }
    }

    const plan = await generateSlotsWithOptionalLLM(assignment, userProfile || {}, existing || []);
    return res.json({ ok: true, plan });
  } catch (err) {
    console.error('suggest error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
};
