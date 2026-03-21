import { Router, type Request, type Response } from 'express';
import type { AppContext } from '../index.js';
import type { CreateGameBody, GameRow, EndRow, ShotRow, GameWithDetails } from '../types.js';

export function gamesRouter(ctx: AppContext): Router {
  const router = Router();

  // GET /api/games
  router.get('/', (_req: Request, res: Response) => {
    const games = ctx.db
      .prepare('SELECT * FROM games ORDER BY id DESC')
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
