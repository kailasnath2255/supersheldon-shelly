# Super Sheldon — with Shelly 🦸‍♀️

A complete, deployable frontend for **Super Sheldon**, a tutor management platform, featuring **Shelly the Super** — an AI sidekick that reads your real data, performs real actions, runs a guided onboarding tour, and falls back to Gemini for open-ended conversation.

**No backend, no build step, no framework.** Pure HTML + CSS + vanilla JS. Drop it on any static host (Vercel, Netlify, GitHub Pages, S3) and it works.

---

## 🚀 Quick start

### Run locally

```bash
git clone https://github.com/kailasnath2255/supersheldon-shelly.git
cd supersheldon-shelly
python3 -m http.server 8000
# open http://localhost:8000/
```

That's it. No `npm install`, no build, no env files (unless you want Gemini — see [Gemini Fallback](#-gemini-fallback-optional)).

### Deploy to Vercel

1. Push this repo to your GitHub
2. Go to https://vercel.com/new → "Import Git Repository" → pick this repo
3. Framework preset: **Other** (Vercel auto-detects static)
4. Build command: **leave blank**
5. Output directory: **leave blank** (Vercel serves root)
6. Click **Deploy**

Vercel will serve every file in the repo as-is. **Nothing is lost** — no build step means no transformation happens. Your `data.js` seed, your HTML pages, the `logo.webp`, `gemini.js`, all of it ships byte-identical.

The deployed URL works for every visitor on every device — each gets the same seeded data on first open, and their edits persist locally in their own browser.

---

## 🎬 The full demo flow

1. Open the deployed URL → routes to **Login**
2. Continue with Mobile → any 10-digit number → **Get Code**
3. OTP is pre-filled (`2 4 7 2`) → tap **Verify**
4. Land on **Classes Dashboard** → Shelly's chat panel auto-opens
5. She asks **"What should I call you?"** → type your name
6. She offers a guided **spotlight tour** — 9 steps walking through every section of the app
7. After the tour, you're free to explore. Sidebar Account → **Log out** resets you for the next demo.

Reset anytime via the sidebar Account menu → **Reset demo data**, or Shelly's ⋮ menu.

---

## ✨ What's actually built

### Auth flow (4 screens)
| Screen | What it does |
| --- | --- |
| `1-login.html` | Provider chooser: Google / Mobile / Email |
| `2-login-phone.html` | 10-digit phone validation, saves to `db.me.phone` |
| `3-login-email.html` | Email regex, saves to `db.me.email` |
| `4-enter-code.html` | OTP with auto-advance, paste, countdown, pre-filled for demo |

### App pages (13 screens, all data-driven)
| Page | Reads from db | Writes to db |
| --- | --- | --- |
| **Classes Dashboard** | Course cards, upcoming sessions strip | — |
| **Course – Home** | Sessions list, credit panel, learner, instructor | Reassign host, add note, schedule, cancel |
| **Course – Content** | Sections list | Add section, create certificate |
| **Live Session Modal** | Session details | Start session, change host, private note |
| **Edit Details Modal** | Learner profile | Save profile changes |
| **1:1 Courses** | filtered course list | — |
| **Group Courses** | group course grid | Create new group course |
| **Recorded Courses** | video library + KPIs | Upload new course |
| **Users** | full user table with role tabs | Invite user → adds to db; click row → profile modal |
| **Progress Reports** | live KPIs, student rows with completion bars | Click row → detailed profile modal |
| **Chats** | conversation list + threads | Send message, smart suggested replies |
| **Store** | credit balance card, packs, purchases, addons | Top-up actually adds credits + creates purchase + notification |
| **Analytics** | revenue, mix, top courses, top instructors | Export report |
| **Notifications** | grouped today/yesterday/earlier | Mark-as-read, mark-all-read, notification prefs |

