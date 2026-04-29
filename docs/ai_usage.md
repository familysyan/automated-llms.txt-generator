# AI Usage Guide

How we use AI in this project to move from idea to production safely and quickly.

---

## Standard Workflow

### 1) Understand the requirement by yourself

### 2) Collaborate with AI on a design doc

- Collaborate with AI agent on the high level design and planning.
- Cover user flow, architecture, data model, API surface, and known limitations.
- Discuss tech stack choices.

### 3) Build frontend with mock data and tune UI

- Implement screens/components first with mock data.
- Keep mock data separated from UI code:
  - UI components in `src/components/...`
  - mock data/constants in dedicated files (for example `src/lib/mock/...`)
- Iterate quickly on layout, interaction, and loading/error states before backend hookup.
- After this step, the frontend code is ready

### 4) Move mock data to API (frontend-backend integration ready)

- Replace mock data reads with API calls.
- Keep the same UI contracts where possible to minimize UI churn.
- After this step, frontend and backend integration paths are in place.

### 5) Implement backend functionality incrementally

- Build backend feature-by-feature behind the existing API contracts.
- Deliver in thin vertical slices (DB + API + UI behavior) and verify each slice.
- Keep migrations and data changes explicit and reversible.

### 6) Use tests to cover CUJ

---

## Rules and Skills for Repetitive Tasks

We use project rules and skills to keep output consistent and reduce repeated prompting.

### Rules (`.cursor/rules/`)

- `frontend-architecture.mdc`
  - Enforces route/page/component structure and frontend coding conventions.
- `error-handling.mdc`
  - Enforces user-safe error handling in UI and API routes.

Use rules whenever changing frontend pages/components or API error behavior.

### Skills (`.cursor/skills/`)

- `check-responsiveness`
  - Use for mobile/responsive audits and fixes.
- `sql-migrations`
  - Use for schema changes, migration creation, rollback/status, and migration troubleshooting.

Use these skills for repetitive implementation patterns so changes stay fast and consistent.
