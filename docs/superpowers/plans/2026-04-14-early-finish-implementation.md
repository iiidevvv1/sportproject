# Early Game Finish Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan. Each step is marked with `- [ ]` for tracking.

**Goal:** Implement early game finish feature with automatic placeholder end creation and correct display logic.

**Architecture:** 
1. Add `status` column to `ends` table (DB migration)
2. Create atomic backend endpoint `POST /api/games/:id/early-finish` that handles score input, placeholder creation, and game finish in one transaction
3. Add frontend dialog and integrate with EndResult modal
4. Update Stats display logic to show X for placeholders

**Tech Stack:** TypeScript, SQLite (better-sqlite3), React, Express.js

**Reference:** Design spec in `docs/superpowers/specs/2026-04-14-early-finish-design.md`

---

## Chunk 1: Database Migration & Backend Setup

### Task 1: Database Migration

**Files:**
- Create: `server/migrations/add_ends_status.sql` (for documentation)
- Modify: `server/src/db/schema.ts` (update schema constant if needed for tests/docs)

- [ ] **Step 1: Create migration file**

Create `server/migrations/add_ends_status.sql`:
```sql
-- Migration: Add status column to ends table
-- Date: 2026-04-14
-- Purpose: Track placeholder ends created during early finish

ALTER TABLE ends ADD COLUMN status TEXT DEFAULT 'played' CHECK (status IN ('played', 'placeholder'));

-- Ensure all existing ends are marked as 'played'
UPDATE ends SET status = 'played' WHERE status IS NULL;
```

**Why:** This documents the schema change for anyone reviewing migrations.

- [ ] **Step 2: Apply migration to development database**

Run the SQL migration manually:
```bash
cd server
# For SQLite via better-sqlite3, run in your node REPL or SQL client:
# sqlite3 /data/curling.db < migrations/add_ends_status.sql
# Or via Node if you have a migration runner
# For now, we'll verify it works when we run tests
```

- [ ] **Step 3: Commit migration**

```bash
cd /home/node/.openclaw/workspace-sportsman/sportproject
git add server/migrations/add_ends_status.sql
git commit -m "chore: add database migration for ends status column"
```

---

### Task 2: Create Backend Helper Function for Hammer Calculation

**Files:**
- Modify: `server/src/lib/gameHelpers.ts` (new file) or `server/src/routes/games.ts`

This function is needed by the early-finish endpoint to calculate hammer for each placeholder end.

- [ ] **Step 1: Create game helpers file**

Create `server/src/lib/gameHelpers.ts`:
```typescript
import { type AppContext } from '../index';

export interface EndRow {
  id: number;
  game_id: number;
  number: number;
  score_home: number;
  score_away: number;
  hammer: string;
  status: string;
}

/**
 * Determine which team has hammer for a given end number.
 * Rules:
 * - End 1: hammer_first_end team
 * - Subsequent ends: team that did NOT score in previous end
 * - Blank ends (0:0): hammer carries over
 */
export function getHammerForEnd(
  endNumber: number,
  hammerFirstEnd: string,
  endResults: EndRow[]
): string {
  if (endNumber === 1) return hammerFirstEnd;

  const prevEnd = endResults.find((e) => e.number === endNumber - 1);
  if (!prevEnd) return hammerFirstEnd;

  // Blank end - hammer stays with same team
  if (prevEnd.score_home === 0 && prevEnd.score_away === 0) {
    return getHammerForEnd(endNumber - 1, hammerFirstEnd, endResults);
  }

  // Team that scored loses hammer
  return prevEnd.score_home > prevEnd.score_away ? 'away' : 'home';
}
```

**Why:** Encapsulates hammer calculation logic, reusable by multiple endpoints.

- [ ] **Step 2: Commit**

```bash
git add server/src/lib/gameHelpers.ts
git commit -m "refactor: extract hammer calculation logic to helpers"
```

---

### Task 3: Create Early Finish Endpoint

**Files:**
- Modify: `server/src/routes/games.ts`
- Test: `server/__tests__/routes/games.test.ts`

- [ ] **Step 1: Write failing test for early-finish endpoint**

