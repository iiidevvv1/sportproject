import type { GameWithDetails, Shot, TeamSide } from '../types';
import { POSITION_NAMES } from '../types';

export interface ExportRow {
  'Игра': string;
  'Дата': string;
  'Команда': string;
  'Позиция': string;
  'Номер игрока': number;
  'Энд': number;
  'Номер броска в энде': number;
  'Тип броска': 'Draw' | 'Take' | '—';
  'Вращение': 'In-turn' | 'Out-turn' | '—';
  'Оценка': number | '—';
  'Проброс': 'Да' | 'Нет';
}

function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return year && month && day ? `${day}.${month}.${year}` : date;
}

function getTeamName(game: GameWithDetails, side: TeamSide): string {
  return side === 'home' ? game.team_home : game.team_away;
}

function formatShotType(shot: Shot): ExportRow['Тип броска'] {
  if (shot.type === 'draw') return 'Draw';
  if (shot.type === 'takeout') return 'Take';
  return '—';
}

function formatTurn(shot: Shot): ExportRow['Вращение'] {
  if (shot.turn === 'inturn') return 'In-turn';
  if (shot.turn === 'outturn') return 'Out-turn';
  return '—';
}

function buildShotRow(game: GameWithDetails, shot: Shot): ExportRow {
  return {
    'Игра': `${game.team_home} — ${game.team_away}`,
    'Дата': formatDate(game.date),
    'Команда': getTeamName(game, shot.team),
    'Позиция': POSITION_NAMES[shot.player_number] ?? `Игрок ${shot.player_number}`,
    'Номер игрока': shot.player_number,
    'Энд': shot.end_number,
    'Номер броска в энде': shot.shot_number,
    'Тип броска': formatShotType(shot),
    'Вращение': formatTurn(shot),
    'Оценка': shot.score ?? '—',
    'Проброс': shot.is_throwaway ? 'Да' : 'Нет',
  };
}

export function buildExportRows(games: GameWithDetails[]): ExportRow[] {
  return games.flatMap((game) =>
    [...game.shots]
      .sort((a, b) => a.end_number - b.end_number || a.shot_number - b.shot_number)
      .map((shot) => buildShotRow(game, shot)),
  );
}
