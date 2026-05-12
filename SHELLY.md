# Shelly — the Super Sheldon AI Companion 🦸‍♀️

A complete reference of everything Shelly the Super can do, see, remember, and act on.

> "I'm just a friendly mascot 🦸‍♀️ that reads your real data and triggers real actions. To save you time."

---

## Contents
1. [Identity & Persona](#identity--persona)
2. [The Avatar & UI](#the-avatar--ui)
3. [Onboarding Flow](#onboarding-flow)
4. [What She Knows](#what-she-knows)
5. [Slash Commands](#slash-commands)
6. [Natural-Language Understanding](#natural-language-understanding)
7. [Multi-Turn Conversations](#multi-turn-conversations)
8. [Action System](#action-system)
9. [**Rich Inline Cards** ⭐ v3](#rich-inline-cards)
10. [**Undo Toasts** ⭐ v3](#undo-toasts)
11. [**Compact / Expanded Modes** ⭐ v3](#compact--expanded-modes)
12. [**Smart Context-Aware Chips** ⭐ v3](#smart-context-aware-chips)
13. [**Bulk Actions** ⭐ v3](#bulk-actions)
14. [**Multi-Step Playbooks** ⭐ v3](#multi-step-playbooks)
15. [**Pinned Insights** ⭐ v3](#pinned-insights)
16. [**Universal Search** ⭐ v3](#universal-search)
17. [**Pattern Learning** ⭐ v3](#pattern-learning)
18. [**Inline Sparklines** ⭐ v3](#inline-sparklines)
19. [Memory Features](#memory-features)
20. [Reminders & Snooze](#reminders--snooze)
21. [Streak & Daily Briefing](#streak--daily-briefing)
22. [Proactive Nudges](#proactive-nudges)
23. [Gemini Fallback](#gemini-fallback)
24. [Keyboard Shortcuts](#keyboard-shortcuts)
25. [Personality Details](#personality-details)
26. [Architecture](#architecture)
27. [Extending Shelly](#extending-shelly)

---

## Identity & Persona

- **Name**: Shelly the Super 🦸‍♀️
- **Tagline**: "Your tiny tutor sidekick"
- **Role**: AI assistant for tutors on the Super Sheldon platform
- **Mission**: Take the boring admin off your plate so you can focus on teaching

She is **strictly scoped** to the tutor-platform domain — anything off-topic (general knowledge, coding help, news, politics) is gently refused:

> "I'm just here for your tutoring work — anything I can help with on Super Sheldon?"

---

## The Avatar & UI

### Floating button
A custom-drawn SVG of a **small girl superhero** in mid-flight pose:
- 🦸‍♀️ Twin pigtails with yellow hair ties
- Red domino mask with sparkly blue eyes
- White suit with red collar trim + golden belt
- Yellow circle "S" emblem on chest
- Red cape billowing behind
- One fist raised triumphantly
- Red speed lines trailing back to sell the flight
- **No circle around her** — edge-traced shadow so she appears to actually float

She bobs up and down (3.6s loop) idle, pulses bigger on new messages, and pops on hover.

### Chat panel
Opens on click. Features:
- **Portrait avatar card** in the header (different from the round head crop) with pink→purple→indigo gradient backdrop
- Header subtitle: `🟢 always on, here to help`
- ⋮ menu with: Clear conversation · Reset demo data
- × close button
- Scrolling message list with typing dots animation
- Suggested-prompt chips (smart, change based on your data state)
- Input bar with paper-plane send button

### Message bubbles
- **Hers**: white bubble, head-only avatar (refined: eyebrows, blue-iris eyes, blush, hair highlight, smile)
- **Yours**: purple-blue gradient bubble, simple user icon
- Action chips appear under her messages for one-tap follow-ups
- Typing animation (3 bouncing dots) while she's "thinking"

---

## Onboarding Flow

### First-ever login (every method triggers it)
1. After signing in, Shelly **auto-opens** her panel
2. Asks: *"What should I call you?"*
3. You type a name → saved to `db.me.name`
4. She offers a guided **spotlight tour**

### The spotlight tour (9 steps)
A dim backdrop falls over the page; one element at a time is highlighted with a glowing ring + tooltip:
1. The sidebar (your command centre)
2. **Courses** — 1:1 / Group / Recorded
3. **Users** — students, parents, instructors
4. **Progress Reports** — completion + at-risk
5. **Chats** — unified inbox
6. **Store** — credits & add-ons
7. **Analytics** — revenue, sessions, ratings
8. **Notifications** — everything needing attention
9. **Shelly herself** — "I'm always here"

After the tour: `auth.isFirstLogin` flips to `false`. Replay anytime with `/tour`.

---

## What She Knows

Shelly reads your **real, live data** from `db` on every query:

| She knows about | From |
|---|---|
| Your name, email, phone, plan | `db.me` |
| Every student, parent, instructor | `db.users` |
| All courses (1:1, group, recorded) | `db.courses` |
| Upcoming + past sessions | `db.sessions` |
| Chat threads + full message history | `db.chats` |
| Notifications grouped by time | `db.notifications` |
| Current credit balance + plan | `db.credits` |
| Recent purchases | `db.purchases` |
| Revenue, growth, top courses | `db.analytics` |
| At-risk learners (progress < 50%) | computed live |
| Things you told her to remember | `db.shellyNotes` |
| Active reminders | `db.shellyReminders` |
| Your active-day streak | `db.shellyPrefs.streak` |

She **never invents stats** — if it's not in `db`, she tells you it's not available.

---

## Slash Commands

Type any of these into Shelly's input. They take precedence over natural-language matching.

| Command | What it does |
| --- | --- |
| `/help` | Lists all commands + keyboard shortcuts |
| `/summary` · `/briefing` | Today's snapshot card (sessions, chats, at-risk, credits) |
| `/today` | Sessions today — rendered as **clickable cards** ⭐ |
| `/risk` | At-risk learners — rendered as **clickable cards with progress bars** ⭐ |
| `/streak` | Your consecutive-day streak 🔥 |
| `/credits` | Current balance + plan + **inline weekly sparkline** ⭐ |
| `/topup [starter\|plus\|pro]` | Buy credits — mutates `db` with **5-second Undo** ⭐ |
| `/find <name>` | Searches users — rendered as **cards** ⭐ |
| `/schedule [name]` | Starts multi-turn scheduling flow |
| `/draft [name]` | Starts multi-turn message-drafting flow |
| `/template <type>` | `welcome` · `recap` · `missed` · `topup` · `feedback` · `welcome_student` |
| `/playbook` ⭐ | Lists guided routines (onboard student, weekly wrap, friday cleanup) |
| `/bulk mark-read` ⭐ | Marks every chat as read (Undo-able) |
| `/bulk recap` ⭐ | Drafts a recap message to every parent of today's attendees |
| `/bulk cancel <name>` ⭐ | Cancels every upcoming session for that learner this week |
| `/pinned` · `/unpin all` ⭐ | Manage pinned insights |
| `/compact` · `/expand` ⭐ | Toggle Shelly's panel mode |
| `/remember <text>` | Saves a note Shelly will recall later |
| `/notes` | Lists everything Shelly remembers |
| `/forget <n>` · `/forget all` | Removes a note (by index) or all |
| `/remind <text> in 15m` | Schedules a future ping |
| `/reminders` | Lists active reminders |
| `/snooze 30m` · `/snooze 2h` | Pauses proactive nudges |
| `/unsnooze` | Wakes her back up |
| `/search <text>` | Fuzz-finds past Shelly messages |
| `/calc <expr>` | Quick math (e.g. `/calc 100*4`) |
| `/go <page>` | Quick nav: `chats`, `store`, `progress`, `analytics`, `users`, `notifications`, `home` |
| `/tour` | Replays the onboarding spotlight tour |
| `/clear` | Clears the conversation |
| `/reset` | Wipes all demo data (confirmation prompt) |

⭐ = new in v3

---

## Natural-Language Understanding

Don't want to memorise commands? Just talk to her. She matches ~50+ intent patterns covering:

### Greetings (time-aware)
- "hi" / "hello" / "hey" → time-of-day greeting using your name
- Morning · Afternoon · Evening · *"Still up?"* (late night) · *"Night owl"*

### Identity
- "who are you?" / "what can you do?" → introduces herself + capability list

### Money
- "how many credits left?" / "what's my balance?"
- "top up", "recharge", "running low"
- "pricing", "plans", "refund"
- "white-label", "custom domain"

### Time / Schedule
- "today", "tonight", "tomorrow"
- "when is my next session?" → relative time ("in 2 hr")
- "what's on this week?"
- "free slots", "available time"
- "book a session", "schedule for Aadya"

### Students / Progress
- "who's at risk?" / "who's struggling?"
- "top performer" / "star student"
- "completion rate" / "progress overview"
- "show me students" / "how many learners?"
- "parents" / "instructors"

### Chats
- "unread chats", "what's in my inbox?"
- "draft a reply" / "reply to Neha"

### Notifications
- "unread notifications", "alerts"
- "mark all read"

### Analytics
- "revenue", "earnings", "income"
- "forecast next month"
- "ratings", "reviews"

### Best Practices
- "give me a tip" → 1 of 4 tutor best-practice nuggets
- "how do I talk to parents?"
- "when's the best time to schedule?"

### Empathy
- "tired", "exhausted", "stressed", "overwhelmed" → soft offer to lighten the load
- "ugh", "rough day" → empathy responses

### Personality
- "tell me a joke" → 1 of 3 dad-jokes
- "love you Shelly" → blush response
- "motivate me" → encouragement

### Conversational filler
- "ok" / "cool" / "nice" → casual ack
- "lol" / "haha" → 😄
- "thanks" → 1 of 3 thank-you replies

### Account
- "log out" → confirm + sign out
- "reset" → confirm + wipe to seed

### Memory / Reminders (natural)
- "remember Aadya prefers mornings" → saves to notes
- "what do you remember?" → lists notes
- "remind me to call Rajiv in 15 minutes" → schedules
- "snooze for 1 hour" / "be quiet"

---

## Multi-Turn Conversations

For complex tasks, Shelly **walks you through it**:

### Schedule a session
```
You:    book a session
Shelly: Which learner? [Aadya] [Mivaan] [Yash] [Type a name]
You:    (tap Aadya)
Shelly: When? [Today 6:30 PM] [Tomorrow 5 PM] [Saturday 11 AM]
You:    tomorrow 7pm
Shelly: Booked! ✅ Aadya on Mon, May 12, 7:00 PM.
```

### Draft a reply
```
You:    draft a reply to Rajiv
Shelly: Their last message: "Can we move Yash's Tuesday slot to 7 PM?"
        What tone? [Warm + agree] [Brief + decline] [Apologetic]
You:    (tap Warm + agree)
Shelly: "Hi Rajiv — totally fine, I can shift Friday's session to 7:30 PM. Confirming on my end now. ✅"
        [Send it] [Open in Chats] [Rewrite]
```

### Follow-ups (Gemini history)
When you say things like "explain more", "walk me through that", "give me an example", "why?", "how exactly" — she **routes through Gemini with the last 10 conversation turns** so the answer builds on what was just said.

```
You:    how do I add a student?
Shelly: Head to Users → Invite User.
You:    walk me through that
Shelly: First, click 'Users' in the sidebar. Top-right has the 'Invite User' button.
        That opens a form for name, email, and role. Submit and they get an
        invite link. Their account appears here once they accept.
You:    give me an example
Shelly: Say you're adding Lily Chen as a student. Name: Lily Chen. Email:
        lily@parent.com. Role: Student. Hit invite — done. ✨
```

Cancel a flow anytime by typing `cancel`, `stop`, or `nevermind`. Flows auto-expire after 5 minutes of inactivity.

---

## Action System

Shelly doesn't just talk — she **does things**. Action chips on her replies (or `shelly.do.*` in code) trigger real `db` mutations that ripple across every page.

| Action | What it changes |
| --- | --- |
| **Top up** | `db.credits.balance` ⬆, new purchase row, notification fires |
| **Schedule session** | Adds to `db.sessions`, appears in upcoming list everywhere |
| **Cancel session** | Status flips to `cancelled`, learner notified |
| **Send message** | New message in `db.chats[chatId].messages` |
| **Mark all notifications read** | Unread count → 0, sidebar badge clears |
| **Add note** | New entry in `db.shellyNotes` |
| **Add reminder** | New entry in `db.shellyReminders`, fires at due time |
| **Reset demo data** | Wipes everything back to seed |
| **Log out** | Resets `me` + `auth`, returns to login |

Programmatic access:
```js
shelly.do.topUp('plus')
shelly.do.schedule(courseId, isoTimestamp)
shelly.do.cancelSession(sessionId)
shelly.do.sendMessage(chatId, text)
shelly.do.markAllRead()
shelly.do.reset()
shelly.do.logout()
shelly.do.tour()
```

---

## Rich Inline Cards

When Shelly mentions a student, session, course, or chat — she renders it as a **clickable mini-card** right inside her bubble instead of plain text.

Each card shows:
- **Student card**: avatar, name, progress bar, status pill (On track / Falling behind / At risk), last active
- **Session card**: 📅 icon, learner name, when, status pill (upcoming / cancelled / completed)
- **Course card**: course icon + colour, name, type, learner count, credits remaining
- **Chat card**: parent/student avatar, name, unread badge, last-message preview

Click any card → navigates straight to the relevant page.

```
You:    /risk
Shelly: 3 learners need attention — tap any to drill in:
        ┌────────────────────────────────────┐
        │ Y  Yash Sandhu                     │
        │    [████░░░░░░] 38% [At Risk]      │
        └────────────────────────────────────┘
        ┌────────────────────────────────────┐
        │ J  Janishaa                        │
        │    [████░░░░░] 44% [Falling]       │
        └────────────────────────────────────┘
```

Powered by `say(text, { cards: [{type, data}, …] })`.

---

## Undo Toasts

Every Shelly action (top-up, bulk cancel, mark-all-read, onboard student) shows a 5-second toast with an **Undo** button. Tap it → the mutation reverses cleanly:

- Top-up → balance reverts, purchase row removed, notification withdrawn
- Bulk cancel → sessions return to upcoming
- Bulk mark-read → unread counts restored

Builds total trust to let Shelly act on real data. Powered by `withUndo(label, doFn, undoFn)`.

---

## Compact / Expanded Modes

Two layouts via the **⊟ / ⊞** button in Shelly's header:

| Mode | Size | What's shown |
|---|---|---|
| **Full** | 380×540px | Pinned strip · search · message list · chips · input |
| **Compact** | 280px wide, auto height | Just chips + input — keep Shelly visible without taking half the screen |

Mode persists across pages via `db.shellyPanelMode`. Slash commands: `/compact` · `/expand`.

---

## Smart Context-Aware Chips

The suggestion chips below the message list are dynamically rebuilt based on **four signals**:

1. **Urgency** — what data says needs attention (low credits → "Top up credits"; unreads → "Summarise unread chats")
2. **Page context** — what page you're on (Store → "Top up Plus"; Chats → "Draft a reply"; Analytics → "Forecast next month")
3. **Habits** — your top 2 most-used slash commands (pattern learning)
4. **Staples** — always-useful fallbacks ("What's on today?", `/summary`)

Chips refresh on every `db` change, so they always reflect *right now*.

---

## Bulk Actions

One command does the job of 10 clicks. All wrapped in **Undo**.

| Command | What happens |
|---|---|
| `/bulk mark-read` | Every unread chat → marked read; sidebar badge clears across pages |
| `/bulk recap` | For each student with a session today, drafts a recap (using the `recap` template, name-filled) and sends it to their parent |
| `/bulk cancel <name>` | Every upcoming session for that learner this week → marked cancelled |

Shelly tells you exactly how many items were affected, so the Undo is always informed.

---

## Multi-Step Playbooks

Guided routines that chain multiple actions through interactive multi-turn flows.

### Built-in playbooks

**`onboard-student`** — *Onboard a new student 🎓*
1. Asks for name
2. Asks for email/phone
3. Adds the user to `db.users` (Undo-able)
4. Offers to schedule their first session
5. Offers to draft a welcome message

**`weekly-wrap`** — *End-of-week wrap 📊*
1. Shows daily summary
2. Drafts recap messages to today's parents (`/bulk recap`)
3. Offers to mark all notifications + chats read

**`friday-cleanup`** — *Friday cleanup 🧹*
1. Surfaces all cancelled sessions
2. Walks you through rescheduling each
3. Prompts a top-up if credits are running low

### Use it

```
/playbook                  → picker with all 3
/playbook onboard          → starts onboarding directly
/playbook weekly           → starts the wrap routine
```

Cancel any playbook mid-flow with `cancel`, `stop`, or `nevermind`.

---

## Pinned Insights

Pin any of Shelly's messages to keep them visible at the top of the panel.

- **Hover** any Shelly message → 📌 button appears top-right
- Click → message text saved to a yellow strip at the top of the panel (max 5 pins)
- Click ✕ on a pin to remove it
- Pins persist across pages and sessions in `db.shellyPinned`

Useful for keeping a parent draft, a student's stats, or an important reminder visible while you work elsewhere in the app.

Slash commands: `/pinned` · `/unpin all`.

---

## Universal Search

Click the **🔍** button in Shelly's header — a search bar opens above the message list. Searches across:

- **Students/parents/instructors** — by name or email
- **Courses** — 1:1, group, recorded
- **Chats** — by participant name
- **Past Shelly messages** — full-text fuzzy search of conversation history

Results are categorised with a tiny badge (`STUDENT`, `COURSE`, `CHAT`, `HISTORY`). Click any → navigates to the relevant page (or scrolls back to the past message).

Press `Esc` inside the search bar to close it.

---

## Pattern Learning

Every slash command you use bumps a counter in `db.shellyCommandUsage`. Shelly's smart-chip system uses your **top 2 most-used commands** as default suggestions — so the more you use her, the more her suggestions match your actual workflow.

Future hooks (planned):
- *"You always schedule Aadya at 6:30 PM — make that the default?"*
- *"You've used `/template recap` 12 times — want a one-click button on the Course Home page?"*

---

## Inline Sparklines

Tiny SVG charts embedded directly in Shelly's bubbles for at-a-glance trend data.

Currently used in:
- `/credits` — shows weekly session-volume trend next to your balance

The renderer (`sparklineSvg(data, w, h)`) takes any number array and produces a 60×18 purple polyline. Plug it into any reply with `text + sparklineSvg([…])`.

---

## Memory Features

### Personal notes
Tell Shelly to remember anything:
```
remember Aadya prefers morning sessions
remember Yash's mum is a doctor — flexible weekend times
```
Listed via `/notes`, referenced in Gemini fallback context, persisted across pages and sessions.

### Persistent conversation
Every message (yours + hers) lives in `db.shellyChat`. On every page load, the conversation is restored — **she never forgets context as you navigate**. Capped at 80 messages (trims oldest first).

### Search past messages
```
/search aadya
/search credits
```
Fuzz-finds any past message containing your query, returns the 4 most recent matches with snippets.

---

## Reminders & Snooze

### Reminders
Time-based pings that fire even when you're on another page:
```
/remind call Rajiv back in 15m
/remind topup next week in 7d
remind me to send recap in 2 hours
```
Supports: `s/sec/seconds`, `m/min/minutes`, `h/hr/hours`, `d/days`. Listed via `/reminders`. Comes with a "Snooze 10 min" action chip when it fires.

### Snooze
Mute proactive nudges (reminders still fire):
```
/snooze 30m
/snooze 2h
be quiet for an hour
```
`/unsnooze` or "wake up" brings her back.

---

## Streak & Daily Briefing

### Streak counter 🔥
Tracks consecutive days you've opened Shelly's panel:
- Day 1 → *"First day — let's start a streak. 🌱"*
- Day 2 → *"One day in — keep it going! 🌱"*
- Day 7+ → *"A full week — legendary."*

Stored in `db.shellyPrefs.streak`. Missing a day resets to 1. View anytime with `/streak`.

### Daily morning briefing
The **first** time Shelly opens each calendar day, she auto-runs a personalised briefing:
- Time-aware greeting (*"good morning ☀️"*, *"late-night session?"*)
- Your current streak with celebration
- Today's snapshot: sessions, unread chats/notifs, at-risk learners, credit balance
- Quick-jump buttons to Chats / Progress / Notifications

Shows once per day. Tracked via `db.shellyPrefs.lastBriefingDay`.

---

## Proactive Nudges

Every 30 seconds (while not snoozed), Shelly checks your data and surfaces things automatically:

| Trigger | She says |
| --- | --- |
| Credit balance < 8 | *"Heads up — only X credits left. Top up Plus?"* |
| Unread chat aging > 30 min | *"A chat with Neha is getting cold. Want me to draft a reply?"* |
| Reminder due | *"⏰ Reminder: <your text>"* with snooze chip |

Each nudge type is **throttled** (won't repeat for 15-30 minutes) so she's never annoying.

---

## Gemini Fallback

When Shelly's rule-based router can't match a query, she **silently** falls back to Google Gemini 2.5 Flash with:

- A tightly-scoped system prompt locking her to the tutor-platform domain
- A live snapshot of your `db` data (credits, students, sessions, notes)
- The **last 10 conversation turns** as `contents` for multi-turn coherence

### Architecture
```
Browser (gemini.js)
  ↓ POST /api/shelly { query, context, history }
Vercel Serverless Function (api/shelly.js)
  ↓ uses process.env.GEMINI_API_KEY (server-side only)
Google Gemini 2.5 Flash
  ↑ returns text
```

The API key **never reaches the browser**. If Gemini fails (no key, rate limit, network), Shelly silently falls back to her rule-based reply — the user never sees an error.

### Safety
- System prompt enforces strict scope → off-topic queries get the canned refusal
- HTML escaped before rendering → no XSS even if Gemini returns weird HTML
- Token cap: 380 output
- Temperature: 0.6 (confident but not robotic)

---

## Keyboard Shortcuts

| Shortcut | What it does |
|---|---|
| `Cmd+K` (Mac) · `Ctrl+K` (Win/Linux) | Opens Shelly + focuses her input from anywhere |
| `/` (alone, when not typing in a field) | Opens Shelly with `/` pre-filled, ready for a command |
| `Esc` | Closes Shelly's panel · or the search bar · or the topmost modal |
| **🔍** (header button) | Opens universal search |
| **⊟ / ⊞** (header button) | Toggles compact / expanded panel |
| **⋮** (header button) | Menu: Clear conversation · Reset demo data |
| **📌** (hover any reply) | Pin it to the top of the panel |

---

## Personality Details

- **Voice**: warm, casual, sometimes lowercase
- **Brevity**: 2–4 sentences max, never wall-of-text
- **Empathy**: detects frustration ("tired", "stressed") and offers help
- **Catchphrase**: *"Shelly the Super 🦸‍♀️"*
- **Emoji**: tasteful (🌟 💜 ⏰ 💳 🔥 🦸‍♀️) — never spammed
- **HTML formatting**: uses `<strong>`, `<em>`, `<code>` (rendered as HTML, not markdown)
- **Time of day awareness**: greetings change with the hour
- **Random variants**: greetings, jokes, motivational lines all rotate (3-4 variants each) so she doesn't repeat
- **Pre-message "thinking" filler**: occasional natural beats like *"hmm, lemme check"* before longer answers

### Sample of her voice
- *"Saved a tutor 47 minutes today — not bad. 🦸‍♀️"*
- *"long day? I got the admin — just say /today and I'll show you the shortest path through it."*
- *"Aww, stop it — I'm blushing under this mask. 💗"*
- *"Anytime! 💜"* / *"That's what sidekicks are for. 🦸‍♀️"* / *"On it, always. 🌟"*

---

## Architecture

### Files involved
| File | Role |
| --- | --- |
| `shelly.js` | The brain. UI, router, multi-turn flows, tour engine, action system, proactive nudges, hotkeys, streak, briefing, search. Auto-loads `gemini.js`. |
| `gemini.js` | Browser-side Gemini adapter. Builds context, posts to `/api/shelly`. |
| `api/shelly.js` | Vercel serverless function. Holds the API key. Strict system prompt + safety filters. |
| `data.js` | The `db` she reads from + writes to. Includes `shellyChat`, `shellyNotes`, `shellyReminders`, `shellyMutedUntil`, `shellyPrefs`, `shellyPinned`, `shellyCommandUsage`, `shellyPanelMode`. |
| `app.js` | Provides `app.modal()`, `app.toast()`, `app.field()` helpers Shelly uses. |

### Public API
```js
window.shelly.say(text, opts)       // make her say something
window.shelly.ask(query)            // simulate user input
window.shelly.open()                // show the panel
window.shelly.close()               // hide it
window.shelly.toggle()              // flip it
window.shelly.context(ctx)          // page tells her where you are
window.shelly.suggest([...])        // refresh the chip suggestions
window.shelly.tour()                // start the spotlight tour
window.shelly.summary()             // show daily snapshot
window.shelly.schedule(student?)    // start scheduling flow
window.shelly.draft(name?)          // start drafting flow
window.shelly.template(key)         // get a message template
window.shelly.remember(text)        // save a note
window.shelly.remind(text, dueAt)   // set a reminder
window.shelly.snooze(minutes)       // mute her
window.shelly.do.* (see Action System)

// v3 helpers also accessible from any page
withUndo(label, doFn, undoFn)       // wrap any mutation with Undo
sparklineSvg(data, w, h)            // tiny inline chart
runPlaybook('onboard-student' | 'weekly-wrap' | 'friday-cleanup')
bulkMarkAllChatsRead()
bulkCancelStudentSessionsThisWeek(studentId)
bulkSendRecapToToday()
```

---

## Extending Shelly

### Add a new intent
Open `shelly.js`, find `function route(q)`, add a regex test + reply:
```js
if (/^(my custom phrase)/i.test(s))
  return "<strong>Custom reply</strong> using db values: " + db.get().me.name + ".";
```
Done — natural language now hits your new intent.

### Add a new slash command
In the same file, find `function runCommand(cmd)`, add a new branch:
```js
if (c === '/mycommand') {
  // do stuff, return string or { text, actions }
  return 'Result string';
}
```

### Add a new action chip handler
Find `function handleAction(action, args)`:
```js
if (action === 'my-action') {
  db.update(d => { /* mutate */ });
  say('Done!');
  return;
}
```

### Add a new playbook
Drop a new entry into the `PLAYBOOKS` constant in `shelly.js`:
```js
PLAYBOOKS['my-routine'] = {
  name: 'My morning ritual ☕',
  run: function () {
    open();
    say('Step 1…', { instant: true });
    setTimeout(function () { /* step 2 */ }, 800);
  },
};
```
It auto-appears in the `/playbook` picker.

### Add cards to a reply
Any reply can include rich cards:
```js
say('Here are at-risk learners:', {
  cards: db.atRisk().map(s => ({ type: 'student', data: s }))
});
```
Supported types: `student`, `session`, `course`, `chat`.

### Teach her about new data
Add fields to `SEED` in `data.js`. They'll automatically be available in Gemini context (Shelly's system prompt includes a live snapshot).

---

## TL;DR

Shelly is:
- A **floating animated superhero girl** (custom SVG, edge-traced shadow, idle bobbing)
- Who **reads your real data** and **performs real actions** — every action wrapped in **5-second Undo**
- Renders **rich inline cards** (students, sessions, courses, chats) in chat — clickable, navigable
- Walks you through **multi-turn flows** for complex tasks
- Runs **multi-step playbooks** (onboard a new student, weekly wrap, friday cleanup)
- Has **bulk actions** (`/bulk mark-read`, `/bulk recap`, `/bulk cancel <name>`) — one command does the job of 10 clicks
- **Remembers** notes, reminders, conversations across pages
- Lets you **pin** important insights to the top of the panel
- Has a **universal search** — students, courses, chats, past Shelly messages
- **Smart context-aware chips** that change per-page + adapt to your habits
- Tracks your **streak**, runs a **morning briefing**, embeds **inline sparklines**
- Has **50+ natural-language intents** + **30 slash commands**
- Opens with **Cmd+K** from anywhere · **⊟** for compact mode
- Silently falls back to **Gemini** for off-script questions, with the API key safely server-side
- Refuses off-topic queries with one consistent line
- **v3 — never been more powerful.** 🦸‍♀️
