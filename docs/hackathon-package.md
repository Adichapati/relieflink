# Smart Resource Allocation — Hackathon Package

Prepared for: Sprake (Adithya)
Prepared by: Wilson

==================================================
1. FINAL TEAM README / SPEC
==================================================

Project name:
ReliefLink

One-line pitch:
ReliefLink turns messy disaster-help messages into structured tasks and matches them to the best available volunteer in seconds.

Problem:
In disaster or emergency situations, coordinators receive many scattered requests through text, forms, and calls. They must manually read each request, judge urgency, find available volunteers, and track completion. This is slow, error-prone, and causes urgent cases to be missed.

Solution:
Build a web app where a coordinator receives free-text relief requests, AI extracts structured information from the text, and a matching engine assigns the best available volunteer based on urgency, location, skills, and availability.

Target use case:
Post-disaster food and medicine delivery in one city/zone.

Primary users:
1. Requester — submits a need
2. Volunteer — receives/accepts tasks
3. Coordinator — reviews, assigns, and tracks requests

Core user flow:
1. Requester submits free-text request
2. AI extracts category, urgency, location, and details
3. Request appears on coordinator dashboard
4. Matching engine selects best volunteer
5. Coordinator confirms assignment
6. Volunteer completes task
7. Dashboard updates metrics and status

Must-have features:
- Free-text request intake form
- AI extraction into structured fields:
  - category
  - urgency
  - location
  - quantity/details
- Seeded volunteer database
- Matching engine v1
- Coordinator dashboard with statuses:
  - pending
  - assigned
  - completed
- Manual review/edit for low-confidence extraction
- Basic impact counters

Nice-to-have features:
- Map with request and volunteer pins
- Duplicate request detection
- Volunteer acceptance screen
- One multilingual request example
- Assignment rationale display

Stretch features:
- OR-Tools optimization
- Voice input demo
- Fairness/coverage panel
- Push notifications

Non-goals for V1:
- Full multilingual support
- Full inventory tracking
- Production-grade auth/security
- Advanced fairness optimization
- BigQuery analytics pipeline
- Live voice call pipeline

Recommended tech stack:
- Frontend: React
- Database: Firestore
- Backend: Firebase Functions or a simple backend service
- AI: Gemini / Vertex AI structured extraction
- Maps: Google Maps API if time permits
- Matching: custom heuristic first
- Hosting: Firebase Hosting

Data model:

Request
- id
- raw_text
- category
- urgency
- location_text
- lat
- lng
- quantity_or_details
- confidence
- status
- assigned_volunteer_id
- created_at
- assigned_at
- completed_at

Volunteer
- id
- name
- skills[]
- lat
- lng
- available
- current_status

Assignment
- id
- request_id
- volunteer_id
- rationale
- assigned_at
- status

Matching logic v1:
- Sort requests by urgency descending
- Filter volunteers by availability
- Filter volunteers by needed skill if applicable
- Score each volunteer using:
  - urgency
  - distance
  - skill match
  - availability
- Pick highest-scoring volunteer
- Mark volunteer busy and request assigned

Simple score example:
- +50 if skill matches
- +30 if available now
- +1 to +20 from urgency score
- +distance bonus for closest volunteer

Example rationale:
Assigned to Priya because she is available now, has delivery skill, and is the closest volunteer at 1.4 km.

Success criteria for demo:
- A request can be submitted and parsed by AI
- The request appears in the dashboard
- The system assigns a volunteer
- Coordinator can confirm the assignment
- The request can move to completed
- Metrics update live or near-live

==================================================
2. SLIDE-BY-SLIDE PITCH DECK OUTLINE
==================================================

Slide 1 — Title
Title: ReliefLink
Subtitle: AI-powered relief coordination for faster disaster response
Say:
ReliefLink turns messy distress messages into structured volunteer actions in seconds.

Slide 2 — The Problem
Show:
- disaster-response chaos
- scattered requests
- manual triage
- delayed response
Say:
Coordinators receive urgent requests from many channels and manually decide what matters most, who should respond, and how to track it. This wastes time and risks missing urgent cases.

Slide 3 — Why This Matters
Show:
- examples: food, water, medicine delivery
- coordinator overload
- underserved cases
Say:
In emergencies, delays are costly. Even when volunteers exist, the bottleneck is coordination.