In `server/__tests__/routes/games.test.ts`, add:
```typescript
describe('Early Finish', () => {
  it('POST /api/games/:id/early-finish with skipResult=true creates placeholders', async () => {
    const gameRes = await request.post('/api/games').send({
      team_name_home: 'Home',
      team_name_away: 'Away',
      max_ends: 10,
      hammer_first_end: 'home',
    });
    const gameId = gameRes.body.id;

    // Manually create first 7 ends
    for (let i = 1; i <= 7; i++) {
      await request.post(`/api/games/${gameId}/ends`).send({
        number: i,
        score_home: i % 2,
        score_away: 0,
        hammer: 'home',
      });
    }

    const res = await request.post(`/api/games/${gameId}/early-finish`).send({
      endNumber: 7,
      skipResult: true,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.ends_created).toBe(3); // 8, 9, 10

    // Verify game is finished
    const game = await request.get(`/api/games/${gameId}`);
    expect(game.body.status).toBe('finished');

    // Verify placeholder ends exist
    const ends = await request.get(`/api/games/${gameId}/ends`);
    const placeholders = ends.body.filter((e: any) => e.status === 'placeholder');
    expect(placeholders.length).toBe(3);
    expect(placeholders.every((e: any) => e.score_home === 0 && e.score_away === 0)).toBe(true);
  });

  it('POST /api/games/:id/early-finish with score creates end and placeholders', async () => {
    // Similar setup as above
    const gameRes = await request.post('/api/games').send({
      team_name_home: 'Home',
      team_name_away: 'Away',
      max_ends: 10,
      hammer_first_end: 'home',
    });
    const gameId = gameRes.body.id;

    for (let i = 1; i <= 7; i++) {
      await request.post(`/api/games/${gameId}/ends`).send({
        number: i,
        score_home: i % 2,
        score_away: 0,
        hammer: 'home',
      });
    }

    const res = await request.post(`/api/games/${gameId}/early-finish`).send({
      endNumber: 8,
      scoreHome: 3,
      scoreAway: 1,
      skipResult: false,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.ends_created).toBe(2); // 9, 10 (8 was created from score input)

    // Verify end 8 exists with correct score
    const ends = await request.get(`/api/games/${gameId}/ends`);
    const end8 = ends.body.find((e: any) => e.number === 8);
    expect(end8.score_home).toBe(3);
    expect(end8.score_away).toBe(1);
    expect(end8.status).toBe('played');

    // Verify placeholders for 9, 10
    const placeholders = ends.body.filter((e: any) => e.status === 'placeholder');
    expect(placeholders.length).toBe(2);
  });

  it('POST /api/games/:id/early-finish returns 404 for non-existent game', async () => {
    const res = await request.post('/api/games/999/early-finish').send({
      endNumber: 1,
      skipResult: true,
    });
    expect(res.status).toBe(404);
  });
});
```

Run test to confirm it fails:
```bash
npm test -- __tests__/routes/games.test.ts
```

Expected: FAIL with "POST /api/games/:id/early-finish not found"

- [ ] **Step 2: Implement early-finish endpoint**

In `server/src/routes/games.ts`, after existing endpoints, add:

```typescript
import { getHammerForEnd, type EndRow } from '../lib/gameHelpers';

// ... existing code ...

// POST /api/games/:id/early-finish
router.post('/:id/early-finish', (req: Request, res: Response) => {
  const gameId = Number(req.params['id']);
  const { endNumber, scoreHome, scoreAway, skipResult } = req.body as {
    endNumber?: number;
    scoreHome?: number;
    scoreAway?: number;
    skipResult?: boolean;
  };

  if (endNumber == null || skipResult == null) {
    res.status(400).json({ error: 'Missing required fields: endNumber, skipResult' });
    return;
  }

  const game = ctx.db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as GameRow | undefined;
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  try {
    // Start transaction
    const insertEnd = ctx.db.prepare(`
      INSERT INTO ends (game_id, number, score_home, score_away, hammer, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const updateGame = ctx.db.prepare(`
      UPDATE games SET status = ? WHERE id = ?
    `);

    const transaction = ctx.db.transaction(() => {
      // Step 1: If not skipping result, create the current end with provided score
      if (!skipResult && scoreHome != null && scoreAway != null) {
        // Get all existing ends to calculate hammer
        const existingEnds = ctx.db
          .prepare('SELECT * FROM ends WHERE game_id = ? ORDER BY number')
          .all(gameId) as EndRow[];

        const hammer = getHammerForEnd(endNumber, game.hammer_first_end, existingEnds);

        insertEnd.run(gameId, endNumber, scoreHome, scoreAway, hammer, 'played');
      }

      // Step 2: Create all remaining placeholder ends
      const startNumber = skipResult ? endNumber : endNumber + 1;
      for (let i = startNumber; i <= game.max_ends; i++) {
        const existingEnds = ctx.db
          .prepare('SELECT * FROM ends WHERE game_id = ? ORDER BY number')
          .all(gameId) as EndRow[];

        const hammer = getHammerForEnd(i, game.hammer_first_end, existingEnds);
        insertEnd.run(gameId, i, 0, 0, hammer, 'placeholder');
      }

      // Step 3: Mark game as finished
      updateGame.run('finished', gameId);
    });

    transaction();

    const endsCount = skipResult ? game.max_ends - endNumber + 1 : game.max_ends - endNumber;

    res.status(200).json({
      success: true,
      game_id: gameId,
      ends_created: endsCount,
    });
  } catch (error) {
    console.error('Error in early-finish:', error);
    res.status(500).json({ error: 'Failed to finish game early' });
  }
});
```

**Why:** Atomic transaction ensures consistency. All-or-nothing semantics.

- [ ] **Step 3: Run tests to verify they pass**

```bash
npm test -- __tests__/routes/games.test.ts
```

Expected: PASS for both early-finish tests + existing tests still pass

- [ ] **Step 4: Run linter**

```bash
npm run lint -w server
```

Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/games.ts server/src/lib/gameHelpers.ts
git add server/__tests__/routes/games.test.ts
git commit -m "feat: add POST /api/games/:id/early-finish endpoint with tests"
```

