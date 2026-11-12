import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { cancelBooking, getMyBookings } from '../bookings.api';
import type { Booking } from '../bookings.types';
import { MyBookingsPage } from './MyBookingsPage';

vi.mock('../bookings.api', () => ({
  cancelBooking: vi.fn(),
  getMyBookings: vi.fn(),
}));

const activeBooking: Booking = {
  id: 'booking-1',
  startAt: '2099-06-15T10:00:00.000Z',
  endAt: '2099-06-15T11:00:00.000Z',
  status: 'CONFIRMED',
  priceMinor: 5000,
  currency: 'AMD',
  court: {
    id: 'court-1',
    name: 'Court 1',
    surface: 'Hard',
    isIndoor: false,
  },
};

const cancelledBooking: Booking = {
  ...activeBooking,
  status: 'CANCELLED',
};

describe('MyBookingsPage', () => {
  beforeEach(() => {
    vi.mocked(getMyBookings)
      .mockReset()
      .mockResolvedValueOnce([activeBooking])
      .mockResolvedValueOnce([cancelledBooking]);

    vi.mocked(cancelBooking)
      .mockReset()
      .mockResolvedValue(cancelledBooking);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  it('calls the cancellation API once and refreshes the booking list', async () => {
    render(
      <MemoryRouter>
        <MyBookingsPage />
      </MemoryRouter>,
    );

    const cancelButton = await screen.findByRole('button', {
      name: 'Cancel',
    });

    fireEvent.click(cancelButton);

    await screen.findByText('Your booking has been cancelled.');
    await screen.findByText('CANCELLED');

    expect(cancelBooking).toHaveBeenCalledTimes(1);
    expect(cancelBooking).toHaveBeenCalledWith('booking-1');
    expect(getMyBookings).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });
});
