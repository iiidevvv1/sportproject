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

    if (body.number == null || body.score_home == null || body.score_away == null || body.hammer == null) {
      res.status(400).json({ error: 'Missing required fields: number, score_home, score_away, hammer' });
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
      INSERT INTO ends (game_id, number, score_home, score_away, hammer)
      VALUES (?, ?, ?, ?, ?)
    `).run(gameId, body.number, body.score_home, body.score_away, body.hammer);

    const end = ctx.db.prepare('SELECT * FROM ends WHERE id = ?').get(result.lastInsertRowid) as EndRow;
    res.status(201).json(end);
  });

  return router;
}
