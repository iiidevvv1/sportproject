// Frontend types matching API responses

export type GameStatus = 'active' | 'finished';
export type TeamSide = 'home' | 'away';
export type ShotType = 'draw' | 'takeout';
export type TurnType = 'inturn' | 'outturn';
export type StoneColor = 'red' | 'yellow' | 'blue' | 'green';
export type ScoreValue = 0 | 25 | 50 | 75 | 100;
export type PlayerPosition = 1 | 2 | 3 | 4;

export interface Game {
  id: number;
  date: string;
  team_home: string;
  team_away: string;
  color_home: StoneColor;
  color_away: StoneColor;
  hammer_first_end: TeamSide;
  max_ends: number;
  status: GameStatus;
  created_at: string;
}

export interface End {
  id: number;
  game_id: number;
  number: number;
  score_home: number;
  score_away: number;
  hammer: TeamSide;
}

export interface Shot {
  id: number;
  game_id: number;
  end_number: number;
  shot_number: number;
  team: TeamSide;
  player_number: PlayerPosition;
  type: ShotType | null;
  turn: TurnType | null;
  score: ScoreValue | null;
  is_throwaway: number;
}

export interface GameWithDetails extends Game {
  ends: End[];
  shots: Shot[];
}

export interface PlayerStats {
  position: number;
  avg: number;
  shot_count: number;
  draw_avg: number;
  takeout_avg: number;
  inturn_avg: number;
  outturn_avg: number;
  inturn_draw_avg: number;
  inturn_takeout_avg: number;
  outturn_draw_avg: number;
  outturn_takeout_avg: number;
}

export interface TeamStats {
  avg: number;
  shot_count: number;
  players: PlayerStats[];
}

export interface GameStats {
  home: TeamStats;
  away: TeamStats;
}

export const STONE_COLORS: Record<StoneColor, string> = {
  red: '#bb0112',
  yellow: '#fbcd17',
  blue: '#2f6388',
  green: '#2e7d32',
};

export const POSITION_NAMES: Record<PlayerPosition, string> = {
  1: 'Лид',
  2: 'Второй',
  3: 'Третий',
  4: 'Скип',
};

export const SCORE_COLORS: Record<ScoreValue, string> = {
  0: '#ba1a1a',
  25: '#f97316',
  50: '#fbcd17',
  75: '#84cc16',
  100: '#16a34a',
};
