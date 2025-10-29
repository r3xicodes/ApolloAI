const { initializeApp } = require('firebase/app');
const { getVertexAI, getGenerativeModel } = require('firebase/vertex-ai-preview');

// Optional: If you want LLM-backed planning, set AI_API_URL and AI_API_KEY in environment.
const fetch = global.fetch || require('node-fetch');

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

let app;
let vertex;
if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  vertex = getVertexAI(app);
}

const { DateTime } = (() => {
  try { return require('luxon'); } catch (e) { return {}; }
})();

/**
 * Simple heuristic planner for assignment scheduling.
 * Inputs:
 *  - assignment: { title, dueDate, estimatedHours, priority }
 *  - userProfile: (optional) { peakHours: [14,15], timezone }
 *  - existingAssignments: array of assignments with scheduled slots (optional)
 *
 * Output: { slots: [{ startISO, durationHours, note }], note }
 */

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function generateSlots(assignment, userProfile = {}, existing = []) {
  // Use luxon-free fallback if luxon absent
  const due = new Date(assignment.dueDate);
  const now = new Date();
  const estHours = Math.max(0.5, (assignment.estimatedHours || 1));

  // chunk size in hours
  const chunk = estHours >= 3 ? 1 : 0.5;

  const slots = [];
  let remaining = estHours;

  // simple availability windows to prefer: peak 14-16, evening 18-21, morning 9-11
  const preferredWindows = [ [14,16], [18,21], [9,11] ];

  // Start scheduling from today up to the day before due date
  const lastDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // ensure we schedule at least one day before due if time allows
  while (remaining > 0 && cursor <= lastDay) {
    // try preferred windows for this day
    for (const win of preferredWindows) {
      if (remaining <= 0) break;
      const startHour = win[0];
      const endHour = win[1];

      // choose hour slots inside window
      for (let h = startHour; h < endHour && remaining > 0; h += chunk) {
        // create a candidate Date at hour h
        const slotStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), Math.floor(h), Math.round((h % 1) * 60), 0);

        // don't schedule in the past
        if (slotStart <= now) continue;

        // naive conflict check against existing assignment due dates (not full calendar integration)
        const conflict = existing.some(a => {
          const d = new Date(a.dueDate || a.date || a.start);
          return Math.abs(d - slotStart) < 1000 * 60 * 60 * 2; // within 2 hours
        });
        if (conflict) continue;

        const duration = Math.min(chunk, remaining);
        slots.push({ startISO: slotStart.toISOString(), durationHours: duration, note: 'Suggested study slot' });
        remaining = Math.round((remaining - duration) * 100) / 100;
      }
    }

    // move to next day
    cursor.setDate(cursor.getDate() + 1);
  }

  const note = remaining > 0 ? 'Not enough free slots before due date — consider extending available time or increasing daily study.' : 'Planned successfully.';

  return { slots, remainingHours: remaining, note };
}

async function generateSlotsWithOptionalLLM(assignment, userProfile = {}, existing = []) {
  if (vertex) {
    try {
      const model = getGenerativeModel(vertex, { model: "gemini-pro" });
      const prompt = `You are a scheduling assistant. Given this assignment object and the user's existing assignments, return a JSON object with a key \"plan\" that contains { slots: [{startISO:string, durationHours:number, note:string}], note:string }.\n\nAssignment: ${JSON.stringify(assignment)}\nExistingAssignments: ${JSON.stringify(existing.slice(0,20))}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.plan) return parsed.plan;
          return parsed;
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.warn('Firebase AI planner failed, falling back to heuristic:', err);
    }
  }

  // fallback to heuristic
  return generateSlots(assignment, userProfile, existing);
}

module.exports = { generateSlots, generateSlotsWithOptionalLLM };
