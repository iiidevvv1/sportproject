# Curling Stats Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack curling match statistics app — React frontend + Express/SQLite backend — from existing UI mockups.

**Architecture:** Monorepo with `client/` (Vite + React + TypeScript) and `server/` (Express + SQLite + TypeScript). The client calls REST API endpoints. React Router for navigation. State managed via React Query (TanStack Query) for server state caching/sync.

**Tech Stack:**
- Frontend: React 18, TypeScript, Vite, Tailwind CSS v4, React Router v7, TanStack Query v5, motion/react, lucide-react
- Backend: Node.js, Express, better-sqlite3, TypeScript, tsx (dev runner)
- Testing: Vitest, React Testing Library, supertest
- Build: Docker multi-stage (Dockerfile), GitHub Actions CI stub

**Repo:** https://github.com/iiidevvv1/sportproject

---

## File Structure

```
sportproject/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── types.ts                    # Shared frontend types
│   │   ├── api.ts                      # API client (fetch wrappers)
│   │   ├── router.tsx                  # React Router config
│   │   ├── hooks/
│   │   │   ├── useGame.ts             # TanStack Query hooks for game
│   │   │   └── useShots.ts            # TanStack Query hooks for shots
│   │   ├── components/
│   │   │   ├── Header.tsx             # Reusable header
│   │   │   ├── ScoreBoard.tsx         # Score display component
│   │   │   ├── ShotInput.tsx          # Shot type/rotation/score buttons
│   │   │   ├── EndResult.tsx          # End score entry modal
│   │   │   ├── SplitProgressBar.tsx   # Reused from mockup
│   │   │   ├── GameCard.tsx           # Game list item
│   │   │   └── ColorPicker.tsx        # Stone color selector
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Screen 1 - game list
│   │   │   ├── NewGame.tsx            # Screen 2 - create game
│   │   │   ├── InGame.tsx             # Screen 3 - shot entry
│   │   │   └── Stats.tsx              # Screen 4 - analytics
│   │   └── lib/
│   │       ├── shotOrder.ts           # Shot sequence logic (who throws next)
│   │       └── statsCalc.ts           # Stats calculation (averages, breakdowns)
│   └── __tests__/
│       ├── lib/
│       │   ├── shotOrder.test.ts
│       │   └── statsCalc.test.ts
│       ├── components/
│       │   ├── ShotInput.test.tsx
│       │   ├── EndResult.test.tsx
│       │   └── GameCard.test.tsx
│       └── pages/
│           ├── Dashboard.test.tsx
│           ├── NewGame.test.tsx
│           ├── InGame.test.tsx
│           └── Stats.test.tsx
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                   # Express app entry
│   │   ├── db.ts                      # SQLite init + migrations
│   │   ├── types.ts                   # Backend types
│   │   ├── routes/
│   │   │   ├── games.ts              # /api/games CRUD
│   │   │   ├── shots.ts              # /api/games/:id/shots
│   │   │   ├── ends.ts               # /api/games/:id/ends
│   │   │   └── stats.ts              # /api/games/:id/stats
│   │   └── lib/
│   │       ├── shotOrder.ts           # Shot sequence validation
│   │       └── statsCalc.ts           # Server-side stats calculation
│   └── __tests__/
│       ├── db.test.ts
│       ├── routes/
│       │   ├── games.test.ts
│       │   ├── shots.test.ts
│       │   ├── ends.test.ts
│       │   └── stats.test.ts
│       └── lib/
│           ├── shotOrder.test.ts
│           └── statsCalc.test.ts
├── Dockerfile
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml                     # Lint + test + build
├── package.json                       # Root workspace config
├── tsconfig.base.json                 # Shared TS config
└── .gitignore
```

---

## Chunk 1: Project Scaffolding + Backend Foundation

### Task 1: Initialize monorepo structure

**Files:**
- Create: `package.json` (root workspace)
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Remove: `src/` (old mockup files — move to `docs/mockup/`)
- Remove: `metadata.json`

- [ ] **Step 1: Back up existing mockup files**

```bash
cd /home/node/.openclaw/workspace-sportsman/sportproject
mkdir -p docs/mockup
mv src/ docs/mockup/src/
mv metadata.json docs/mockup/
mv index.html docs/mockup/
```

- [ ] **Step 2: Create root package.json with workspaces**

Create `package.json`:
```json
{
  "name": "curling-stats",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w server\" \"npm run dev -w client\"",
    "build": "npm run build -w server && npm run build -w client",
    "test": "npm run test -w server && npm run test -w client",
    "lint": "npm run lint -w server && npm run lint -w client"
  },
  "devDependencies": {
    "concurrently": "^9.1.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
*.db
*.sqlite
.env
.DS_Store
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: init monorepo structure, archive mockup"
```

---

### Task 2: Set up server package with Express + SQLite

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`

- [ ] **Step 1: Create server/package.json**

```json
{
  "name": "curling-stats-server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "better-sqlite3": "^11.8.0",
    "cors": "^2.8.5",
    "express": "^5.1.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.2",
    "supertest": "^7.1.0",
    "@types/supertest": "^6.0.2",
    "tsx": "^4.19.0",
    "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 2: Create server/tsconfig.json**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["__tests__"]
}
```

- [ ] **Step 3: Install dependencies**

```bash
cd /home/node/.openclaw/workspace-sportsman/sportproject
npm install
```

Expected: packages installed in root node_modules with hoisting.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add server package with deps"
```

---

### Task 3: Database schema and initialization

**Files:**
- Create: `server/src/db.ts`
- Create: `server/src/types.ts`
- Create: `server/__tests__/db.test.ts`

- [ ] **Step 1: Write failing test for DB initialization**

Create `server/__tests__/db.test.ts`:
```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { createDb, type AppDatabase } from '../src/db.js';

describe('Database', () => {
  let db: AppDatabase;

  afterEach(() => {
    db?.close();
  });

  it('creates all tables on init', () => {
    db = createDb(':memory:');

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as Array<{ name: string }>;

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('games');
    expect(tableNames).toContain('ends');
    expect(tableNames).toContain('shots');
  });

  it('games table has correct columns', () => {
    db = createDb(':memory:');

    const columns = db.pragma('table_info(games)') as Array<{ name: string; type: string; notnull: number }>;
    const colNames = columns.map((c) => c.name);

    expect(colNames).toContain('id');
    expect(colNames).toContain('date');
    expect(colNames).toContain('team_home');
    expect(colNames).toContain('team_away');
    expect(colNames).toContain('color_home');
    expect(colNames).toContain('color_away');
    expect(colNames).toContain('hammer_first_end');
    expect(colNames).toContain('max_ends');
    expect(colNames).toContain('status');
  });

  it('shots table has is_throwaway column', () => {
    db = createDb(':memory:');

    const columns = db.pragma('table_info(shots)') as Array<{ name: string }>;
    const colNames = columns.map((c) => c.name);

    expect(colNames).toContain('is_throwaway');
    expect(colNames).toContain('type');
    expect(colNames).toContain('turn');
    expect(colNames).toContain('score');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/node/.openclaw/workspace-sportsman/sportproject
npm test -w server
```
Expected: FAIL — module `../src/db.js` not found.

- [ ] **Step 3: Create server/src/types.ts**

