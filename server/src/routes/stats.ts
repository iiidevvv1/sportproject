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
