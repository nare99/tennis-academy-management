
import type { Court } from '../courts/courts.types';

export type BookingOption = {
  durationMinutes: number;
  endAt: string;
  priceMinor: number;
  currency: string;
};

export type AvailableSlot = {
  startAt: string;
  options: BookingOption[];
};

export type AvailabilityResponse = {
  court: Court;
  date: string;
  timeZone: string;
  slots: AvailableSlot[];
};

export type Booking = {
  id: string;
  startAt: string;
  endAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  priceMinor: number;
  currency: string;
  court: Court;
};
