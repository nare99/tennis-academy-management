import { apiRequest } from '../../lib/api-client';
import type {
  Court,
  CourtInput,
  UpdateCourtStatusInput,
} from './courts.types';

export function getAdminCourts(): Promise<Court[]> {
  return apiRequest<Court[]>('/api/courts/admin');
}

export function createCourt(input: CourtInput): Promise<Court> {
  return apiRequest<Court>('/api/courts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCourt(
  id: string,
  input: CourtInput,
): Promise<Court> {
  return apiRequest<Court>(`/api/courts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function updateCourtStatus(
  id: string,
  input: UpdateCourtStatusInput,
): Promise<Court> {
  return apiRequest<Court>(
    `/api/courts/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}
