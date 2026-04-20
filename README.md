# ReliefLink

AI-powered disaster relief coordination hackathon project.

ReliefLink turns messy disaster-help messages into structured tasks and matches them to the best available volunteer in seconds.

## Why this project exists

During disasters and emergency situations, coordinators receive scattered requests through forms, messages, and calls. They must manually read each request, judge urgency, choose available volunteers, and track completion. That slows response, creates duplication, and increases the chance of missing urgent cases.

ReliefLink is a lightweight web app that helps a coordinator:
- collect free-text relief requests
- turn them into structured data with AI
- match the best volunteer based on urgency, distance, skill, and availability
- keep a human in the loop for final review

## Hackathon MVP

### Core flow
request -> AI extraction -> volunteer matching -> coordinator confirmation -> completion tracking

### Must-have features
- Free-text request intake form
- AI extraction into category, urgency, location, and details
- Seeded volunteer database
- Matching engine v1
- Coordinator dashboard with pending / assigned / completed states
- Manual review for low-confidence extraction
- Basic impact counters

### Nice-to-have
- Map view
- Duplicate request detection
- Volunteer acceptance screen
- One multilingual sample
- Assignment rationale display

## Repo structure

```text
relieflink/
├── docs/
│   ├── hackathon-package.md
│   └── PROJECT_BOARD.md
├── functions/
│   ├── package.json
│   └── src/index.js
├── web/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── styles.css
│       ├── components/
│       └── lib/
├── .env.example
├── .gitignore
├── LICENSE
└── package.json
```

## Current scaffold

This repo now includes:
- a polished README
- a project board inside `docs/PROJECT_BOARD.md`
- a React/Vite frontend scaffold in `web/`
- a simple backend scaffold in `functions/`
- mock extraction + matching logic so the team can start the UI flow immediately

The mock flow is intentionally simple and can later be replaced with:
- Gemini / Vertex AI extraction
- Firestore persistence
- Google Maps API distance lookup
- OR-Tools optimization

## Quick start

### Frontend
```bash
npm install
npm run dev
```

### Backend scaffold
```bash
npm run dev:functions
```

## Suggested team split

- Frontend / UX
- AI extraction
- Backend / database
- Matching / demo / QA

Use the GitHub issues and `docs/PROJECT_BOARD.md` as the source of truth.

## Docs
- Full hackathon package: `docs/hackathon-package.md`
- Project board: `docs/PROJECT_BOARD.md`

## Recommended stack
- React
- Firebase / Firestore
- Gemini / Vertex AI
- Google Maps API (optional)
- Custom heuristic matching engine first
- OR-Tools later if core flow is already stable

## Winning principle

Do not try to impress judges with too many features.
Impress them with one complete, smooth, believable workflow.
