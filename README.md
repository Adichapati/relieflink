# ReliefLink

AI-powered disaster relief coordination hackathon project.

## One-line pitch
ReliefLink turns messy disaster-help messages into structured tasks and matches them to the best available volunteer in seconds.

## Problem
During disasters and emergency situations, coordinators receive scattered requests through forms, messages, and calls. They must manually read each request, judge urgency, choose available volunteers, and track completion. This causes delays, duplication, and missed urgent cases.

## Solution
ReliefLink is a web app that uses AI to extract structured information from free-text relief requests, then matches the best available volunteer based on urgency, location, skills, and availability.

## MVP scope
- Free-text request intake form
- AI extraction into category, urgency, location, and details
- Seeded volunteer database
- Matching engine v1
- Coordinator dashboard for pending, assigned, and completed tasks
- Manual review for low-confidence AI output
- Basic impact counters

## Recommended stack
- React
- Firebase / Firestore
- Gemini / Vertex AI
- Google Maps API (optional)
- Custom heuristic matching engine

## Docs
- Full hackathon package: `docs/hackathon-package.md`

## Goal
Build one complete, smooth, believable workflow for hackathon judging:
request -> AI extraction -> volunteer matching -> coordinator confirmation -> completion tracking
