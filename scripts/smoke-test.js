#!/usr/bin/env node
/**
 * Simple smoke test for local demo endpoints
 * Usage: node scripts/smoke-test.js [baseUrl] [token]
 * Defaults: baseUrl=http://localhost:5500, token=1
 */
const base = process.argv[2] || process.env.BASE_URL || 'http://localhost:5500';
const token = process.argv[3] || process.env.TEST_TOKEN || '1';
const timeout = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  try {
    console.log('Smoke test base:', base);

    const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };

    console.log('GET /api/settings');
    let r = await fetch(base + '/api/settings', { headers });
    console.log('status', r.status);
    const js = await r.text();
    console.log('body:', js);

    console.log('POST /api/settings');
    const payload = { theme: 'dark', accentColor: 'blue', 'study-duration': 30 };
    r = await fetch(base + '/api/settings', { method: 'POST', headers, body: JSON.stringify(payload) });
    console.log('status', r.status);
    console.log('body:', await r.text());

    await timeout(300);

    console.log('POST /api/update-profile');
    const profile = { firstName: 'Smoke', lastName: 'Tester', institution: 'Local U', major: 'Testing' };
    r = await fetch(base + '/api/update-profile', { method: 'POST', headers, body: JSON.stringify(profile) });
    console.log('status', r.status);
    console.log('body:', await r.text());

    console.log('Smoke test finished');
  } catch (err) {
    console.error('Smoke test failed', err);
    process.exit(2);
  }
}

run();
