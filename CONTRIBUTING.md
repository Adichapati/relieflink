# Contributing to ReliefLink

Thanks for contributing to ReliefLink.

This repo is being used for a hackathon build, so speed matters — but clarity matters more. The goal is not to build everything. The goal is to ship one complete, believable, stable workflow.

## Core principle

Do not work on stretch features until the core flow is stable.

Core flow:
request -> AI extraction -> volunteer matching -> coordinator confirmation -> completion tracking

## Before you start

1. Read:
- `README.md`
- `docs/hackathon-package.md`
- `docs/PROJECT_BOARD.md`

2. Pick your assigned GitHub issue.
3. Comment on the issue if you are taking it.
4. Make sure nobody else is already working on the same task.

## Team workflow

Work in small, isolated changes.

Preferred parallel split:
- Frontend / UX
- AI extraction
- Backend / database
- Matching / demo / QA

Avoid multiple people editing the same file at the same time unless you coordinate first.

High-collision files to coordinate carefully:
- `web/src/App.jsx`
- `web/src/styles.css`
- `functions/src/index.js`
- `web/src/lib/matching.js`

## Branch naming

Always branch from latest `main`.

Use one of these formats:
- `feat/issue-12-short-name`
- `fix/issue-8-short-name`
- `docs/issue-3-short-name`
- `chore/issue-5-short-name`

Examples:
- `feat/issue-1-request-form`
- `feat/issue-8-ai-prompt`
- `fix/issue-16-status-transitions`
- `docs/issue-22-demo-rehearsal-notes`

## Local setup

### Install dependencies
```bash
npm install
npm --prefix web install
npm --prefix functions install
```

### Run frontend
```bash
npm run dev
```

### Run backend scaffold
```bash
npm run dev:functions
```

## Development rules

1. Keep changes small.
2. One branch = one focused issue.
3. Do not refactor unrelated code.
4. Do not introduce heavy dependencies unless the team agrees.
5. Prefer finishing the existing flow over adding a flashy feature.
6. If a feature is unstable, cut it.

## What to do before opening a PR

Checklist:
- [ ] My branch is based on latest `main`
- [ ] My change solves one specific issue
- [ ] I tested the relevant flow locally
- [ ] I did not break the core demo path
- [ ] I updated docs if needed
- [ ] I kept the change focused and reviewable

## Commit message format

Use simple conventional commits:
- `feat: add request submission form`
- `fix: correct assignment status transition`
- `docs: add demo workflow notes`
- `chore: seed demo volunteer data`

## Pull request rules

PR title format:
- `feat: add request submission form (#1)`
- `fix: persist request status transitions (#16)`

PR body should include:
1. What changed
2. Why it changed
3. How you tested it
4. Screenshot if UI changed
5. Link to issue

Recommended PR template:

```text
## Summary
- 
- 

## Why
- 

## Testing
- 

Closes #ISSUE_NUMBER
```

## Parallel work rules to avoid collisions

### Frontend contributors
- Prefer creating new components instead of editing `App.jsx` heavily
- If you must change layout state in `App.jsx`, tell the team first

### AI contributors
- Keep prompt/schema logic isolated
- Avoid mixing extraction experiments with UI styling changes

### Backend contributors
- Keep request/assignment/status logic modular
- Document any API shape changes clearly for frontend teammates

### Matching contributors
- Change the score logic in one place
- Avoid scattering matching decisions across multiple files

## Merge discipline

For hackathon speed:
- prefer small PRs
- review quickly
- merge only if the change is clearly safe
- if two PRs overlap heavily, merge the lower-risk/core-flow PR first

## Priority policy

Do work in this order:
1. P0 issues
2. P1 issues
3. P2 issues

If P0 is not stable, do not spend time on P2.

## Demo-first rule

Every major change should be judged by one question:
Does this improve or protect the live demo?

If not, it is probably not the highest-priority task right now.

## If you get blocked

If blocked:
1. comment on the issue
2. explain what is blocked
3. mention which file / dependency is causing it
4. move to another approved task instead of stalling silently

## Definition of done

A task is done only if:
- the code works
- the relevant UI or logic is visible/usable
- the core workflow still works
- the change is pushed in a PR

## Final reminder

Hackathons reward clarity and execution.
A smooth, reliable demo beats a bigger but unstable product.
