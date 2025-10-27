const t = require('./planner.test');

async function main() {
  try {
    t.runAll();
    console.log('\nTests completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Tests failed:', err);
    process.exit(1);
  }
}

main();
