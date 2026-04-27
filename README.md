<div align="center">

```
██████╗ ███████╗██╗     ██╗███████╗███████╗██╗     ██╗███╗   ██╗██╗  ██╗
██╔══██╗██╔════╝██║     ██║██╔════╝██╔════╝██║     ██║████╗  ██║██║ ██╔╝
██████╔╝█████╗  ██║     ██║█████╗  █████╗  ██║     ██║██╔██╗ ██║█████╔╝
██╔══██╗██╔══╝  ██║     ██║██╔══╝  ██╔══╝  ██║     ██║██║╚██╗██║██╔═██╗
██║  ██║███████╗███████╗██║███████╗██║     ███████╗██║██║ ╚████║██║  ██╗
╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚══════╝╚═╝     ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

### **Turn distress signals into coordinated action.**

*AI-powered disaster relief coordination · Gemini-decoded · Live map · Real-time matching*

[![Made with React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash--Lite-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-00ff88?style=flat-square)](LICENSE)

</div>

---

## ⚡ What is ReliefLink?

When disaster strikes, the bottleneck isn't compassion — it's **triage**. Distress signals arrive as messy, multilingual, half-finished messages, and coordinators waste hours doing what an AI can do in seconds.

**ReliefLink** is the relief operations command center.
You feed it a raw cry for help — by **text** or by **voice**, in **English, Spanish, Hindi, French, Portuguese, or Arabic** — and the platform takes it from there:

```
  ✉  raw signal  →  🤖 Gemini decode  →  📍 geocode  →  ⚖️ AI match  →  🚨 dispatch
```

The whole pipeline runs in **under a minute**, with a human coordinator in the loop for approval and a live tactical map showing every signal, every volunteer, and every route as it happens.

---

## ✨ Highlights

|  |  |
|--|--|
| 🧠 **Gemini-decoded intake** | Text or voice. Six languages. Structured JSON output via `responseSchema`. |
| 🗺️ **Live tactical map** | Leaflet pins for signals + volunteers, animated routing lines, distance labels. |
| 🌍 **Three.js globe** | Interactive globe with continent-grouped pins, drag-to-rotate, hover-to-pause. |
| ⚖️ **AI matching** | Distance-scored, skill-aware. Volunteers see the rationale ("Priya, medical, 1.4 km"). |
| 👥 **Two roles** | Volunteers self-onboard with skills + GPS. Admins are seeded out-of-band. |
| ✅ **Human-in-the-loop** | Every signal hits an Awaiting Review column. Approve / delete / manual-assign. |
| 📊 **Analytics tab** | Category mix, urgency stack, response-time histogram, hot zones, leaderboard. |
| 🔴 **Real-time** | Firestore `onSnapshot` with REST polling fallback when rules block client reads. |
| 🎬 **Demo mode** | One click streams 5 fake signals through the entire pipeline for judges. |
| 💾 **Vercel-ready** | Single deploy: static frontend + Express-as-serverless-function. |

---

## 🎬 Live demo flow (3 minutes)

1. **Log in as admin.** Globe rotates, kanban empty.
2. **Click `Demo Mode`.** Five distress signals stream into `AWAITING REVIEW` over ~12 s; toasts cascade.
3. The coordinator approves them in bulk; cards roll into `PENDING` and auto-match assigns each one with a Gemini rationale.
4. **Click "Why this match?"** to expose the reasoning — *"Priya, medical, 1.4 km away."*
5. **Switch to Tactical Map.** Volunteer pins (green) and request pins (red/amber) connected by dashed routing lines.
6. **Switch to Analytics.** Category mix, urgency stack, response time histogram, top hot zones, volunteer leaderboard.
7. **Scroll to Intake → switch to Voice.** Record a fresh distress message; visualizer pulses; hit Decode.
8. **Click `Load HI`.** Same pipeline understands Hindi and shows the original-language badge on the card.
9. **Open another browser, sign up as a volunteer.** Watch missions appear with Accept / Decline.

---

## 🏛 Architecture

```
                  ┌──────────────────────────────────────────────────────┐
                  │                       VERCEL                         │
                  │  ┌──────────────────┐    ┌──────────────────────┐    │
                  │  │  React + Vite    │───▶│   /api  (Express)    │    │
                  │  │  static dist     │    │   serverless fn      │    │
                  │  └─────────┬────────┘    └──────────┬───────────┘    │
                  └────────────│────────────────────────│────────────────┘
                               │ onSnapshot              │ firebase-admin
                               ▼                         ▼
                  ┌──────────────────────────────────────────────────────┐
                  │                      FIREBASE                        │
                  │       Auth          ·         Firestore              │
                  └──────────────────────────────────────────────────────┘
                                          │
                                          ▼
                  ┌──────────────────────────────────────────────────────┐
                  │                   GEMINI 2.5 Flash-Lite              │
                  │   text + audio multimodal · structured JSON output   │
                  └──────────────────────────────────────────────────────┘
