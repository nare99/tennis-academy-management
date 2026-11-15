import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import * as courtsApi from './courts.api';
import type { CourtInput, UpdateCourtStatusInput } from './courts.types';

export const courtsQueryKey = ['admin', 'courts'] as const;

export function useAdminCourts() {
  return useQuery({
    queryKey: courtsQueryKey,
    queryFn: courtsApi.getAdminCourts,
  });
}

export function useCreateCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CourtInput) => courtsApi.createCourt(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: courtsQueryKey }),
  });
}

export function useUpdateCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CourtInput }) =>
      courtsApi.updateCourt(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: courtsQueryKey }),
  });
}

export function useUpdateCourtStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateCourtStatusInput;
    }) => courtsApi.updateCourtStatus(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: courtsQueryKey }),
  });
}
