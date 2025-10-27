// Helper to generate a test JWT token for smoke tests
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const generateToken = (userId = '1') => {
  // For smoke tests, we'll use a consistent secret if none provided
  const secret = process.env.JWT_SECRET || 'apollo-smoke-test-secret-do-not-use-in-production';
  return jwt.sign({ userId, role: 'admin' }, secret, { expiresIn: '1h' });
};

if (require.main === module) {
  const token = generateToken();
  console.log('Generated test token:');
  console.log(token);
  console.log('\nTo use this token:');
  console.log('1. Add to GitHub Actions:');
  console.log('   Repository → Settings → Secrets → Actions → New secret');
  console.log('   Name: SMOKE_TEST_TOKEN');
  console.log('   Value: ' + token);
  console.log('\n2. For local testing:');
  console.log('   $env:SMOKE_TEST_TOKEN="' + token + '"');
  console.log('   node scripts/smoke-test.js --base http://localhost:5500 --token "$env:SMOKE_TEST_TOKEN"');
}

module.exports = { generateToken };