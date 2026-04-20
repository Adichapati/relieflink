# ReliefLink Project Board

Use this board as the in-repo working checklist.

## P0 — Core flow first

### Frontend / UX
- [ ] A1 — Build request submission page
- [ ] A2 — Build coordinator dashboard skeleton
- [ ] A3 — Add extracted-field display
- [ ] A4 — Add coordinator actions

### AI / extraction
- [ ] B1 — Define extraction schema
- [ ] B2 — Build Gemini/Vertex extraction prompt
- [ ] B3 — Add confidence handling
- [ ] B4 — Handle extraction failure gracefully

### Backend / database
- [ ] C1 — Create Firestore collections
- [ ] C2 — Implement request creation flow
- [ ] C3 — Seed volunteer data
- [ ] C4 — Implement assignment persistence
- [ ] C5 — Implement status transitions

### Matching / demo / QA
- [ ] D1 — Define matching score
- [ ] D2 — Implement matching engine v1
- [ ] D3 — Generate demo request set
- [ ] D5 — End-to-end test the demo flow

## P1 — Polish after the full flow works

- [ ] A5 — Add impact counters
- [ ] C6 — Add timestamps for metrics
- [ ] D4 — Write assignment rationale text
- [ ] D6 — Prepare backup demo assets

## P2 — Only if core flow is stable

- [ ] A6 — Add map view
- [ ] B5 — Add one multilingual request example
- [ ] Optional — Duplicate request detection
- [ ] Optional — OR-Tools upgrade
- [ ] Optional — Volunteer acceptance screen

## Demo lock checklist

- [ ] Core request -> assign -> complete flow works end to end
- [ ] AI output is visible in UI
- [ ] At least 5 successful demo rehearsals completed
- [ ] One unstable feature has been cut if necessary
- [ ] Backup screenshots or recording are ready
- [ ] Final pitch roles assigned

## Priority order
1. Schema freeze
2. Request form
3. Data persistence
4. AI extraction
5. Volunteer seed data
6. Matching engine
7. Status flow
8. Metrics
9. One wow feature only
10. Demo rehearsal
