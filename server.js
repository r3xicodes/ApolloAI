const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { generateSlots } = require('./ai/planner');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limit initialization - must be before route definitions
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many auth attempts, please try again later.'
});
app.use(cors());
app.use(bodyParser.json());

// serve static frontend files from repo root
app.use(express.static(path.join(__dirname)));

// simple file store for demo assignments
const DATA_DIR = path.join(__dirname, 'data');
const ASSIGNMENTS_FILE = path.join(DATA_DIR, 'assignments.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

if (!fs.existsSync(ASSIGNMENTS_FILE)) fs.writeFileSync(ASSIGNMENTS_FILE, '[]');
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, '{}');

function readAssignments() {
  try {
    return JSON.parse(fs.readFileSync(ASSIGNMENTS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeAssignments(list) {
  fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(list, null, 2));
}

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeUsers(list) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2));
}

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function writeSettings(obj) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(obj, null, 2));
}

function getUserFromToken(auth) {
  if (!auth) return null;
  const m = String(auth).match(/Bearer\s+(.+)/i);
  if (!m) return null;
  const token = m[1].trim();
  const users = readUsers();
  // token can be numeric id or email for demo purposes
  let user = users.find(u => String(u.id) === token || (u.email && u.email === token));
  return user || null;
}

// API: list assignments
app.get('/api/assignments', (req, res) => {
  res.json(readAssignments());
});

// API: create assignment (saves to file and returns suggestion)
app.post('/api/assignments', (req, res) => {
  const assignment = req.body;
  const list = readAssignments();
  assignment.id = Date.now();
  assignment.createdAt = new Date().toISOString();
  list.push(assignment);
  writeAssignments(list);

  // Immediately produce a plan using the planner
  const plan = generateSlots(assignment, {}, list);
  res.json({ assignment, plan });
});

// API: ask planner for suggestions without saving
app.post('/api/suggest', (req, res) => {
  try {
    const { assignment, userProfile, existingAssignments } = req.body || {};
    const existing = existingAssignments || readAssignments();
    const plan = generateSlots(assignment, userProfile || {}, existing);
    res.json({ ok: true, plan });
  } catch (err) {
    console.error('Planner error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});


// Simple demo auth: register and login (insecure, for demo only)
app.post('/api/register', authLimiter, (req, res) => {
  const { email, password, firstName, lastName, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'email and password required' });
    const users = readUsers();
    if (users.find(u => u.email === email)) return res.status(409).json({ ok: false, error: 'user already exists' });

  const user = { id: Date.now(), email, password, firstName, lastName, role: role || 'student', createdAt: new Date().toISOString() };
    users.push(user);
  writeUsers(users);

  const safe = Object.assign({}, user);
  delete safe.password;
  res.json({ ok: true, user: safe });
});

app.post('/api/login', authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'email and password required' });

  const users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ ok: false, error: 'invalid credentials' });

  const safe = Object.assign({}, user);
  delete safe.password;
  res.json({ ok: true, user: safe });
});

// Demo: list users (no auth) — useful for admin testing locally
app.get('/api/users', (req, res) => {
  const users = readUsers().map(u => {
    const s = Object.assign({}, u);
    delete s.password;
    return s;
  });
  res.json(users);
});

// Local: update user role (demo only - no auth). In production use the serverless update endpoint with JWT.
app.post('/api/update-user', (req, res) => {
  const { id, email, role } = req.body || {};
  if (!id && !email) return res.status(400).json({ ok: false, error: 'id or email required' });
  if (!role) return res.status(400).json({ ok: false, error: 'role required' });

  const users = readUsers();
  const idx = users.findIndex(u => (id && u.id === id) || (email && u.email === email));
  if (idx === -1) return res.status(404).json({ ok: false, error: 'user not found' });
  users[idx].role = role;
  writeUsers(users);
  const safe = Object.assign({}, users[idx]); delete safe.password;
  res.json({ ok: true, user: safe });
});

// Local: get settings for authenticated demo user
app.get('/api/settings', (req, res) => {
  const auth = req.headers.authorization;
  const user = getUserFromToken(auth);
  if (!user) return res.status(401).json({ ok: false, error: 'unauthorized' });
  const settings = readSettings();
  const userSettings = settings[String(user.id)] || {};
  res.json({ ok: true, settings: userSettings });
});

// Local: update settings for demo user
app.post('/api/settings', (req, res) => {
  const auth = req.headers.authorization;
  const user = getUserFromToken(auth);
  if (!user) return res.status(401).json({ ok: false, error: 'unauthorized' });
  const body = req.body || {};
  const settings = readSettings();
  settings[String(user.id)] = body;
  writeSettings(settings);
  res.json({ ok: true, settings: body });
});

// Local: update-profile (mirrors serverless behavior)
app.post('/api/update-profile', (req, res) => {
  const auth = req.headers.authorization;
  const user = getUserFromToken(auth);
  if (!user) return res.status(401).json({ ok: false, error: 'unauthorized' });
  const body = req.body || {};
  const allowed = ['firstName', 'lastName', 'institution', 'major'];
  const updates = {};
  for (const k of allowed) if (k in body) updates[k] = body[k];
  if (Object.keys(updates).length === 0) return res.status(400).json({ ok: false, error: 'no updatable fields provided' });
  const users = readUsers();
  const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'user not found' });
  for (const k in updates) users[idx][k] = updates[k];
  writeUsers(users);
  const safe = Object.assign({}, users[idx]); delete safe.password;
  res.json({ ok: true, user: safe });
});

app.listen(PORT, () => {
  console.log(`ApolloAI server running on http://localhost:${PORT}`);
});
