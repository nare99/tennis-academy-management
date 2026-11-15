import { apiRequest } from '../../lib/api-client';
import type {
  OperatingHour,
  ReplaceOperatingHoursInput,
} from './operating-hours.types';

export function getCourtOperatingHours(courtId: string): Promise<OperatingHour[]> {
  return apiRequest<OperatingHour[]>(
    `/api/courts/${encodeURIComponent(courtId)}/operating-hours`,
  );
}

export function replaceCourtOperatingHours(
  courtId: string,
  input: ReplaceOperatingHoursInput,
): Promise<OperatingHour[]> {
  return apiRequest<OperatingHour[]>(
    `/api/courts/${encodeURIComponent(courtId)}/operating-hours`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
}