### Sidebar (single source)
- **Courses** (Courses → 1:1 / Group / Recorded sub-nav)
- **Users · Progress Reports · Chats · Store · Analytics · Notifications**
- **Live badges** for unread chats and unread notifications, driven by `db`
- **Account button** at the bottom → dropdown with "Reset demo data" and "Log out"

---

## 🦸‍♀️ Shelly — the AI sidekick

Shelly is a floating animated character (custom SVG with cape, mask, pigtails, "S" emblem) that lives in the bottom-right of every app page. She's not a chatbot wrapper — she's deeply integrated with the data layer and performs real mutations.

### What she can do

**Read real numbers from your data**
```
"how many credits left?"   → 12 credits on Plus plan
"who's at risk?"          → 3 learners with names + completion %
"what's on today?"        → today's sessions with times + students
```

**Perform real actions** (mutates `db`, surfaces across every page)
- Top up credits → balance goes up, purchase row appears in Store, notification fires
- Schedule a session → new session in upcoming list everywhere
- Cancel session → status changes, learner notified
- Draft a parent reply → opens chats with the draft pre-filled
- Mark all notifications read → sidebar badge clears

**Multi-turn conversations** (state machine for follow-ups)
```
You:    book a session
Shelly: Which learner? [Aadya] [Mivaan] [Yash] [Type a name]
You:    tap [Aadya]
Shelly: When? [Today 6:30 PM] [Tomorrow 5 PM] [Saturday 11 AM]
You:    tomorrow 7pm
Shelly: Booked! ✅ Aadya on Mon, May 12, 7:00 PM.
```

**Slash commands** (typed into her input)
| Command | What it does |
| --- | --- |
| `/help` | List all commands |
| `/summary` | Today's snapshot card |
| `/today` | Sessions today |
| `/risk` | At-risk learners |
| `/credits` · `/topup [pack]` | Check / top-up credits |
| `/find <name>` | Search across users |
| `/schedule [name]` | Multi-turn schedule flow |
| `/draft [name]` | Multi-turn draft-message flow |
| `/template <type>` | Message templates (welcome / recap / missed / topup / feedback) |
| `/remember <text>` · `/notes` · `/forget` | Personal memory |
| `/remind <text> in 15m` · `/reminders` | Time-based reminders |
| `/snooze 30m` · `/unsnooze` | Mute proactive nudges |
| `/calc <expr>` | Quick math |
| `/go <page>` | Quick navigation |
| `/tour` | Replay the onboarding tour |
| `/clear` · `/reset` | Clear chat / reset demo |

**Onboarding tour**
On first login, Shelly:
1. Auto-opens and asks for the user's name
2. Saves it to `db.me.name`
3. Runs a 9-step **spotlight tour** — dim backdrop, focus ring around each section, tooltip explaining what it does
4. Marks `auth.isFirstLogin = false` so subsequent logins skip it

Replay anytime with `/tour` or Shelly ⋮ menu.

**Proactive nudges** (every 30s, throttled)
- Credit balance dropping below 8 → "want me to top up?"
- Unread chat aging > 30 min → "want me to draft a reply?"
- Reminders due → fires the user's reminder

**Persistent conversation**
Every message Shelly says and every user input is stored in `db.shellyChat`. On every page load, the conversation is restored from `db` — she never forgets context as you navigate.

**Personality**
- Time-of-day aware greetings (morning / afternoon / evening / late-night)
- Empathy responses (tired / stressed / overwhelmed)
- Random variety on greetings, thanks, jokes, motivation
- Casual lowercase voice when it fits
- Catchphrase: "Shelly the Super" 🦸‍♀️

---

## 🧠 Gemini fallback (optional)

When Shelly's rule-based router can't match an input (e.g. "how do I handle a kid who keeps disengaging?"), she **silently** falls back to **Google Gemini** with a tightly-scoped system prompt + live data context. The user never sees a "Connect Gemini" button — they just see Shelly answering.

### To enable

Open [`gemini.js`](gemini.js) and paste your API key into one line:

