// Invisible Gemini fallback for Shelly.
//
// Used silently when Shelly's rule-based router can't match a query.
// The user never sees a "Connect Gemini" button — to them, Shelly just answers.
//
// =====================================================================
//   DROP YOUR API KEY HERE (one line). Get one at:
//   https://aistudio.google.com/app/apikey  — free tier is generous.
// =====================================================================
const GEMINI_KEY = '';
const GEMINI_MODEL = 'gemini-2.5-flash'; // fast + cheap, ideal for chat fallback
// =====================================================================
//
// SECURITY NOTE — since this file ships in your static bundle, the key is
// readable by anyone who views the page source. That's fine for personal
// demos / dev. For a real production deployment, replace this file with
// a tiny serverless proxy (Vercel/Cloudflare Workers) so the key stays
// on the server. The rest of the code already expects a fetch() call,
// so the swap is one line.
// =====================================================================

(function () {
  if (window.gemini) return;

  function isReady() { return GEMINI_KEY && GEMINI_KEY.length > 10; }

  // Compact snapshot of the user's data — fed to Gemini as live context.
  function buildContext() {
    if (!window.db) return '';
    const d = db.get();
    const me = d.me || {};
    const students = (d.users || []).filter(function (u) { return u.role === 'student'; });
    const atRisk = students.filter(function (s) { return (s.progress || 0) < 50; });
    const upcoming = (d.sessions || []).filter(function (s) { return s.status === 'upcoming'; }).sort(function (a, b) { return a.startsAt.localeCompare(b.startsAt); });
    const nextSession = upcoming[0];
    const nextStudent = nextSession ? ((d.users.find(function (u) { return u.id === (nextSession.studentIds || [])[0]; }) || {}).name || '—') : null;
    const unreadChats = (d.chats || []).reduce(function (a, c) { return a + (c.unread || 0); }, 0);
    const unreadNotifs = (d.notifications || []).filter(function (n) { return !n.read; }).length;
    return [
      '## Current user',
      '- Name: ' + (me.name || 'Teacher'),
      '- Plan: ' + (me.plan || 'Plus'),
      '',
      '## Live numbers',
      '- Credit balance: ' + ((d.credits || {}).balance || 0),
      '- Active students: ' + students.length,
      '- Upcoming sessions: ' + upcoming.length,
      '- Next session: ' + (nextSession ? (nextStudent + ' at ' + new Date(nextSession.startsAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) : 'none'),
      '- Unread chats: ' + unreadChats,
      '- Unread notifications: ' + unreadNotifs,
      '- At-risk learners (<50%): ' + (atRisk.length ? atRisk.map(function (s) { return s.name + ' (' + s.progress + '%)'; }).join(', ') : 'none'),
      '',
      '## Notes the user told Shelly to remember',
      ((d.shellyNotes || []).slice(0, 8).map(function (n) { return '- ' + n.text; }).join('\n') || '- (none yet)'),
    ].join('\n');
  }

  const SYSTEM_PROMPT = function () { return [
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
    "- Never pretend you performed an action. If the user asks you to do something, suggest the slash command and stop.",
    "",
    "## SLASH COMMANDS YOU CAN POINT THEM TO:",
    "- <code>/topup plus</code> · <code>/schedule [name]</code> · <code>/draft [name]</code>",
    "- <code>/summary</code> · <code>/risk</code> · <code>/credits</code> · <code>/today</code>",
    "- <code>/remember [text]</code> · <code>/remind [text] in 15m</code>",
    "- <code>/go chats|store|progress|analytics|users|notifications</code>",
    "",
    "## LIVE CONTEXT — real data about THIS user RIGHT NOW:",
    buildContext(),
    "",
    "Use these real numbers. Never invent stats. If something isn't in context, say you don't know or suggest where to find it.",
  ].join('\n'); };

  async function ask(query) {
    if (!isReady()) throw new Error('gemini-not-configured');
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(GEMINI_MODEL) + ':generateContent?key=' + encodeURIComponent(GEMINI_KEY);
    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT() }] },
      contents: [{ role: 'user', parts: [{ text: query }] }],
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        maxOutputTokens: 380,
        responseMimeType: 'text/plain',
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',         threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_ONLY_HIGH' },
      ],
    };
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('gemini-http-' + res.status);
    const json = await res.json();
    const parts = (((json.candidates || [])[0] || {}).content || {}).parts;
    const out = (parts && parts[0] && parts[0].text) || '';
    if (!out) throw new Error('gemini-empty-response');
    return out.trim();
  }

  // Internal — no UI ever surfaces this. Shelly checks isReady() silently.
  window.gemini = { isReady: isReady, ask: ask };
})();
