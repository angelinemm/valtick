# Val-Tick V1 — Implementation Blueprint & Prompt Series

## Blueprint

### Phases at a Glance

| Phase              | Focus                         | Prompts |
| ------------------ | ----------------------------- | ------- |
| 1 — Foundation     | Monorepo, types, DB schema    | 1–3     |
| 2 — Backend Logic  | Catalog, economy, tick engine | 4–6     |
| 3 — Offline Sim    | Idle catch-up simulation      | 7       |
| 4 — API Layer      | Repositories, routes, seed    | 8–13    |
| 5 — Frontend Shell | Scaffold, routing, API client | 14–16   |
| 6 — Frontend UI    | Components, interactions      | 17–19   |
| 7 — Game Loop      | Adaptive ticking, wiring      | 20      |

### Key Ordering Constraints

- Shared types must exist before any backend or frontend code uses them
- Pure logic services (summary, tick) must be built and tested before they're wired to a DB
- Repositories must exist before routes
- Routes must be complete before frontend API client is built
- Frontend components must exist before the tick loop is wired up

### Highest-Risk Areas

- **Tick order** — income is earned _before_ break rolls; easy to get wrong
- **Junk boundary** — "break at >=1.0 → junk" vs "reach 1.0 after doubling → still repairable" is subtle
- **Integer cents** — never use floats for money; test this explicitly
- **Offline simulation** — tick count off-by-one errors are silent

---

## Chunk & Step Breakdown

### Phase 1: Foundation

- **Chunk A**: Monorepo scaffold → root workspace, backend shell, frontend shell, shared shell
- **Chunk B**: Shared types → all DTOs, request/response shapes, enums
- **Chunk C**: Database schema → Prisma models, migration, DB client singleton

### Phase 2: Backend Logic

- **Chunk D**: Lift model catalog → hardcoded constants, lookup helpers
- **Chunk E**: Summary service → pass price, capacity, income calculation (pure)
- **Chunk F**: Tick service → per-tick simulation engine (pure, injectable random)

### Phase 3: Offline Simulation

- **Chunk G**: Offline sim → tick replay from `lastTickAt`, early stop

### Phase 4: API Layer

- **Chunk H**: Repositories → Prisma queries for resort + lift CRUD
- **Chunk I**: GET /resort/:guestId + resortService
- **Chunk J**: Seed script → admin creation of a starting resort
- **Chunk K**: POST /tick → route + integration test
- **Chunk L**: POST /buy_lift → liftService + route
- **Chunk M**: POST /repair_lift → liftService + route
- **Chunk N**: Background job → periodic offline sim worker

### Phase 5: Frontend Shell

- **Chunk O**: Frontend scaffold → Vite, React Router, React Query
- **Chunk P**: API client → typed fetch functions
- **Chunk Q**: useResort hook → data fetching, loading/error states

### Phase 6: Frontend UI

- **Chunk R**: Top bar → resort stats display
- **Chunk S**: Lift groups → grouped list, collapsible, buy button, lift rows
- **Chunk T**: Broken + junkyard → repair interaction, junkyard section

### Phase 7: Game Loop

- **Chunk U**: Adaptive ticking → Page Visibility API, useTick hook, full wiring

---

## Prompt Series

---

### Prompt 1 — Monorepo Scaffold

```text
Create the project scaffold for "val-tick", a browser-based incremental ski resort game. This is a greenfield monorepo.

## Structure to create

val-tick/
  apps/
    frontend/       ← Vite + React + TypeScript
    backend/        ← Express + TypeScript
  packages/
    shared/         ← Pure TypeScript types only
  prisma/
    schema.prisma   ← Prisma schema (skeleton only)
  package.json      ← Root workspace config
  tsconfig.base.json
  .env.example

## Root package.json
- "private": true
- "workspaces": ["apps/*", "packages/*"]
- scripts:
  - "test" → "vitest run --passWithNoTests"
  - "dev:backend" → "npm run dev --workspace=apps/backend"
  - "dev:frontend" → "npm run dev --workspace=apps/frontend"

## Root tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}

## packages/shared
- package.json: name `@val-tick/shared`, "main": "src/index.ts", "types": "src/index.ts"
- tsconfig.json extending ../../tsconfig.base.json
- src/index.ts: export {} (empty for now)

## apps/backend
- package.json: name `@val-tick/backend`
  - dependencies: express, @prisma/client
  - devDependencies: typescript, vitest, supertest, @types/express, @types/supertest, @types/node, ts-node, @val-tick/shared
  - scripts: "dev": "ts-node src/index.ts", "test": "vitest run"
- tsconfig.json extending ../../tsconfig.base.json, with "outDir": "dist"
- src/index.ts:
  - Create an Express app
  - Register GET /health returning { ok: true }
  - Export the app from this file
  - Separately in src/server.ts, import app and call app.listen(3001, () => console.log("Backend running on http://localhost:3001"))
  - IMPORTANT: index.ts only exports app, it does NOT call listen. This makes the app testable without starting a real server.

## apps/frontend
- package.json: name `@val-tick/frontend`
  - dependencies: react, react-dom, react-router-dom, @tanstack/react-query
  - devDependencies: vite, @vitejs/plugin-react, typescript, vitest, jsdom, @testing-library/react, @testing-library/jest-dom, @types/react, @types/react-dom, @val-tick/shared
  - scripts: "dev": "vite", "build": "vite build", "test": "vitest run"
- vite.config.ts: basic Vite config with @vitejs/plugin-react
- src/main.tsx: ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
- src/App.tsx: returns <div>Val-Tick</div> (placeholder only)

## prisma/schema.prisma (skeleton only)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../apps/backend/node_modules/.prisma/client"
}

## .env.example
DATABASE_URL=postgresql://localhost:5432/valtick

## Tests
Write apps/backend/src/__tests__/health.test.ts:
- Import app from ../index
- Use supertest to call GET /health
- Assert response status 200 and body { ok: true }
- This test must pass

## Acceptance criteria
- npm test from root runs and the health test passes
- No game logic exists yet
- All files are present at the paths listed above
```

---

### Prompt 2 — Shared Types Package

