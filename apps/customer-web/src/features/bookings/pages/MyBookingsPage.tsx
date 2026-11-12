import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  cancelBooking as cancelBookingRequest,
  getMyBookings,
} from '../bookings.api';

import type { Booking } from '../bookings.types';

import {
  formatDate,
  formatPrice,
  formatTime,
} from '../../../utils/formatting';

export function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingId, setCancelingId] = useState('');
  const [notice, setNotice] = useState('');

  async function loadBookings() {
    setLoading(true);
    setError('');

    try {
      const result = await getMyBookings();
      setBookings(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your bookings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBookings();
  }, []);

  async function handleCancelBooking(id: string) {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking?',
    );

    if (!confirmed) return;

    setCancelingId(id);
    setError('');
    setNotice('');

    try {
      await cancelBookingRequest(id);

      setNotice('Your booking has been cancelled.');
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel this booking.');
    } finally {
      setCancelingId('');
    }
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-5xl px-6 py-12 sm:px-10 lg:py-16">
      <p className="eyebrow">YOUR BASELINE ACCOUNT</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
        My <span className="font-editorial italic text-academy-green">bookings.</span>
      </h1>
      <p className="mt-3 text-sm text-academy-muted">
        Your upcoming court time, all in one place.
      </p>

      {notice && (
        <p role="status" className="mt-6 text-sm text-green-800">{notice}</p>
      )}
      {error && (
        <p role="alert" className="mt-6 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="py-12 text-sm text-academy-muted">Loading your bookings…</p>
      ) : bookings.length === 0 ? (
        <section className="mt-8 border border-academy-line bg-white p-8">
          <h2 className="text-lg font-semibold">No bookings yet.</h2>
          <p className="mt-2 text-sm text-academy-muted">
            Your next match is waiting.
          </p>
          <Link to="/#courts" className="button-primary mt-6">
            Find a court <span aria-hidden="true">↗</span>
          </Link>
        </section>
      ) : (
        <div className="mt-8 space-y-3">
          {bookings.map((booking) => {
            const isActive =
              booking.status === 'PENDING' || booking.status === 'CONFIRMED';

            return (
              <article
                key={booking.id}
                className="flex flex-col justify-between gap-5 border border-academy-line bg-white p-5 sm:flex-row sm:items-center sm:p-6"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-semibold">{booking.court.name}</h2>
                    <span
                      className={`px-2 py-1 text-[9px] font-bold tracking-wide ${
                        booking.status === 'CANCELLED'
                          ? 'bg-stone-100 text-stone-500'
                          : booking.status === 'CONFIRMED'
                            ? 'bg-[#e8efdd] text-[#43603b]'
                            : 'bg-[#f5efdc] text-[#856d2f]'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-academy-muted">
                    {formatDate(booking.startAt)} · {formatTime(booking.startAt)}–{formatTime(booking.endAt)}
                  </p>

                  <p className="mt-2 text-xs text-academy-muted">
                    {booking.court.surface || 'Tennis court'}
                    <span className="mx-2">·</span>
                    {booking.court.isIndoor ? 'Indoor' : 'Outdoor'}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <strong className="text-base">
                    {formatPrice(booking.priceMinor, booking.currency)}
                  </strong>

                  {isActive && new Date(booking.startAt).getTime() > Date.now() && (
                    <button
                      type="button"
                      disabled={cancelingId === booking.id}
                      onClick={() => void handleCancelBooking(booking.id)}
                      className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
                    >
                      {cancelingId === booking.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
