import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
import type { StoneColor, TeamSide } from '../types';

export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: api.getGames,
  });
}

export function useGame(id: number) {
  return useQuery({
    queryKey: ['game', id],
    queryFn: () => api.getGame(id),
  });
}

export function useGameStats(id: number) {
  return useQuery({
    queryKey: ['game', id, 'stats'],
    queryFn: () => api.getGameStats(id),
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      team_home: string;
      team_away: string;
      color_home: StoneColor;
      color_away: StoneColor;
      hammer_first_end: TeamSide;
      max_ends?: number;
    }) => api.createGame(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useFinishGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.finishGame(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['games'] });
      void queryClient.invalidateQueries({ queryKey: ['game', id] });
    },
  });
}

export function useResumeGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.resumeGame(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['games'] });
      void queryClient.invalidateQueries({ queryKey: ['game', id] });
    },
  });
}

export function useDeleteGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteGame(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useUpdateEnd(gameId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      endNumber,
      score_home,
      score_away,
    }: {
      endNumber: number;
      score_home: number;
      score_away: number;
    }) =>
      fetch(`/api/games/${gameId}/ends/${endNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score_home, score_away }),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to update end');
        return res.json();
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['game', gameId] });
    },
  });
}