```text
You are working on the val-tick monorepo. The scaffold is in place. packages/shared currently exports {}.

## Task
Define all shared TypeScript types in packages/shared/src/. These types are used by both the frontend and backend. Zero runtime logic goes here — only types.

## Files to create

### packages/shared/src/enums.ts
export type LiftStatus = "working" | "broken" | "junked";

export type LiftModelKey =
  | "magic_carpet"
  | "drag_lift"
  | "chairlift"
  | "gondola"
  | "cable_car";

### packages/shared/src/models.ts
import type { LiftModelKey, LiftStatus } from "./enums";

export interface LiftModelDTO {
  key: LiftModelKey;
  name: string;
  purchasePriceCents: number;
  capacity: number;
  priceBonusCents: number;
  repairCostCents: number;
  initialBreakChance: number;
  iconKey: string;
}

export interface ResortDTO {
  id: string;
  name: string;
  guestId: string;
  moneyCents: number;
  lastTickAt: string;   // ISO 8601 string
  createdAt: string;
  updatedAt: string;
}

export interface LiftDTO {
  id: string;
  resortId: string;
  liftModelKey: LiftModelKey;
  currentBreakProbability: number;
  status: LiftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SummaryDTO {
  moneyCents: number;
  incomePerSecCents: number;
  capacityPerSec: number;
  passPriceCents: number;
  totalLifts: number;
  brokenLiftsCount: number;
  junkedLiftsCount: number;
}

### packages/shared/src/api.ts
import type { LiftModelDTO, LiftModelKey, LiftDTO, ResortDTO, SummaryDTO } from "./models";

export interface GetResortResponse {
  resort: ResortDTO;
  summary: SummaryDTO;
  liftModels: LiftModelDTO[];
  lifts: LiftDTO[];
}

// POST /buy_lift and POST /repair_lift return the same shape as GET
export type MutationResortResponse = GetResortResponse;

export interface TickResponse {
  ok: boolean;
}

export interface TickRequest {
  guestId: string;
}

export interface BuyLiftRequest {
  guestId: string;
  liftModelKey: LiftModelKey;
}

export interface RepairLiftRequest {
  guestId: string;
  liftId: string;
}

### packages/shared/src/index.ts
Re-export everything:
export * from "./enums";
export * from "./models";
export * from "./api";

## Tests
Create packages/shared/src/__tests__/types.test.ts.

Use Vitest's expectTypeOf to write compile-time assertions:
1. Assert that "working" satisfies LiftStatus
2. Assert that "broken" satisfies LiftStatus
3. Assert that "junked" satisfies LiftStatus
4. Assert that "magic_carpet" satisfies LiftModelKey
5. Assert that "cable_car" satisfies LiftModelKey
6. Assert that a LiftDTO object has a status field of type LiftStatus
7. Assert that a SummaryDTO object has moneyCents of type number

Add a vitest.config.ts to packages/shared.

## Acceptance criteria
- All types are exported from packages/shared
- The compile-time tests pass
- No runtime logic exists in this package
- Backend and frontend can both import from "@val-tick/shared"
```

---

### Prompt 3 — Prisma Schema and DB Client

```text
You are working on val-tick. The scaffold exists and shared types are defined.

## Task
Define the full Prisma schema, set up migrations, and create the Prisma client singleton for the backend.

## prisma/schema.prisma
Replace the skeleton with:

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../apps/backend/node_modules/.prisma/client"
}

enum LiftStatus {
  working
  broken
  junked
}

model Resort {
  id         String   @id @default(uuid())
  name       String
  guestId    String   @unique
  moneyCents Int
  lastTickAt DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  lifts Lift[]
}

model Lift {
  id                      String     @id @default(uuid())
  resortId                String
  liftModelKey            String
  currentBreakProbability Float
  status                  LiftStatus
  createdAt               DateTime   @default(now())
  updatedAt               DateTime   @updatedAt

  resort Resort @relation(fields: [resortId], references: [id], onDelete: Cascade)

  @@index([resortId])
  @@index([status])
}

Notes:
- moneyCents is Int (integer cents, never float)
- liftModelKey is a plain String — no DB foreign key, because lift models are hardcoded
- currentBreakProbability is Float and CAN exceed 1.0

## Root package.json — add scripts
"db:generate": "prisma generate --schema=prisma/schema.prisma",
"db:migrate": "prisma migrate dev --schema=prisma/schema.prisma",
"db:migrate:test": "prisma migrate deploy --schema=prisma/schema.prisma"

## apps/backend/src/db/prisma.ts
Create a singleton Prisma client:

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

## Test
Create apps/backend/src/__tests__/db.test.ts:

import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("Database connectivity", () => {
  const testGuestId = `test-${Date.now()}`;

  afterEach(async () => {
    await prisma.resort.deleteMany({ where: { guestId: testGuestId } });
  });

  it("can create and read a resort", async () => {
    const resort = await prisma.resort.create({
      data: {
        name: "Test Resort",
        guestId: testGuestId,
        moneyCents: 1000,
        lastTickAt: new Date(),
      },
    });

    expect(resort.id).toBeDefined();
    expect(resort.moneyCents).toBe(1000);

    const found = await prisma.resort.findUnique({
      where: { guestId: testGuestId },
    });
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Test Resort");
  });
});

## Acceptance criteria
- Schema is valid and migration can be run
- Prisma client singleton is exported from apps/backend/src/db/prisma.ts
- DB test is skipped when DATABASE_URL is absent, passes when present
- prisma generate is run as part of setup (document in .env.example that this is required before running)
```

---

### Prompt 4 — Lift Model Catalog

```text
You are working on val-tick. Monorepo, shared types, and Prisma schema all exist.

## Task
Create the hardcoded lift model catalog in the backend. This is the single source of truth for all gameplay values. No database. No side effects.

## File: apps/backend/src/catalog/liftModelCatalog.ts

Import LiftModelDTO and LiftModelKey from @val-tick/shared.

Define and export a constant array LIFT_MODELS: LiftModelDTO[] with exactly these values:

| key          | name         | purchasePriceCents | capacity | priceBonusCents | repairCostCents | initialBreakChance | iconKey      |
|---|---|---|---|---|---|---|---|
| magic_carpet | Magic Carpet | 1000               | 5        | 10              | 100             | 0.001              | magic-carpet |
| drag_lift    | Drag Lift    | 2000               | 10       | 20              | 200             | 0.001              | drag-lift    |
| chairlift    | Chairlift    | 5000               | 20       | 50              | 500             | 0.001              | chairlift    |
| gondola      | Gondola      | 20000              | 50       | 100             | 2000            | 0.001              | gondola      |
| cable_car    | Cable Car    | 50000              | 100      | 200             | 5000            | 0.001              | cable-car    |

Export two helper functions:

export function getLiftModel(key: LiftModelKey): LiftModelDTO
// throws Error if key is not found

export function getAllLiftModels(): LiftModelDTO[]
// returns a copy of the full array

## Tests: apps/backend/src/__tests__/liftModelCatalog.test.ts

1. getAllLiftModels() returns exactly 5 items
2. getLiftModel("magic_carpet") returns the correct object — check all fields
3. getLiftModel("cable_car") returns the correct object — check all fields
4. getLiftModel("invalid_key" as LiftModelKey) throws an error
5. Every model has initialBreakChance === 0.001
6. Every model's repairCostCents equals exactly purchasePriceCents / 10 (verify this is true for all 5)
7. The LIFT_MODELS order is: magic_carpet, drag_lift, chairlift, gondola, cable_car (smallest to largest)

## Notes
- This file imports only from @val-tick/shared — no Prisma, no Express
- getLiftModel throws a descriptive Error message like `Unknown lift model key: "foo"`
- getAllLiftModels returns a new array (not a reference to the internal one)
```