```typescript
// --- Database row types (match SQLite schema) ---

export type GameStatus = 'active' | 'finished';
export type TeamSide = 'home' | 'away';
export type ShotType = 'draw' | 'takeout';
export type TurnType = 'inturn' | 'outturn';
export type StoneColor = 'red' | 'yellow' | 'blue' | 'green' | 'orange' | 'purple' | 'black' | 'white';
export type ScoreValue = 0 | 25 | 50 | 75 | 100;

export interface GameRow {
  id: number;
  date: string;
  team_home: string;
  team_away: string;
  color_home: StoneColor;
  color_away: StoneColor;
  hammer_first_end: TeamSide;
  max_ends: number;
  status: GameStatus;
  created_at: string;
}

export interface EndRow {
  id: number;
  game_id: number;
  number: number;
  score_home: number;
  score_away: number;
}

export interface ShotRow {
  id: number;
  game_id: number;
  end_number: number;
  shot_number: number;
  team: TeamSide;
  player_number: number;
  type: ShotType | null;
  turn: TurnType | null;
  score: ScoreValue | null;
  is_throwaway: number; // SQLite boolean (0/1)
}

// --- API request/response types ---

export interface CreateGameBody {
  team_home: string;
  team_away: string;
  color_home: StoneColor;
  color_away: StoneColor;
  hammer_first_end: TeamSide;
  max_ends?: number;
}

export interface CreateShotBody {
  end_number: number;
  shot_number: number;
  team: TeamSide;
  player_number: number;
  type: ShotType | null;
  turn: TurnType | null;
  score: ScoreValue | null;
  is_throwaway: boolean;
}

export interface CreateEndBody {
  number: number;
  score_home: number;
  score_away: number;
}

export interface GameWithDetails extends GameRow {
  ends: EndRow[];
  shots: ShotRow[];
}

export interface PlayerStats {
  position: number;
  avg: number;
  shot_count: number;
  draw_avg: number;
  takeout_avg: number;
  inturn_avg: number;
  outturn_avg: number;
  inturn_draw_avg: number;
  inturn_takeout_avg: number;
  outturn_draw_avg: number;
  outturn_takeout_avg: number;
}

export interface TeamStats {
  avg: number;
  shot_count: number;
  players: PlayerStats[];
}

export interface GameStats {
  home: TeamStats;
  away: TeamStats;
}
```

- [ ] **Step 4: Create server/src/db.ts**

```typescript
import Database from 'better-sqlite3';

export type AppDatabase = Database.Database;

export function createDb(path: string): AppDatabase {
  const db = new Database(path);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL DEFAULT (date('now')),
      team_home TEXT NOT NULL,
      team_away TEXT NOT NULL,
      color_home TEXT NOT NULL DEFAULT 'red',
      color_away TEXT NOT NULL DEFAULT 'yellow',
      hammer_first_end TEXT NOT NULL DEFAULT 'home' CHECK(hammer_first_end IN ('home', 'away')),
      max_ends INTEGER NOT NULL DEFAULT 10 CHECK(max_ends IN (8, 10)),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'finished')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      number INTEGER NOT NULL CHECK(number >= 1),
      score_home INTEGER NOT NULL DEFAULT 0,
      score_away INTEGER NOT NULL DEFAULT 0,
      UNIQUE(game_id, number)
    );

    CREATE TABLE IF NOT EXISTS shots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      end_number INTEGER NOT NULL CHECK(end_number >= 1),
      shot_number INTEGER NOT NULL CHECK(shot_number >= 1 AND shot_number <= 16),
      team TEXT NOT NULL CHECK(team IN ('home', 'away')),
      player_number INTEGER NOT NULL CHECK(player_number >= 1 AND player_number <= 4),
      type TEXT CHECK(type IN ('draw', 'takeout') OR type IS NULL),
      turn TEXT CHECK(turn IN ('inturn', 'outturn') OR turn IS NULL),
      score INTEGER CHECK(score IN (0, 25, 50, 75, 100) OR score IS NULL),
      is_throwaway INTEGER NOT NULL DEFAULT 0 CHECK(is_throwaway IN (0, 1)),
      UNIQUE(game_id, end_number, shot_number)
    );

    CREATE INDEX IF NOT EXISTS idx_shots_game ON shots(game_id);
    CREATE INDEX IF NOT EXISTS idx_ends_game ON ends(game_id);
  `);

  return db;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -w server
```
Expected: 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(server): add database schema with games, ends, shots tables"
```

---

### Task 4: Games CRUD API routes

**Files:**
- Create: `server/src/index.ts`
- Create: `server/src/routes/games.ts`
- Create: `server/__tests__/routes/games.test.ts`

- [ ] **Step 1: Write failing tests for games routes**

Create `server/__tests__/routes/games.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/index.js';
import type { GameRow, GameWithDetails } from '../src/types.js';

describe('Games API', () => {
  let request: ReturnType<typeof supertest>;
  let cleanup: () => void;

  beforeEach(() => {
    const { app, close } = createApp(':memory:');
    request = supertest(app);
    cleanup = close;
  });

  afterEach(() => {
    cleanup();
  });

  describe('POST /api/games', () => {
    it('creates a new game with required fields', async () => {
      const res = await request.post('/api/games').send({
        team_home: 'Красные',
        team_away: 'Синие',
        color_home: 'red',
        color_away: 'blue',
        hammer_first_end: 'home',
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        team_home: 'Красные',
        team_away: 'Синие',
        color_home: 'red',
        color_away: 'blue',
        hammer_first_end: 'home',
        max_ends: 10,
        status: 'active',
      });
      expect(res.body.id).toBeTypeOf('number');
    });

    it('creates game with custom max_ends', async () => {
      const res = await request.post('/api/games').send({
        team_home: 'A',
        team_away: 'B',
        color_home: 'red',
        color_away: 'yellow',
        hammer_first_end: 'away',
        max_ends: 8,
      });

      expect(res.status).toBe(201);
      expect(res.body.max_ends).toBe(8);
    });

    it('returns 400 for missing team_home', async () => {
      const res = await request.post('/api/games').send({
        team_away: 'B',
        color_home: 'red',
        color_away: 'yellow',
        hammer_first_end: 'home',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/games', () => {
    it('returns empty list initially', async () => {
      const res = await request.get('/api/games');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns created games ordered by date desc', async () => {
      await request.post('/api/games').send({
        team_home: 'A', team_away: 'B',
        color_home: 'red', color_away: 'yellow',
        hammer_first_end: 'home',
      });
      await request.post('/api/games').send({
        team_home: 'C', team_away: 'D',
        color_home: 'blue', color_away: 'green',
        hammer_first_end: 'away',
      });

      const res = await request.get('/api/games');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect((res.body as GameRow[])[0]!.team_home).toBe('C');
    });
  });

  describe('GET /api/games/:id', () => {
    it('returns game with ends and shots', async () => {
      const createRes = await request.post('/api/games').send({
        team_home: 'A', team_away: 'B',
        color_home: 'red', color_away: 'yellow',
        hammer_first_end: 'home',
      });
      const gameId = (createRes.body as GameRow).id;

      const res = await request.get(`/api/games/${gameId}`);
      expect(res.status).toBe(200);
      const body = res.body as GameWithDetails;
      expect(body.id).toBe(gameId);
      expect(body.ends).toEqual([]);
      expect(body.shots).toEqual([]);
    });

    it('returns 404 for non-existent game', async () => {
      const res = await request.get('/api/games/999');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/games/:id/status', () => {
    it('finishes a game', async () => {
      const createRes = await request.post('/api/games').send({
        team_home: 'A', team_away: 'B',
        color_home: 'red', color_away: 'yellow',
        hammer_first_end: 'home',
      });
      const gameId = (createRes.body as GameRow).id;

      const res = await request.put(`/api/games/${gameId}/status`).send({ status: 'finished' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('finished');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -w server
```
Expected: FAIL — `../src/index.js` doesn't export `createApp`.

- [ ] **Step 3: Create server/src/index.ts**

```typescript
import express from 'express';
import cors from 'cors';
import { createDb, type AppDatabase } from './db.js';
import { gamesRouter } from './routes/games.js';

export interface AppContext {
  db: AppDatabase;
}

export function createApp(dbPath: string): { app: express.Express; close: () => void } {
  const db = createDb(dbPath);
  const app = express();

  app.use(cors());
  app.use(express.json());

  const ctx: AppContext = { db };

  app.use('/api/games', gamesRouter(ctx));

  return {
    app,
    close: () => db.close(),
  };
}

// Start server only when run directly
const isMainModule = process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js');
if (isMainModule) {
  const PORT = process.env['PORT'] ?? 3001;
  const { app } = createApp('./curling-stats.db');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

- [ ] **Step 4: Create server/src/routes/games.ts**

```typescript
import { Router, type Request, type Response } from 'express';
import type { AppContext } from '../index.js';
import type { CreateGameBody, GameRow, EndRow, ShotRow, GameWithDetails } from '../types.js';

