import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
import type { ShotType, TurnType, ScoreValue, TeamSide } from '../types';

export function useCreateShot(gameId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      end_number: number;
      shot_number: number;
      team: TeamSide;
      player_number: number;
      type: ShotType | null;
      turn: TurnType | null;
      score: ScoreValue | null;
      is_throwaway: boolean;
    }) => api.createShot(gameId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['game', gameId] });
    },
  });
}

export function useUpdateShot(gameId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      shotNumber: number;
      end_number: number;
      type: ShotType | null;
      turn: TurnType | null;
      score: ScoreValue | null;
      is_throwaway: boolean;
    }) => {
      const { shotNumber, ...rest } = data;
      return api.updateShot(gameId, shotNumber, rest);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['game', gameId] });
    },
  });
}

export function useCreateEnd(gameId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { number: number; score_home: number; score_away: number; hammer: TeamSide }) =>
      api.createEnd(gameId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['game', gameId] });
    },
  });
}