---

### Prompt 5 — Summary Service

```text
You are working on val-tick. The lift model catalog exists with tests. Now build the summary service — pure economy logic, no database.

## Economy rules from spec
- passPriceCents = 100 (base) + sum(priceBonusCents of all WORKING lifts)
- capacityPerSec = sum(capacity of all WORKING lifts)
- incomePerSecCents = capacityPerSec * passPriceCents
- BROKEN and JUNKED lifts contribute nothing
- totalLifts = count of ALL lifts including junked
- brokenLiftsCount = count where status === "broken"
- junkedLiftsCount = count where status === "junked"

## File: apps/backend/src/services/summaryService.ts

Define an input type:
type LiftSummaryInput = {
  status: LiftStatus;
  liftModelKey: LiftModelKey;
};

Export one function:
export function calculateSummary(
  moneyCents: number,
  lifts: LiftSummaryInput[]
): SummaryDTO

Use getLiftModel internally to look up priceBonusCents and capacity for each working lift.

All arithmetic is integer math. Never introduce a float for money.

## Tests: apps/backend/src/__tests__/summaryService.test.ts

1. Empty lifts array: passPriceCents=100, capacityPerSec=0, incomePerSecCents=0, all counts=0
2. One working magic_carpet: capacity=5, passPriceCents=110, incomePerSecCents=550
3. One broken magic_carpet: capacity=0, passPriceCents=100, incomePerSecCents=0
4. One junked magic_carpet: same as broken — contributes nothing
5. Working magic_carpet + broken chairlift: only magic_carpet contributes to price/capacity
6. Two working magic_carpets: capacity=10, passPriceCents=120, incomePerSecCents=1200
7. One working cable_car: capacity=100, passPriceCents=300, incomePerSecCents=30000
8. totalLifts counts working + broken + junked all together
9. brokenLiftsCount counts only broken
10. junkedLiftsCount counts only junked
11. moneyCents in output matches moneyCents input (pass-through)

## Notes
- Import LiftStatus, LiftModelKey, SummaryDTO from @val-tick/shared
- Import getLiftModel from the catalog
- No Prisma, no Express, no side effects
```

---

### Prompt 6 — Tick Service

```text
You are working on val-tick. Summary service exists with tests. Now build the tick service — the core game simulation engine. This is the most complex piece of logic in the game.

## Tick order of operations (exact, from spec — do not reorder)
1. Calculate capacityPerSec from all WORKING lifts
2. Calculate passPriceCents from all WORKING lifts
3. Add income: moneyCents += capacityPerSec * passPriceCents
4. For each WORKING lift, roll for break:
   - Draw random number r in [0, 1)
   - If r < currentBreakProbability:
     - If currentBreakProbability >= 1.0 → set status to "junked"
     - Else → set status to "broken", set currentBreakProbability = currentBreakProbability * 2

Key consequence: A lift that breaks on step 4 already contributed income in step 3. It stops contributing from the NEXT tick.

## Junk boundary rule (subtle — read carefully)
- Lift breaks while its breakProbability is 0.5 → becomes broken, probability doubles to 1.0. Still broken (not junked). The check was BEFORE the doubling.
- Later: that lift is repaired and working again. It has breakProbability 1.0. On the NEXT break (1.0 >= 1.0) → becomes JUNKED.
- So: "reach 1.0 after doubling → still repairable. Break again at 1.0+ → junked."

## File: apps/backend/src/services/tickService.ts

export type LiftTickState = {
  id: string;
  liftModelKey: LiftModelKey;
  status: LiftStatus;
  currentBreakProbability: number;
};

export type TickResult = {
  updatedMoneyCents: number;
  updatedLifts: LiftTickState[];
};

export function processOneTick(
  moneyCents: number,
  lifts: LiftTickState[],
  random: () => number = Math.random
): TickResult

The random parameter defaults to Math.random but can be injected for testing.
Return new arrays/values — do not mutate inputs.

## Tests: apps/backend/src/__tests__/tickService.test.ts

Use a helper: const alwaysBreaks = () => 0 (forces break) and const neverBreaks = () => 1 (prevents break).

### Income calculation
1. One working magic_carpet, no breaks: moneyCents increases by 550
2. One broken lift: moneyCents unchanged
3. No lifts: moneyCents unchanged
4. Two working magic_carpets: moneyCents increases by 1200

### Break behavior
5. Working lift with alwaysBreaks: status becomes "broken", breakProbability doubles
6. Working lift with neverBreaks: stays "working", breakProbability unchanged
7. Broken lift is NOT rolled for breaks (alwaysBreaks doesn't affect broken lifts)
8. Junked lift is NOT rolled for breaks

### Junk boundary (critical tests)
9. Lift with breakProbability=0.5, alwaysBreaks: becomes "broken" with probability=1.0 (NOT junked — probability was 0.5 before the roll)
10. Lift with breakProbability=1.0, alwaysBreaks: becomes "junked"
11. Lift with breakProbability=2.0, alwaysBreaks: becomes "junked"

### Income-before-break ordering
12. Working lift that breaks this tick (alwaysBreaks): income IS still added to moneyCents for this tick

### Return value
13. Input lifts array is not mutated (verify original is unchanged after call)
14. Returns correct IDs on updatedLifts

## Notes
- Do NOT import Prisma here
- calculateSummary can be reused internally for the income step, or inline the math — your choice
- The injectable random is non-negotiable for test determinism
```

---

### Prompt 7 — Offline Simulation Service

