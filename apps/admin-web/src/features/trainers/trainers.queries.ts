import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './trainers.api';
import type { TrainerInput } from './trainers.types';

export const trainersQueryKey = ['admin', 'trainers'] as const;

export function useTrainers() {
  return useQuery({ queryKey: trainersQueryKey, queryFn: api.getTrainers });
}

export function useCreateTrainer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: TrainerInput) => api.createTrainer(input),
    onSuccess: () => client.invalidateQueries({ queryKey: trainersQueryKey }),
  });
}

export function useUpdateTrainer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TrainerInput }) => api.updateTrainer(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: trainersQueryKey }),
  });
}

export function useUpdateTrainerStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.updateTrainerStatus(id, isActive),
    onSuccess: () => client.invalidateQueries({ queryKey: trainersQueryKey }),
  });
}

export function useReissueTrainerInvitation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.reissueTrainerInvitation(id),
    onSuccess: () => client.invalidateQueries({ queryKey: trainersQueryKey }),
  });
}
