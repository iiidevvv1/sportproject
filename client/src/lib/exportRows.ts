import type { Game, GameStats, PlayerStats, TeamSide } from '../types';

export interface ExportRow {
  'Игра': string;
  'Команда': string;
  'Позиция': string;
  'Тип броска': 'Draw' | 'Take';
  'Вращение': 'In-turn' | 'Out-turn';
  'Количество': number;
  '%': number;
  'Вес для среднего': number;
}

const POSITION_NAMES: Record<number, string> = {
  1: 'Лид',
  2: 'Второй',
  3: 'Третий',
  4: 'Скип',
};

function formatGameLabel(game: Game): string {
  const [year, month, day] = game.date.split('-');
  const date = year && month && day ? `${day}.${month}.${year}` : game.date;
  return `${game.team_home} — ${game.team_away} | ${date}`;
}

function buildPlayerRows(game: Game, teamName: string, player: PlayerStats): ExportRow[] {
  const position = POSITION_NAMES[player.position] ?? `Игрок ${player.position}`;

  const combos = [
    { shotType: 'Draw' as const, turn: 'In-turn' as const, count: player.draw_in_count, percent: player.inturn_draw_avg },
    { shotType: 'Draw' as const, turn: 'Out-turn' as const, count: player.draw_out_count, percent: player.outturn_draw_avg },
    { shotType: 'Take' as const, turn: 'In-turn' as const, count: player.takeout_in_count, percent: player.inturn_takeout_avg },
    { shotType: 'Take' as const, turn: 'Out-turn' as const, count: player.takeout_out_count, percent: player.outturn_takeout_avg },
  ];

  return combos.map(({ shotType, turn, count, percent }) => ({
    'Игра': formatGameLabel(game),
    'Команда': teamName,
    'Позиция': position,
    'Тип броска': shotType,
    'Вращение': turn,
    'Количество': count,
    '%': percent,
    'Вес для среднего': count * percent,
  }));
}

function buildTeamRows(game: Game, stats: GameStats, side: TeamSide): ExportRow[] {
  const teamName = side === 'home' ? game.team_home : game.team_away;
  const players = side === 'home' ? stats.home.players : stats.away.players;
  return players.flatMap((player) => buildPlayerRows(game, teamName, player));
}

export function buildExportRows(entries: Array<{ game: Game; stats: GameStats }>): ExportRow[] {
  return entries.flatMap(({ game, stats }) => [
    ...buildTeamRows(game, stats, 'home'),
    ...buildTeamRows(game, stats, 'away'),
  ]);
}