```text
You are working on val-tick. The tick service exists with passing tests. Now build the offline simulation service that replays multiple ticks for idle resorts.

## Offline simulation rules (from spec)
- Simulate ticks exactly (not approximately) — each tick runs the full processOneTick logic
- Stop early as soon as ALL lifts are broken or junked — no point continuing
- If all lifts are already inactive on entry, do NOT simulate — just return as-is
- The number of ticks to simulate = floor((now - lastTickAt) / 1000) where timestamps are in ms

## File: apps/backend/src/services/offlineSimService.ts

import type { LiftTickState } from "./tickService";

export type OfflineSimInput = {
  moneyCents: number;
  lifts: LiftTickState[];
  lastTickAt: Date;
  now?: Date;       // defaults to new Date() — injectable for testing
  random?: () => number; // injectable for testing
};

export type OfflineSimResult = {
  updatedMoneyCents: number;
  updatedLifts: LiftTickState[];
  ticksSimulated: number;
};

export function simulateOfflineTicks(input: OfflineSimInput): OfflineSimResult

## Tests: apps/backend/src/__tests__/offlineSimService.test.ts

Use fixed timestamps for determinism.

1. Zero elapsed ticks (lastTickAt = now): ticksSimulated=0, money unchanged
2. 3 elapsed seconds with working lifts and neverBreaks: ticksSimulated=3, income = 3 * singleTickIncome
3. 5 elapsed seconds with alwaysBreaks and 1 magic_carpet: lift breaks on tick 1, ticks 2-5 skipped (early stop). ticksSimulated=1
4. All lifts already broken at start: ticksSimulated=0, money unchanged (early stop before first tick)
5. All lifts already junked at start: ticksSimulated=0
6. 1 working + 1 broken, alwaysBreaks: working breaks on tick 1, then all inactive, stop. ticksSimulated=1
7. Large elapsed time (7200 seconds = 2hr): simulates up to 7200 ticks if lifts survive

## Notes
- Use processOneTick from tickService internally
- Floor the elapsed time to whole ticks
- "All inactive" means every lift has status "broken" or "junked"
- The early-stop check happens at the START of each loop iteration, before running the tick
```

---

### Prompt 8 — Repository Layer

```text
You are working on val-tick. Pure logic services (summary, tick, offline sim) all exist with tests. Now build the database access layer using Prisma.

## Task
Create typed repository functions for resorts and lifts. These abstract all Prisma queries behind clean function interfaces. No business logic goes here — just DB reads and writes.

## File: apps/backend/src/db/resortRepository.ts

import type { Resort, Lift } from "@prisma/client";
export type { Resort, Lift };

// Load resort by guestId, including its lifts
export async function findResortByGuestId(
  guestId: string
): Promise<(Resort & { lifts: Lift[] }) | null>

// Save updated resort fields (money, lastTickAt)
export async function updateResort(
  id: string,
  data: { moneyCents: number; lastTickAt: Date }
): Promise<Resort>

## File: apps/backend/src/db/liftRepository.ts

import type { Lift } from "@prisma/client";

// Create a new lift record
export async function createLift(data: {
  resortId: string;
  liftModelKey: string;
  currentBreakProbability: number;
  status: "working" | "broken" | "junked";
}): Promise<Lift>

// Update a single lift's status and/or breakProbability
export async function updateLift(
  id: string,
  data: Partial<{
    status: "working" | "broken" | "junked";
    currentBreakProbability: number;
  }>
): Promise<Lift>

// Bulk update multiple lifts (used after a tick runs)
// Takes an array of { id, status, currentBreakProbability } objects
export async function bulkUpdateLifts(
  updates: Array<{
    id: string;
    status: "working" | "broken" | "junked";
    currentBreakProbability: number;
  }>
): Promise<void>

Use prisma.$transaction for bulkUpdateLifts to keep all updates atomic.

## File: apps/backend/src/db/index.ts
Re-export everything from resortRepository and liftRepository.

## Tests: apps/backend/src/__tests__/repositories.test.ts

Gate all tests with describe.skipIf(!process.env.DATABASE_URL).
Use a unique guestId per test run. Clean up in afterEach.

1. findResortByGuestId returns null for unknown guestId
2. findResortByGuestId returns resort with empty lifts array when no lifts exist
3. findResortByGuestId returns resort with lifts array populated
4. updateResort changes moneyCents and lastTickAt
5. createLift creates a lift with correct fields
6. updateLift changes a lift's status
7. bulkUpdateLifts updates multiple lifts atomically

## Notes
- All repositories import prisma from ../db/prisma
- The LiftStatus enum values must match Prisma's generated enum exactly
- bulkUpdateLifts with an empty array should be a no-op (no error)
```

---

### Prompt 9 — GET /resort/:guestId + resortService

```text
You are working on val-tick. Repositories exist. Pure logic services exist. Now build the first real API endpoint.

## Task
Build resortService (formats API responses) and wire up GET /resort/:guestId.

## File: apps/backend/src/services/resortService.ts

import type { GetResortResponse } from "@val-tick/shared";
import type { Resort, Lift } from "@prisma/client";

export function formatResortResponse(
  resort: Resort,
  lifts: Lift[]
): GetResortResponse

This function:
1. Computes SummaryDTO using calculateSummary from summaryService
2. Returns all lift model definitions using getAllLiftModels from the catalog
3. Maps Prisma Lift objects to LiftDTO (converting Date fields to ISO strings)
4. Maps Prisma Resort to ResortDTO (converting Date fields to ISO strings)

## File: apps/backend/src/routes/resort.ts

Create an Express Router. Register:

GET /resort/:guestId

Logic:
1. Extract guestId from path params
2. Call findResortByGuestId(guestId)
3. If null: return 404 JSON { error: "Game not found" }
4. Call formatResortResponse(resort, lifts)
5. Return 200 with the GetResortResponse

## Wire the router into apps/backend/src/index.ts
import and use the resort router:
app.use("/", resortRouter);

## Tests: apps/backend/src/__tests__/resortRoute.test.ts

Use supertest. Gate DB tests with skipIf(!process.env.DATABASE_URL).

Create a helper createTestResort(guestId) that inserts a resort + one working magic_carpet lift into the DB. Clean up after each test.

1. GET /resort/unknown-id → 404 with { error: "Game not found" }
2. GET /resort/:validGuestId → 200 with correct resort shape (check resort.guestId, summary fields, liftModels array length=5, lifts array)
3. Response includes all 5 liftModels
4. Summary correctly reflects the one working magic_carpet lift (incomePerSecCents=550)
5. Lifts array contains the created lift with correct liftModelKey and status

## Notes
- Do not put business logic in the route handler — delegate to services
- Date fields from Prisma are Date objects — convert to .toISOString() in formatResortResponse
- The summary is computed from current lift states, not stored in DB
```

---

### Prompt 10 — Seed Script

