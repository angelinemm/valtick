# Val-Tick

A browser-based incremental ski resort game. Build lifts, earn money, repair breakdowns, and keep your resort running.

## Stack

- **Frontend** — React + TypeScript (Vite), React Router, React Query
- **Backend** — Express + TypeScript, CORS enabled
- **Database** — PostgreSQL + Prisma
- **Monorepo** — npm workspaces
- **Testing** — Vitest, React Testing Library

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL running locally

### Install

```bash
npm install
```

### Configure

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL to your local Postgres instance
```

### Database

```bash
npm run db:migrate    # run migrations
npm run db:generate   # generate Prisma client
```

### Run

```bash
npm run dev:backend   # http://localhost:3001
npm run dev:frontend  # http://localhost:5173
```

### Test

```bash
npm test                                      # backend + shared tests
npm run test --workspace=apps/frontend        # frontend tests (jsdom)
```

## Project structure

```
val-tick/
  apps/
    backend/      Express API
    frontend/     React app
  packages/
    shared/       Shared TypeScript types
  prisma/
    schema.prisma Database schema
```

## API endpoints

| Method | Path           | Description                    |
| ------ | -------------- | ------------------------------ |
| GET    | `/health`      | Health check                   |
| GET    | `/resort`      | Fetch resort state             |
| POST   | `/tick`        | Process one game tick          |
| POST   | `/buy_lift`    | Purchase a lift                |
| POST   | `/repair_lift` | Repair a broken lift           |
| POST   | `/reset`       | Reset resort to starting state |

## Game features

- **Ticking** — money increments every second while the tab is active; slows to every 10s when hidden; stops after 5 minutes hidden
- **Offline catch-up** — background job simulates ticks for idle resorts; resort refetches on return from long absence
- **Lifts** — 5 models (Magic Carpet → Drag Lift → Chairlift → Gondola → Cable Car), each with increasing cost, capacity, and break chance
- **Breakdowns** — lifts break over time; repair costs money; probability doubles on each break; lifts that break at max probability are junked
- **Junkyard** — junked lifts shown in a separate section, non-interactive
- **Reset** — big red button in the top bar wipes the resort back to starting state ($10, 1 magic carpet) after confirmation

## Creating a user (admin only)

Players can't sign up themselves. Create accounts via the CLI:

```bash
npm run create-user --workspace=apps/backend -- <username> <password> [USER|ADMIN]
```

The user logs in at `http://localhost:5173/login`. Their resort is created automatically on first login.
