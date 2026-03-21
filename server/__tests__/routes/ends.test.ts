import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/index.js';
import type { GameRow, EndRow } from '../../src/types.js';

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
        hammer: 'home',
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        game_id: gameId,
        number: 1,
        score_home: 2,
        score_away: 0,
        hammer: 'home',
      });
    });

    it('creates blank end (0:0)', async () => {
      const res = await request.post(`/api/games/${gameId}/ends`).send({
        number: 1,
        score_home: 0,
        score_away: 0,
        hammer: 'away',
      });

      expect(res.status).toBe(201);
      expect(res.body.score_home).toBe(0);
      expect(res.body.score_away).toBe(0);
      expect(res.body.hammer).toBe('away');
    });

    it('rejects duplicate end number', async () => {
      await request.post(`/api/games/${gameId}/ends`).send({
        number: 1, score_home: 1, score_away: 0, hammer: 'home',
      });

      const res = await request.post(`/api/games/${gameId}/ends`).send({
        number: 1, score_home: 0, score_away: 2, hammer: 'away',
      });

      expect(res.status).toBe(409);
    });

    it('returns 400 for missing hammer', async () => {
      const res = await request.post(`/api/games/${gameId}/ends`).send({
        number: 1, score_home: 1, score_away: 0,
      });

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent game', async () => {
      const res = await request.post('/api/games/999/ends').send({
        number: 1, score_home: 1, score_away: 0, hammer: 'home',
      });

      expect(res.status).toBe(404);
    });
  });
});
