import { describe, it, expect } from 'vitest';
import { calculateGameStats } from '../../src/lib/statsCalc.js';
import type { ShotRow } from '../../src/types.js';

function makeShot(overrides: Partial<ShotRow>): ShotRow {
  return {
    id: 1,
    game_id: 1,
    end_number: 1,
    shot_number: 1,
    team: 'home',
    player_number: 1,
    type: 'draw',
    turn: 'inturn',
    score: 50,
    is_throwaway: 0,
    ...overrides,
  };
}

describe('calculateGameStats', () => {
  it('calculates average for single player', () => {
    const shots: ShotRow[] = [
      makeShot({ shot_number: 2, team: 'home', player_number: 1, score: 50 }),
      makeShot({ shot_number: 4, team: 'home', player_number: 1, score: 100 }),
    ];

    const stats = calculateGameStats(shots);
    expect(stats.home.players[0]!.avg).toBe(75);
    expect(stats.home.players[0]!.shot_count).toBe(2);
  });

  it('excludes throwaway shots from averages and counts', () => {
    const shots: ShotRow[] = [
      makeShot({ shot_number: 2, team: 'home', player_number: 1, score: 100 }),
      makeShot({ shot_number: 4, team: 'home', player_number: 1, score: null, is_throwaway: 1 }),
    ];

    const stats = calculateGameStats(shots);
    expect(stats.home.players[0]!.avg).toBe(100);
    expect(stats.home.players[0]!.shot_count).toBe(1);
  });

  it('splits draw vs takeout averages', () => {
    const shots: ShotRow[] = [
      makeShot({ team: 'home', player_number: 1, type: 'draw', score: 100 }),
      makeShot({ team: 'home', player_number: 1, type: 'takeout', score: 50, shot_number: 4 }),
    ];

    const stats = calculateGameStats(shots);
    expect(stats.home.players[0]!.draw_avg).toBe(100);
    expect(stats.home.players[0]!.takeout_avg).toBe(50);
  });

  it('splits inturn vs outturn averages', () => {
    const shots: ShotRow[] = [
      makeShot({ team: 'home', player_number: 1, turn: 'inturn', score: 75 }),
      makeShot({ team: 'home', player_number: 1, turn: 'outturn', score: 25, shot_number: 4 }),
    ];

    const stats = calculateGameStats(shots);
    expect(stats.home.players[0]!.inturn_avg).toBe(75);
    expect(stats.home.players[0]!.outturn_avg).toBe(25);
  });

  it('calculates team-wide averages', () => {
    const shots: ShotRow[] = [
      makeShot({ team: 'home', player_number: 1, score: 100, shot_number: 2 }),
      makeShot({ team: 'home', player_number: 2, score: 50, shot_number: 6 }),
    ];

    const stats = calculateGameStats(shots);
    expect(stats.home.avg).toBe(75);
    expect(stats.home.shot_count).toBe(2);
  });

  it('handles empty shots array', () => {
    const stats = calculateGameStats([]);
    expect(stats.home.avg).toBe(0);
    expect(stats.home.shot_count).toBe(0);
    expect(stats.away.avg).toBe(0);
  });

  it('calculates cross-rotation-type breakdowns', () => {
    const shots: ShotRow[] = [
      makeShot({ team: 'home', player_number: 1, type: 'draw', turn: 'inturn', score: 100, shot_number: 2 }),
      makeShot({ team: 'home', player_number: 1, type: 'draw', turn: 'outturn', score: 50, shot_number: 4 }),
      makeShot({ team: 'home', player_number: 1, type: 'takeout', turn: 'inturn', score: 75, end_number: 2, shot_number: 2 }),
      makeShot({ team: 'home', player_number: 1, type: 'takeout', turn: 'outturn', score: 25, end_number: 2, shot_number: 4 }),
    ];

    const stats = calculateGameStats(shots);
    const lead = stats.home.players[0]!;
    expect(lead.inturn_draw_avg).toBe(100);
    expect(lead.outturn_draw_avg).toBe(50);
    expect(lead.inturn_takeout_avg).toBe(75);
    expect(lead.outturn_takeout_avg).toBe(25);
  });
});
