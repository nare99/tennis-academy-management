
import { apiRequest } from '../../lib/api-client';
import type { Court } from './courts.types';

export function getCourts(): Promise<Court[]> {
  return apiRequest<Court[]>('/api/courts');
}
