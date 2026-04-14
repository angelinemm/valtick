# CODEX.md

## 1. Project Overview

Val-Tick is a browser-based incremental ski resort game. Players build lifts, earn money over time, repair breakdowns, and grow a resort economy.

Key domain concepts:

- A `User` owns one resort.
- A `Resort` has money, lift inventory, and tick-based progression.
- `Lift` entities have a model, name, status, and break probability.
- The game loop is driven by ticks, offline catch-up, lift upgrades, and repair/junking rules.

Important gameplay rules to keep in mind when changing logic:

- Money increases over time based on active lift capacity and ticket price.
- Lifts can break; repairing costs money.
- Break probability increases over time and can eventually lead to a lift becoming junked.
- The `/how-to-play` page must be updated whenever player-facing game rules or features change.

## 2. Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- React Query

### Backend

- Express
- TypeScript
- Session-based auth

### Database

- PostgreSQL
- Prisma ORM

### Key tools

- npm workspaces for the monorepo
- Vitest for tests
- React Testing Library for frontend tests
- ESLint for linting
- Prettier for formatting
- Husky + lint-staged for pre-commit checks
- `gh` CLI for pull requests
- Railway may be used for deployment/infrastructure workflows if already configured in the project

## 3. Architecture

The project is a monorepo with three main parts:

- `apps/frontend`: React client
- `apps/backend`: Express API
- `packages/shared`: shared TypeScript types/contracts used by both apps
- `prisma`: database schema and migrations

High-level interaction flow:

1. The frontend calls backend API endpoints.
2. The backend applies game logic and reads/writes Postgres through Prisma.
3. Shared DTOs and enums from `packages/shared` keep frontend/backend contracts aligned.

Important folders and entry points:

- `apps/frontend/src/main.tsx`: frontend bootstrap
- `apps/frontend/src/App.tsx`: frontend routing
- `apps/backend/src/index.ts`: Express app configuration
- `apps/backend/src/server.ts`: backend startup and background job scheduling
- `apps/backend/src/routes/*`: API endpoints
- `apps/backend/src/services/*`: game/business logic
- `apps/backend/src/catalog/*`: static gameplay configuration such as lift models
- `packages/shared/src/*`: shared types and API models
- `prisma/schema.prisma`: database schema

## 4. Development Workflow

### Local development

Install and configure:

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:generate
```

Run locally:

```bash
npm run dev:backend
npm run dev:frontend
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

### Deployment workflow

- Never push directly to `main`.
- Always create a feature branch with a descriptive name such as `fix/economy-balance` or `feat/offline-simulation`.
- When work is complete, push the branch and open a PR against `main`.
- PR title and description should clearly explain what changed and why.

### Commit guidelines

- When creating commits, always include a co-author line for Codex.
- Use the exact format:

```text
Co-authored-by: Codex <codex@openai.com>
```

- Ensure the co-author line is present in the final commit message.
- Do not duplicate the line if it already exists.

### Testing expectations

Before pushing, run:

```bash
npm test
npm run test --workspace=apps/frontend
npm run lint
npm run format:check
```

Rules:

- Do not push with failing tests.
- If a change affects existing tests, update the tests to match the intended behavior.
- This applies to code changes and data/content changes.
- If formatting or linting fails, fix it before pushing.

Useful autofix commands:

```bash
npm run lint:fix
npm run format
```

## 5. Coding Guidelines

- Prefer small, targeted, low-risk changes.
- Preserve existing behavior unless the task explicitly requires changing it.
- Do not break existing gameplay, auth, or data flows as a side effect of refactors.
- Keep changes consistent with the current codebase style and structure.
- Use shared types from `packages/shared` instead of duplicating contracts.
- Let Prettier handle formatting; do not hand-format code unnecessarily.

Frontend-specific guidelines:

- Do not hardcode user-facing strings directly in JSX or component logic.
- Keep UI strings in a local constants or `strings` file near the component or feature.
- This includes labels, messages, headings, placeholders, confirmations, and status text.
- Do not implement full i18n yet; just keep strings easy to extract later.

Page styling requirements:

- Every page must include the shared mountain SVG background fixed to the bottom of the viewport.
- Use the same two-range silhouette styling already established in the app.
- Page root should use:
  - `min-height: 100vh`
  - `position: relative`
  - `background-color: var(--bg-base)`
- Page content should render above the mountain background with a wrapper using:
  - `position: relative`
  - `z-index: 1`

Documentation rules:

- Update `/how-to-play` whenever gameplay changes affect how the user plays.
- Review `README.md` at the end of each task and update it if setup, configuration, or gameplay behavior changed.

## 6. AI Agent Rules

- Read relevant files before making changes.
- For large or multi-file changes, propose a short plan before editing.
- Prefer minimal, incremental edits over broad rewrites.
- Ask for clarification when requirements are ambiguous or a change could have multiple valid interpretations.
- Do not introduce unnecessary abstractions, dependencies, or complexity.
- Keep fixes local unless there is a clear architectural reason to generalize.
- Preserve tests; do not delete or skip failing tests to make a change pass.
- If UI behavior changes, update the corresponding tests.
- If gameplay behavior changes, update `/how-to-play`.
- Before finishing, consider whether `README.md` also needs an update.

## 7. Key Files to Read First

Start here when orienting yourself in the project:

- `README.md`
- `package.json`
- `prisma/schema.prisma`
- `apps/backend/src/index.ts`
- `apps/backend/src/server.ts`
- `apps/backend/src/routes/resort.ts`
- `apps/backend/src/services/tickService.ts`
- `apps/backend/src/services/liftService.ts`
- `apps/backend/src/catalog/liftModelCatalog.ts`
- `apps/frontend/src/main.tsx`
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/pages/ResortPage.tsx`
- `apps/frontend/src/hooks/useResort.ts`
- `packages/shared/src/index.ts`
- `packages/shared/src/models.ts`
- `packages/shared/src/api.ts`