```js
const GEMINI_KEY = '';   // ← paste your key inside the quotes
```

Get a free key at https://aistudio.google.com/app/apikey. The free tier (15 req/min, 1M tokens/day) easily covers personal demos.

### What's locked down

- **Strict domain scope** — Gemini is instructed to refuse anything off-topic: "I'm just here for your tutoring work — anything I can help with on Super Sheldon?"
- **Live context injection** — every call includes real numbers (your credit balance, at-risk learners, upcoming sessions, notes you told Shelly to remember)
- **Personality contract** — warm, brief (2-4 sentences), HTML-not-markdown, no fake action claims
- **Token cap** at 380, temperature 0.6
- **On failure** — silently falls back to Shelly's rule-based reply; user never sees an error

### Security note

Since the key sits in static JS, it's readable by anyone view-sourcing the deployed site. **For personal demos this is fine.** For real production, replace the `fetch()` in `gemini.js` with a tiny Vercel/Cloudflare serverless function so the key stays server-side. The wiring on Shelly's side stays identical — one URL change.

---

## 📁 Project structure

```
super-sheldon-screens/
├── index.html              # router — sends signed-in users to /classes, others to /login
├── 1-login.html            # auth: provider chooser
├── 2-login-phone.html      # auth: phone
├── 3-login-email.html      # auth: email
├── 4-enter-code.html       # auth: OTP
├── 5-classes.html          # main dashboard (1:1 courses + sessions)
├── 6-course-home.html      # course detail — Home tab
├── 7-course-content.html   # course detail — Content tab
├── 8-session-modal.html    # live-session overlay
├── 9-edit-modal.html       # edit-learner overlay
├── 10-group-courses.html   # group course grid + create wizard
├── 11-recorded-courses.html# recorded video library + upload modal
├── 12-users.html           # users table + invite + profile modals
├── 13-progress-reports.html# progress KPIs + per-learner detail
├── 14-chats.html           # unified inbox + thread + smart-replies
├── 15-store.html           # credit packs + addons + purchase history
├── 16-analytics.html       # revenue, sessions, top courses, top instructors
├── 17-notifications.html   # grouped notifications + mark-read + prefs
│
├── app.css                 # shared shell, sidebar, components
├── app.js                  # auth bridge, toast, modal helper, account menu
├── data.js                 # seeded database (single source of truth)
├── sidebar.js              # injected sidebar with live badges
├── shelly.js               # the AI sidekick — UI, brain, actions, tour
├── gemini.js               # silent Gemini fallback (optional, opt-in via key)
├── logo.webp               # brand logo
│
├── README.md               # this file
└── .gitignore
```

### File responsibilities

**`data.js`** — single source of truth. A localStorage-backed JSON object holding everything:
- `me` — current user profile
- `auth` — signed-in state + isFirstLogin
- `users[]` — 11 seeded users (students, parents, instructors, admin)
- `courses[]` — 17 courses across 1:1 / group / recorded
- `sessions[]` — 14 sessions in past + upcoming
- `chats[]` — 4 conversations with full message history
- `notifications[]` — 9 notifications grouped by time
- `credits` — balance + plan
- `purchases[]` — 3 past transactions
- `analytics` — revenue, sessions, ratings
- `shellyChat[]` — persistent Shelly conversation
- `shellyNotes[]` — things Shelly remembers
- `shellyReminders[]` — scheduled reminders
- `settings` — user preferences

API:
```js
db.get()          // snapshot
db.update(fn)     // mutate + notify subscribers
db.subscribe(fn)  // re-render on changes
db.reset()        // wipe everything back to seed

// Convenience
db.findUser(id) · db.findCourse(id) · db.findSession(id)
db.students() · db.atRisk() · db.upcoming()
db.unreadChats() · db.unreadNotifs()

// Mutations
db.topUp(pack) · db.scheduleSession() · db.cancelSession()
db.sendMessage() · db.markChatRead() · db.markAllNotificationsRead()
db.addUser() · db.editUser()
db.addNote() · db.addReminder() · db.muteUntil()
db.signIn() · db.signOut() · db.completeOnboarding()
```