```text
You are working on val-tick. GET /resort/:guestId is working. Now create the admin seed script for creating a starter resort.

## Task
Create a runnable script that creates a new resort with the correct starting state. This is the only way resorts are created in V1.

## Starting state (from spec)
- money = $10 = 1000 cents
- 1 Magic Carpet lift, status="working", currentBreakProbability=0.001
- name and guestId are passed as arguments

## File: apps/backend/src/scripts/seedResort.ts

Usage: ts-node src/scripts/seedResort.ts <name> <guestId>
Example: ts-node src/scripts/seedResort.ts "Val Thorens" abc123

Extract the core creation logic into a separately exported and testable function:

export async function createResort(name: string, guestId: string): Promise<Resort>

This function:
1. Checks for duplicate guestId (throw if exists)
2. Creates resort with moneyCents=1000, lastTickAt=now
3. Creates one magic_carpet lift: status=working, currentBreakProbability=0.001
4. Returns the created resort

The script file calls createResort with process.argv args, logs the result, and disconnects Prisma.

## apps/backend/package.json — add script
"seed": "ts-node src/scripts/seedResort.ts"

## Tests: apps/backend/src/__tests__/seedResort.test.ts

Gate with skipIf(!process.env.DATABASE_URL). Clean up after each test.

1. Creates a resort with moneyCents=1000
2. Creates a resort with exactly one lift
3. The lift has liftModelKey="magic_carpet", status="working", currentBreakProbability=0.001
4. Throws if guestId already exists (Prisma unique constraint)

## Notes
- The createResort function is exported and tested
- The script file just wires args → createResort → logs output
- This is not an HTTP endpoint — it's a CLI script
```

---

### Prompt 11 — POST /tick

```text
You are working on val-tick. GET /resort/:guestId is working. The tick service and repositories exist. Now wire up the tick endpoint.

## Task
Build POST /tick — it runs one game tick for a resort and persists the result.

## Route: POST /tick

Add to apps/backend/src/routes/resort.ts (or a new routes/tick.ts).

Request body: { guestId: string }

Logic:
1. Find resort by guestId — 404 if not found
2. Map lifts to LiftTickState[]
3. Call processOneTick(resort.moneyCents, liftTickStates)
4. Persist: call updateResort with updatedMoneyCents and new lastTickAt=now
5. Call bulkUpdateLifts with the updated lift states
6. Return { ok: true }

## Tests: apps/backend/src/__tests__/tickRoute.test.ts

Gate with skipIf(!process.env.DATABASE_URL).
Create a test resort with known state before each test.

1. POST /tick with unknown guestId → 404
2. POST /tick with valid guestId → 200 { ok: true }
3. After ticking, GET /resort/:guestId shows updated money (one magic_carpet = +550 cents)
4. After ticking, lastTickAt on resort is updated to approximately now
5. POST /tick with a lift at breakProbability=1.0: use vi.spyOn(Math, "random").mockReturnValue(0) to force a break, verify the lift becomes junked in the subsequent GET response. Restore Math.random after the test.

## Notes
- The tick always uses the current time as the new lastTickAt
- bulkUpdateLifts handles all lifts including ones with no change
- Do NOT run offline simulation on POST /tick
```

---

### Prompt 12 — POST /buy_lift

```text
You are working on val-tick. POST /tick is working. Now build the buy lift endpoint.

## Task
Build the buy lift logic and POST /buy_lift route.

## File: apps/backend/src/services/liftService.ts (create new)

export async function buyLift(
  resort: Resort & { lifts: Lift[] },
  liftModelKey: LiftModelKey
): Promise<Resort & { lifts: Lift[] }>

Logic:
1. Look up the lift model with getLiftModel(liftModelKey) — throws if invalid key
2. Check if resort.moneyCents >= model.purchasePriceCents
3. If insufficient funds: return the resort unchanged (no error thrown)
4. Subtract purchasePriceCents from moneyCents, call updateResort
5. Create new lift with createLift: status="working", currentBreakProbability=model.initialBreakChance
6. Re-fetch and return the updated resort (call findResortByGuestId so the return is fresh)

## Route: POST /buy_lift

Request body: { guestId: string, liftModelKey: LiftModelKey }

Logic:
1. Find resort by guestId — 404 if not found
2. Call buyLift(resort, liftModelKey)
3. Format response with formatResortResponse
4. Return 200 with full GetResortResponse

## Tests: apps/backend/src/__tests__/buyLiftRoute.test.ts

Gate with skipIf(!process.env.DATABASE_URL).

1. Unknown guestId → 404
2. Valid buy: resort gets new lift in response, moneyCents reduced by purchasePriceCents
3. New lift has status="working"
4. New lift has currentBreakProbability=0.001
5. Insufficient funds: response still 200, resort unchanged (same moneyCents, same lift count)
6. Can buy multiple lifts of same type (call buy twice, verify two lifts exist)
7. Response matches full GetResortResponse shape (has resort, summary, liftModels, lifts)

## Notes
- Business failure (insufficient funds) returns 200 with unchanged state, not 4xx
- The new lift is available in the response lifts array immediately
```

---

### Prompt 13 — POST /repair_lift

```text
You are working on val-tick. POST /buy_lift is working. Now build the repair lift endpoint.

## Task
Add repairLift to liftService and build POST /repair_lift.

## File: apps/backend/src/services/liftService.ts (add to existing)

export async function repairLift(
  resort: Resort & { lifts: Lift[] },
  liftId: string
): Promise<Resort & { lifts: Lift[] }>

Logic:
1. Find the lift by liftId in resort.lifts — if not found: return resort unchanged
2. If lift.status !== "broken": return resort unchanged (can't repair working or junked lifts)
3. Look up the lift model to get repairCostCents
4. If resort.moneyCents < repairCostCents: return resort unchanged
5. Subtract repairCostCents from moneyCents, call updateResort
6. Set lift status to "working" via updateLift — do NOT change currentBreakProbability
7. Return refreshed resort (re-fetch via findResortByGuestId)

## Route: POST /repair_lift

Request body: { guestId: string, liftId: string }

Logic:
1. Find resort by guestId — 404 if not found
2. Call repairLift(resort, liftId)
3. Format and return full GetResortResponse

## Tests: apps/backend/src/__tests__/repairLiftRoute.test.ts

Gate with skipIf(!process.env.DATABASE_URL).
Setup helper: create resort with one broken magic_carpet lift.

1. Unknown guestId → 404
2. Valid repair: lift status changes to "working" in response
3. Valid repair: moneyCents reduced by 100 (magic_carpet repairCostCents)
4. Repair does NOT change currentBreakProbability (verify value is unchanged)
5. Insufficient funds: resort unchanged, 200 response
6. Lift not found (wrong liftId): resort unchanged, 200 response
7. Lift belongs to different resort: resort unchanged
8. Working lift repair attempt: resort unchanged
9. Junked lift repair attempt: resort unchanged

## Notes
- Repair deliberately does NOT reset break probability — this is a gameplay feature
- Junked lifts cannot be repaired — caught by status !== "broken" check
- Returning 200 with unchanged state for all business failures is intentional per spec
```