Slide 4 — Our Solution
Show:
Simple 4-step flow:
request -> AI extraction -> matching -> coordinator action
Say:
We built a system that understands free-text requests, structures them, prioritizes them, and matches them to the best available volunteer.

Slide 5 — Product Demo Snapshot
Show:
Screenshot/mockup of dashboard or architecture flow
Say:
This is our coordinator dashboard. It shows incoming requests, AI-extracted details, assignment status, and impact metrics.

Slide 6 — How It Works
Show:
1. free-text request
2. AI extracts fields
3. volunteer matching engine
4. dashboard review
Say:
A user submits a request. Gemini/Vertex extracts category, urgency, location, and details. Then our matching logic chooses the best volunteer based on urgency, availability, skill, and distance.

Slide 7 — AI Innovation
Show:
- AI extraction
- confidence handling
- optional dedup / multilingual stretch
Say:
Our innovation is not just volunteer listing. It is the AI intake-to-assignment pipeline. The system converts unstructured human language into action-ready tasks.

Slide 8 — Matching Engine
Show:
Small scoring box:
- urgency
- skill match
- availability
- distance
Say:
We score volunteers for each request and assign the best fit. This makes response faster and more explainable.

Slide 9 — Responsible AI / Human-in-the-Loop
Show:
- low-confidence review
- coordinator override
Say:
We do not blindly automate critical decisions. Low-confidence cases go to human review, and coordinators can always edit or override assignments.

Slide 10 — Tech Stack
Show:
- React
- Firebase / Firestore
- Gemini / Vertex AI
- Google Maps API
- optional OR-Tools
Say:
We chose a Google-friendly stack that is fast to build, scalable, and ideal for hackathon delivery.

Slide 11 — Demo Results / Impact
Show:
- total requests
- assigned
- completed
- average assignment time
Say:
Our demo shows how ReliefLink reduces coordination delay and makes relief work more structured, visible, and actionable.

Slide 12 — Why It Can Win
Show:
- impact
- technical merit
- UX
- innovation
Say:
This project combines real-world social impact with practical AI and strong demoability. It is useful, understandable, and technically meaningful.

Slide 13 — Future Scope
Show:
- multilingual support
- deduplication
- OR-Tools optimization
- NGO integrations
Say:
This can grow into a real operational platform for NGOs, cities, and disaster-response teams.

Slide 14 — Closing
Closing line:
ReliefLink turns chaos into coordinated action.

Backup Q&A points:
- Why better than a normal volunteer app? Because it understands free-text needs and converts them into assignments.
- What if AI makes a mistake? Human review and coordinator override.
- Can it scale? Yes, with Firebase/Cloud Run style architecture.
- Why this use case? Clear social impact, clear urgency, and very demoable.

==================================================
3. BUILD TASK BOARD WITH EXACT TEAMMATE TICKETS
==================================================

MASTER RULES
- Finish the core flow first
- No stretch work until end-to-end flow is stable
- Test the demo flow repeatedly
- Cut unstable features fast

TEAM MEMBER A — FRONTEND / UX

Ticket A1
Title: Build request submission page
Goal:
Create a clean page with a free-text textarea, optional address field, and submit button.
Done when:
- request can be submitted from UI
- loading and success states are visible

Ticket A2
Title: Build coordinator dashboard skeleton
Goal:
Create dashboard sections for pending, assigned, and completed requests.
Done when:
- requests display in columns/cards or table
- status labels are visually clear

Ticket A3
Title: Add extracted-field display
Goal:
Show category, urgency, location, details, and confidence next to each request.
Done when:
- structured AI output appears in dashboard
- raw text remains visible for review

Ticket A4
Title: Add coordinator actions
Goal:
Add buttons for Confirm Assignment, Edit Request, Mark Complete.
Done when:
- coordinator can move request through workflow

Ticket A5
Title: Add impact counters
Goal:
Show total requests, assigned requests, completed requests, average assignment time.
Done when:
- counters update based on current data

Ticket A6 (nice-to-have)
Title: Add map view
Goal:
Display request and volunteer pins on a map.
Done when:
- clicking a request highlights the location

TEAM MEMBER B — AI / EXTRACTION

Ticket B1
Title: Define extraction schema
Goal:
Finalize exact AI output structure.
Schema fields:
- category
- urgency
- location_text
- quantity_or_details
- confidence
Done when:
- team agrees on schema and sample outputs