```

### Request lifecycle

```
   needs_approval  ─►  needs_review                  ◀── extracted by Gemini
        │                  │
        ▼                  ▼
        ▶─────►  pending  ◀──── (admin approves)
                     │
                     ▼
                  assigned  ◀── (AI matcher OR manual pick)
                     │
                     ▼
                  dispatched  ◀── (volunteer accepts)
                     │
                     ▼
                  completed
```

---

## 📁 Repo structure

```
relieflink/
├── api/
│   └── [...path].js              # Vercel serverless adapter (Express → /api/*)
├── functions/
│   └── src/
│       ├── app.js                # Express app (all routes)
│       ├── index.js              # Local dev listener (port 8787)
│       ├── aiExtractor.js        # Gemini text + voice extraction
│       ├── aiMatcher.js          # Volunteer matching prompt + scoring
│       ├── geocode.js            # City → lat/lng dictionary + haversine
│       ├── firebase.js           # firebase-admin (env or local key)
│       └── seed.js               # Demo admin + 6 volunteers + 8 requests
├── web/
│   └── src/
│       ├── pages/                # LandingPage, AuthPage, SkillSetupPage, AdminDashboard, VolunteerDashboard
│       ├── components/
│       │   ├── globe/            # Three.js globe + continent pins
│       │   ├── map/              # Leaflet tactical map
│       │   ├── dashboard/        # Kanban, RequestCard, AnalyticsView
│       │   ├── sections/         # Intake, Operations, Impact, Hero
│       │   ├── landing/          # Decode title, magnetic CTA, scrollytelling
│       │   ├── layout/           # Navbar
│       │   └── ui/               # Toasts, FieldReveal, ScrollProgress
│       ├── hooks/                # useLiveTasks, useVoiceRecorder, useToasts, ...
│       ├── lib/                  # apiBase, taskAdapter
│       └── firebaseClient.js
├── vercel.json                   # Build + output config
└── README.md
```

---

## 🚀 Quick start (local)

### Prerequisites

- **Node 18+**
- A **Firebase project** with Authentication and Firestore enabled
- A **Gemini API key** ([free tier works](https://aistudio.google.com/app/apikey))

### 1. Clone and install

```bash
git clone https://github.com/your-handle/relieflink.git
cd relieflink
npm install
npm --prefix web install
npm --prefix functions install
```

### 2. Drop in credentials

| File | Purpose |
|---|---|
| `functions/src/serviceAccountKey.json` | Firebase Admin key — Project Settings → Service accounts → Generate new private key |
| `functions/.env` | `GEMINI_API_KEY=your_key` |
| `web/.env.local` | Firebase web SDK config (see `web/.env.example`) |

> **🔒 Never commit these.** They're in `.gitignore` already.

### 3. Run it

```bash
# terminal 1 — backend on http://localhost:8787
npm --prefix functions run dev

