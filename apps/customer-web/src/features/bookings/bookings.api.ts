
import { apiRequest } from '../../lib/api-client';
import type {
  AvailabilityResponse,
  Booking,
} from './bookings.types';

export function getAvailability(
  courtId: string,
  date: string,
): Promise<AvailabilityResponse> {
  return apiRequest<AvailabilityResponse>(
    `/api/bookings/availability/${encodeURIComponent(courtId)}?date=${encodeURIComponent(date)}`,
  );
}

export function createBooking(input: {
  courtId: string;
  startAt: string;
  endAt: string;
}): Promise<Booking> {
  return apiRequest<Booking>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMyBookings(): Promise<Booking[]> {
  return apiRequest<Booking[]>('/api/bookings/mine');
}

export function cancelBooking(id: string): Promise<Booking> {
  return apiRequest<Booking>(
    `/api/bookings/${encodeURIComponent(id)}/cancel`,
    { method: 'PATCH' },
  );
}
