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

  // DELETE /api/games/:id/shots/last
  router.delete('/last', (req: Request, res: Response) => {
    const gameId = Number(req.params['id']);

    const lastShot = ctx.db.prepare(
      'SELECT * FROM shots WHERE game_id = ? ORDER BY end_number DESC, shot_number DESC LIMIT 1'
    ).get(gameId) as ShotRow | undefined;

    if (!lastShot) {
      res.status(404).json({ error: 'No shots to delete' });
      return;
    }

    ctx.db.prepare('DELETE FROM shots WHERE id = ?').run(lastShot.id);
    res.json({ ok: true, deleted: lastShot });
  });

  return router;
}
