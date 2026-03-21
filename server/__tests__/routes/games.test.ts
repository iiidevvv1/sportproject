import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/index.js';
import type { GameRow, GameWithDetails } from '../../src/types.js';

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
