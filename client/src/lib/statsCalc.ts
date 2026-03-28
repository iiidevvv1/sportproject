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
  // Shot counts from API
  drawCount: number;
  takeoutCount: number;
  drawInCount: number;
  drawOutCount: number;
  takeoutInCount: number;
  takeoutOutCount: number;
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
    drawCount: ps.draw_count,
    takeoutCount: ps.takeout_count,
    drawInCount: ps.draw_in_count,
    drawOutCount: ps.draw_out_count,
    takeoutInCount: ps.takeout_in_count,
    takeoutOutCount: ps.takeout_out_count,
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
