import type {
  Game,
  GameWithDetails,
  GameStats,
  Shot,
  End,
  StoneColor,
  TeamSide,
  ShotType,
  TurnType,
  ScoreValue,
} from './types';

const BASE = '/api';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// Games
export function getGames(): Promise<Game[]> {
  return fetchJson<Game[]>('/games');
}

export function getGame(id: number): Promise<GameWithDetails> {
  return fetchJson<GameWithDetails>(`/games/${id}`);
}

export function createGame(data: {
  team_home: string;
  team_away: string;
  color_home: StoneColor;
  color_away: StoneColor;
  hammer_first_end: TeamSide;
  max_ends?: number;
}): Promise<Game> {
  return fetchJson<Game>('/games', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function finishGame(id: number): Promise<Game> {
  return fetchJson<Game>(`/games/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'finished' }),
  });
}

export function deleteGame(id: number): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(`/games/${id}`, {
    method: 'DELETE',
  });
}

// Shots
export function createShot(
  gameId: number,
  data: {
    end_number: number;
    shot_number: number;
    team: TeamSide;
    player_number: number;
    type: ShotType | null;
    turn: TurnType | null;
    score: ScoreValue | null;
    is_throwaway: boolean;
  },
): Promise<Shot> {
  return fetchJson<Shot>(`/games/${gameId}/shots`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateShot(
  gameId: number,
  shotNumber: number,
  data: {
    end_number: number;
    type: ShotType | null;
    turn: TurnType | null;
    score: ScoreValue | null;
    is_throwaway: boolean;
  },
): Promise<Shot> {
  return fetchJson<Shot>(`/games/${gameId}/shots/${shotNumber}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Ends
export function createEnd(
  gameId: number,
  data: { number: number; score_home: number; score_away: number; hammer: TeamSide },
): Promise<End> {
  return fetchJson<End>(`/games/${gameId}/ends`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Stats
export function getGameStats(id: number): Promise<GameStats> {
  return fetchJson<GameStats>(`/games/${id}/stats`);
}
