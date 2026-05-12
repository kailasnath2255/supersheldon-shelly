// Super Sheldon — single source of truth. Ships with the bundle, seeds every
// device the same way, persists user edits in localStorage (per-device).
// Pages read via db.get() and mutate via db.update(). Subscribe for re-renders.
(function () {
  if (window.db) return;
  const KEY = 'ss_data_v2';
  const VERSION = 2;

  const SEED = {
    version: VERSION,
    me: {
      id: 'me', name: 'Ekta Jha', role: 'Admin',
      email: 'ekta.jha@supersheldon.com', phone: '+91 96618 37016',
      avatar: 'E', color: '#0ea5e9', plan: 'Plus',
    },

    users: [
      { id: 'u-ekta',    name: 'Ekta test',     role: 'student',    email: '+91 96618 37016',    avatar: 'E', color: '#7c3aed', active: '2 minutes ago', status: 'active',   progress: 78, sessionsAttended: 14, sessionsTotal: 18, parent: 'Neha Aadya',   city: 'Bangalore', school: 'DAV',                courseId: 'c-ekta',    enrolled: '2026-04-26' },
      { id: 'u-aadya',   name: 'Aadya',         role: 'student',    email: 'aadya.k@gmail.com',  avatar: 'A', color: '#f97316', active: '1 hour ago',     status: 'active',   progress: 62, sessionsAttended:  9, sessionsTotal: 15, parent: 'Neha Aadya',   city: 'Mumbai',     school: 'Cathedral',          courseId: 'c-aadya',   enrolled: '2025-11-12' },
      { id: 'u-yash',    name: 'Yash Sandhu',   role: 'student',    email: 'rajiv@parent.com',   avatar: 'Y', color: '#16a34a', active: '2 weeks ago',    status: 'inactive', progress: 38, sessionsAttended:  5, sessionsTotal: 14, parent: 'Rajiv Sandhu', city: 'Manchester', school: 'St. Margaret Mary',  courseId: 'c-yash',    enrolled: '2025-02-08' },
      { id: 'u-mivaan',  name: 'Mivaan',        role: 'student',    email: '+1 415 555 9912',    avatar: 'M', color: '#ef4444', active: 'Yesterday',      status: 'active',   progress: 84, sessionsAttended: 21, sessionsTotal: 25, parent: 'Karan M.',     city: 'Sydney',     school: 'Lakeview Primary',   courseId: 'c-mivaan',  enrolled: '2025-04-26' },
      { id: 'u-janishaa',name: 'Janishaa',      role: 'student',    email: 'janishaa@gmail.com', avatar: 'J', color: '#a855f7', active: '1 week ago',     status: 'inactive', progress: 44, sessionsAttended:  4, sessionsTotal:  9, parent: 'Priya J.',     city: 'London',     school: 'Greenfield Academy', courseId: 'c-janishaa',enrolled: '2025-02-18' },
      { id: 'u-adriana', name: 'Adriana',       role: 'student',    email: 'adriana.s@gmail.com',avatar: 'A', color: '#0ea5e9', active: 'Today',          status: 'active',   progress: 91, sessionsAttended: 32, sessionsTotal: 35, parent: 'Maria S.',     city: 'New York',   school: 'Brooklyn Heights',   courseId: 'c-eng',     enrolled: '2025-09-04' },
      { id: 'u-neha',    name: 'Neha Aadya',    role: 'parent',     email: 'neha@gmail.com',     avatar: 'N', color: '#2563eb', active: '3 hours ago',    status: 'active',   linkedTo: ['u-aadya'] },
      { id: 'u-rajiv',   name: 'Rajiv Sandhu',  role: 'parent',     email: 'rajiv@gmail.com',    avatar: 'R', color: '#1e2130', active: '5 hours ago',    status: 'active',   linkedTo: ['u-yash'] },
      { id: 'u-priya',   name: 'Priya Menon',   role: 'instructor', email: 'priya@supersheldon.com', avatar: 'P', color: '#8b5cf6', active: '30 min ago', status: 'active', rating: 4.8, sessions: 108, retention: 91 },
      { id: 'u-arjun',   name: 'Arjun Iyer',    role: 'instructor', email: 'arjun@supersheldon.com', avatar: 'A', color: '#6366f1', active: '1 hour ago', status: 'active', rating: 4.7, sessions:  62, retention: 88 },
      { id: 'u-admin',   name: 'Sheldon HQ',    role: 'admin',      email: 'admin@supersheldon.com', avatar: 'S', color: '#f59e0b', active: 'Today',      status: 'active' },
    ],

    courses: [
      { id: 'c-ekta',     name: 'Ekta test',           code: 'IN-1001-Ekta-0526-Coding-1',     type: '1on1', topic: 'Coding',    icon: '💻', color: '#f3e8ff', studentIds: ['u-ekta'],    creditsRemaining: 12, creditsTotal: 18 },
      { id: 'c-mivaan',   name: 'Mivaan',              code: 'AUS-3925-Mivaan-0426-Coding-4',  type: '1on1', topic: 'Coding',    icon: '📘', color: '#dbeafe', studentIds: ['u-mivaan'],  creditsRemaining:  9, creditsTotal: 25 },
      { id: 'c-janishaa', name: 'Janishaa',            code: 'UK-6038-Janisha-0226-Reasoning-3', type: '1on1', topic: 'Reasoning', icon: '📚', color: '#fef9c3', studentIds: ['u-janishaa'], creditsRemaining: 8, creditsTotal: 12 },
      { id: 'c-yash',     name: 'Yash Sandhu',         code: 'UK-9297-Yash-0226-Coding-7',     type: '1on1', topic: 'Coding',    icon: '🔬', color: '#dcfce7', studentIds: ['u-yash'],    creditsRemaining:  9, creditsTotal: 14 },
      { id: 'c-aadya',    name: 'Aadya',               code: 'UK-2058-Aadya-1125-Reasoning-4', type: '1on1', topic: 'Reasoning', icon: '✏️', color: '#fce7f3', studentIds: ['u-aadya'],   creditsRemaining: 15, creditsTotal: 24 },
      { id: 'c-eng',      name: 'English Conversation Club',  type: 'group', topic: 'Language', icon: '🗣️', color: '#ede9fe', studentCount: 31, status: 'top-rated',       schedule: 'Daily',     rating: 4.9 },
      { id: 'c-math',     name: 'Math Olympiad Prep',          type: 'group', topic: 'Math',     icon: '🧮', color: '#fef3c7', studentCount: 24, status: 'active',          schedule: 'Mon & Wed', rating: 4.8 },
      { id: 'c-python',   name: 'Coding Club – Python Beginners', type: 'group', topic: 'Coding', icon: '💻', color: '#dbeafe', studentCount: 18, status: 'active',          schedule: 'Tue & Thu', rating: 4.6 },
      { id: 'c-robot',    name: 'Junior Robotics',             type: 'group', topic: 'STEM',     icon: '🤖', color: '#dcfce7', studentCount:  9, status: 'active',          schedule: 'Sun',       rating: 4.7 },
      { id: 'c-public',   name: 'Public Speaking Bootcamp',    type: 'group', topic: 'Soft Skills', icon: '🎤', color: '#fce7f3', studentCount: 12, status: 'low-engagement', schedule: 'Sat',      rating: 4.2 },
      { id: 'c-sci',      name: 'Science Curiosity Lab',       type: 'group', topic: 'Science',  icon: '🔬', color: '#dcfce7', studentCount: 16, status: 'active',          schedule: 'Fri',       rating: 4.6 },
      { id: 'c-vedic',    name: 'Vedic Math Crash Course',     type: 'recorded', topic: 'Math',     icon: '📐', videos: 24, durationHours: 8.2,   enrollments: 312, rating: 4.8 },
      { id: 'c-ai',       name: 'Intro to AI for Teens',       type: 'recorded', topic: 'Tech',     icon: '🤖', videos: 18, durationHours: 5.67,  enrollments: 186, rating: 4.7 },
      { id: 'c-writing',  name: 'Creative Writing Workshop',   type: 'recorded', topic: 'Language', icon: '✍️', videos: 12, durationHours: 3.33,  enrollments:  94, rating: 4.6 },
      { id: 'c-chess',    name: 'Chess Fundamentals',          type: 'recorded', topic: 'Strategy', icon: '♟️', videos: 30, durationHours: 11.08, enrollments: 142, rating: 4.7 },
      { id: 'c-hindi',    name: 'Spoken Hindi for Kids',       type: 'recorded', topic: 'Language', icon: '📚', videos: 22, durationHours: 6.83,  enrollments:  78, rating: 4.5 },
      { id: 'c-draw',     name: 'Drawing & Sketching 101',     type: 'recorded', topic: 'Art',      icon: '🎨', videos: 15, durationHours: 4.5,   enrollments:  35, rating: 4.4 },
    ],

    sessions: [
      // Upcoming (Ekta test - the demo course)
      { id: 's-1',  courseId: 'c-ekta',    studentIds: ['u-ekta'],    instructorId: 'me', startsAt: '2026-05-11T18:30:00', duration: 60, status: 'upcoming',  title: 'Live Session' },
      { id: 's-2',  courseId: 'c-ekta',    studentIds: ['u-ekta'],    instructorId: 'me', startsAt: '2026-05-18T18:30:00', duration: 60, status: 'upcoming',  title: 'Live Session' },
      { id: 's-3',  courseId: 'c-ekta',    studentIds: ['u-ekta'],    instructorId: 'me', startsAt: '2026-05-25T18:30:00', duration: 60, status: 'upcoming',  title: 'Live Session' },
      { id: 's-4',  courseId: 'c-ekta',    studentIds: ['u-ekta'],    instructorId: 'me', startsAt: '2026-06-01T18:30:00', duration: 60, status: 'upcoming',  title: 'Live Session' },
      // Aadya
      { id: 's-5',  courseId: 'c-aadya',   studentIds: ['u-aadya'],   instructorId: 'me', startsAt: '2026-05-11T20:30:00', duration: 60, status: 'cancelled', title: 'Live Session' },
      { id: 's-6',  courseId: 'c-aadya',   studentIds: ['u-aadya'],   instructorId: 'me', startsAt: '2026-05-11T22:30:00', duration: 60, status: 'upcoming',  title: 'Live Session' },
      { id: 's-7',  courseId: 'c-aadya',   studentIds: ['u-aadya'],   instructorId: 'me', startsAt: '2026-05-12T18:30:00', duration: 60, status: 'upcoming',  title: 'Live Session' },
      // Adriana
      { id: 's-8',  courseId: 'c-eng',     studentIds: ['u-adriana'], instructorId: 'me', startsAt: '2026-05-12T21:30:00', duration: 60, status: 'upcoming',  title: 'Live Session' },
      // Mivaan
      { id: 's-9',  courseId: 'c-mivaan',  studentIds: ['u-mivaan'],  instructorId: 'me', startsAt: '2026-05-13T11:30:00', duration: 60, status: 'upcoming',  title: 'Live Session' },
      { id: 's-10', courseId: 'c-mivaan',  studentIds: ['u-mivaan'],  instructorId: 'me', startsAt: '2026-05-20T11:30:00', duration: 60, status: 'upcoming',  title: 'Live Session' },
      // Yash
      { id: 's-11', courseId: 'c-yash',    studentIds: ['u-yash'],    instructorId: 'me', startsAt: '2026-05-14T18:30:00', duration: 60, status: 'upcoming',  title: 'Live Session' },
      { id: 's-12', courseId: 'c-yash',    studentIds: ['u-yash'],    instructorId: 'me', startsAt: '2026-05-21T18:30:00', duration: 60, status: 'upcoming',  title: 'Live Session' },
      // Past
      { id: 's-13', courseId: 'c-ekta',    studentIds: ['u-ekta'],    instructorId: 'me', startsAt: '2026-05-04T18:30:00', duration: 60, status: 'completed', title: 'Live Session' },
      { id: 's-14', courseId: 'c-ekta',    studentIds: ['u-ekta'],    instructorId: 'me', startsAt: '2026-04-27T18:30:00', duration: 60, status: 'completed', title: 'Live Session' },
    ],

    chats: [
      {
        id: 'ch-neha', userId: 'u-neha', unread: 1, lastMessageAt: '2026-05-11T09:45:00',
        messages: [
          { id: 'm-1',  from: 'u-neha', text: "Hi Ekta — Aadya really enjoyed yesterday's session!",                                                           at: '2026-05-11T09:14:00' },
          { id: 'm-2',  from: 'me',     text: 'So glad to hear that 🌟 She picked up the recursion concept beautifully.',                                       at: '2026-05-11T09:16:00' },
          { id: 'm-3',  from: 'u-neha', text: "I just topped up her plan with 12 more credits — let me know if it reflects.",                                   at: '2026-05-11T09:42:00' },
          { id: 'm-4',  from: 'me',     text: 'Got it, confirmed. Thanks Neha!',                                                                                 at: '2026-05-11T09:43:00' },
          { id: 'm-5',  from: 'u-neha', text: "Quick question — can we shift next Friday's session by an hour? She has a school event.",                       at: '2026-05-11T09:45:00' },
        ],
      },
      {
        id: 'ch-rajiv', userId: 'u-rajiv', unread: 2, lastMessageAt: '2026-05-11T08:30:00',
        messages: [
          { id: 'm-6', from: 'u-rajiv', text: "Hey, can we move Yash's Tuesday slot to 7 PM instead of 6:30?", at: '2026-05-11T08:00:00' },
          { id: 'm-7', from: 'u-rajiv', text: "He's been a bit overwhelmed with school this term.",            at: '2026-05-11T08:30:00' },
        ],
      },
      {
        id: 'ch-priya', userId: 'u-priya', unread: 1, lastMessageAt: '2026-05-11T06:00:00',
        messages: [
          { id: 'm-8',  from: 'u-priya', text: "Sharing the lesson plan for next week — opened a Doc with the slides.", at: '2026-05-11T05:50:00' },
          { id: 'm-9',  from: 'me',     text: 'Looks great Priya, thanks!',                                              at: '2026-05-11T06:00:00' },
        ],
      },
      {
        id: 'ch-ekta', userId: 'u-ekta', unread: 0, lastMessageAt: '2026-05-10T19:00:00',
        messages: [
          { id: 'm-10', from: 'u-ekta', text: 'Thank you so much for explaining loops — finally clicked! 🌟', at: '2026-05-10T18:50:00' },
          { id: 'm-11', from: 'me',     text: 'You worked it out yourself, I just nudged. Proud of you!',     at: '2026-05-10T19:00:00' },
        ],
      },
    ],

    notifications: [
      { id: 'n-1', type: 'credits',  icon: '💳', tone: 'green',  title: "Neha topped up Aadya's plan",                  body: '+12 credits added — Aadya now has 24 credits.',                          time: '2m',  read: false, action: 'store',     bucket: 'today' },
      { id: 'n-2', type: 'chat',     icon: '💬', tone: 'purple', title: 'New message from Rajiv Sandhu',                body: '"Can we move Yash\'s Tuesday slot to 7 PM instead of 6:30?"',            time: '1h',  read: false, action: 'chats',     bucket: 'today' },
      { id: 'n-3', type: 'session',  icon: '📅', tone: 'yellow', title: 'Session starting in 15 min',                   body: 'Ekta test — 1:1 Coding session at 6:30 PM. Tap to start.',               time: '3h',  read: false, action: 'session',   bucket: 'today' },
      { id: 'n-4', type: 'progress', icon: '⚠️', tone: 'red',    title: "Yash Sandhu hasn't attended for 14 days",      body: 'Consider reaching out — completion has dropped to 38%.',                 time: '5h',  read: true,  action: 'progress',  bucket: 'today' },
      { id: 'n-5', type: 'analytics',icon: '📈', tone: 'blue',   title: 'Weekly summary ready',                          body: 'You held 112 sessions this week — up 21% from last week!',               time: '1d',  read: true,  action: 'analytics', bucket: 'yesterday' },
      { id: 'n-6', type: 'enroll',   icon: '🎉', tone: 'green',  title: 'New learner enrolled',                          body: 'Adriana joined English Conversation Club.',                              time: '1d',  read: true,  action: 'users',     bucket: 'yesterday' },
      { id: 'n-7', type: 'rating',   icon: '⭐', tone: 'purple', title: "New 5-star rating from Mivaan's parent",        body: '"Best teacher we\'ve had. Period."',                                     time: '1d',  read: true,  action: 'course',    bucket: 'yesterday' },
      { id: 'n-8', type: 'payout',   icon: '💰', tone: 'yellow', title: 'Payout processed',                              body: '₹64,200 has been transferred to your bank account.',                    time: '3d',  read: true,  action: 'store',     bucket: 'earlier' },
      { id: 'n-9', type: 'lesson',   icon: '📚', tone: 'blue',   title: 'Lesson plan from Priya Menon',                  body: "Next week's lesson plan for Math Olympiad Prep is ready for review.",   time: '4d',  read: true,  action: 'course',    bucket: 'earlier' },
    ],

    credits: { balance: 12, plan: 'Plus', planLabel: '💎 Plus plan', monthlyLimit: 100, autoTopup: false },

    purchases: [
      { id: 'p-1', item: 'Plus pack — 100 credits',     date: '2026-05-11', amount: 3999, status: 'paid' },
      { id: 'p-2', item: 'Starter pack — 20 credits',   date: '2026-04-14', amount:  999, status: 'paid' },
      { id: 'p-3', item: 'Custom domain (1 mo)',        date: '2026-04-02', amount:  499, status: 'paid' },
    ],

    analytics: {
      revenue: 214300, revenueGrowth: 12,
      activeLearners: 54, learnerGrowth: 6,
      sessionsHeld: 312, sessionsGrowth: 8,
      avgRating: 4.8, reviewCount: 142,
      mix: { '1on1': 62, group: 20, recorded: 13, addon: 5 },
      weekly: [58, 72, 81, 66, 92, 112, 102, 124],
    },

    settings: {
      notifications: { email: true, sms: false, push: true },
      autoTopup: false, theme: 'light', language: 'en',
    },

    shellyChat: [], // persistent Shelly conversation
    shellyNudges: {}, // throttling for proactive nudges (intent → timestamp)
    shellyNotes: [], // personal memory: { id, text, createdAt }
    shellyReminders: [], // scheduled nudges: { id, text, dueAt, fired }
    shellyMutedUntil: 0, // ms epoch — proactive ticks paused until this time
    shellyPrefs: {},     // arbitrary key/value prefs Shelly learns about the user
    shellyPinned: [],    // pinned message IDs for the chat panel strip
    shellyCommandUsage: {}, // track {/topup: 5, /summary: 12, ...} for smart chips
    shellyPanelMode: 'full', // 'full' | 'compact'

    auth: {
      signedIn: false,
      identifier: null,           // phone or email used to sign in
      method: null,               // 'phone' | 'email' | 'google'
      isFirstLogin: true,         // becomes false after onboarding tour completes
      onboardingDone: false,
      signedInAt: null,
    },
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function load() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (stored && stored.version === VERSION) return stored;
    } catch (e) {}
    const seed = clone(SEED);
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); }
    catch (e) {
      // Quota exceeded — trim Shelly's persistent chat first (biggest variable),
      // then retry. If still failing, log and continue with stale localStorage
      // but a live in-memory cache (degraded but functional).
      try {
        if (d.shellyChat && d.shellyChat.length > 20) d.shellyChat = d.shellyChat.slice(-20);
        localStorage.setItem(KEY, JSON.stringify(d));
      } catch (e2) {
        console.warn('[db] localStorage save failed:', e2 && e2.message);
      }
    }
  }

  const subs = new Set();
  function notify(d) { subs.forEach(function (fn) { try { fn(d); } catch (e) { console.error(e); } }); }

  let cache = load();

  const db = {
    get() { return cache; },
    update(mutate) {
      const ret = mutate(cache);
      save(cache);
      notify(cache);
      return ret;
    },
    subscribe(fn) { subs.add(fn); return function () { subs.delete(fn); }; },
    reset() {
      localStorage.removeItem(KEY);
      cache = load();
      notify(cache);
    },
    seed() { return clone(SEED); },
  };

  // Convenience lookups
  db.findUser    = function (id) { return cache.users.find(function (u) { return u.id === id; }); };
  db.findCourse  = function (id) { return cache.courses.find(function (c) { return c.id === id; }); };
  db.findSession = function (id) { return cache.sessions.find(function (s) { return s.id === id; }); };
  db.findChat    = function (id) { return cache.chats.find(function (c) { return c.id === id; }); };
  db.usersByRole = function (role) { return cache.users.filter(function (u) { return role === 'all' || u.role === role; }); };
  db.students    = function () { return cache.users.filter(function (u) { return u.role === 'student'; }); };
  db.atRisk      = function () { return db.students().filter(function (s) { return s.progress < 50; }); };
  db.upcoming    = function () { return cache.sessions.filter(function (s) { return s.status === 'upcoming'; }).sort(function (a, b) { return a.startsAt.localeCompare(b.startsAt); }); };
  db.unreadChats = function () { return cache.chats.filter(function (c) { return c.unread > 0; }); };
  db.unreadNotifs= function () { return cache.notifications.filter(function (n) { return !n.read; }); };
  db.unreadNotifCount = function () { return db.unreadNotifs().length; };
  db.unreadChatCount  = function () { return db.unreadChats().reduce(function (s, c) { return s + c.unread; }, 0); };

  // Mutations — the actions Shelly + the UI can perform.
  db.topUp = function (packId) {
    const PACKS = { starter: { credits: 20, amount: 999, label: 'Starter pack — 20 credits' },
                    plus:    { credits: 100, amount: 3999, label: 'Plus pack — 100 credits' },
                    pro:     { credits: 300, amount: 9499, label: 'Pro pack — 300 credits' } };
    const pack = PACKS[packId] || PACKS.plus;
    db.update(function (d) {
      d.credits.balance += pack.credits;
      d.purchases.unshift({ id: 'p-' + Date.now(), item: pack.label, date: today(), amount: pack.amount, status: 'paid' });
      d.notifications.unshift({ id: 'n-' + Date.now(), type: 'credits', icon: '💳', tone: 'green', title: 'Top-up successful', body: '+' + pack.credits + ' credits added. New balance: ' + d.credits.balance + '.', time: 'just now', read: false, action: 'store', bucket: 'today' });
    });
    return pack;
  };
  db.markNotificationRead = function (id) { db.update(function (d) { const n = d.notifications.find(function (x) { return x.id === id; }); if (n) n.read = true; }); };
  db.markAllNotificationsRead = function () { db.update(function (d) { d.notifications.forEach(function (n) { n.read = true; }); }); };
  db.cancelSession = function (sessionId) { db.update(function (d) { const s = d.sessions.find(function (x) { return x.id === sessionId; }); if (s) s.status = 'cancelled'; }); };
  db.scheduleSession = function (courseId, startsAt) {
    db.update(function (d) {
      const c = d.courses.find(function (x) { return x.id === courseId; });
      if (!c) return;
      d.sessions.push({ id: 's-' + Date.now(), courseId: courseId, studentIds: c.studentIds || [], instructorId: 'me', startsAt: startsAt, duration: 60, status: 'upcoming', title: 'Live Session' });
      d.notifications.unshift({ id: 'n-' + Date.now(), type: 'session', icon: '📅', tone: 'blue', title: 'Session scheduled', body: 'New session added to ' + c.name + '.', time: 'just now', read: false, action: 'course', bucket: 'today' });
    });
  };
  db.sendMessage = function (chatId, text) {
    db.update(function (d) {
      const c = d.chats.find(function (x) { return x.id === chatId; });
      if (!c) return;
      c.messages.push({ id: 'm-' + Date.now(), from: 'me', text: text, at: new Date().toISOString() });
      c.lastMessageAt = new Date().toISOString();
    });
  };
  db.markChatRead = function (chatId) { db.update(function (d) { const c = d.chats.find(function (x) { return x.id === chatId; }); if (c) c.unread = 0; }); };
  db.addUser = function (user) {
    db.update(function (d) {
      const id = user.id || ('u-' + Date.now());
      d.users.unshift(Object.assign({ id: id, status: 'active', active: 'just now' }, user));
    });
  };
  db.editUser = function (id, patch) { db.update(function (d) { const u = d.users.find(function (x) { return x.id === id; }); if (u) Object.assign(u, patch); }); };
  db.setSetting = function (path, value) {
    db.update(function (d) {
      const parts = path.split('.');
      let obj = d.settings;
      for (let i = 0; i < parts.length - 1; i++) { obj = obj[parts[i]] = obj[parts[i]] || {}; }
      obj[parts[parts.length - 1]] = value;
    });
  };

  // Shelly's conversation persistence
  db.shellyAppend = function (msg) { db.update(function (d) { d.shellyChat.push(msg); if (d.shellyChat.length > 80) d.shellyChat.splice(0, d.shellyChat.length - 80); }); };
  db.shellyClear  = function () { db.update(function (d) { d.shellyChat = []; }); };
  db.shellyNudge  = function (key) { db.update(function (d) { d.shellyNudges[key] = Date.now(); }); };
  db.shellyNudgedAt = function (key) { return cache.shellyNudges[key] || 0; };

  // ===== Shelly extended memory =====
  db.addNote      = function (text) { db.update(function (d) { d.shellyNotes = d.shellyNotes || []; d.shellyNotes.unshift({ id: 'note-' + Date.now(), text: text, createdAt: new Date().toISOString() }); }); };
  db.listNotes    = function () { return (cache.shellyNotes || []).slice(); };
  db.forgetNote   = function (id) { db.update(function (d) { d.shellyNotes = (d.shellyNotes || []).filter(function (n) { return n.id !== id; }); }); };
  db.forgetAllNotes = function () { db.update(function (d) { d.shellyNotes = []; }); };

  db.addReminder  = function (text, dueAt) { const id = 'rem-' + Date.now(); db.update(function (d) { d.shellyReminders = d.shellyReminders || []; d.shellyReminders.push({ id: id, text: text, dueAt: dueAt, fired: false }); }); return id; };
  db.listReminders= function () { return (cache.shellyReminders || []).slice(); };
  db.fireReminder = function (id) { db.update(function (d) { const r = (d.shellyReminders || []).find(function (x) { return x.id === id; }); if (r) r.fired = true; }); };
  db.cancelReminder = function (id) { db.update(function (d) { d.shellyReminders = (d.shellyReminders || []).filter(function (r) { return r.id !== id; }); }); };

  db.muteUntil    = function (ms) { db.update(function (d) { d.shellyMutedUntil = ms; }); };
  db.isMuted      = function () { return Date.now() < (cache.shellyMutedUntil || 0); };

  db.setPref      = function (k, v) { db.update(function (d) { d.shellyPrefs = d.shellyPrefs || {}; d.shellyPrefs[k] = v; }); };
  db.getPref      = function (k) { return (cache.shellyPrefs || {})[k]; };

  // Pinned messages for Shelly's panel strip
  db.pinMessage   = function (msg) { db.update(function (d) { d.shellyPinned = d.shellyPinned || []; if (d.shellyPinned.length >= 5) d.shellyPinned.shift(); d.shellyPinned.push({ id: 'pin-' + Date.now(), text: msg.text, from: msg.from || 'shelly', at: new Date().toISOString() }); }); };
  db.unpinMessage = function (id) { db.update(function (d) { d.shellyPinned = (d.shellyPinned || []).filter(function (p) { return p.id !== id; }); }); };
  db.listPinned   = function () { return (cache.shellyPinned || []).slice(); };
  db.clearPinned  = function () { db.update(function (d) { d.shellyPinned = []; }); };

  // Command usage tracking → drives smart chip suggestions
  db.bumpCommand  = function (cmd) { db.update(function (d) { d.shellyCommandUsage = d.shellyCommandUsage || {}; d.shellyCommandUsage[cmd] = (d.shellyCommandUsage[cmd] || 0) + 1; }); };
  db.topCommands  = function (n) { const u = cache.shellyCommandUsage || {}; return Object.keys(u).sort(function (a, b) { return u[b] - u[a]; }).slice(0, n || 3); };

  // Panel mode (compact vs full)
  db.setPanelMode = function (m) { db.update(function (d) { d.shellyPanelMode = m; }); };
  db.getPanelMode = function () { return cache.shellyPanelMode || 'full'; };

  // ===== Auth =====
  db.signIn = function (identifier, method) {
    db.update(function (d) {
      d.auth = d.auth || {};
      d.auth.signedIn = true;
      d.auth.identifier = identifier;
      d.auth.method = method;
      d.auth.signedInAt = new Date().toISOString();
      // Save the identifier on the user profile
      if (method === 'email' && identifier && identifier.includes('@')) d.me.email = identifier;
      if (method === 'phone' && identifier) d.me.phone = identifier;
    });
  };
  db.signOut = function () {
    // Reset everything tied to "this person" — so the next login starts fresh:
    //   profile (name/email/phone), auth state, Shelly memory + onboarding flag.
    db.update(function (d) {
      const seed = clone(SEED);
      d.me = seed.me;
      d.auth = seed.auth;
      d.shellyChat = [];
      d.shellyNudges = {};
    });
    // Also wipe the localStorage 'supersheldon' key used by the auth pages
    try { localStorage.removeItem('supersheldon'); } catch (e) {}
  };
  db.isSignedIn = function () { return !!(cache.auth && cache.auth.signedIn); };
  db.isFirstLogin = function () { return !!(cache.auth && cache.auth.isFirstLogin); };
  db.completeOnboarding = function () { db.update(function (d) { d.auth.isFirstLogin = false; d.auth.onboardingDone = true; }); };
  db.setMyName = function (name) { db.update(function (d) { if (name) { d.me.name = name; d.me.avatar = name.trim()[0].toUpperCase(); } }); };
  db.setMyEmail = function (email) { db.update(function (d) { d.me.email = email; }); };

  function today() { return new Date().toISOString().split('T')[0]; }

  window.db = db;
})();
