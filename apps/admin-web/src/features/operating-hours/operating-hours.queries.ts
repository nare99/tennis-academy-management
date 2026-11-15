import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as operatingHoursApi from './operating-hours.api';
import type { ReplaceOperatingHoursInput } from './operating-hours.types';

export const operatingHoursQueryKey = (courtId: string) =>
  ['admin', 'courts', courtId, 'operating-hours'] as const;

export function useCourtOperatingHours(courtId: string | undefined) {
  return useQuery({
    queryKey: operatingHoursQueryKey(courtId ?? ''),
    queryFn: () => operatingHoursApi.getCourtOperatingHours(courtId!),
    enabled: Boolean(courtId),
  });
}

export function useReplaceCourtOperatingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courtId,
      input,
    }: {
      courtId: string;
      input: ReplaceOperatingHoursInput;
    }) => operatingHoursApi.replaceCourtOperatingHours(courtId, input),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: operatingHoursQueryKey(variables.courtId),
      }),
  });
}
