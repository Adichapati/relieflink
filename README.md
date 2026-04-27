# ReliefLink

AI-powered disaster relief coordination.

ReliefLink turns messy distress messages — typed, spoken, or pasted in any
language — into structured tasks, then matches each one to the closest
qualified volunteer in seconds. One coordinator dashboard, one volunteer view,
one live picture of who needs what and who is on the way.

## What it does

- **Two roles, realistic boundaries.** Self-signup is volunteer-only.
  Coordinator (admin) accounts are issued out of band — seeded by the
  setup script or created in the Firebase console. The backend rejects
  any client attempt to self-promote.
- **Volunteer location capture.** At signup, volunteers can grant the
  browser geolocation prompt with one tap or type a city; coordinates
  are persisted on the user doc and feed directly into the matcher's
  distance scoring.
- **Volunteer-first reporting.** Volunteers can also decode and submit
  distress signals from the field. Submitted signals enter an
  admin-only review queue first.
- **Coordinator approval gate.** Every decoded signal lands in
  `needs_approval` (or `needs_review` if low-confidence) and only becomes
  visible to volunteers and matchable after a coordinator approves it.
  Prevents spam and keeps a human in the loop.
- **Free-text intake.** Paste a raw distress message; Gemini 2.5 Flash-Lite
  extracts category, urgency, location, and quantity into a typed schema.
- **Voice intake.** Record up to 30 s of audio in the browser; the same
  Gemini model transcribes and extracts in one call. Re-encoded to WAV
  client-side so it stays on Gemini's supported audio mime list.
- **Multilingual.** Non-English messages are translated to English during
  extraction. A dedicated demo button loads a Spanish sample.
- **Backend geocoding.** Extracted location text is resolved to lat/lng on
  the server before persistence.
- **AI matching with rationale.** For each request, Gemini scores available
  volunteers on skill match, distance (haversine, computed server-side),
  and availability. The rationale is stored on the request and shown in
  the UI ("Priya, medical, 1.4 km away").
- **Manual assignment.** Coordinator can override the AI and pick a
  specific volunteer from a live, skill-aware picker on each card.
- **Delete signals.** Coordinator can remove erroneous or duplicate
  reports; if the request was assigned, the volunteer is freed automatically.
- **Live coordination.** Both dashboards use Firestore `onSnapshot` for
  real-time updates and fall back to REST polling if security rules block
  client reads.
- **Tactical map.** Dark Leaflet map with red/amber/green pins by urgency,
  green volunteer pins, and animated routing lines from volunteer to
  request (dashed when assigned, flowing solid when dispatched).
- **3D globe.** Drag-rotatable Three.js globe with continent-level lift on
  hover; pin counts come from live tasks.
- **Coordinator actions.** Approve, Auto-Match all pending, Manual Assign,
  Delete, Complete, Reassign, edit extraction.
- **Volunteer actions.** Accept, Decline, Mark Complete; volunteer is
  automatically returned to `available` on completion or decline.
- **Demo mode.** Single button streams 5 staged distress messages into
  review, pauses to show the human-in-the-loop approval, bulk-approves,
  then auto-matches — removes typing risk during the pitch.
- **Toasts.** Live transitions (new signal, matched, dispatched, resolved)
  surface as bottom-right notifications.
- **Impact section.** Stats are computed from real tasks: cases resolved,
  match rate, avg minutes-to-assign, signals decoded.

## Architecture

```
                     ┌────────────────────────────────────────┐
                     │                Browser                 │
                     │  React + Vite + Three.js + Leaflet     │
                     │  ─ Auth via Firebase                   │
                     │  ─ Live tasks via onSnapshot or poll   │
                     │  ─ Voice capture via MediaRecorder→WAV │
                     └─────┬─────────────────────────┬────────┘
                           │                         │
        text / audio       │ POST /extract-{request,voice}
                           ▼                         │
                ┌────────────────────────┐           │
                │   Express functions    │           │
                │  ─ Gemini extraction   │           │
                │  ─ Geocode location    │           │
                │  ─ Gemini match w/     │           │
                │    distance reasoning  │           │
                │  ─ Firestore writes    │           │
                └─────┬──────────────────┘           │
                      │                              │
                      ▼                              │
              ┌──────────────┐                       │
              │  Firestore   │ ◄─────────────────────┘
              │ requests /   │   (live snapshot read or
              │ users        │    REST /tasks fallback)
              └──────────────┘
```

## Repo structure

