// Invisible Gemini fallback for Shelly.
//
// Calls the /api/shelly serverless function (see api/shelly.js) which holds
// the Gemini API key server-side as a Vercel environment variable. The key
// never reaches the browser. On any failure (no proxy locally, network blip,
// missing env var, Gemini quota), Shelly silently falls back to her rule-based
// reply — the user never sees an error.

(function () {
  if (window.gemini) return;

  // Healthy until proven otherwise. After the first failure we stop trying,
  // so we never wait on a slow 404 again during the session.
  let healthy = true;

  function isReady() { return healthy; }

  // Compact text snapshot of the user's live data — fed into the system prompt.
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

  // Build last N turns from the persisted Shelly chat as { role, parts } pairs
  // for Gemini's `contents` array. Strips HTML so the model sees clean text.
  function buildHistory(limit) {
    if (!window.db) return [];
    const chat = db.get().shellyChat || [];
    // Take the last 10 messages (≈5 exchanges) but never include the one we're
    // about to send — that gets appended on the server.
    const recent = chat.slice(-Math.max(0, limit || 10));
    const turns = [];
    let lastRole = null;
    for (const m of recent) {
      const role = m.from === 'user' ? 'user' : 'model';
      const text = String(m.text || '').replace(/<[^>]+>/g, '').trim();
      if (!text) continue;
      // Gemini requires alternating user/model — merge consecutive same-role
      if (lastRole === role && turns.length) {
        turns[turns.length - 1].parts[0].text += '\n' + text;
      } else {
        turns.push({ role: role, parts: [{ text: text }] });
        lastRole = role;
      }
    }
    // contents must start with user; drop leading model messages
    while (turns.length && turns[0].role !== 'user') turns.shift();
    return turns;
  }

  async function ask(query, options) {
    if (!healthy) throw new Error('proxy-marked-unhealthy');
    const includeHistory = !options || options.includeHistory !== false;
    try {
      const res = await fetch('/api/shelly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          context: buildContext(),
          history: includeHistory ? buildHistory(10) : [],
        }),
      });
      if (!res.ok) {
        // 404 (no function deployed) or 500 (no env var) — disable for this session
        if (res.status === 404 || res.status === 500) healthy = false;
        const j = await res.json().catch(function () { return {}; });
        throw new Error('proxy-' + res.status + ':' + (j.error || ''));
      }
      const json = await res.json();
      if (json.error) throw new Error('proxy-error:' + json.error);
      return json.text;
    } catch (e) {
      // Network errors, JSON parse errors, etc. — disable so we don't keep retrying.
      if (/Failed to fetch|NetworkError/.test(String(e))) healthy = false;
      throw e;
    }
  }

  window.gemini = { isReady: isReady, ask: ask };
})();
