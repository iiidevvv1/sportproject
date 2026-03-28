// --- Database row types (match SQLite schema) ---

export type GameStatus = 'active' | 'finished';
export type TeamSide = 'home' | 'away';
export type ShotType = 'draw' | 'takeout';
export type TurnType = 'inturn' | 'outturn';
export type StoneColor = 'red' | 'yellow' | 'blue' | 'green';
export type ScoreValue = 0 | 25 | 50 | 75 | 100;

export interface GameRow {
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

export interface EndRow {
  id: number;
  game_id: number;
  number: number;
  score_home: number;
  score_away: number;
  hammer: TeamSide;
}

export interface ShotRow {
  id: number;
  game_id: number;
  end_number: number;
  shot_number: number;
  team: TeamSide;
  player_number: number;
  type: ShotType | null;
  turn: TurnType | null;
  score: ScoreValue | null;
  is_throwaway: number; // SQLite boolean (0/1)
}

// --- API request/response types ---

export interface CreateGameBody {
  team_home: string;
  team_away: string;
  color_home: StoneColor;
  color_away: StoneColor;
  hammer_first_end: TeamSide;
  max_ends?: number;
}

export interface CreateShotBody {
  end_number: number;
  shot_number: number;
  team: TeamSide;
  player_number: number;
  type: ShotType | null;
  turn: TurnType | null;
  score: ScoreValue | null;
  is_throwaway: boolean;
}

export interface CreateEndBody {
  number: number;
  score_home: number;
  score_away: number;
  hammer: TeamSide;
}

export interface GameWithDetails extends GameRow {
  ends: EndRow[];
  shots: ShotRow[];
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
  // Shot counts by type
  draw_count: number;
  takeout_count: number;
  draw_in_count: number;
  draw_out_count: number;
  takeout_in_count: number;
  takeout_out_count: number;
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