**`shelly.js`** — the AI sidekick. Floating button + chat panel + tour engine + rule-based router + multi-turn flow + Gemini hook.

**`app.js`** — toast helper, reusable modal (`app.modal()` / `app.field()`), account dropdown, auth bridge between localStorage and `db`.

**`sidebar.js`** — single config drives the sidebar on every page; subscribes to `db` for live unread badges.

**`gemini.js`** — auto-loaded by Shelly; activates silently when `GEMINI_KEY` is filled in.

---

## 🔄 The "fresh data on every device" guarantee

**Yes — Vercel deployment preserves every byte of the seed.**

How it works:
- All seeded data lives in `data.js` as a JavaScript constant — it ships in your bundle
- On first visit to any page, `data.js` initializes localStorage with the seed
- Subsequent edits the user makes (top-ups, new students, sent messages) live in their *own* device's localStorage
- A second visitor on a different phone sees the same fresh seed
- **Reset demo data** in the sidebar wipes their local edits → back to seed

Vercel just serves the static files. No transformation. No build step that could strip anything. What you push is what visitors get.

---

## 🛠️ Tech stack (or lack thereof)

| Layer | Choice |
| --- | --- |
| Framework | None — vanilla JS |
| Build tool | None |
| Package manager | None |
| State | localStorage + reactive pub/sub in `data.js` |
| Styles | Plain CSS + a few inline declarations |
| Icons | Inline SVG |
| Avatars | Inline SVG (Shelly is hand-drawn in SVG paths) |
| Optional AI | Google Gemini 2.5 Flash (free tier, browser fetch) |
| Hosting | Vercel / Netlify / GitHub Pages / any static host |

The total bundle (every HTML page + every JS file + the logo) is well under 200 KB.

---

## ⚙️ Known limitations & next steps

This is a frontend-only demo, so:

- **No multi-user sync** — Phone A's edits don't appear on Phone B. Each device has its own localStorage copy of the data. Production would need a backend (Supabase, Firebase, or custom).
- **Gemini key is client-side** — readable by anyone view-sourcing the site. Fine for demos; for production, swap `gemini.js` to call a serverless function.
- **No real video calls** — the Live Session screen is illustrative. Production would integrate Zoom / Daily / 100ms / WebRTC.
- **No actual payment processing** — the Store top-up mutates `db.credits.balance` but doesn't charge a card. Wire in Razorpay / Stripe for real.
- **No password / 2FA** — phone OTP is pre-filled (`2472`) for instant demo access. Production would call a real SMS provider.

If you want to take this to production, the migration path is well-defined:
1. Swap `data.js` localStorage for a Supabase / Firebase backend (the `db.get/update/subscribe` API stays identical)
2. Swap `gemini.js` `fetch()` URL for a serverless function that holds the key server-side
3. Replace phone OTP with a real provider (Supabase Auth handles this in 1 line)

---

## 🤝 Contributing / extending

To add a new sidebar item:
1. Add an entry to the `NAV` array in [`sidebar.js`](sidebar.js)
2. Create the corresponding HTML page (follow the pattern of `12-users.html`)
3. Done — the sidebar renders the new item with the correct active highlight everywhere

To add a new Shelly intent:
1. Edit `route()` in [`shelly.js`](shelly.js)
2. Add a regex test + return a string or `{ text, actions }` object
3. That's it — natural language now hits your new intent

To extend the seeded data:
1. Edit the `SEED` constant in [`data.js`](data.js)
2. Bump `VERSION` so existing localStorage gets re-seeded on next visit

---

## 📜 License

Free to use, modify, and deploy. Built with help from Claude.

---

**Built for the Super Sheldon platform · May 2026.**
