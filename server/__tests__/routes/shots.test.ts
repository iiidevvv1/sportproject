import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/index.js';
import type { GameRow, ShotRow } from '../../src/types.js';

describe('Shots API', () => {
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

  describe('POST /api/games/:id/shots', () => {
    it('records a normal shot', async () => {
      const res = await request.post(`/api/games/${gameId}/shots`).send({
        end_number: 1,
        shot_number: 1,
        team: 'away',
        player_number: 1,
        type: 'draw',
        turn: 'inturn',
        score: 75,
        is_throwaway: false,
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        game_id: gameId,
        end_number: 1,
        shot_number: 1,
        team: 'away',
        player_number: 1,
        type: 'draw',
        turn: 'inturn',
        score: 75,
        is_throwaway: 0,
      });
    });

    it('records a throwaway shot with null fields', async () => {
      const res = await request.post(`/api/games/${gameId}/shots`).send({
        end_number: 1,
        shot_number: 1,
        team: 'away',
        player_number: 1,
        type: null,
        turn: null,
        score: null,
        is_throwaway: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.is_throwaway).toBe(1);
      expect(res.body.type).toBeNull();
    });

    it('returns 400 for invalid shot_number', async () => {
      const res = await request.post(`/api/games/${gameId}/shots`).send({
        end_number: 1,
        shot_number: 17,
        team: 'away',
        player_number: 1,
        type: 'draw',
        turn: 'inturn',
        score: 50,
        is_throwaway: false,
      });

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent game', async () => {
      const res = await request.post('/api/games/999/shots').send({
        end_number: 1,
        shot_number: 1,
        team: 'away',
        player_number: 1,
        type: 'draw',
        turn: 'inturn',
        score: 50,
        is_throwaway: false,
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/games/:id/shots/:shotNumber', () => {
    it('updates an existing shot', async () => {
      await request.post(`/api/games/${gameId}/shots`).send({
        end_number: 1, shot_number: 1, team: 'away', player_number: 1,
        type: 'draw', turn: 'inturn', score: 50, is_throwaway: false,
      });

      const res = await request.put(`/api/games/${gameId}/shots/1`).send({
        end_number: 1,
        type: 'takeout',
        turn: 'outturn',
        score: 100,
        is_throwaway: false,
      });

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('takeout');
      expect(res.body.score).toBe(100);
    });
  });
});
