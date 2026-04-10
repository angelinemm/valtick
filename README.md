# Val-Tick

A browser-based incremental ski resort game. Build lifts, earn money, repair breakdowns, and keep your resort running.

## Stack

- **Frontend** — React + TypeScript (Vite)
- **Backend** — Express + TypeScript
- **Database** — PostgreSQL + Prisma
- **Monorepo** — npm workspaces

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
npm test
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

## Creating a resort (admin only)

Players can't create resorts themselves. Use the seed script:

```bash
npm run seed --workspace=apps/backend -- "My Resort" your-guest-id
```

Share the guest ID with the player — they access the game at `http://localhost:5173/resort/<guest-id>`.