---

## Chunk 2: Frontend Components & Integration

### Task 4: Create EarlyFinishDialog Component

**Files:**
- Create: `client/src/components/EarlyFinishDialog.tsx`
- Test: `client/__tests__/components/EarlyFinishDialog.test.tsx`

- [ ] **Step 1: Create component file**

Create `client/src/components/EarlyFinishDialog.tsx`:
```typescript
interface EarlyFinishDialogProps {
  isOpen: boolean;
  onYes: () => void;
  onNo: () => void;
}

export default function EarlyFinishDialog({ isOpen, onYes, onNo }: EarlyFinishDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm">
        <h2 className="text-lg font-bold mb-4">Ввести результат этого энда?</h2>
        
        <div className="flex gap-3">
          <button
            onClick={onYes}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium"
          >
            Да
          </button>
          <button
            onClick={onNo}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded font-medium"
          >
            Нет
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create component test**

Create `client/__tests__/components/EarlyFinishDialog.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EarlyFinishDialog from '../../src/components/EarlyFinishDialog';

describe('EarlyFinishDialog', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <EarlyFinishDialog isOpen={false} onYes={vi.fn()} onNo={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when open', () => {
    render(
      <EarlyFinishDialog isOpen={true} onYes={vi.fn()} onNo={vi.fn()} />
    );
    expect(screen.getByText('Ввести результат этого энда?')).toBeInTheDocument();
  });

  it('calls onYes when Да button clicked', async () => {
    const user = userEvent.setup();
    const onYes = vi.fn();
    
    render(
      <EarlyFinishDialog isOpen={true} onYes={onYes} onNo={vi.fn()} />
    );
    
    await user.click(screen.getByRole('button', { name: /Да/ }));
    expect(onYes).toHaveBeenCalled();
  });

  it('calls onNo when Нет button clicked', async () => {
    const user = userEvent.setup();
    const onNo = vi.fn();
    
    render(
      <EarlyFinishDialog isOpen={true} onYes={vi.fn()} onNo={onNo} />
    );
    
    await user.click(screen.getByRole('button', { name: /Нет/ }));
    expect(onNo).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test -- client/__tests__/components/EarlyFinishDialog.test.tsx
```

Expected: PASS

- [ ] **Step 4: Run linter**

```bash
npm run lint -w client
```

Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add client/src/components/EarlyFinishDialog.tsx
git add client/__tests__/components/EarlyFinishDialog.test.tsx
git commit -m "feat: add EarlyFinishDialog component with tests"
```

---

### Task 5: Add API Hook for Early Finish

**Files:**
- Modify: `client/src/api.ts`

- [ ] **Step 1: Add earlyFinishGame function**

In `client/src/api.ts`, add:

```typescript
export async function earlyFinishGame(
  gameId: number,
  body: {
    endNumber: number;
    scoreHome?: number;
    scoreAway?: number;
    skipResult: boolean;
  }
): Promise<{ success: boolean; game_id: number; ends_created: number }> {
  const response = await fetch(`/api/games/${gameId}/early-finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Early finish failed: ${response.statusText}`);
  }

  return response.json();
}
```

- [ ] **Step 2: Run linter**

```bash
npm run lint -w client
```

- [ ] **Step 3: Commit**

```bash
git add client/src/api.ts
git commit -m "feat: add earlyFinishGame API function"
```

---

### Task 6: Integrate Early Finish into InGame.tsx

**Files:**
- Modify: `client/src/pages/InGame.tsx`

This is the most complex integration. The flow:
1. User clicks "Завершить досрочно" button → open EarlyFinishDialog
2. User clicks "Да" → open EndResult modal for current end
3. After EndResult save → call earlyFinishGame with score
4. User clicks "Нет" → call earlyFinishGame with skipResult=true
5. On success → navigate to Stats

- [ ] **Step 1: Add imports**

At the top of `InGame.tsx`, add:

```typescript
import EarlyFinishDialog from '../components/EarlyFinishDialog';
import { earlyFinishGame } from '../api';
```

- [ ] **Step 2: Add state for early finish dialog**

In the state section of InGame component, add:

```typescript
const [showEarlyFinishDialog, setShowEarlyFinishDialog] = useState(false);
const [isEarlyFinishPending, setIsEarlyFinishPending] = useState(false);
```

- [ ] **Step 3: Add handler for "Завершить досрочно" button click**

Add new handler function before the return statement:

```typescript
const handleEarlyFinish = () => {
  setShowEarlyFinishDialog(true);
};

const handleEarlyFinishYes = () => {
  setShowEarlyFinishDialog(false);
  setShowEndResult(true);
  // EndResult modal will handle the rest
};

const handleEarlyFinishNo = async () => {
  setShowEarlyFinishDialog(false);
  setIsEarlyFinishPending(true);
  try {
    await earlyFinishGame(gameId, {
      endNumber: currentEnd,
      skipResult: true,
    });
    navigate(`/stats/${gameId}`);
  } catch (error) {
    console.error('Early finish failed:', error);
    setIsEarlyFinishPending(false);
  }
};
```

Where `currentEnd` is the current end number. You may need to calculate it from `game.ends.length + 1` or similar logic already in the component.

- [ ] **Step 4: Modify EndResult save handler for early finish**

Find the existing `handleEndResult` function and modify it to detect early finish mode:

```typescript
const handleEndResult = async (scoreHome: number, scoreAway: number) => {
  try {
    // Check if we're in early finish mode (showEarlyFinishDialog was triggered)
    // You can track this with another state variable or check a flag
    const isEarlyFinish = showEarlyFinishDialog || /* some indicator */;
    
    if (isEarlyFinish && !showEndResult) {
      // Normal end result flow - don't early finish
      // ... existing code ...
      return;
    }

    // If we opened EndResult from early finish dialog
    if (isEarlyFinish) {
      setShowEndResult(false);
      setIsEarlyFinishPending(true);
      
      await earlyFinishGame(gameId, {
        endNumber: currentEnd,
        scoreHome,
        scoreAway,
        skipResult: false,
      });
      
      navigate(`/stats/${gameId}`);
      return;
    }

    // ... existing normal flow ...
  } catch (error) {
    console.error('Error saving end result:', error);
    setIsEarlyFinishPending(false);
  }
};
```

**Actually**, looking at the code more carefully, you may want to refactor this to be cleaner. Alternative: add a flag `isEarlyFinishMode` state:

```typescript
const [isEarlyFinishMode, setIsEarlyFinishMode] = useState(false);

const handleEarlyFinishYes = () => {
  setShowEarlyFinishDialog(false);
  setIsEarlyFinishMode(true);
  setShowEndResult(true);
};

const handleEarlyFinishNo = async () => {
  setShowEarlyFinishDialog(false);
  setIsEarlyFinishMode(true);
  setIsEarlyFinishPending(true);
  try {
    await earlyFinishGame(gameId, {
      endNumber: currentEnd,
      skipResult: true,
    });
    navigate(`/stats/${gameId}`);
  } catch (error) {
    console.error('Early finish failed:', error);
    setIsEarlyFinishPending(false);
  }
};

const handleEndResult = async (scoreHome: number, scoreAway: number) => {
  try {
    if (isEarlyFinishMode) {
      setShowEndResult(false);
      setIsEarlyFinishPending(true);
      await earlyFinishGame(gameId, {
        endNumber: currentEnd,
        scoreHome,
        scoreAway,
        skipResult: false,
      });
      navigate(`/stats/${gameId}`);
      return;
    }

    // ... existing normal flow (creating end and shot entry) ...
  } catch (error) {
    console.error('Error:', error);
    setIsEarlyFinishPending(false);
  }
};
```

- [ ] **Step 5: Add EarlyFinishDialog component to JSX**

In the return/render section, add the dialog before the EndResult modal:

```tsx
<EarlyFinishDialog
  isOpen={showEarlyFinishDialog}
  onYes={handleEarlyFinishYes}
  onNo={handleEarlyFinishNo}
/>
```

- [ ] **Step 6: Find and modify the "Завершить досрочно" button**

Look for existing button (likely in footer or action buttons section) that has text "Завершить досрочно" or similar, change its onClick handler to `handleEarlyFinish` if not already connected.

If it doesn't exist yet, add it:

```tsx
<button
  onClick={handleEarlyFinish}
  disabled={isEarlyFinishPending}
  className="..."
>
  Завершить досрочно
</button>
```

- [ ] **Step 7: Run linter and type check**

```bash
npm run lint -w client
```

Expected: No TypeScript errors

- [ ] **Step 8: Run tests**

```bash
npm test -- client/__tests__/pages/InGame.test.tsx
```

Existing InGame tests should still pass. You may need to add new tests for early finish flow.

- [ ] **Step 9: Commit**

```bash
git add client/src/pages/InGame.tsx
git commit -m "feat: integrate early finish dialog and flow into InGame"
```

---

## Chunk 3: Display Logic & Finalization

### Task 7: Update Stats Display for Placeholder Ends

**Files:**
- Modify: `client/src/pages/Stats.tsx`

The Stats page has a table showing all ends. Need to check if `end.status === 'placeholder'` and display "X" instead of score.

- [ ] **Step 1: Locate score display in Stats.tsx**

Find the part of Stats that renders the score table (likely in the "Overall" tab). It probably looks like:

```tsx
{game.ends.map(end => (
  <td>{end.score_home}:{end.score_away}</td>
))}
```

- [ ] **Step 2: Add conditional display logic**

Modify to:

```tsx
{game.ends.map(end => (
  <td>
    {end.status === 'placeholder' ? 'X' : `${end.score_home}:${end.score_away}`}
  </td>
))}
```

If there are multiple places where score is displayed, update all of them.

- [ ] **Step 3: Run linter**

```bash
npm run lint -w client
```

- [ ] **Step 4: Run tests**

```bash
npm test -- client/__tests__/pages/Stats.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Stats.tsx
git commit -m "feat: display 'X' for placeholder ends in Stats score table"
```

---

### Task 8: Update Version & Deploy

**Files:**
- Modify: `version.json`
- Modify: `client/public/version.json`

- [ ] **Step 1: Update version.json**

Edit `version.json`:

```json
{
  "version": "1.7.18",
  "buildDate": "2026-04-14T07:50:00Z"
}
```

Increment patch version from 1.7.17 to 1.7.18.

- [ ] **Step 2: Update client/public/version.json**

Same content:

```json
{
  "version": "1.7.18",
  "buildDate": "2026-04-14T07:50:00Z"
}
```

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

All tests must pass: server tests, client tests.

- [ ] **Step 4: Run full linter**

```bash
npm run lint
```

No errors.

- [ ] **Step 5: Build locally to verify**

```bash
npm run build
```

Should complete without errors.

- [ ] **Step 6: Commit version bump**

```bash
git add version.json client/public/version.json
git commit -m "chore: bump version to 1.7.18 - early finish feature"
```

- [ ] **Step 7: Push to main**

```bash
git push origin main
```

This triggers GitHub Actions CI/CD → build → Docker → deploy to kurling.inkpie.ru

- [ ] **Step 8: Monitor deployment**

Check GitHub Actions workflow to confirm build passes and deployment succeeds. Should see Telegram notification on success.

---

## Summary

**Total commits:**
1. Database migration (docs)
2. Game helpers (hammer calculation)
3. Early finish endpoint + tests
4. EarlyFinishDialog component + tests
5. API hook
6. InGame integration
7. Stats display update
8. Version bump + push

**Files created:**
- `server/migrations/add_ends_status.sql`
- `server/src/lib/gameHelpers.ts`
- `client/src/components/EarlyFinishDialog.tsx`
- `client/__tests__/components/EarlyFinishDialog.test.tsx`

**Files modified:**
- `server/src/routes/games.ts` (add endpoint)
- `server/__tests__/routes/games.test.ts` (add tests)
- `client/src/api.ts` (add hook)
- `client/src/pages/InGame.tsx` (integrate dialog)
- `client/src/pages/Stats.tsx` (display logic)
- `version.json`, `client/public/version.json`

**Key principles followed:**
- ✅ TDD: write tests first, then code
- ✅ Atomic transactions: all-or-nothing consistency
- ✅ DRY: reuse EndResult component, extract hammer logic
- ✅ Frequent commits: one logical change per commit
- ✅ Linting & testing at each step
