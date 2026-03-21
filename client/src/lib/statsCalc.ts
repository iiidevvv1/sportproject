import type { PlayerStats, TeamStats, GameStats } from '../types';

/**
 * Calculate display stats from the API PlayerStats response.
 * Returns formatted percentages and rotation distributions.
 */

export interface DisplayPlayerStats {
  position: number;
  positionName: string;
  avg: number;
  shotCount: number;
  drawAvg: number;
  takeoutAvg: number;
  inturnAvg: number;
  outturnAvg: number;
  inturnDrawAvg: number;
  outturnDrawAvg: number;
  inturnTakeoutAvg: number;
  outturnTakeoutAvg: number;
  // For progress bar: distribution of inturn vs outturn within draw
  drawInturnDist: number;
  drawOutturnDist: number;
  // For progress bar: distribution of inturn vs outturn within takeout
  takeoutInturnDist: number;
  takeoutOutturnDist: number;
}

export interface DisplayTeamStats {
  avg: number;
  shotCount: number;
  players: DisplayPlayerStats[];
}

const POSITION_NAMES_MAP: Record<number, string> = {
  1: 'Лид',
  2: 'Второй',
  3: 'Третий',
  4: 'Скип',
};

function toDisplay(ps: PlayerStats): DisplayPlayerStats {
  // We don't have per-type inturn/outturn counts from API, so we estimate distribution
  // from averages: if both are non-zero, show 50/50; otherwise show 100/0
  const drawInturnDist = ps.inturn_draw_avg > 0 && ps.outturn_draw_avg > 0 ? 50 : ps.inturn_draw_avg > 0 ? 100 : 0;
  const drawOutturnDist = 100 - drawInturnDist;
  const takeoutInturnDist = ps.inturn_takeout_avg > 0 && ps.outturn_takeout_avg > 0 ? 50 : ps.inturn_takeout_avg > 0 ? 100 : 0;
  const takeoutOutturnDist = 100 - takeoutInturnDist;

  return {
    position: ps.position,
    positionName: POSITION_NAMES_MAP[ps.position] ?? `Игрок ${ps.position}`,
    avg: ps.avg,
    shotCount: ps.shot_count,
    drawAvg: ps.draw_avg,
    takeoutAvg: ps.takeout_avg,
    inturnAvg: ps.inturn_avg,
    outturnAvg: ps.outturn_avg,
    inturnDrawAvg: ps.inturn_draw_avg,
    outturnDrawAvg: ps.outturn_draw_avg,
    inturnTakeoutAvg: ps.inturn_takeout_avg,
    outturnTakeoutAvg: ps.outturn_takeout_avg,
    drawInturnDist,
    drawOutturnDist,
    takeoutInturnDist,
    takeoutOutturnDist,
  };
}

export function toDisplayTeam(ts: TeamStats): DisplayTeamStats {
  return {
    avg: ts.avg,
    shotCount: ts.shot_count,
    players: ts.players.map(toDisplay),
  };
}

export function toDisplayStats(stats: GameStats): { home: DisplayTeamStats; away: DisplayTeamStats } {
  return {
    home: toDisplayTeam(stats.home),
    away: toDisplayTeam(stats.away),
  };
}