```
relieflink/
├── functions/
│   ├── package.json
│   └── src/
│       ├── index.js          # Express app, all REST endpoints
│       ├── aiExtractor.js    # Gemini text + audio extraction
│       ├── aiMatcher.js      # Gemini volunteer matcher
│       ├── geocode.js        # City lookup + haversine distance
│       ├── firebase.js       # firebase-admin init
│       ├── seed.js           # Volunteer + request seed script
│       └── serviceAccountKey.json   (gitignored)
├── web/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx           # Router + AuthContext + Toasts
│       ├── main.jsx
│       ├── firebaseClient.js # Auth + Firestore client SDK
│       ├── pages/            # Landing, Auth, SkillSetup, Admin, Volunteer
│       ├── hooks/            # useLiveTasks, useVoiceRecorder, useToasts, …
│       ├── components/
│       │   ├── sections/     # Hero, Intake (text+voice), Operations, Impact
│       │   ├── dashboard/    # KanbanBoard, RequestCard, AnimatedCounter
│       │   ├── map/          # TacticalMap (with routing lines)
│       │   ├── globe/        # Three.js scene + continent meshes
│       │   ├── layout/       # Navbar
│       │   └── ui/           # Toasts, FieldReveal, ScrollProgress
│       ├── lib/
│       │   ├── taskAdapter.js     # normalize + globe pin classifier
│       │   └── continentData.js
│       └── styles/           # tokens, reset, global, animations
├── docs/
│   ├── hackathon-package.md
│   └── PROJECT_BOARD.md
└── package.json              # root npm scripts
```

## REST endpoints (`functions/src/index.js`)

| Method | Path                  | Purpose                                          |
|--------|-----------------------|--------------------------------------------------|
| GET    | `/health`             | Liveness                                         |
| POST   | `/extract-request`    | Text → structured request → Firestore            |
| POST   | `/extract-voice`      | Audio (base64 WAV) → structured request          |
| POST   | `/approve-request`    | Coordinator gates a signal into `pending`        |
| POST   | `/approve-all`        | Bulk-approve everything in review (demo mode)    |
| POST   | `/match-request`      | Run AI matcher, assign best volunteer            |
| POST   | `/assign-request`     | Manually assign a specific volunteer             |
| POST   | `/update-request`     | Edit extracted fields (human-in-the-loop)        |
| POST   | `/complete-request`   | Coordinator marks complete, frees volunteer      |
| POST   | `/reassign-request`   | Coordinator unassigns, returns to pending        |
| POST   | `/delete-request`     | Coordinator removes a signal, frees volunteer    |
| POST   | `/accept-mission`     | Volunteer accepts assignment → dispatched        |
| POST   | `/decline-mission`    | Volunteer declines, request returns to pending   |
| POST   | `/complete-mission`   | Volunteer marks complete                         |
| POST   | `/add-user`           | Create or update user profile (volunteer only)   |
| GET    | `/user/:firebaseUid`  | Fetch profile                                    |
| GET    | `/volunteers`         | List volunteers (`?available=true` filters)      |
| GET    | `/tasks`              | All requests (used as snapshot fallback)         |

## Setup

### Prerequisites

- Node 18+
- A Firebase project with Authentication and Firestore enabled
- A Gemini API key (free tier works)

### Environment variables

Two sets — see `.env.example` and `web/.env.example` for templates.

**Frontend** (`web/.env.local` for dev, Vercel dashboard for prod):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_BASE=          # leave blank locally; set to /api on Vercel
```

**Backend** (`functions/.env` for dev, Vercel dashboard for prod):

```
GEMINI_API_KEY=...
FIREBASE_SERVICE_ACCOUNT=  # Vercel only — JSON contents of the service account
```

For local dev, place your Firebase service account key at
`functions/src/serviceAccountKey.json` (download from Firebase Console →
Project Settings → Service accounts). It is gitignored. On Vercel, paste
the JSON contents into the `FIREBASE_SERVICE_ACCOUNT` env var instead.

### Firestore rules

The frontend uses live `onSnapshot` listeners. To enable them, set rules to
allow authenticated reads:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /requests/{doc} { allow read: if request.auth != null; }
    match /users/{doc}    { allow read: if request.auth != null; }
  }
}
```

If rules block client reads, the frontend automatically falls back to
polling `/tasks` every 3 seconds.

### Install and run

```bash
# from repo root
npm install                                # root deps
npm --prefix web install                   # frontend deps
npm --prefix functions install             # backend deps
```

```bash
# terminal 1 — backend on http://localhost:8787
npm --prefix functions run dev

# terminal 2 — frontend on http://localhost:5173
npm run dev
```

### Seed demo data

