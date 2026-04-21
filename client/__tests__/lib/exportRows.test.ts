import { describe, expect, it } from 'vitest';
import { buildExportRows } from '../../src/lib/exportRows';
import type { GameWithDetails } from '../../src/types';

const game: GameWithDetails = {
  id: 7,
  date: '2026-04-21',
  team_home: 'Альфа',
  team_away: 'Бета',
  color_home: 'red',
  color_away: 'blue',
  hammer_first_end: 'home',
  max_ends: 8,
  status: 'finished',
  created_at: '2026-04-21T09:00:00Z',
  score_home: 5,
  score_away: 3,
  ends: [],
  shots: [
    {
      id: 101,
      game_id: 7,
      end_number: 1,
      shot_number: 1,
      team: 'away',
      player_number: 1,
      type: 'draw',
      turn: 'inturn',
      score: 75,
      is_throwaway: 0,
    },
    {
      id: 102,
      game_id: 7,
      end_number: 1,
      shot_number: 2,
      team: 'home',
      player_number: 1,
      type: 'takeout',
      turn: 'outturn',
      score: 50,
      is_throwaway: 1,
    },
    {
      id: 103,
      game_id: 7,
      end_number: 2,
      shot_number: 1,
      team: 'away',
      player_number: 2,
      type: null,
      turn: null,
      score: null,
      is_throwaway: 0,
    },
  ],
};

describe('buildExportRows', () => {
  it('builds one excel row per shot', () => {
    const rows = buildExportRows([game]);

    expect(rows).toEqual([
      {
        'Игра': 'Альфа — Бета',
        'Дата': '21.04.2026',
        'Команда': 'Бета',
        'Позиция': 'Лид',
        'Номер игрока': 1,
        'Энд': 1,
        'Номер броска в энде': 1,
        'Тип броска': 'Draw',
        'Вращение': 'In-turn',
        'Оценка': 75,
        'Проброс': 'Нет',
      },
      {
        'Игра': 'Альфа — Бета',
        'Дата': '21.04.2026',
        'Команда': 'Альфа',
        'Позиция': 'Лид',
        'Номер игрока': 1,
        'Энд': 1,
        'Номер броска в энде': 2,
        'Тип броска': 'Take',
        'Вращение': 'Out-turn',
        'Оценка': 50,
        'Проброс': 'Да',
      },
      {
        'Игра': 'Альфа — Бета',
        'Дата': '21.04.2026',
        'Команда': 'Бета',
        'Позиция': 'Второй',
        'Номер игрока': 2,
        'Энд': 2,
        'Номер броска в энде': 1,
        'Тип броска': '—',
        'Вращение': '—',
        'Оценка': '—',
        'Проброс': 'Нет',
      },
    ]);
  });

  it('sorts rows by end and shot number', () => {
    const rows = buildExportRows([{ ...game, shots: [...game.shots].reverse() }]);

    expect(rows.map((row) => `${row['Энд']}-${row['Номер броска в энде']}`)).toEqual(['1-1', '1-2', '2-1']);
  });
});