# terminal 2 — frontend on http://localhost:5173
npm run dev
```

### 4. Seed the demo

```bash
npm --prefix functions run seed
```

This creates:

- **1 admin** — `admin@relieflink.demo / ReliefLink!2026`
- **6 demo volunteers** spread across India (tagged `is_seed`, hidden from real matching)
- **8 sample requests** in `needs_approval`

To wipe and reseed:

```bash
npm --prefix functions run reset
```

---

## ☁️ Deploying to Vercel

The repo is wired up for a **single-platform Vercel deploy**: the Vite frontend ships as static assets and the Express backend runs as one serverless function under `/api/*`.

### Step by step

1. **Push to GitHub.** Confirm `serviceAccountKey.json` is not committed.
2. **Import the repo in Vercel** — pick "Other" framework. The included `vercel.json` does the rest.
3. **Set env vars** in Vercel → Settings → Environment Variables (use the dashboard's *Import .env* button):

   | Variable | Value |
   |---|---|
   | `GEMINI_API_KEY` | your Gemini key |
   | `FIREBASE_SERVICE_ACCOUNT` | the **entire JSON** from `serviceAccountKey.json`, on one line |
   | `VITE_FIREBASE_API_KEY` | from Firebase Console → Project Settings → Your apps → Web |
   | `VITE_FIREBASE_AUTH_DOMAIN` | …same place |
   | `VITE_FIREBASE_PROJECT_ID` | …same place |
   | `VITE_FIREBASE_STORAGE_BUCKET` | …same place |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | …same place |
   | `VITE_FIREBASE_APP_ID` | …same place |
   | `VITE_API_BASE` | `/api` |

   To get the service account on one line:
   ```bash
   node -e "console.log(JSON.stringify(JSON.stringify(require('./functions/src/serviceAccountKey.json'))))"
   ```

4. **Add your Vercel domain to Firebase** → Authentication → Settings → Authorized domains.
   *(Otherwise Google sign-in fails in production.)*

5. **Deploy.** Vercel runs `npm run vercel-build` and auto-discovers the serverless function.

### ⚠️ Limits to know

| Limit | Hobby tier | Mitigation |
|---|---|---|
| Function timeout | 10 s | Voice extract can run 6–12 s. Upgrade to Pro (60 s) if needed. |
| Request body | 4.5 MB | A 30 s WAV is ~2.6 MB base64 — you're fine. |
| Cold start | ~1 s | First request after idle. |

---

## 🔌 REST API

All endpoints are served by `functions/src/app.js`. Locally on `http://localhost:8787`. On Vercel under `/api/*`.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET`  | `/health` | Liveness probe |
| `POST` | `/extract-request` | Decode raw text → structured signal, save to Firestore |
| `POST` | `/extract-voice` | Decode base64 WAV → structured signal, save to Firestore |
| `POST` | `/match-request` | Run Gemini matcher and assign a volunteer |
| `POST` | `/approve-request` | Admin approves a `needs_approval` signal |
| `POST` | `/approve-all` | Bulk approve everything in review |
| `POST` | `/assign-request` | Manual assign by coordinator |
| `POST` | `/update-request` | Edit extracted fields (human override) |
| `POST` | `/complete-request` | Mark request done, free volunteer |
| `POST` | `/reassign-request` | Free volunteer, return signal to pending |
| `POST` | `/delete-request` | Delete a signal |
| `POST` | `/accept-mission` | Volunteer accepts → status `dispatched` |
| `POST` | `/decline-mission` | Volunteer declines → return to pending |
| `POST` | `/complete-mission` | Volunteer marks mission complete |
| `POST` | `/add-user` | Self-onboarding (volunteer only — admin role preserved if seeded) |
| `GET`  | `/user/:firebaseUid` | Fetch profile |
| `GET`  | `/tasks` | List all requests |
| `GET`  | `/volunteers` | List volunteers (filters: `?available=true`, `?includeSeed=true`) |

---

## 🔐 Firestore rules

Live `onSnapshot` listeners need authenticated reads:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /requests/{doc} { allow read: if request.auth != null; }
    match /users/{doc}    { allow read: if request.auth != null; }
  }
}
```

If rules block client reads, the frontend automatically falls back to polling `/tasks` every 3 s.

---

## 🛠 Tech stack

```
┌─ Frontend ─────────────────────────────────────────────────────────┐
│  React 18 · Vite 5 · React Router 6 · Framer Motion                │
│  Three.js / @react-three/fiber · Leaflet                           │
└────────────────────────────────────────────────────────────────────┘

┌─ Backend ──────────────────────────────────────────────────────────┐
│  Node 18 · Express 4 · firebase-admin 13                           │
│  @google/generative-ai (Gemini 2.5 Flash-Lite)                     │
└────────────────────────────────────────────────────────────────────┘

┌─ Database / Auth ──────────────────────────────────────────────────┐
│  Firebase Firestore + Firebase Auth                                │
└────────────────────────────────────────────────────────────────────┘

┌─ Hosting ──────────────────────────────────────────────────────────┐
│  Vercel (static frontend + Express as one serverless function)     │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Notable design choices

- **Gemini does the heavy lifting in one call.** Both text and voice intake use `responseSchema` for guaranteed JSON shape — no parsing fragility, no retries.
- **Human-in-the-loop by default.** Nothing reaches volunteers until a coordinator approves it. Prevents prank-spam from flooding the field map.
- **Snapshot with polling fallback.** Live updates use Firestore `onSnapshot`. If rules block client reads, the hook silently falls back to polling `/tasks`. Same UX either way.
- **Seed volunteers tagged `is_seed`.** Real matching ignores them by default. Demo mode opts in with `{ includeSeed: true }` so judges see assignments happen.
- **Distance-scored matching.** Backend computes haversine distance from each volunteer to each signal. The Gemini matcher prompt requires a `"X km away"` rationale.
- **Pre-approval signals stay off the map.** Only approved signals show on the tactical map and globe — the kanban Review column is the only place a draft lives. Approving a signal is therefore a *visible* state change.

---

## 🚧 Future scope

- 📷 Photo intake (Gemini Vision) for damage assessment
- 📲 SMS / WhatsApp intake via Twilio webhook → `/extract-request`
- 📱 Mobile-first volunteer view + push notifications via FCM
- 📜 Audit log of every state transition
- 🌐 OR-Tools optimization for batch matching
- 🔄 Offline-first volunteer mode with service worker

---

## 📜 License

[MIT](LICENSE) — see the LICENSE file. Built for hackathon judges. Designed for the real world.

<div align="center">

—— *built with care for people on their worst day* ——

</div>