---

### Prompt 14 — Background Simulation Job

```text
You are working on val-tick. All four API endpoints are working. Now build the background simulation job.

## Task
Build a background worker that periodically simulates ticks for resorts that have been idle too long, then wire it into the Express server.

## Rule
- If a resort has not been updated for approximately 2 hours, simulate it
- Use simulateOfflineTicks from offlineSimService
- If all lifts are already inactive, just update lastTickAt and skip simulation

## Add to resortRepository:
export async function findIdleResorts(idleThreshold: Date): Promise<Resort[]>
// Returns all resorts where lastTickAt < idleThreshold

## File: apps/backend/src/jobs/backgroundSimJob.ts

export async function runBackgroundSim(): Promise<void>

Logic:
1. Query findIdleResorts(new Date(Date.now() - 2 * 60 * 60 * 1000))
2. Log: "[backgroundSim] Processing N resorts"
3. For each resort (in sequence):
   a. Fetch resort with lifts via findResortByGuestId
   b. Map to LiftTickState[]
   c. Call simulateOfflineTicks({ moneyCents, lifts, lastTickAt, now: new Date() })
   d. Call updateResort with updatedMoneyCents and lastTickAt=now
   e. Call bulkUpdateLifts with updatedLifts
   f. Log: "[backgroundSim] Resort {guestId}: simulated {N} ticks"
4. Wrap each resort's processing in try/catch — log errors, continue to next resort

## Wire into apps/backend/src/server.ts
After server starts:
const BACKGROUND_JOB_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
setInterval(() => {
  runBackgroundSim().catch((e) => console.error("[backgroundSim] Error:", e));
}, BACKGROUND_JOB_INTERVAL_MS);

## Tests: apps/backend/src/__tests__/backgroundSimJob.test.ts

Gate with skipIf(!process.env.DATABASE_URL).
Manipulate lastTickAt directly in DB to simulate idle time.

1. Resort updated within last 2 hours: runBackgroundSim does NOT touch it (moneyCents unchanged)
2. Resort idle 3 hours with 1 working magic_carpet: money increases after sim runs
3. Resort idle 3 hours with all broken lifts: money unchanged, lastTickAt updated
4. Resort idle 3 hours with all junked lifts: money unchanged, lastTickAt updated
5. Error in one resort does not prevent others from being processed

## Notes
- Tests call runBackgroundSim() directly — no interval needed in tests
- Log every run, including "0 resorts needed simulation"
```

---

### Prompt 15 — Frontend Scaffold

```text
You are working on val-tick. The entire backend is complete. Now build the React frontend scaffold.

## Task
Set up the React app with routing, React Query, and the basic app shell — including the "Game not found" screen.

## Files to create/modify

### apps/frontend/src/main.tsx
Wrap app in both QueryClientProvider and BrowserRouter:

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
);

### apps/frontend/src/App.tsx
Define two routes:
- /resort/:guestId → renders <ResortPage />
- * (wildcard) → renders <NotFoundPage /> (bad URL, no guestId)

### apps/frontend/src/pages/NotFoundPage.tsx
Renders: "Game not found. Check your URL or ask for a valid guest ID."
Minimal, no buttons needed.

### apps/frontend/src/pages/GameNotFoundPage.tsx
Shown when API returns 404 for a valid-looking guestId:
"This resort doesn't exist."

### apps/frontend/src/pages/ResortPage.tsx
Placeholder only:
export function ResortPage() {
  const { guestId } = useParams<{ guestId: string }>();
  return <div>Resort: {guestId}</div>;
}

## Vitest setup
Add to apps/frontend/vite.config.ts:
test: {
  environment: "jsdom",
  globals: true,
  setupFiles: ["./src/test/setup.ts"],
}

Create apps/frontend/src/test/setup.ts:
import "@testing-library/jest-dom";

## Tests: apps/frontend/src/__tests__/App.test.tsx

Use MemoryRouter from react-router-dom for routing tests.

1. Navigating to /resort/abc123 renders "Resort: abc123"
2. Navigating to /unknown-route renders NotFoundPage content
3. NotFoundPage renders the expected message
4. GameNotFoundPage renders the expected message

## Notes
- No API calls yet — ResortPage is a placeholder
- QueryClient config: retry:1 so tests don't hammer a failing mock API
```

---

### Prompt 16 — API Client Layer

```text
You are working on val-tick. The frontend scaffold exists with routing and React Query. Now build the typed API client and data hooks.

## File: apps/frontend/src/api/client.ts

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function fetchResort(guestId: string): Promise<GetResortResponse>
// GET /resort/:guestId
// throws Error("NOT_FOUND") if response is 404
// throws for other non-ok responses

export async function postTick(guestId: string): Promise<TickResponse>
// POST /tick with body { guestId }

export async function postBuyLift(req: BuyLiftRequest): Promise<MutationResortResponse>
// POST /buy_lift

export async function postRepairLift(req: RepairLiftRequest): Promise<MutationResortResponse>
// POST /repair_lift

Each function sets Content-Type: application/json on POST requests.

## File: apps/frontend/src/hooks/useResort.ts

export function useResort(guestId: string) {
  return useQuery({
    queryKey: ["resort", guestId],
    queryFn: () => fetchResort(guestId),
  });
}

export function useBuyLiftMutation(guestId: string)
// On success: queryClient.setQueryData(["resort", guestId], data)

export function useRepairLiftMutation(guestId: string)
// On success: queryClient.setQueryData(["resort", guestId], data)

## File: apps/frontend/src/hooks/useTickMutation.ts
export function useTickMutation(guestId: string)
// On success: queryClient.invalidateQueries({ queryKey: ["resort", guestId] })
// (tick returns only {ok:true} so we need a full refetch)

## Update ResortPage to use real data
const { data, isLoading, error } = useResort(guestId!);

if (isLoading) return <div>Loading...</div>;
if (error?.message === "NOT_FOUND") return <GameNotFoundPage />;
if (error || !data) return <div>Something went wrong.</div>;

return <div>Resort: {data.resort.name}</div>;

## Tests: apps/frontend/src/__tests__/apiClient.test.ts

Mock fetch using vi.stubGlobal("fetch", mockFn).

1. fetchResort parses and returns GetResortResponse on 200
2. fetchResort throws Error("NOT_FOUND") on 404
3. fetchResort throws on 500
4. postTick sends correct body and returns { ok: true }
5. postBuyLift sends correct body
6. postRepairLift sends correct body

## Tests: apps/frontend/src/__tests__/useResort.test.tsx

Use renderHook with a wrapper that provides QueryClient.

1. useResort returns loading state initially
2. useResort returns data on 200 success
3. useResort surfaces NOT_FOUND error on 404

## Notes
- Never hardcode localhost in tests — mock fetch instead
- NOT_FOUND error string is the contract between client.ts and ResortPage
- setQueryData on buy/repair avoids an extra round-trip GET
```

