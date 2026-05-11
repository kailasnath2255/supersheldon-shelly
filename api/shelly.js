// Vercel Serverless Function — /api/shelly
//
// Browser-side Shelly calls this when her rule-based router can't match.
// We forward to Google Gemini with a tightly-scoped system prompt and the
// user's live data context. The API key lives ONLY here, as an environment
// variable on Vercel — it never reaches the browser.
//
// Setup (one time):
//   1. Vercel dashboard → Project → Settings → Environment Variables
//   2. Add: GEMINI_API_KEY = <your key from aistudio.google.com/app/apikey>
//   3. Redeploy
//
// That's it. The frontend code is unchanged.

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

export default async function handler(req, res) {
  // CORS — same-origin in production but be friendly for local dev too
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('[shelly] GEMINI_API_KEY not set in environment');
    return res.status(500).json({ error: 'not-configured' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const query = body && body.query;
  const context = (body && body.context) || '';

  if (!query || typeof query !== 'string') return res.status(400).json({ error: 'missing-query' });
  if (query.length > 1500)                  return res.status(400).json({ error: 'query-too-long' });
  if (context.length > 8000)                return res.status(400).json({ error: 'context-too-long' });

  const systemPrompt = SYSTEM_PROMPT_BASE + '\n\n## LIVE CONTEXT — real data about THIS user RIGHT NOW:\n' + context + '\n\nUse these real numbers. Never invent stats.';

  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(MODEL) + ':generateContent?key=' + encodeURIComponent(key);
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: query }] }],
        generationConfig: {
          temperature: 0.6,
          topP: 0.9,
          maxOutputTokens: 380,
          responseMimeType: 'text/plain',
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    });
    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[shelly] gemini', upstream.status, errText.slice(0, 300));
      return res.status(502).json({ error: 'upstream-' + upstream.status });
    }
    const json = await upstream.json();
    const parts = (((json.candidates || [])[0] || {}).content || {}).parts;
    const text = (parts && parts[0] && parts[0].text) || '';
    if (!text) return res.status(502).json({ error: 'empty-response' });
    return res.status(200).json({ text: text.trim() });
  } catch (e) {
    console.error('[shelly] handler error:', e);
    return res.status(500).json({ error: 'handler-failed' });
  }
}
