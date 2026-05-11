// scripts/test-shelly-gemini.mjs
//
// Smoke-tests the Gemini fallback the same way the deployed serverless function
// will call it: same system prompt, same model, same generation config, with a
// realistic context snapshot. Verifies that:
//   1. The key works.
//   2. In-scope queries get useful, brief, tutor-platform answers.
//   3. Out-of-scope queries get the canned refusal.
//
// Run:   node scripts/test-shelly-gemini.mjs
// Needs: GEMINI_API_KEY in ../.env.local (already in place per the README).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ───────── Load .env.local ─────────
const envPath = join(__dirname, '..', '.env.local');
let key = '';
try {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim();
    if (k === 'GEMINI_API_KEY') key = v;
  }
} catch {}

if (!key || !key.startsWith('AIzaSy')) {
  console.error('\n❌ No valid GEMINI_API_KEY found in .env.local');
  console.error('   Expected format: AIzaSy… (39 chars total)');
  process.exit(1);
}

console.log('✓ key loaded (length=' + key.length + ', prefix=' + key.slice(0, 8) + '…)\n');

// ───────── Replicated from api/shelly.js ─────────
const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT_BASE = [
  "You are Shelly the Super 🦸‍♀️ — a warm, brief, practical AI sidekick for tutors on Super Sheldon (a Tutor Management Software / TMS).",
  "",
  "## STRICT SCOPE — you ONLY help with:",
  "- Tutor business: scheduling sessions, credits, billing, top-ups, analytics, revenue",
  "- Learners/students: progress, profiles, at-risk status, attendance",
  "- Parents and instructors: communication, drafting messages, follow-ups",
  "- Course content: lessons, certificates, group/recorded/1:1 courses",
  "- Platform how-tos: where features live, how to use them",
  "- Best practices for tutoring: engagement, parent comms, scheduling tips",
  "",
  "## REFUSE off-topic queries firmly but kindly:",
  "If asked anything NOT in scope (general world knowledge, math homework help, coding, news, politics, personal opinions, anything outside running a tutoring business on this platform), reply with a single short sentence: \"I'm just here for your tutoring work — anything I can help with on Super Sheldon?\" Then stop.",
  "",
  "## PERSONALITY:",
  "- Warm, casual, occasionally lowercase. Never stiff or corporate.",
  "- BRIEF. 2–4 short sentences. Max 2 short paragraphs.",
  "- Practical. Specific advice using REAL numbers from the context below.",
  "- Use HTML for emphasis: <strong>x</strong>, <em>x</em>, <code>x</code>. The UI renders HTML, NOT markdown. No **bold** or `backticks`.",
  "- Occasional emoji is fine (🌟 💜 ⏰ 💳). Don't overdo it.",
  "- Never pretend you performed an action. If the user asks you to do something, suggest the matching slash command instead.",
  "",
  "## SLASH COMMANDS YOU CAN POINT THEM TO:",
  "- <code>/topup plus</code> · <code>/schedule [name]</code> · <code>/draft [name]</code>",
  "- <code>/summary</code> · <code>/risk</code> · <code>/credits</code> · <code>/today</code>",
  "- <code>/remember [text]</code> · <code>/remind [text] in 15m</code>",
  "- <code>/go chats|store|progress|analytics|users|notifications</code>",
].join('\n');

const SAMPLE_CONTEXT = `## Current user
- Name: Ekta Jha
- Plan: Plus

## Live numbers
- Credit balance: 12
- Active students: 6
- Upcoming sessions: 12
- Next session: Ekta test at Mon, May 11, 6:30 PM
- Unread chats: 4
- Unread notifications: 3
- At-risk learners (<50%): Yash Sandhu (38%), Janishaa (44%)

## Notes the user told Shelly to remember
- (none yet)`;

const SYSTEM_PROMPT = SYSTEM_PROMPT_BASE + '\n\n## LIVE CONTEXT — real data about THIS user RIGHT NOW:\n' + SAMPLE_CONTEXT + '\n\nUse these real numbers. Never invent stats.';

// ───────── Test cases ─────────
const REFUSAL = "I'm just here for your tutoring work";

const TESTS = [
  // In-scope
  { name: 'IN-SCOPE — live numbers',     query: 'how many credits do I have left?',                     mustInclude: ['12'], mustNotInclude: [REFUSAL] },
  { name: 'IN-SCOPE — at-risk learners', query: "who's struggling right now?",                          mustInclude: ['Yash', 'Janishaa'], mustNotInclude: [REFUSAL] },
  { name: 'IN-SCOPE — tutor advice',     query: 'how do I keep a disengaged kid coming back?',          mustInclude: [], mustNotInclude: [REFUSAL] },
  { name: 'IN-SCOPE — action ask',       query: 'top up my plan please',                                 mustInclude: ['/topup'], mustNotInclude: [REFUSAL] },
  { name: 'IN-SCOPE — parent comms',     query: 'help me reply to a parent whose kid keeps missing sessions', mustInclude: [], mustNotInclude: [REFUSAL] },
  // OUT-OF-SCOPE
  { name: 'OUT — world knowledge',       query: 'what is the capital of france?',                       mustInclude: [REFUSAL], mustNotInclude: ['Paris'] },
  { name: 'OUT — coding help',           query: 'fix my python: print(hello)',                          mustInclude: [REFUSAL], mustNotInclude: ['print("hello"'] },
  { name: 'OUT — personal advice',       query: 'should I quit my job and become a chef?',              mustInclude: [REFUSAL], mustNotInclude: [] },
  { name: 'OUT — news',                  query: "what's happening in the stock market today?",          mustInclude: [REFUSAL], mustNotInclude: [] },
];

async function ask(query) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + encodeURIComponent(key);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: query }] }],
      generationConfig: { temperature: 0.6, topP: 0.9, maxOutputTokens: 380, responseMimeType: 'text/plain' },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    }),
  });
  if (!res.ok) {
    return { error: 'HTTP ' + res.status + ': ' + (await res.text()).slice(0, 200) };
  }
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts;
  const text = (parts && parts[0] && parts[0].text) || '';
  return { text: text.trim() };
}

// ───────── Run ─────────
let pass = 0, fail = 0;
for (const t of TESTS) {
  process.stdout.write('• ' + t.name.padEnd(36) + ' … ');
  const r = await ask(t.query);
  if (r.error) {
    console.log('✗ FAILED — ' + r.error);
    fail++; continue;
  }
  const text = r.text;
  const missing = (t.mustInclude || []).filter(s => !text.toLowerCase().includes(s.toLowerCase()));
  const present = (t.mustNotInclude || []).filter(s => text.toLowerCase().includes(s.toLowerCase()));
  const ok = missing.length === 0 && present.length === 0;
  console.log(ok ? '✓' : '✗');
  console.log('  Q: ' + t.query);
  console.log('  A: ' + text.replace(/\n/g, '\n     '));
  if (missing.length) console.log('  ⚠ missing expected: ' + missing.join(', '));
  if (present.length) console.log('  ⚠ contains forbidden: ' + present.join(', '));
  console.log('');
  ok ? pass++ : fail++;
}

console.log('━'.repeat(50));
console.log(pass + ' passed, ' + fail + ' failed (' + TESTS.length + ' total)');
process.exit(fail > 0 ? 1 : 0);
