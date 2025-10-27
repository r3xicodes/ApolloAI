const { generateSlotsWithOptionalLLM } = require('../ai/planner');
const { Redis } = require('@upstash/redis');

// Vercel serverless function: /api/assignments
// This endpoint accepts an assignment, persists it to Redis if configured, and returns a planner suggestion.
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const assignment = req.body;
      if (!assignment || !assignment.title) return res.status(400).json({ ok: false, error: 'assignment object required' });

      // Assign a temporary id for client-side use
      assignment.id = assignment.id || Date.now();
      assignment.createdAt = new Date().toISOString();

      // If Upstash environment variables are present, persist the assignment list under key 'apolloai:assignments'
      let existing = [];
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        try {
          const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
          const raw = await redis.get('apolloai:assignments');
          existing = raw ? JSON.parse(raw) : [];
          existing.push(assignment);
          await redis.set('apolloai:assignments', JSON.stringify(existing));
        } catch (err) {
          console.warn('Redis persist failed:', err);
        }
      }

      // Generate a plan (prefer LLM if configured)
      const plan = await generateSlotsWithOptionalLLM(assignment, {}, existing);

      // Return the assignment and the plan. Persistence optional via Redis.
      return res.json({ ok: true, assignment, plan });
    }

    // If GET, return stored assignments (protected: teacher/admin)
    if (req.method === 'GET') {
      // verify auth and role
      const auth = req.headers.authorization;
      let payload;
      try {
        const { verifyTokenFromHeader } = require('./_auth');
        payload = verifyTokenFromHeader(auth);
      } catch (err) {
        return res.status(401).json({ ok: false, error: 'unauthorized' });
      }

      // allow teacher or admin
      if (!payload || (payload.role !== 'admin' && payload.role !== 'teacher')) return res.status(403).json({ ok: false, error: 'forbidden' });

      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        try {
          const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
          const raw = await redis.get('apolloai:assignments');
          const items = raw ? JSON.parse(raw) : [];
          return res.json(items);
        } catch (err) {
          console.warn('Redis read assignments failed:', err);
        }
      }

      return res.json([]);
    }

    return res.status(405).json({ ok: false, error: 'method not allowed' });
  } catch (err) {
    console.error('assignments error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
};
