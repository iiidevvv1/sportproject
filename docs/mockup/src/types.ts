export type TeamColor = 'red' | 'yellow' | 'blue' | 'green';

export interface Team {
  name: string;
  color: TeamColor;
}

export interface Shot {
  type: 'draw' | 'takeout';
  rotation: 'inturn' | 'outturn';
  score: number; // 0, 25, 50, 75, 100
  isHogged: boolean;
  playerPos: 'lead' | 'second' | 'third' | 'skip';
  stoneNum: number; // 1-8
}

export interface End {
  number: number;
  ourScore: number;
  opponentScore: number;
  shots: Shot[];
}

export interface Game {
  id: string;
  date: string;
  ourTeam: Team;
  opponentTeam: Team;
  totalEnds: number;
  currentEnd: number;
  hammerInFirst: 'ours' | 'theirs';
  status: 'live' | 'completed';
  ends: End[];
}

export const TEAM_COLORS: Record<TeamColor, string> = {
  red: '#bb0112',
  yellow: '#fbcd17',
  blue: '#2f6388',
  green: '#2e7d32',
};

