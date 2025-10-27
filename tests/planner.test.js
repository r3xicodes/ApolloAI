const assert = require('assert');
const { generateSlots } = require('../ai/planner');

function isoHoursFromNow(hours) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function testHappyPath() {
  const due = new Date();
  due.setDate(due.getDate() + 3); // due in 3 days
  const assignment = { title: 'Essay', dueDate: due.toISOString(), estimatedHours: 2 };
  const plan = generateSlots(assignment, {}, []);
  assert.ok(plan.slots && plan.slots.length > 0, 'Expected at least one slot for a 2-hour assignment due in 3 days');
  assert.strictEqual(typeof plan.remainingHours, 'number');
}

function testTightDeadline() {
  const due = new Date();
  due.setHours(due.getHours() + 1); // due in 1 hour
  const assignment = { title: 'Quick', dueDate: due.toISOString(), estimatedHours: 2 };
  const plan = generateSlots(assignment, {}, []);
  // likely not enough time
  assert.ok(plan.remainingHours > 0, 'Expected remainingHours > 0 for an impossible deadline');
}

function runAll() {
  console.log('Running planner tests...');
  testHappyPath();
  console.log(' - happy path passed');
  testTightDeadline();
  console.log(' - tight deadline passed');
  console.log('All planner tests passed.');
}

module.exports = { runAll };
