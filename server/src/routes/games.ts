import { Router, type Request, type Response } from 'express';
import type { AppContext } from '../index.js';
import type { CreateGameBody, GameRow, EndRow, ShotRow, GameWithDetails } from '../types.js';

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

  // PUT /api/games/:id/ends/:endNumber - Update end result
  router.put('/:id/ends/:endNumber', (req: Request, res: Response) => {
    const { id, endNumber } = req.params;
    const { score_home, score_away } = req.body as { score_home?: number; score_away?: number };

    if (score_home == null || score_away == null) {
      res.status(400).json({ error: 'Missing required fields: score_home, score_away' });
      return;
    }

    const result = ctx.db
      .prepare('UPDATE ends SET score_home = ?, score_away = ? WHERE game_id = ? AND number = ?')
      .run(score_home, score_away, id, endNumber);

    if (result.changes === 0) {
      res.status(404).json({ error: 'End not found' });
      return;
    }

    res.json({ success: true });
  });

  // Helper function: determine hammer team for an end
  function getHammerForEnd(endNumber: number, hammerFirstEnd: string, endResults: EndRow[]): string {
    if (endNumber === 1) return hammerFirstEnd;

    const prevEnd = endResults.find((e) => e.number === endNumber - 1);
    if (!prevEnd) return hammerFirstEnd;

    if (prevEnd.score_home === 0 && prevEnd.score_away === 0) {
      // Blank end - hammer stays
      return getHammerForEnd(endNumber - 1, hammerFirstEnd, endResults);
    }

    // Team that scored loses the hammer
    return prevEnd.score_home > prevEnd.score_away ? 'away' : 'home';
  }

  // POST /api/games/:id/ends - Create placeholder end (for early finish)
  router.post('/:id/ends', (req: Request, res: Response) => {
    const { id } = req.params;
    const { number } = req.body as { number?: number };

    if (number == null) {
      res.status(400).json({ error: 'Missing required field: number' });
      return;
    }

    const game = ctx.db
      .prepare('SELECT * FROM games WHERE id = ?')
      .get(id) as GameRow | undefined;

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const ends = ctx.db
      .prepare('SELECT * FROM ends WHERE game_id = ? ORDER BY number')
      .all(id) as EndRow[];

    const hammerTeam = getHammerForEnd(number, game.hammer_first_end, ends);

    const result = ctx.db
      .prepare(`
        INSERT INTO ends (game_id, number, score_home, score_away, hammer)
        VALUES (?, ?, 0, 0, ?)
      `)
      .run(id, number, hammerTeam);

    res.json({ success: true, id: result.lastInsertRowid });
  });

  return router;
}