Creates a demo coordinator account, 6 volunteers (skills + lat/lng across
India), and 8 sample requests in `needs_approval`:

```bash
npm --prefix functions run seed
```

Default credentials printed by the script:
```
admin@relieflink.demo / ReliefLink!2026
```

Wipe existing requests and reseed:

```bash
npm --prefix functions run reset
```

## Deploying to Vercel

The repo is wired up for a single-platform Vercel deploy: the Vite frontend
ships as static assets and the Express backend runs as one serverless
function under `/api/*`.

### Layout

```
api/[...path].js     ← thin adapter that forwards every /api/* request to
                       the Express app (strips the /api prefix first)
functions/src/app.js ← the Express app itself (no listener, exports default)
functions/src/index.js ← local-dev listener (port 8787)
vercel.json          ← buildCommand + outputDirectory
```

### Steps

1. Push the repo to GitHub and import it in Vercel — pick "Other" framework
   (the included `vercel.json` does the rest).
2. In **Vercel → Project → Settings → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `GEMINI_API_KEY` | your Gemini key |
   | `FIREBASE_SERVICE_ACCOUNT` | the **entire contents** of your `serviceAccountKey.json`, pasted as one line |
   | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | values from the Firebase console |
   | `VITE_API_BASE` | `/api` |

3. **Add your Vercel domain to Firebase Auth → Authorized Domains**
   (Firebase Console → Authentication → Settings → Authorized domains).
   Otherwise Google sign-in will fail in production.
4. Click **Deploy**. The first build runs `npm run vercel-build`, which
   installs and builds `web/`. The serverless function is auto-discovered.

### Limits to be aware of

- **Function timeout**: Hobby tier caps at 10 s. A typical Gemini text
  extraction returns in 1–3 s, but voice extraction can run 6–12 s. If
  voice intake times out for you, either upgrade to Pro (60 s) and add
  `"functions": { "api/[...path].js": { "maxDuration": 30 } }` to
  `vercel.json`, or move just the voice endpoint off Vercel.
- **Request body size**: Hobby caps at 4.5 MB. A 30-s WAV is ~2.6 MB
  base64, so you'll fit; longer recordings won't. Express's body limit is
  already raised to 12 MB in `app.js`.
- **Cold starts** add ~1 s on the first hit after idle.

### Local dev still works

`functions/src/index.js` keeps the standalone listener on port 8787, and
`web/src/lib/apiBase.js` defaults to that URL when `VITE_API_BASE` is unset.
Run `npm --prefix functions run dev` + `npm run dev` exactly as before.

## Demo flow (3 minutes)

1. **Log in as admin** with the seeded coordinator account. Globe rotating,
   kanban empty.
2. **Click Demo Mode.** Five distress signals stream into the AWAITING
   REVIEW column over ~12 s; toasts cascade. After a brief pause the
   coordinator approval fires and the cards roll into PENDING, then
   auto-match assigns each one with a Gemini rationale.
3. **Click "Why this match?"** on any card to expose the rationale —
   "Priya, medical, 1.4 km away."
4. **Switch to map view.** Volunteer pins (green) and request pins
   (red/amber) connected by routing lines, distance label at midpoint.
5. **Scroll to intake → switch to Voice.** Record a fresh distress message;
   watch the visualizer pulse. Hit Decode. The new card lands in
   AWAITING REVIEW. Click **Approve**, then **Assign…** to manually
   pick a volunteer.
6. **Click Load ES, Decode.** Same pipeline understands Spanish, returns
   English-structured fields.
7. **Open another browser, sign up as a volunteer.** Watch the assigned
   missions appear with Accept / Decline.
8. **Scroll to Impact.** Counters animate up from real numbers.

## Tech stack

- **Frontend**: React 18, Vite 5, React Router 6, Framer Motion,
  Three.js / @react-three/fiber, Leaflet
- **Backend**: Node 18, Express 4, firebase-admin 12, @google/generative-ai
- **AI**: Gemini 2.5 Flash-Lite (text + audio multimodal, structured JSON
  output via `responseSchema`)
- **Database / Auth**: Firebase Firestore + Firebase Auth
- **Maps**: Leaflet with CartoDB dark tiles
- **Hosting**: Vercel (static frontend + Express backend as one serverless
  function under `/api/*`). See the *Deploying to Vercel* section.

## Future scope

- OR-Tools optimization for batch matching
- WhatsApp / SMS intake via Twilio webhook into `/extract-request`
- Photo intake (Gemini Vision) for damage assessment
- Mobile-first volunteer view + push notifications via FCM
- Audit log of all state transitions

## License

MIT — see `LICENSE`.
