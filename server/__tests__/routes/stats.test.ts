import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/index.js';
import type { GameRow } from '../../src/types.js';

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
