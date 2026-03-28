import type { ShotRow, PlayerStats, TeamStats, GameStats } from '../types.js';

function avg(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function calcPlayerStats(shots: ShotRow[]): PlayerStats[] {
  const players: PlayerStats[] = [];

  for (let pos = 1; pos <= 4; pos++) {
    const playerShots = shots.filter((s) => s.player_number === pos && s.is_throwaway === 0);
    const scores = playerShots.filter((s) => s.score != null).map((s) => s.score!);
    const drawShots = playerShots.filter((s) => s.type === 'draw' && s.score != null);
    const takeoutShots = playerShots.filter((s) => s.type === 'takeout' && s.score != null);
    const inturnShots = playerShots.filter((s) => s.turn === 'inturn' && s.score != null);
    const outturnShots = playerShots.filter((s) => s.turn === 'outturn' && s.score != null);

    const drawInShots = playerShots.filter((s) => s.type === 'draw' && s.turn === 'inturn' && s.score != null);
    const drawOutShots = playerShots.filter((s) => s.type === 'draw' && s.turn === 'outturn' && s.score != null);
    const takeoutInShots = playerShots.filter((s) => s.type === 'takeout' && s.turn === 'inturn' && s.score != null);
    const takeoutOutShots = playerShots.filter((s) => s.type === 'takeout' && s.turn === 'outturn' && s.score != null);

    players.push({
      position: pos,
      avg: avg(scores),
      shot_count: playerShots.length,
      draw_avg: avg(drawShots.map((s) => s.score!)),
      takeout_avg: avg(takeoutShots.map((s) => s.score!)),
      inturn_avg: avg(inturnShots.map((s) => s.score!)),
      outturn_avg: avg(outturnShots.map((s) => s.score!)),
      inturn_draw_avg: avg(drawInShots.map((s) => s.score!)),
      inturn_takeout_avg: avg(takeoutInShots.map((s) => s.score!)),
      outturn_draw_avg: avg(drawOutShots.map((s) => s.score!)),
      outturn_takeout_avg: avg(takeoutOutShots.map((s) => s.score!)),
      draw_count: drawShots.length,
      takeout_count: takeoutShots.length,
      draw_in_count: drawInShots.length,
      draw_out_count: drawOutShots.length,
      takeout_in_count: takeoutInShots.length,
      takeout_out_count: takeoutOutShots.length,
    });
  }

  return players;
}

function calcTeamStats(shots: ShotRow[]): TeamStats {
  const validShots = shots.filter((s) => s.is_throwaway === 0 && s.score != null);
  const scores = validShots.map((s) => s.score!);
  const players = calcPlayerStats(shots);

  return {
    avg: avg(scores),
    shot_count: validShots.length,
    players,
  };
}

export function calculateGameStats(shots: ShotRow[]): GameStats {
  const homeShots = shots.filter((s) => s.team === 'home');
  const awayShots = shots.filter((s) => s.team === 'away');

  return {
    home: calcTeamStats(homeShots),
    away: calcTeamStats(awayShots),
  };
}
