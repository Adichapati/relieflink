# ReliefLink

AI-powered disaster relief coordination.

ReliefLink turns messy distress messages — typed, spoken, or pasted in any
language — into structured tasks, then matches each one to the closest
qualified volunteer in seconds. One coordinator dashboard, one volunteer view,
one live picture of who needs what and who is on the way.

## What it does

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
- **Live coordination.** Both dashboards use Firestore `onSnapshot` for
  real-time updates and fall back to REST polling if security rules block
  client reads.
- **Tactical map.** Dark Leaflet map with red/amber/green pins by urgency,
  green volunteer pins, and animated routing lines from volunteer to
  request (dashed when assigned, flowing solid when dispatched).
- **3D globe.** Drag-rotatable Three.js globe with continent-level lift on
  hover; pin counts come from live tasks.
- **Coordinator actions.** Auto-Match all pending, Complete, Reassign,
  edit extraction.
- **Volunteer actions.** Accept, Decline, Mark Complete; volunteer is
  automatically returned to `available` on completion or decline.
- **Demo mode.** Single button streams 5 staged distress messages through
  the pipeline and auto-matches them — removes typing risk during the pitch.
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
| POST   | `/match-request`      | Run AI matcher, assign best volunteer            |
| POST   | `/update-request`     | Edit extracted fields (human-in-the-loop)        |
| POST   | `/complete-request`   | Coordinator marks complete, frees volunteer      |
| POST   | `/reassign-request`   | Coordinator unassigns, returns to pending        |
| POST   | `/accept-mission`     | Volunteer accepts assignment → dispatched        |
| POST   | `/decline-mission`    | Volunteer declines, request returns to pending   |
| POST   | `/complete-mission`   | Volunteer marks complete                         |
| POST   | `/add-user`           | Create or update user profile                    |
| GET    | `/user/:firebaseUid`  | Fetch profile                                    |
| GET    | `/tasks`              | All requests (used as snapshot fallback)         |

## Setup

### Prerequisites

- Node 18+
- A Firebase project with Authentication and Firestore enabled
- A Gemini API key (free tier works)

### Environment variables

Create `web/.env`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Create `functions/.env`:

```
GEMINI_API_KEY=...
```

Place your Firebase service account key at
`functions/src/serviceAccountKey.json` (download from Firebase Console →
Project Settings → Service accounts). It is gitignored.

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

Populates 6 volunteers (with skills + lat/lng across India) and 8 sample
requests:

```bash
npm --prefix functions run seed
```

Wipe existing requests and reseed:

```bash
npm --prefix functions run reset
```

## Demo flow (3 minutes)

1. **Open the admin dashboard.** Globe rotating, kanban empty.
2. **Click Demo Mode.** Five distress signals stream in over ~12 seconds;
   toasts cascade in the corner. The auto-match fires at the end and the
   rationale toggle on each card explains *why* this volunteer.
3. **Switch to map view.** Volunteer pins (green) and request pins
   (red/amber) connected by routing lines, distance label at midpoint.
4. **Scroll to intake → switch to Voice.** Record a fresh distress message;
   watch the visualizer pulse. Hit Decode. Field-reveal animation plays.
5. **Click Load ES, Decode.** Same pipeline understands Spanish, returns
   English-structured fields.
6. **Scroll to Impact.** Counters animate up from real numbers.

## Tech stack

- **Frontend**: React 18, Vite 5, React Router 6, Framer Motion,
  Three.js / @react-three/fiber, Leaflet
- **Backend**: Node 18, Express 4, firebase-admin 12, @google/generative-ai
- **AI**: Gemini 2.5 Flash-Lite (text + audio multimodal, structured JSON
  output via `responseSchema`)
- **Database / Auth**: Firebase Firestore + Firebase Auth
- **Maps**: Leaflet with CartoDB dark tiles
- **Hosting (suggested)**: Firebase Hosting (web) + Cloud Run / Functions
  (backend)

## Future scope

- OR-Tools optimization for batch matching
- WhatsApp / SMS intake via Twilio webhook into `/extract-request`
- Photo intake (Gemini Vision) for damage assessment
- Mobile-first volunteer view + push notifications via FCM
- Audit log of all state transitions

## License

MIT — see `LICENSE`.