---

### Prompt 17 — Top Bar Component

```text
You are working on val-tick. API client and useResort hook are working. ResortPage shows resort name. Now build the top bar.

## Top bar contents (in order, from spec)
1. Resort name
2. Guest ID
3. Current money (formatted as $X.XX)
4. Income/sec (formatted as $X.XX/sec)
5. Capacity/sec (integer)
6. Total lifts (integer)
7. Broken lifts count (integer)

## File: apps/frontend/src/utils/format.ts

export function formatMoney(cents: number): string
// (cents / 100).toFixed(2) with "$" prefix
// formatMoney(1050) === "$10.50"

export function formatMoneyPerSec(cents: number): string
// formatMoney(cents) + "/sec"

## File: apps/frontend/src/components/ResortTopBar.tsx

interface Props {
  resort: ResortDTO;
  summary: SummaryDTO;
}

export function ResortTopBar({ resort, summary }: Props)

Render all 7 fields in a <header> with a horizontal flexbox layout. Labels should be clear and readable.

## Update ResortPage
return (
  <div>
    <ResortTopBar resort={data.resort} summary={data.summary} />
    {/* lift list coming next */}
  </div>
);

## Tests: apps/frontend/src/__tests__/ResortTopBar.test.tsx

Create test fixtures for ResortDTO and SummaryDTO.

1. Renders resort name
2. Renders guest ID
3. Renders money as "$10.00" when moneyCents=1000
4. Renders income as "$5.50/sec" when incomePerSecCents=550
5. Renders capacity as "25" when capacityPerSec=25
6. Renders totalLifts as "4"
7. Renders brokenLiftsCount as "1"
8. brokenLiftsCount of 0 is still visible (not hidden)

## Tests: apps/frontend/src/__tests__/format.test.ts

1. formatMoney(0) === "$0.00"
2. formatMoney(1000) === "$10.00"
3. formatMoney(1050) === "$10.50"
4. formatMoney(1) === "$0.01"
5. formatMoneyPerSec(550) === "$5.50/sec"

## Notes
- All values come from the summary object — never recompute on the frontend
- Full numbers only — no compact or scientific notation (per spec)
```

---

### Prompt 18 — Lift Groups and Individual Rows

```text
You are working on val-tick. Top bar is complete. Now build the main lift list.

## Spec
- Lifts grouped by model (Magic Carpet → Drag Lift → Chairlift → Gondola → Cable Car)
- Each group collapsible (open by default)
- Group header: model name, owned count, broken count, model stats, buy button
- Rows sorted: broken first within each group
- Active list shows only working + broken lifts (junked go to junkyard)
- All 5 model groups always visible (even if 0 owned — for buying)

## File: apps/frontend/src/components/LiftRow.tsx

interface Props {
  lift: LiftDTO;
  model: LiftModelDTO;
  onRepair: (liftId: string) => void;
  canAffordRepair: boolean;
}

Renders: icon placeholder, model name, capacity ("5/sec"), and if broken: red "BROKEN" label + "Repair ($X.XX)" button (disabled if !canAffordRepair).

## File: apps/frontend/src/components/LiftGroup.tsx

interface Props {
  model: LiftModelDTO;
  lifts: LiftDTO[];         // only this model's working + broken lifts
  onBuy: () => void;
  onRepair: (liftId: string) => void;
  canAffordBuy: boolean;
  canAffordRepair: (repairCostCents: number) => boolean;
}

Renders:
- <details open> for collapsible behaviour (HTML-native, no state needed)
- Header: model name, "N owned, N broken", purchase price, capacity, price bonus, repair cost
- "Buy ($X.XX)" button — disabled if !canAffordBuy
- LiftRow list sorted broken-first

## File: apps/frontend/src/components/LiftList.tsx

interface Props {
  liftModels: LiftModelDTO[];
  lifts: LiftDTO[];            // all non-junked lifts
  currentMoneyCents: number;
  onBuy: (liftModelKey: LiftModelKey) => void;
  onRepair: (liftId: string) => void;
}

Renders one LiftGroup per model (always all 5). Filters lifts per model before passing to group.

## Update ResortPage
Wire in mutations and LiftList:

const buyLift = useBuyLiftMutation(guestId!);
const repairLift = useRepairLiftMutation(guestId!);
const activeLifts = data.lifts.filter((l) => l.status !== "junked");

return (
  <div>
    <ResortTopBar resort={data.resort} summary={data.summary} />
    <LiftList
      liftModels={data.liftModels}
      lifts={activeLifts}
      currentMoneyCents={data.summary.moneyCents}
      onBuy={(key) => buyLift.mutate({ guestId: guestId!, liftModelKey: key })}
      onRepair={(id) => repairLift.mutate({ guestId: guestId!, liftId: id })}
    />
  </div>
);

## Tests: apps/frontend/src/__tests__/LiftGroup.test.tsx

Use vi.fn() for handlers.

1. Renders model name in header
2. Shows correct owned count
3. Shows correct broken count
4. Group is expanded by default (details[open])
5. Buy button disabled when canAffordBuy=false
6. Buy button click calls onBuy
7. Broken lift row shows "BROKEN" text
8. Repair button click calls onRepair with correct liftId
9. Repair button disabled when canAffordRepair returns false
10. Working lift does not show "BROKEN"
11. Broken lifts appear before working lifts in the list
```

---

### Prompt 19 — Broken State, Junkyard, and Icons