export function gamesRouter(ctx: AppContext): Router {
  const router = Router();

  // GET /api/games
  router.get('/', (_req: Request, res: Response) => {
    const games = ctx.db
      .prepare('SELECT * FROM games ORDER BY created_at DESC')
      .all() as GameRow[];
    res.json(games);
  });

  // POST /api/games
  router.post('/', (req: Request, res: Response) => {
    const body = req.body as Partial<CreateGameBody>;

    if (!body.team_home || !body.team_away || !body.color_home || !body.color_away || !body.hammer_first_end) {
      res.status(400).json({ error: 'Missing required fields: team_home, team_away, color_home, color_away, hammer_first_end' });
      return;
    }

    const maxEnds = body.max_ends ?? 10;

    const result = ctx.db.prepare(`
      INSERT INTO games (team_home, team_away, color_home, color_away, hammer_first_end, max_ends)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(body.team_home, body.team_away, body.color_home, body.color_away, body.hammer_first_end, maxEnds);

    const game = ctx.db
      .prepare('SELECT * FROM games WHERE id = ?')
      .get(result.lastInsertRowid) as GameRow;

    res.status(201).json(game);
  });

  // GET /api/games/:id
  router.get('/:id', (req: Request, res: Response) => {
    const game = ctx.db
      .prepare('SELECT * FROM games WHERE id = ?')
      .get(req.params['id']) as GameRow | undefined;

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const ends = ctx.db
      .prepare('SELECT * FROM ends WHERE game_id = ? ORDER BY number')
      .all(game.id) as EndRow[];

    const shots = ctx.db
      .prepare('SELECT * FROM shots WHERE game_id = ? ORDER BY end_number, shot_number')
      .all(game.id) as ShotRow[];

    const response: GameWithDetails = { ...game, ends, shots };
    res.json(response);
  });

  // PUT /api/games/:id/status
  router.put('/:id/status', (req: Request, res: Response) => {
    const { status } = req.body as { status?: string };

    if (status !== 'finished') {
      res.status(400).json({ error: 'Invalid status. Use "finished"' });
      return;
    }

    const result = ctx.db
      .prepare('UPDATE games SET status = ? WHERE id = ?')
      .run(status, req.params['id']);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const game = ctx.db
      .prepare('SELECT * FROM games WHERE id = ?')
      .get(req.params['id']) as GameRow;

    res.json(game);
  });

  return router;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -w server
```
Expected: All games tests PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(server): add games CRUD API with tests"
```

---

### Task 5: Shots API routes

**Files:**
- Create: `server/src/routes/shots.ts`
- Create: `server/__tests__/routes/shots.test.ts`
- Modify: `server/src/index.ts` — register shots router

- [ ] **Step 1: Write failing tests for shots routes**

Create `server/__tests__/routes/shots.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/index.js';
import type { GameRow, ShotRow } from '../src/types.js';

describe('Shots API', () => {
  let request: ReturnType<typeof supertest>;
  let cleanup: () => void;
  let gameId: number;

  beforeEach(async () => {
    const { app, close } = createApp(':memory:');
    request = supertest(app);
    cleanup = close;

    const res = await request.post('/api/games').send({
      team_home: 'A', team_away: 'B',
      color_home: 'red', color_away: 'yellow',
      hammer_first_end: 'home',
    });
    gameId = (res.body as GameRow).id;
  });

  afterEach(() => {
    cleanup();
  });

  describe('POST /api/games/:id/shots', () => {
    it('records a normal shot', async () => {
      const res = await request.post(`/api/games/${gameId}/shots`).send({
        end_number: 1,
        shot_number: 1,
        team: 'away',
        player_number: 1,
        type: 'draw',
        turn: 'inturn',
        score: 75,
        is_throwaway: false,
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        game_id: gameId,
        end_number: 1,
        shot_number: 1,
        team: 'away',
        player_number: 1,
        type: 'draw',
        turn: 'inturn',
        score: 75,
        is_throwaway: 0,
      });
    });

    it('records a throwaway shot with null fields', async () => {
      const res = await request.post(`/api/games/${gameId}/shots`).send({
        end_number: 1,
        shot_number: 1,
        team: 'away',
        player_number: 1,
        type: null,
        turn: null,
        score: null,
        is_throwaway: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.is_throwaway).toBe(1);
      expect(res.body.type).toBeNull();
    });

    it('returns 400 for invalid shot_number', async () => {
      const res = await request.post(`/api/games/${gameId}/shots`).send({
        end_number: 1,
        shot_number: 17,
        team: 'away',
        player_number: 1,
        type: 'draw',
        turn: 'inturn',
        score: 50,
        is_throwaway: false,
      });

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent game', async () => {
      const res = await request.post('/api/games/999/shots').send({
        end_number: 1,
        shot_number: 1,
        team: 'away',
        player_number: 1,
        type: 'draw',
        turn: 'inturn',
        score: 50,
        is_throwaway: false,
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/games/:id/shots/:shotNumber', () => {
    it('updates an existing shot', async () => {
      await request.post(`/api/games/${gameId}/shots`).send({
        end_number: 1, shot_number: 1, team: 'away', player_number: 1,
        type: 'draw', turn: 'inturn', score: 50, is_throwaway: false,
      });

      const res = await request.put(`/api/games/${gameId}/shots/1`).send({
        end_number: 1,
        type: 'takeout',
        turn: 'outturn',
        score: 100,
        is_throwaway: false,
      });

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('takeout');
      expect(res.body.score).toBe(100);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -w server
```
Expected: FAIL — shots router not registered.

- [ ] **Step 3: Create server/src/routes/shots.ts**

```typescript
import { Router, type Request, type Response } from 'express';
import type { AppContext } from '../index.js';
import type { CreateShotBody, GameRow, ShotRow } from '../types.js';

export function shotsRouter(ctx: AppContext): Router {
  const router = Router({ mergeParams: true });

  // POST /api/games/:id/shots
  router.post('/', (req: Request, res: Response) => {
    const gameId = Number(req.params['id']);
    const game = ctx.db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as GameRow | undefined;

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const body = req.body as Partial<CreateShotBody>;

    if (!body.end_number || !body.shot_number || !body.team || !body.player_number) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (body.shot_number < 1 || body.shot_number > 16) {
      res.status(400).json({ error: 'shot_number must be 1-16' });
      return;
    }

    if (body.player_number < 1 || body.player_number > 4) {
      res.status(400).json({ error: 'player_number must be 1-4' });
      return;
    }

    const isThrowaway = body.is_throwaway ? 1 : 0;

    const result = ctx.db.prepare(`
      INSERT INTO shots (game_id, end_number, shot_number, team, player_number, type, turn, score, is_throwaway)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      gameId, body.end_number, body.shot_number, body.team, body.player_number,
      body.type ?? null, body.turn ?? null, body.score ?? null, isThrowaway
    );

    const shot = ctx.db.prepare('SELECT * FROM shots WHERE id = ?').get(result.lastInsertRowid) as ShotRow;
    res.status(201).json(shot);
  });

  // PUT /api/games/:id/shots/:shotNumber
  router.put('/:shotNumber', (req: Request, res: Response) => {
    const gameId = Number(req.params['id']);
    const shotNumber = Number(req.params['shotNumber']);
    const body = req.body as Partial<CreateShotBody>;

    if (!body.end_number) {
      res.status(400).json({ error: 'end_number required to identify shot' });
      return;
    }

    const existing = ctx.db.prepare(
      'SELECT * FROM shots WHERE game_id = ? AND end_number = ? AND shot_number = ?'
    ).get(gameId, body.end_number, shotNumber) as ShotRow | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Shot not found' });
      return;
    }

    const isThrowaway = body.is_throwaway ? 1 : 0;

    ctx.db.prepare(`
      UPDATE shots SET type = ?, turn = ?, score = ?, is_throwaway = ?
      WHERE game_id = ? AND end_number = ? AND shot_number = ?
    `).run(
      body.type ?? null, body.turn ?? null, body.score ?? null, isThrowaway,
      gameId, body.end_number, shotNumber
    );

    const shot = ctx.db.prepare(
      'SELECT * FROM shots WHERE game_id = ? AND end_number = ? AND shot_number = ?'
    ).get(gameId, body.end_number, shotNumber) as ShotRow;

    res.json(shot);
  });

  return router;
}
```

- [ ] **Step 4: Register shots router in index.ts**

Add import and route in `server/src/index.ts`:
```typescript
import { shotsRouter } from './routes/shots.js';
// ... after gamesRouter line:
app.use('/api/games/:id/shots', shotsRouter(ctx));
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -w server
```
Expected: All shots tests PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(server): add shots API with create/update and tests"
```

---

### Task 6: Ends API routes

**Files:**
- Create: `server/src/routes/ends.ts`
- Create: `server/__tests__/routes/ends.test.ts`
- Modify: `server/src/index.ts` — register ends router

- [ ] **Step 1: Write failing tests for ends routes**

Create `server/__tests__/routes/ends.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/index.js';
import type { GameRow, EndRow } from '../src/types.js';

describe('Ends API', () => {
  let request: ReturnType<typeof supertest>;
  let cleanup: () => void;
  let gameId: number;

  beforeEach(async () => {
    const { app, close } = createApp(':memory:');
    request = supertest(app);
    cleanup = close;

    const res = await request.post('/api/games').send({
      team_home: 'A', team_away: 'B',
      color_home: 'red', color_away: 'yellow',
      hammer_first_end: 'home',
    });
    gameId = (res.body as GameRow).id;
  });

  afterEach(() => {
    cleanup();
  });

  describe('POST /api/games/:id/ends', () => {
    it('creates an end result', async () => {
      const res = await request.post(`/api/games/${gameId}/ends`).send({
        number: 1,
        score_home: 2,
        score_away: 0,
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        game_id: gameId,
        number: 1,
        score_home: 2,
        score_away: 0,
      });
    });

    it('creates blank end (0:0)', async () => {
      const res = await request.post(`/api/games/${gameId}/ends`).send({
        number: 1,
        score_home: 0,
        score_away: 0,
      });

      expect(res.status).toBe(201);
      expect(res.body.score_home).toBe(0);
      expect(res.body.score_away).toBe(0);
    });

    it('rejects duplicate end number', async () => {
      await request.post(`/api/games/${gameId}/ends`).send({
        number: 1, score_home: 1, score_away: 0,
      });

      const res = await request.post(`/api/games/${gameId}/ends`).send({
        number: 1, score_home: 0, score_away: 2,
      });

      expect(res.status).toBe(409);
    });

    it('returns 404 for non-existent game', async () => {
      const res = await request.post('/api/games/999/ends').send({
        number: 1, score_home: 1, score_away: 0,
      });

      expect(res.status).toBe(404);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -w server
```
Expected: FAIL — ends router not registered.

- [ ] **Step 3: Create server/src/routes/ends.ts**

```typescript
import { Router, type Request, type Response } from 'express';
import type { AppContext } from '../index.js';
import type { CreateEndBody, GameRow, EndRow } from '../types.js';

export function endsRouter(ctx: AppContext): Router {
  const router = Router({ mergeParams: true });

  // POST /api/games/:id/ends
  router.post('/', (req: Request, res: Response) => {
    const gameId = Number(req.params['id']);
    const game = ctx.db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as GameRow | undefined;

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const body = req.body as Partial<CreateEndBody>;

    if (body.number == null || body.score_home == null || body.score_away == null) {
      res.status(400).json({ error: 'Missing required fields: number, score_home, score_away' });
      return;
    }

    const existing = ctx.db.prepare(
      'SELECT * FROM ends WHERE game_id = ? AND number = ?'
    ).get(gameId, body.number) as EndRow | undefined;

    if (existing) {
      res.status(409).json({ error: `End ${body.number} already exists for this game` });
      return;
    }

    const result = ctx.db.prepare(`
      INSERT INTO ends (game_id, number, score_home, score_away)
      VALUES (?, ?, ?, ?)
    `).run(gameId, body.number, body.score_home, body.score_away);

    const end = ctx.db.prepare('SELECT * FROM ends WHERE id = ?').get(result.lastInsertRowid) as EndRow;
    res.status(201).json(end);
  });

  return router;
}
```

- [ ] **Step 4: Register ends router in index.ts**

Add to `server/src/index.ts`:
```typescript
import { endsRouter } from './routes/ends.js';
// ... after shots router:
app.use('/api/games/:id/ends', endsRouter(ctx));
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -w server
```
Expected: All ends tests PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(server): add ends API with tests"
```

---

### Task 7: Stats API route

**Files:**
- Create: `server/src/lib/statsCalc.ts`
- Create: `server/src/routes/stats.ts`
- Create: `server/__tests__/lib/statsCalc.test.ts`
- Create: `server/__tests__/routes/stats.test.ts`
- Modify: `server/src/index.ts` — register stats router

- [ ] **Step 1: Write failing tests for statsCalc**

Create `server/__tests__/lib/statsCalc.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateGameStats } from '../src/lib/statsCalc.js';
import type { ShotRow } from '../src/types.js';

function makeShot(overrides: Partial<ShotRow>): ShotRow {
  return {
    id: 1,
    game_id: 1,
    end_number: 1,
    shot_number: 1,
    team: 'home',
    player_number: 1,
    type: 'draw',
    turn: 'inturn',
    score: 50,
    is_throwaway: 0,
    ...overrides,
  };
}

describe('calculateGameStats', () => {
  it('calculates average for single player', () => {
    const shots: ShotRow[] = [
      makeShot({ shot_number: 2, team: 'home', player_number: 1, score: 50 }),
      makeShot({ shot_number: 4, team: 'home', player_number: 1, score: 100 }),
    ];

    const stats = calculateGameStats(shots);
    expect(stats.home.players[0]!.avg).toBe(75);
    expect(stats.home.players[0]!.shot_count).toBe(2);
  });

  it('excludes throwaway shots from averages and counts', () => {
    const shots: ShotRow[] = [
      makeShot({ shot_number: 2, team: 'home', player_number: 1, score: 100 }),
      makeShot({ shot_number: 4, team: 'home', player_number: 1, score: null, is_throwaway: 1 }),
    ];

    const stats = calculateGameStats(shots);
    expect(stats.home.players[0]!.avg).toBe(100);
    expect(stats.home.players[0]!.shot_count).toBe(1);
  });

  it('splits draw vs takeout averages', () => {
    const shots: ShotRow[] = [
      makeShot({ team: 'home', player_number: 1, type: 'draw', score: 100 }),
      makeShot({ team: 'home', player_number: 1, type: 'takeout', score: 50, shot_number: 4 }),
    ];

    const stats = calculateGameStats(shots);
    expect(stats.home.players[0]!.draw_avg).toBe(100);
    expect(stats.home.players[0]!.takeout_avg).toBe(50);
  });

  it('splits inturn vs outturn averages', () => {
    const shots: ShotRow[] = [
      makeShot({ team: 'home', player_number: 1, turn: 'inturn', score: 75 }),
      makeShot({ team: 'home', player_number: 1, turn: 'outturn', score: 25, shot_number: 4 }),
    ];

    const stats = calculateGameStats(shots);
    expect(stats.home.players[0]!.inturn_avg).toBe(75);
    expect(stats.home.players[0]!.outturn_avg).toBe(25);
  });

  it('calculates team-wide averages', () => {
    const shots: ShotRow[] = [
      makeShot({ team: 'home', player_number: 1, score: 100, shot_number: 2 }),
      makeShot({ team: 'home', player_number: 2, score: 50, shot_number: 6 }),
    ];

    const stats = calculateGameStats(shots);
    expect(stats.home.avg).toBe(75);
    expect(stats.home.shot_count).toBe(2);
  });

  it('handles empty shots array', () => {
    const stats = calculateGameStats([]);
    expect(stats.home.avg).toBe(0);
    expect(stats.home.shot_count).toBe(0);
    expect(stats.away.avg).toBe(0);
  });

  it('calculates cross-rotation-type breakdowns', () => {
    const shots: ShotRow[] = [
      makeShot({ team: 'home', player_number: 1, type: 'draw', turn: 'inturn', score: 100, shot_number: 2 }),
      makeShot({ team: 'home', player_number: 1, type: 'draw', turn: 'outturn', score: 50, shot_number: 4 }),
      makeShot({ team: 'home', player_number: 1, type: 'takeout', turn: 'inturn', score: 75, end_number: 2, shot_number: 2 }),
      makeShot({ team: 'home', player_number: 1, type: 'takeout', turn: 'outturn', score: 25, end_number: 2, shot_number: 4 }),
    ];

    const stats = calculateGameStats(shots);
    const lead = stats.home.players[0]!;
    expect(lead.inturn_draw_avg).toBe(100);
    expect(lead.outturn_draw_avg).toBe(50);
    expect(lead.inturn_takeout_avg).toBe(75);
    expect(lead.outturn_takeout_avg).toBe(25);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -w server
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create server/src/lib/statsCalc.ts**

```typescript
import type { ShotRow, PlayerStats, TeamStats, GameStats, TeamSide } from '../types.js';

function avg(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function calcPlayerStats(shots: ShotRow[]): PlayerStats[] {
  const players: PlayerStats[] = [];

  for (let pos = 1; pos <= 4; pos++) {
    const playerShots = shots.filter((s) => s.player_number === pos && s.is_throwaway === 0);
    const scores = playerShots.filter((s) => s.score != null).map((s) => s.score!);
    const drawShots = playerShots.filter((s) => s.type === 'draw' && s.score != null);
    const takeoutShots = playerShots.filter((s) => s.type === 'takeout' && s.score != null);
    const inturnShots = playerShots.filter((s) => s.turn === 'inturn' && s.score != null);
    const outturnShots = playerShots.filter((s) => s.turn === 'outturn' && s.score != null);

    players.push({
      position: pos,
      avg: avg(scores),
      shot_count: playerShots.length,
      draw_avg: avg(drawShots.map((s) => s.score!)),
      takeout_avg: avg(takeoutShots.map((s) => s.score!)),
      inturn_avg: avg(inturnShots.map((s) => s.score!)),
      outturn_avg: avg(outturnShots.map((s) => s.score!)),
      inturn_draw_avg: avg(
        playerShots.filter((s) => s.turn === 'inturn' && s.type === 'draw' && s.score != null).map((s) => s.score!)
      ),
      inturn_takeout_avg: avg(
        playerShots.filter((s) => s.turn === 'inturn' && s.type === 'takeout' && s.score != null).map((s) => s.score!)
      ),
      outturn_draw_avg: avg(
        playerShots.filter((s) => s.turn === 'outturn' && s.type === 'draw' && s.score != null).map((s) => s.score!)
      ),
      outturn_takeout_avg: avg(
        playerShots.filter((s) => s.turn === 'outturn' && s.type === 'takeout' && s.score != null).map((s) => s.score!)
      ),
    });
  }

  return players;
}

function calcTeamStats(shots: ShotRow[]): TeamStats {
  const validShots = shots.filter((s) => s.is_throwaway === 0 && s.score != null);
  const scores = validShots.map((s) => s.score!);
  const players = calcPlayerStats(shots);

  return {
    avg: avg(scores),
    shot_count: validShots.length,
    players,
  };
}

export function calculateGameStats(shots: ShotRow[]): GameStats {
  const homeShots = shots.filter((s) => s.team === 'home');
  const awayShots = shots.filter((s) => s.team === 'away');

  return {
    home: calcTeamStats(homeShots),
    away: calcTeamStats(awayShots),
  };
}
```

- [ ] **Step 4: Run statsCalc tests**

```bash
npm test -w server
```
Expected: All statsCalc tests PASS.

- [ ] **Step 5: Create stats route and test**

Create `server/src/routes/stats.ts`:
```typescript
import { Router, type Request, type Response } from 'express';
import type { AppContext } from '../index.js';
import type { GameRow, ShotRow } from '../types.js';
import { calculateGameStats } from '../lib/statsCalc.js';

export function statsRouter(ctx: AppContext): Router {
  const router = Router({ mergeParams: true });

  // GET /api/games/:id/stats
  router.get('/', (req: Request, res: Response) => {
    const gameId = Number(req.params['id']);
    const game = ctx.db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as GameRow | undefined;

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const shots = ctx.db
      .prepare('SELECT * FROM shots WHERE game_id = ?')
      .all(gameId) as ShotRow[];

    const stats = calculateGameStats(shots);
    res.json(stats);
  });

  return router;
}
```

Create `server/__tests__/routes/stats.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/index.js';
import type { GameRow } from '../src/types.js';

describe('Stats API', () => {
  let request: ReturnType<typeof supertest>;
  let cleanup: () => void;
  let gameId: number;

  beforeEach(async () => {
    const { app, close } = createApp(':memory:');
    request = supertest(app);
    cleanup = close;

    const res = await request.post('/api/games').send({
      team_home: 'A', team_away: 'B',
      color_home: 'red', color_away: 'yellow',
      hammer_first_end: 'home',
    });
    gameId = (res.body as GameRow).id;
  });

  afterEach(() => {
    cleanup();
  });

  it('returns stats for game with shots', async () => {
    await request.post(`/api/games/${gameId}/shots`).send({
      end_number: 1, shot_number: 2, team: 'home', player_number: 1,
      type: 'draw', turn: 'inturn', score: 75, is_throwaway: false,
    });

    const res = await request.get(`/api/games/${gameId}/stats`);
    expect(res.status).toBe(200);
    expect(res.body.home.avg).toBe(75);
    expect(res.body.home.shot_count).toBe(1);
    expect(res.body.home.players).toHaveLength(4);
  });

  it('returns empty stats for game without shots', async () => {
    const res = await request.get(`/api/games/${gameId}/stats`);
    expect(res.status).toBe(200);
    expect(res.body.home.avg).toBe(0);
    expect(res.body.away.avg).toBe(0);
  });

  it('returns 404 for non-existent game', async () => {
    const res = await request.get('/api/games/999/stats');
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 6: Register stats router in index.ts**

Add to `server/src/index.ts`:
```typescript
import { statsRouter } from './routes/stats.js';
// ...
app.use('/api/games/:id/stats', statsRouter(ctx));
```

- [ ] **Step 7: Run all server tests**

```bash
npm test -w server
```
Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(server): add stats calculation and API with tests"
```

---

## Chunk 2: Client Setup + Pages

### Task 8: Initialize client package (Vite + React + TypeScript + Tailwind v4)

**Files:**
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `client/index.html`
- Create: `client/src/main.tsx`
- Create: `client/src/index.css`
- Create: `client/src/types.ts`

- [ ] **Step 1: Create client/package.json**

```json
{
  "name": "curling-stats-client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 5173",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.67.0",
    "lucide-react": "^0.475.0",
    "motion": "^12.6.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router": "^7.4.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.4.0",
    "jsdom": "^26.1.0",
    "tailwindcss": "^4.1.0",
    "vite": "^6.2.0",
    "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 2: Create client/tsconfig.json**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "__tests__/**/*"]
}
```

- [ ] **Step 3: Create client/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 4: Create client/index.html**

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Керлинг Стат</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create client/src/index.css** (copy from mockup, unchanged)

```css
@import "tailwindcss";

@theme {
  --font-headline: "Manrope", sans-serif;
  --font-body: "Inter", sans-serif;
  
  --color-primary: #2f6388;
  --color-secondary: #bb0112;
  --color-tertiary: #fbcd17;
  
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
}

@layer base {
  body {
    @apply font-body bg-[#f8f9ff] text-[#0d1c2e];
  }
}

.stone-shadow {
  box-shadow: inset -2px -2px 4px rgba(0,0,0,0.1), inset 2px 2px 4px rgba(255,255,255,0.3);
}
```

- [ ] **Step 6: Create client/src/types.ts**

```typescript
// Frontend types matching API responses

export type GameStatus = 'active' | 'finished';
export type TeamSide = 'home' | 'away';
export type ShotType = 'draw' | 'takeout';
export type TurnType = 'inturn' | 'outturn';
export type StoneColor = 'red' | 'yellow' | 'blue' | 'green' | 'orange' | 'purple' | 'black' | 'white';
export type ScoreValue = 0 | 25 | 50 | 75 | 100;
export type PlayerPosition = 1 | 2 | 3 | 4;

export interface Game {
  id: number;
  date: string;
  team_home: string;
  team_away: string;
  color_home: StoneColor;
  color_away: StoneColor;
  hammer_first_end: TeamSide;
  max_ends: number;
  status: GameStatus;
  created_at: string;
}

export interface End {
  id: number;
  game_id: number;
  number: number;
  score_home: number;
  score_away: number;
}

export interface Shot {
  id: number;
  game_id: number;
  end_number: number;
  shot_number: number;
  team: TeamSide;
  player_number: PlayerPosition;
  type: ShotType | null;
  turn: TurnType | null;
  score: ScoreValue | null;
  is_throwaway: number;
}

export interface GameWithDetails extends Game {
  ends: End[];
  shots: Shot[];
}

export interface PlayerStats {
  position: number;
  avg: number;
  shot_count: number;
  draw_avg: number;
  takeout_avg: number;
  inturn_avg: number;
  outturn_avg: number;
  inturn_draw_avg: number;
  inturn_takeout_avg: number;
  outturn_draw_avg: number;
  outturn_takeout_avg: number;
}

export interface TeamStats {
  avg: number;
  shot_count: number;
  players: PlayerStats[];
}

export interface GameStats {
  home: TeamStats;
  away: TeamStats;
}

export const STONE_COLORS: Record<StoneColor, string> = {
  red: '#bb0112',
  yellow: '#fbcd17',
  blue: '#2f6388',
  green: '#2e7d32',
  orange: '#f97316',
  purple: '#7c3aed',
  black: '#1e293b',
  white: '#e2e8f0',
};

export const POSITION_NAMES: Record<PlayerPosition, string> = {
  1: 'Лид',
  2: 'Второй',
  3: 'Третий',
  4: 'Скип',
};

export const SCORE_COLORS: Record<ScoreValue, string> = {
  0: '#ba1a1a',
  25: '#f97316',
  50: '#fbcd17',
  75: '#84cc16',
  100: '#16a34a',
};
```

- [ ] **Step 7: Create client/src/main.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { router } from './router';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
```

- [ ] **Step 8: Install client dependencies**

```bash
cd /home/node/.openclaw/workspace-sportsman/sportproject
npm install
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore(client): scaffold Vite + React + TS + Tailwind + Router + TanStack Query"
```

---

### Task 9: API client and React Query hooks

**Files:**
- Create: `client/src/api.ts`
- Create: `client/src/hooks/useGame.ts`
- Create: `client/src/hooks/useShots.ts`

- [ ] **Step 1: Create client/src/api.ts**

```typescript
import type {
  Game,
  GameWithDetails,
  GameStats,
  Shot,
  End,
  StoneColor,
  TeamSide,
  ShotType,
  TurnType,
  ScoreValue,
} from './types';

const BASE = '/api';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// Games
export function getGames(): Promise<Game[]> {
  return fetchJson<Game[]>('/games');
}

export function getGame(id: number): Promise<GameWithDetails> {
  return fetchJson<GameWithDetails>(`/games/${id}`);
}

export function createGame(data: {
  team_home: string;
  team_away: string;
  color_home: StoneColor;
  color_away: StoneColor;
  hammer_first_end: TeamSide;
  max_ends?: number;
}): Promise<Game> {
  return fetchJson<Game>('/games', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function finishGame(id: number): Promise<Game> {
  return fetchJson<Game>(`/games/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'finished' }),
  });
}

// Shots
export function createShot(
  gameId: number,
  data: {
    end_number: number;
    shot_number: number;
    team: TeamSide;
    player_number: number;
    type: ShotType | null;
    turn: TurnType | null;
    score: ScoreValue | null;
    is_throwaway: boolean;
  },
): Promise<Shot> {
  return fetchJson<Shot>(`/games/${gameId}/shots`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateShot(
  gameId: number,
  shotNumber: number,
  data: {
    end_number: number;
    type: ShotType | null;
    turn: TurnType | null;
    score: ScoreValue | null;
    is_throwaway: boolean;
  },
): Promise<Shot> {
  return fetchJson<Shot>(`/games/${gameId}/shots/${shotNumber}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Ends
export function createEnd(
  gameId: number,
  data: { number: number; score_home: number; score_away: number },
): Promise<End> {
  return fetchJson<End>(`/games/${gameId}/ends`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Stats
export function getGameStats(id: number): Promise<GameStats> {
  return fetchJson<GameStats>(`/games/${id}/stats`);
}
```

- [ ] **Step 2: Create client/src/hooks/useGame.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
import type { StoneColor, TeamSide } from '../types';

export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: api.getGames,
  });
}

export function useGame(id: number) {
  return useQuery({
    queryKey: ['game', id],
    queryFn: () => api.getGame(id),
  });
}

export function useGameStats(id: number) {
  return useQuery({
    queryKey: ['game', id, 'stats'],
    queryFn: () => api.getGameStats(id),
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      team_home: string;
      team_away: string;
      color_home: StoneColor;
      color_away: StoneColor;
      hammer_first_end: TeamSide;
      max_ends?: number;
    }) => api.createGame(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useFinishGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.finishGame(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['games'] });
      void queryClient.invalidateQueries({ queryKey: ['game', id] });
    },
  });
}
```

- [ ] **Step 3: Create client/src/hooks/useShots.ts**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
import type { ShotType, TurnType, ScoreValue, TeamSide } from '../types';

export function useCreateShot(gameId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      end_number: number;
      shot_number: number;
      team: TeamSide;
      player_number: number;
      type: ShotType | null;
      turn: TurnType | null;
      score: ScoreValue | null;
      is_throwaway: boolean;
    }) => api.createShot(gameId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['game', gameId] });
    },
  });
}

export function useUpdateShot(gameId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      shotNumber: number;
      end_number: number;
      type: ShotType | null;
      turn: TurnType | null;
      score: ScoreValue | null;
      is_throwaway: boolean;
    }) => {
      const { shotNumber, ...rest } = data;
      return api.updateShot(gameId, shotNumber, rest);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['game', gameId] });
    },
  });
}

export function useCreateEnd(gameId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { number: number; score_home: number; score_away: number }) =>
      api.createEnd(gameId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['game', gameId] });
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(client): add API client and React Query hooks"
```

---

### Task 10: Router + shared components + shot order logic

**Files:**
- Create: `client/src/router.tsx`
- Create: `client/src/components/Header.tsx`
- Create: `client/src/components/ColorPicker.tsx`
- Create: `client/src/components/SplitProgressBar.tsx`
- Create: `client/src/lib/shotOrder.ts`
- Create: `client/__tests__/lib/shotOrder.test.ts`

- [ ] **Step 1: Create client/src/router.tsx**

```tsx
import { createBrowserRouter } from 'react-router';
import Dashboard from './pages/Dashboard';
import NewGame from './pages/NewGame';
import InGame from './pages/InGame';
import Stats from './pages/Stats';

export const router = createBrowserRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/games/new', element: <NewGame /> },
  { path: '/games/:id/play', element: <InGame /> },
  { path: '/games/:id/stats', element: <Stats /> },
]);
```

- [ ] **Step 2: Write failing test for shotOrder**

Create `client/__tests__/lib/shotOrder.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { getShotInfo } from '../../src/lib/shotOrder';
import type { TeamSide } from '../../src/types';

describe('getShotInfo', () => {
  it('shot 1: team without hammer, Lead, stone 1', () => {
    const info = getShotInfo(1, 'home');
    expect(info).toEqual({ team: 'away', playerNumber: 1, positionName: 'Лид', stoneOfPlayer: 1 });
  });

  it('shot 2: team with hammer, Lead, stone 1', () => {
    const info = getShotInfo(2, 'home');
    expect(info).toEqual({ team: 'home', playerNumber: 1, positionName: 'Лид', stoneOfPlayer: 1 });
  });

  it('shot 3: team without hammer, Lead, stone 2', () => {
    const info = getShotInfo(3, 'home');
    expect(info).toEqual({ team: 'away', playerNumber: 1, positionName: 'Лид', stoneOfPlayer: 2 });
  });

  it('shot 4: team with hammer, Lead, stone 2', () => {
    const info = getShotInfo(4, 'home');
    expect(info).toEqual({ team: 'home', playerNumber: 1, positionName: 'Лид', stoneOfPlayer: 2 });
  });

  it('shot 5: team without hammer, Second, stone 1', () => {
    const info = getShotInfo(5, 'home');
    expect(info).toEqual({ team: 'away', playerNumber: 2, positionName: 'Второй', stoneOfPlayer: 1 });
  });

  it('shot 13: team without hammer, Skip, stone 1', () => {
    const info = getShotInfo(13, 'home');
    expect(info).toEqual({ team: 'away', playerNumber: 4, positionName: 'Скип', stoneOfPlayer: 1 });
  });

  it('shot 16: team with hammer, Skip, stone 2', () => {
    const info = getShotInfo(16, 'home');
    expect(info).toEqual({ team: 'home', playerNumber: 4, positionName: 'Скип', stoneOfPlayer: 2 });
  });

  it('works when away has hammer', () => {
    const info = getShotInfo(1, 'away');
    expect(info).toEqual({ team: 'home', playerNumber: 1, positionName: 'Лид', stoneOfPlayer: 1 });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -w client
```
Expected: FAIL — module not found.

- [ ] **Step 4: Create client/src/lib/shotOrder.ts**

```typescript
import type { TeamSide, PlayerPosition } from '../types';
import { POSITION_NAMES } from '../types';

export interface ShotInfo {
  team: TeamSide;
  playerNumber: PlayerPosition;
  positionName: string;
  stoneOfPlayer: 1 | 2;
}

/**
 * Given a shot number (1-16) and which team has the hammer,
 * returns who throws and which player/stone it is.
 *
 * Pattern: shots alternate teams. Odd shots = team WITHOUT hammer, even = WITH hammer.
 * Every 4 shots change player: 1-4 Lead, 5-8 Second, 9-12 Third, 13-16 Skip.
 * Within each player's 4 shots, stones alternate: 1,1,2,2 (each team throws one stone, then the other).
 */
export function getShotInfo(shotNumber: number, hammerTeam: TeamSide): ShotInfo {
  const isOdd = shotNumber % 2 === 1;
  const team: TeamSide = isOdd
    ? (hammerTeam === 'home' ? 'away' : 'home')
    : hammerTeam;

  const playerNumber = (Math.ceil(shotNumber / 4)) as PlayerPosition;
  const positionName = POSITION_NAMES[playerNumber];

  // Within each group of 4: shots 1,2 are stone 1; shots 3,4 are stone 2
  const posInGroup = ((shotNumber - 1) % 4);
  const stoneOfPlayer: 1 | 2 = posInGroup < 2 ? 1 : 2;

  return { team, playerNumber, positionName, stoneOfPlayer };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -w client
```
Expected: All shotOrder tests PASS.

- [ ] **Step 6: Create shared components**

Create `client/src/components/Header.tsx`:
```tsx
import type { ReactNode } from 'react';

interface HeaderProps {
  leftIcon?: ReactNode;
  centerContent: ReactNode;
  rightIcon?: ReactNode;
}

export default function Header({ leftIcon, centerContent, rightIcon }: HeaderProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-white flex items-center justify-between px-6 py-4 shadow-sm border-b border-slate-100/50">
      <div className="w-12 flex items-center justify-start">
        {leftIcon}
      </div>
      <div className="flex-1 flex justify-center overflow-hidden">
        {centerContent}
      </div>
      <div className="w-12 flex items-center justify-end">
        {rightIcon}
      </div>
    </header>
  );
}
```

Create `client/src/components/ColorPicker.tsx`:
```tsx
import { STONE_COLORS, type StoneColor } from '../types';
import { ArrowRight } from 'lucide-react';

interface ColorPickerProps {
  value: StoneColor;
  onChange: (color: StoneColor) => void;
  disabledColor?: StoneColor;
}

const AVAILABLE_COLORS: StoneColor[] = ['red', 'yellow', 'blue', 'green', 'orange', 'purple', 'black', 'white'];

export default function ColorPicker({ value, onChange, disabledColor }: ColorPickerProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {AVAILABLE_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          disabled={color === disabledColor}
          className={`w-10 h-10 rounded-full transition-all shadow-sm flex items-center justify-center
            ${value === color ? 'scale-110' : 'hover:scale-105'}
            ${color === disabledColor ? 'opacity-30 cursor-not-allowed' : ''}`}
          style={{
            backgroundColor: STONE_COLORS[color],
            boxShadow: value === color ? `0 0 0 4px ${STONE_COLORS[color]}66` : 'none',
          }}
        >
          {value === color && <ArrowRight size={14} className="text-white rotate-90" />}
        </button>
      ))}
    </div>
  );
}
```

Create `client/src/components/SplitProgressBar.tsx`:
```tsx
import { RotateCw, RotateCcw } from 'lucide-react';

interface SplitProgressBarProps {
  inValue: number;
  outValue: number;
  inColor: string;
  outColor: string;
}

export default function SplitProgressBar({ inValue, outValue, inColor, outColor }: SplitProgressBarProps) {
  return (
    <div>
      <div className="flex justify-between items-center text-[10px] mb-1.5 font-bold">
        <div className="flex items-center gap-1">
          <RotateCw size={10} className="text-slate-400" />
          <span className="text-slate-500">In: {inValue}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500">Out: {outValue}%</span>
          <RotateCcw size={10} className="text-slate-400" />
        </div>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
        <div className="h-full transition-all duration-500" style={{ width: `${inValue}%`, backgroundColor: inColor }} />
        <div className="h-full transition-all duration-500" style={{ width: `${outValue}%`, backgroundColor: outColor }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(client): add router, shared components, shot order logic with tests"
```

---

### Task 11: Dashboard page (Screen 1)

**Files:**
- Create: `client/src/components/GameCard.tsx`
- Create: `client/src/pages/Dashboard.tsx`
- Create: `client/__tests__/pages/Dashboard.test.tsx`

- [ ] **Step 1: Create GameCard component**

Create `client/src/components/GameCard.tsx`:
```tsx
import { useNavigate } from 'react-router';
import { STONE_COLORS, type Game, type End } from '../types';

interface GameCardProps {
  game: Game;
  ends: End[];
  totalHome: number;
  totalAway: number;
}

export default function GameCard({ game, totalHome, totalAway }: GameCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (game.status === 'active') {
      void navigate(`/games/${game.id}/play`);
    } else {
      void navigate(`/games/${game.id}/stats`);
    }
  };

  return (
    <div
      className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{game.date}</span>
        {game.status === 'active' && (
          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">В процессе</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center w-20">
          <div className="w-3 h-3 rounded-full mb-1 shadow-sm" style={{ backgroundColor: STONE_COLORS[game.color_home] }} />
          <span className="text-xs font-bold text-[#0d1c2e] truncate w-full text-center">{game.team_home}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-3xl font-black text-[#0d1c2e]">{totalHome}</span>
          <div className="h-px w-4 bg-slate-200" />
          <span className="text-3xl font-black text-[#0d1c2e]">{totalAway}</span>
        </div>
        <div className="flex flex-col items-center w-20">
          <div className="w-3 h-3 rounded-full mb-1 shadow-sm" style={{ backgroundColor: STONE_COLORS[game.color_away] }} />
          <span className="text-xs font-bold text-[#0d1c2e] truncate w-full text-center">{game.team_away}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Dashboard page**

Create `client/src/pages/Dashboard.tsx` — extracted from the mockup's `renderDashboard()`, refactored to use real API data via `useGames()` hook, React Router `useNavigate()` for navigation, and `GameCard` component for each game. The page follows the mockup structure: header with "Керлинг Стат", active game section (if exists), past games list, and "+ Новая игра" button.

*(Full implementation to be written by implementing agent using the mockup in `docs/mockup/src/App.tsx` — `renderDashboard()` function as visual reference.)*

- [ ] **Step 3: Write Dashboard test**

Create `client/__tests__/pages/Dashboard.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../../src/pages/Dashboard';

// Mock the API module
vi.mock('../../src/api', () => ({
  getGames: vi.fn().mockResolvedValue([]),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Dashboard', () => {
  it('renders page title', async () => {
    renderWithProviders(<Dashboard />);
    expect(await screen.findByText('Керлинг Стат')).toBeInTheDocument();
  });

  it('shows new game button', async () => {
    renderWithProviders(<Dashboard />);
    expect(await screen.findByText('Новая игра')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -w client
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(client): add Dashboard page with GameCard component"
```

---

### Task 12: NewGame page (Screen 2)

**Files:**
- Create: `client/src/pages/NewGame.tsx`
- Create: `client/__tests__/pages/NewGame.test.tsx`

- [ ] **Step 1: Create NewGame page**

Extract from mockup's `renderNewGame()` function. Use form state, `ColorPicker` component, `useCreateGame()` mutation. On success, navigate to `/games/:id/play`.

*(Full implementation by implementing agent using mockup reference.)*

- [ ] **Step 2: Write NewGame test**

Create `client/__tests__/pages/NewGame.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewGame from '../../src/pages/NewGame';

vi.mock('../../src/api', () => ({
  createGame: vi.fn().mockResolvedValue({ id: 1 }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('NewGame', () => {
  it('renders form fields', () => {
    renderWithProviders(<NewGame />);
    expect(screen.getByText('Новая игра')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/название/i)).toBeInTheDocument();
  });

  it('has team name inputs', () => {
    renderWithProviders(<NewGame />);
    const inputs = screen.getAllByPlaceholderText(/введите название/i);
    expect(inputs).toHaveLength(2);
  });

  it('has ends selector with 8 and 10 options', () => {
    renderWithProviders(<NewGame />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests and verify pass**

```bash
npm test -w client
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(client): add NewGame page with form and tests"
```

---

### Task 13: InGame page (Screen 3)

**Files:**
- Create: `client/src/components/ShotInput.tsx`
- Create: `client/src/components/EndResult.tsx`
- Create: `client/src/components/ScoreBoard.tsx`
- Create: `client/src/pages/InGame.tsx`
- Create: `client/__tests__/components/ShotInput.test.tsx`
- Create: `client/__tests__/components/EndResult.test.tsx`
- Create: `client/__tests__/pages/InGame.test.tsx`

- [ ] **Step 1: Create ShotInput component**

Extracted from mockup's shot entry UI — type buttons (Draw/Takeout), rotation buttons (Inturn/Outturn), score buttons (0/25/50/75/100), throwaway button. Controlled component with callbacks.

- [ ] **Step 2: Write ShotInput test**

Create `client/__tests__/components/ShotInput.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShotInput from '../../src/components/ShotInput';

describe('ShotInput', () => {
  const defaultProps = {
    type: 'draw' as const,
    turn: 'inturn' as const,
    score: 50 as const,
    isThrowaway: false,
    onTypeChange: vi.fn(),
    onTurnChange: vi.fn(),
    onScoreChange: vi.fn(),
    onThrowaway: vi.fn(),
  };

  it('renders type buttons', () => {
    render(<ShotInput {...defaultProps} />);
    expect(screen.getByText('Draw')).toBeInTheDocument();
    expect(screen.getByText('Takeout')).toBeInTheDocument();
  });

  it('renders rotation buttons', () => {
    render(<ShotInput {...defaultProps} />);
    expect(screen.getByText('In')).toBeInTheDocument();
    expect(screen.getByText('Out')).toBeInTheDocument();
  });

  it('renders score buttons', () => {
    render(<ShotInput {...defaultProps} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calls onThrowaway when throwaway button clicked', async () => {
    const user = userEvent.setup();
    render(<ShotInput {...defaultProps} />);
    await user.click(screen.getByText(/проброс/i));
    expect(defaultProps.onThrowaway).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Create EndResult component**

Modal/inline for entering end score after 16th shot: who scored, how many stones (1-8), blank end option.

- [ ] **Step 4: Write EndResult test**

Create `client/__tests__/components/EndResult.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EndResult from '../../src/components/EndResult';

describe('EndResult', () => {
  const props = {
    teamHome: 'Красные',
    teamAway: 'Синие',
    endNumber: 3,
    onSubmit: vi.fn(),
  };

  it('shows end number in title', () => {
    render(<EndResult {...props} />);
    expect(screen.getByText(/результат энда 3/i)).toBeInTheDocument();
  });

  it('has team selection buttons', () => {
    render(<EndResult {...props} />);
    expect(screen.getByText('Красные')).toBeInTheDocument();
    expect(screen.getByText('Синие')).toBeInTheDocument();
  });

  it('has blank end option', () => {
    render(<EndResult {...props} />);
    expect(screen.getByText(/нулевой энд/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Create ScoreBoard component**

Small header component showing score, end info, current team/player.

- [ ] **Step 6: Create InGame page**

Full Screen 3 implementation using `useGame()`, `useCreateShot()`, `useCreateEnd()`, `getShotInfo()`, and all sub-components. Navigate to `/games/:id/stats` on finish.

- [ ] **Step 7: Write InGame page test**

Basic rendering test verifying the page shows shot entry UI when game data is loaded.

- [ ] **Step 8: Run all client tests**

```bash
npm test -w client
```
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(client): add InGame page with ShotInput, EndResult, ScoreBoard"
```

---

### Task 14: Stats page (Screen 4)

**Files:**
- Create: `client/src/lib/statsCalc.ts`
- Create: `client/src/pages/Stats.tsx`
- Create: `client/__tests__/pages/Stats.test.tsx`

- [ ] **Step 1: Create client-side statsCalc helper** (for transforming API response into display values — percent formatting, inturn/outturn distribution calc)

- [ ] **Step 2: Create Stats page**

Two tabs extracted from mockup: "Общая таблица" (team comparison, end-by-end score table, player comparison table) and "Моя команда" (inturn/outturn breakdown cards per player).

- [ ] **Step 3: Write Stats page test**

Basic rendering test verifying both tabs render with mock data.

- [ ] **Step 4: Run all client tests**

```bash
npm test -w client
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(client): add Stats page with team comparison and rotation analysis"
```

---

## Chunk 3: Integration, Docker, CI

### Task 15: Server serves client build in production

**Files:**
- Modify: `server/src/index.ts` — serve `../client/dist` as static files in production

- [ ] **Step 1: Add static file serving to server/src/index.ts**

After API routes, before server start:
```typescript
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// In createApp, after routes:
if (process.env['NODE_ENV'] === 'production') {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const clientDist = join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(server): serve client static files in production"
```

---

### Task 16: Docker setup

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
# Build client
FROM node:22-alpine AS client-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci
COPY tsconfig.base.json ./
COPY client/ ./client/
RUN npm run build -w client

# Build server
FROM node:22-alpine AS server-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci
COPY tsconfig.base.json ./
COPY server/ ./server/
RUN npm run build -w server

# Production
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci --omit=dev
COPY --from=client-build /app/client/dist ./client/dist
COPY --from=server-build /app/server/dist ./server/dist

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "server/dist/index.js"]
```

- [ ] **Step 2: Create docker-compose.yml**

```yaml
services:
  app:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - db-data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3001

volumes:
  db-data:
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: add Docker multi-stage build and docker-compose"
```

---

### Task 17: GitHub Actions CI stub

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint -w server
      - run: npm run lint -w client
      - run: npm test -w server
      - run: npm test -w client
      - run: npm run build

  docker:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t curling-stats .
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "ci: add GitHub Actions workflow for lint, test, build, docker"
```

---

### Task 18: Final verification

- [ ] **Step 1: Run all server tests**

```bash
npm test -w server
```
Expected: All PASS.

- [ ] **Step 2: Run all client tests**

```bash
npm test -w client
```
Expected: All PASS.

- [ ] **Step 3: TypeScript check (no errors, no `any`)**

```bash
npm run lint -w server
npm run lint -w client
```
Expected: No errors.

- [ ] **Step 4: Production build**

```bash
npm run build
```
Expected: Both client and server build successfully.

- [ ] **Step 5: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 6: Commit completion log**

```bash
git log --oneline
```
Verify all commits present.
