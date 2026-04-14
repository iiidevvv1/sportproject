import { Router, type Request, type Response } from 'express';
import type { AppContext } from '../index.js';
import type { CreateGameBody, GameRow, EndRow, ShotRow, GameWithDetails } from '../types.js';
import { getHammerForEnd } from '../lib/gameHelpers.js';

export function gamesRouter(ctx: AppContext): Router {
  const router = Router();

  // GET /api/games
  router.get('/', (_req: Request, res: Response) => {
    const games = ctx.db
      .prepare(`
        SELECT g.*,
          COALESCE(SUM(e.score_home), 0) AS score_home,
          COALESCE(SUM(e.score_away), 0) AS score_away
        FROM games g
        LEFT JOIN ends e ON e.game_id = g.id
        GROUP BY g.id
        ORDER BY g.id DESC
      `)
      .all() as (GameRow & { score_home: number; score_away: number })[];
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

    if (status !== 'finished' && status !== 'active') {
      res.status(400).json({ error: 'Invalid status. Use "finished" or "active"' });
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

  // DELETE /api/games/:id
  router.delete('/:id', (req: Request, res: Response) => {
    const gameId = req.params['id'];

    const game = ctx.db
      .prepare('SELECT * FROM games WHERE id = ?')
      .get(gameId) as GameRow | undefined;

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    // Delete shots, ends, then game (cascade manually)
    ctx.db.prepare('DELETE FROM shots WHERE game_id = ?').run(gameId);
    ctx.db.prepare('DELETE FROM ends WHERE game_id = ?').run(gameId);
    ctx.db.prepare('DELETE FROM games WHERE id = ?').run(gameId);

    res.json({ ok: true });
  });

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
          const existingEnds = ctx.db
            .prepare('SELECT * FROM ends WHERE game_id = ? ORDER BY number')
            .all(gameId) as EndRow[];

          const hammer = getHammerForEnd(endNumber, game.hammer_first_end, existingEnds);
          insertEnd.run(gameId, endNumber, scoreHome, scoreAway, hammer, 'played');
        }

        // Step 2: Create all remaining placeholder ends
        // If skipResult=true, we skip the current end so start at endNumber+1
        // If skipResult=false, we created the current end so also start at endNumber+1
        const startNumber = endNumber + 1;
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

      // endsCount = number of placeholder ends created (from endNumber+1 to max_ends)
      const endsCount = game.max_ends - endNumber;

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

  return router;
}