```text
You are working on val-tick. LiftList and LiftGroup are working with buy/repair interactions. Now complete the UI.

## Task 1: Style broken state
Add CSS modules or inline styles to LiftRow so broken lifts are visually distinct:
- "BROKEN" label in red (#cc0000), bold
- Repair button in red with white text
- Disabled repair button at 50% opacity with not-allowed cursor

Create apps/frontend/src/components/LiftRow.module.css with those rules and apply the classes in LiftRow.tsx.

## Task 2: Junkyard section

### apps/frontend/src/components/JunkyardSection.tsx

interface Props {
  liftModels: LiftModelDTO[];
  junkedLifts: LiftDTO[];
}

export function JunkyardSection({ liftModels, junkedLifts }: Props)

Renders:
- Returns null if junkedLifts.length === 0
- Section heading: "Junkyard"
- Total count: "N lifts junked"
- Grouped by model — similar visual structure to LiftGroup but:
  - No buy button
  - No repair button
  - Each row shows a "JUNKED" label
  - Non-interactive

## Update ResortPage
const junkedLifts = data.lifts.filter((l) => l.status === "junked");

return (
  <div>
    <ResortTopBar ... />
    <LiftList ... />
    <JunkyardSection liftModels={data.liftModels} junkedLifts={junkedLifts} />
  </div>
);

## Task 3: Lift icon placeholders
Create apps/frontend/src/assets/lifts/ with 5 placeholder SVG files:
- magic-carpet.svg, drag-lift.svg, chairlift.svg, gondola.svg, cable-car.svg

Each SVG: a simple colored rectangle with the lift name as text label. Different fill color per model.

Create apps/frontend/src/assets/liftIcons.ts:
export const liftIcons: Record<string, string> = {
  "magic-carpet": magicCarpetSvg,
  // ... etc
};

Use liftIcons[model.iconKey] as the src for <img alt={model.name}> in LiftRow and junkyard rows.

## Tests: apps/frontend/src/__tests__/JunkyardSection.test.tsx

1. Returns null when junkedLifts is empty
2. Renders "Junkyard" heading when lifts exist
3. Shows correct total count text
4. Shows "JUNKED" label on each row
5. No buttons present (no repair, no buy)
6. Groups lifts by model correctly

## Tests: extend apps/frontend/src/__tests__/LiftRow.test.tsx

7. Broken LiftRow has the broken CSS class applied to the label
8. Working LiftRow does not have the broken CSS class
```

---

### Prompt 20 — Adaptive Ticking and Final Wiring

```text
You are working on val-tick. All UI components are complete. Now wire up the live tick loop — this is the final step that makes the game run.

## Tick behavior (from spec)
- Tab active: tick every 1 second
- Tab inactive (hidden < 5 min): tick every 10 seconds
- Tab hidden 5+ minutes: stop ticking entirely
- Return from 5+ min hidden: resume ticking + immediately invalidate resort query (triggers refetch to pick up backend offline simulation)
- Return from < 5 min hidden: resume at 1s, no forced refetch

Use the Page Visibility API: document.visibilityState and visibilitychange event.

## File: apps/frontend/src/hooks/useTick.ts

// Constants
const ACTIVE_INTERVAL_MS = 1_000;
const INACTIVE_INTERVAL_MS = 10_000;
const STOP_AFTER_HIDDEN_MS = 5 * 60 * 1_000; // 5 minutes

export function useTick(guestId: string): void

This hook:
1. Uses a ref to track when the tab was hidden (hiddenAt: number | null)
2. Uses a ref to track the current setInterval id
3. On mount: starts a 1s interval that calls the tick mutation
4. On visibilitychange to hidden: record hiddenAt=Date.now(), switch to 10s interval
5. On visibilitychange back to visible:
   - If Date.now() - hiddenAt >= STOP_AFTER_HIDDEN_MS: invalidate resort query, resume 1s interval
   - Else: just resume 1s interval
6. While continuously hidden for 5+ min (detect in the interval callback): clear the interval
7. Cleans up all intervals and event listeners on unmount

The tick mutation is fire-and-forget — no loading state needed.

## Update ResortPage — add the hook
export function ResortPage() {
  const { guestId } = useParams<{ guestId: string }>();
  const { data, isLoading, error } = useResort(guestId!);

  useTick(guestId!); // Always at top level, regardless of load state

  // ... rest of render unchanged
}

## Tests: apps/frontend/src/__tests__/useTick.test.tsx

Use vi.useFakeTimers() — restore in afterEach.
Mock useTickMutation to expose a mutate spy.
Mock document.visibilityState and dispatch visibilitychange events manually.

1. Tick mutation called after 1000ms when tab active
2. Tick mutation NOT called at 1000ms when tab hidden
3. Tick mutation called at 10000ms when tab hidden
4. After 5 minutes hidden: no more ticks fire
5. Return from 5+ min: tick resumes AND resort query is invalidated
6. Return from < 5 min: tick resumes, resort query NOT invalidated
7. On unmount: interval is cleared, no more ticks fire

## Final integration check (manual)
After this prompt, the game is complete. Verify manually:
- npm run seed -- "My Resort" testguest123
- Open http://localhost:5173/resort/testguest123
- Money increments every second
- Buy a lift → appears immediately, money decreases
- Wait for a lift to break → it shows as broken
- Click repair → broken indicator disappears, money decreases
- If a lift junks → it moves to junkyard section
- Open browser devtools → switch to background tab → ticking slows to 10s cadence
- Hide tab for 5+ min → return → resort refetches to pick up backend simulation

## Notes
- vi.useFakeTimers() must be paired with vi.useRealTimers() in afterEach — it affects all timers globally
- The 5-minute stop check uses real Date.now() wall-clock time, not tick counts
- Tick mutation errors are swallowed silently — this is correct per spec
```

---

## Summary of Build Order

```
Prompt 1  → Monorepo + health check
Prompt 2  → Shared types (used everywhere)
Prompt 3  → Prisma schema + DB client
Prompt 4  → Lift model catalog (pure constants)
Prompt 5  → Summary service (pure economy math)
Prompt 6  → Tick service (pure simulation engine)
Prompt 7  → Offline simulation (wraps tick service)
Prompt 8  → DB repositories (Prisma queries)
Prompt 9  → GET /resort/:guestId (first working endpoint)
Prompt 10 → Seed script (creates testable data)
Prompt 11 → POST /tick (second endpoint)
Prompt 12 → POST /buy_lift (third endpoint)
Prompt 13 → POST /repair_lift (fourth endpoint)
Prompt 14 → Background job (wired into server)
Prompt 15 → Frontend scaffold (routing + React Query)
Prompt 16 → API client + useResort hook
Prompt 17 → Top bar component
Prompt 18 → Lift groups + rows + buy/repair interactions
Prompt 19 → Broken visuals + junkyard section
Prompt 20 → Adaptive tick loop (makes it a live game)
```

At no point does a prompt leave orphaned code. Every module built is either tested in isolation or wired into the running app by the end of that prompt. The backend is fully working and end-to-end testable by Prompt 14. The frontend is fully interactive by Prompt 20.