Ticket B2
Title: Build Gemini/Vertex extraction prompt
Goal:
Create a prompt that reliably converts free-text requests into structured JSON.
Done when:
- at least 5 sample requests parse consistently

Ticket B3
Title: Add confidence handling
Goal:
Mark low-confidence outputs for manual review.
Done when:
- low-confidence cases are clearly flagged

Ticket B4
Title: Handle extraction failure gracefully
Goal:
Return safe fallback output when AI response fails or is malformed.
Done when:
- system never blocks request creation because AI failed

Ticket B5 (nice-to-have)
Title: Add one multilingual request example
Goal:
Support one non-English sample request in demo.
Done when:
- one sample parses correctly and displays in English fields

TEAM MEMBER C — BACKEND / DATABASE

Ticket C1
Title: Create Firestore collections
Goal:
Set up collections for requests, volunteers, assignments.
Done when:
- CRUD works for all three entities

Ticket C2
Title: Implement request creation flow
Goal:
Save submitted request and trigger AI extraction pipeline.
Done when:
- a submitted request appears in DB and dashboard

Ticket C3
Title: Seed volunteer data
Goal:
Create 5–8 realistic volunteer profiles.
Done when:
- volunteers have location, skills, availability

Ticket C4
Title: Implement assignment persistence
Goal:
Store volunteer assignment and rationale in DB.
Done when:
- assigned volunteer and rationale appear in dashboard

Ticket C5
Title: Implement status transitions
Goal:
Support pending -> assigned -> completed.
Done when:
- coordinator actions persist correctly

Ticket C6
Title: Add timestamps for metrics
Goal:
Store created_at, assigned_at, completed_at.
Done when:
- average assignment time can be computed

TEAM MEMBER D — MATCHING / DEMO / QA

Ticket D1
Title: Define matching score
Goal:
Finalize the v1 scoring formula.
Include:
- urgency
- skill match
- availability
- distance
Done when:
- team agrees on scoring weights

Ticket D2
Title: Implement matching engine v1
Goal:
Assign best volunteer to each request based on score.
Done when:
- at least 5 demo scenarios match correctly

Ticket D3
Title: Generate demo request set
Goal:
Create 8–10 realistic requests.
Include:
- food requests
- medicine requests
- one high urgency case
- one low-confidence case
- optional duplicate case
Done when:
- team has stable demo data for testing

Ticket D4
Title: Write assignment rationale text
Goal:
Generate short human-readable explanation for each assignment.
Done when:
- each assignment has a clear reason shown in UI

Ticket D5
Title: End-to-end test the demo flow
Goal:
Run through full workflow repeatedly and log breakpoints.
Done when:
- team completes at least 5 successful demo rehearsals

Ticket D6
Title: Prepare backup demo assets
Goal:
Create screenshots or a backup recording in case live demo fails.
Done when:
- fallback material is ready before final pitch

==================================================
4. EXECUTION ORDER
==================================================

Priority order:
1. Schema freeze
2. Request form
3. Firestore storage
4. AI extraction
5. Volunteer seed data
6. Matching engine
7. Dashboard status flow
8. Metrics
9. One wow feature only
10. Demo rehearsal

If time runs short, cut in this order:
1. Map
2. Multilingual example
3. Duplicate detection
4. Volunteer acceptance flow
5. OR-Tools

==================================================
5. FINAL DEMO SCRIPT
==================================================

0:00–0:20
Problem:
During emergencies, coordinators receive scattered requests and manually decide who needs help first.

0:20–0:50
Input:
We submit a request: “Family of 5 at Lake Road needs food and medicine urgently. One child is sick.”

0:50–1:20
AI extraction:
The system extracts category, urgency, location, and details from the raw text.

1:20–1:50
Matching:
The system checks available volunteers and matches the best person based on skill, availability, and distance.

1:50–2:15
Coordinator control:
The coordinator reviews the AI output, confirms the assignment, and keeps control of the workflow.

2:15–2:40
Completion:
The request moves from pending to assigned to completed, and metrics update.

2:40–3:00
Close:
ReliefLink turns messy distress messages into coordinated volunteer action in seconds.

==================================================
6. FINAL REMINDER
==================================================

Winning principle:
Do not try to impress judges with too many features.
Impress them with one complete, smooth, believable workflow.
