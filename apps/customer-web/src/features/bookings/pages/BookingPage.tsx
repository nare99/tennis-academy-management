import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { createBooking, getAvailability } from '../bookings.api';
import type {
  AvailabilityResponse,
  AvailableSlot,
  Booking,
  BookingOption,
} from '../bookings.types';

import {
  academyDate,
  formatDate,
  formatDuration,
  formatPrice,
  formatTime,
  formatAcademyDate,
} from '../../../utils/formatting';

export function BookingPage() {
  const { courtId } = useParams();
  const navigate = useNavigate();

  const [date, setDate] = useState(academyDate);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedOption, setSelectedOption] = useState<BookingOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!courtId) return;

    let cancelled = false;

    setLoading(true);
    setError('');
    setSelectedStart('');
    setSelectedOption(null);

    getAvailability(courtId, date)
      .then((result) => {
        if (!cancelled) setAvailability(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setAvailability(null);
          setError(err instanceof Error ? err.message : 'Could not load availability.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courtId, date]);

  function selectStart(slot: AvailableSlot) {
    setSelectedStart(slot.startAt);
    setSelectedOption(null);
    setMessage('');
  }

  const selectedSlot = availability?.slots.find(
    (slot) => slot.startAt === selectedStart,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!courtId || !selectedStart || !selectedOption) return;

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await createBooking({ courtId, startAt: selectedStart, endAt: selectedOption.endAt })

      navigate('/my-bookings', {
        state: { bookingCreated: true },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'We could not create your booking.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-6xl px-6 py-12 sm:px-10 lg:py-16">
      <Link to="/#courts" className="text-xs text-academy-muted hover:text-academy-green">
        ← Back to courts
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <section>
          <p className="eyebrow">BOOK YOUR COURT</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
            Find your <span className="font-editorial italic text-academy-green">time.</span>
          </h1>

          {availability?.court && (
            <div className="mt-5">
              <h2 className="text-lg font-semibold">{availability.court.name}</h2>
              <p className="mt-1 text-xs text-academy-muted">
                {availability.court.surface || 'Tennis court'}
                <span className="mx-2">·</span>
                {availability.court.isIndoor ? 'Indoor' : 'Outdoor'}
              </p>
            </div>
          )}

          <label className="form-label mt-8 max-w-xs">
            Choose a date
            <input
              type="date"
              min={academyDate()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          {loading && (
            <p className="py-10 text-sm text-academy-muted">Checking available times…</p>
          )}

          {error && (
            <p role="alert" className="mt-6 text-sm leading-6 text-red-700">{error}</p>
          )}

          {!loading && !error && availability && (
            <div className="mt-8">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-lg font-semibold">Available start times</h2>
                <span className="text-xs text-academy-muted">
                  {availability.slots.length} available
                </span>
              </div>

              {availability.slots.length === 0 ? (
                <p className="mt-5 border border-academy-line bg-white p-5 text-sm text-academy-muted">
                  There are no available times for this date. Try another day.
                </p>
              ) : (
                <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {availability.slots.map((slot) => (
                    <button
                      key={slot.startAt}
                      type="button"
                      onClick={() => selectStart(slot)}
                      aria-pressed={selectedStart === slot.startAt}
                      className={`min-h-12 border px-2 text-sm font-semibold transition ${
                        selectedStart === slot.startAt
                          ? 'border-academy-green bg-academy-green text-white'
                          : 'border-academy-line bg-white hover:border-academy-green'
                      }`}
                    >
                      {formatTime(slot.startAt, availability.timeZone)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSlot && availability && (
            <div className="mt-9">
              <h2 className="text-lg font-semibold">Choose your duration</h2>
              <p className="mt-1 text-xs text-academy-muted">
                Starting at {formatTime(selectedSlot.startAt, availability.timeZone)}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {selectedSlot.options.map((option) => (
                  <button
                    key={`${option.durationMinutes}-${option.endAt}`}
                    type="button"
                    onClick={() => setSelectedOption(option)}
                    aria-pressed={selectedOption?.endAt === option.endAt}
                    className={`flex min-h-[68px] items-center justify-between border p-4 text-left transition ${
                      selectedOption?.endAt === option.endAt
                        ? 'border-academy-green bg-[#edf1e6]'
                        : 'border-academy-line bg-white hover:border-academy-green'
                    }`}
                  >
                    <span>
                      <strong className="block text-sm">
                        {formatDuration(option.durationMinutes)}
                      </strong>
                      <span className="mt-1 block text-xs text-academy-muted">
                        Until {formatTime(option.endAt, availability.timeZone)}
                      </span>
                    </span>
                    <strong className="text-sm">
                      {formatPrice(option.priceMinor, option.currency)}
                    </strong>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="h-fit border border-academy-line bg-white p-6">
          <p className="eyebrow">YOUR BOOKING</p>
          <h2 className="mt-3 text-xl font-semibold">
            {availability?.court.name || 'Court reservation'}
          </h2>

          <div className="my-5 space-y-4 border-y border-academy-line py-5 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-academy-muted">Date</span>
              <strong>{formatAcademyDate(date)}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-academy-muted">Start</span>
              <strong>
                {selectedStart && availability
                  ? formatTime(selectedStart, availability.timeZone)
                  : '—'}
              </strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-academy-muted">Duration</span>
              <strong>
                {selectedOption
                  ? formatDuration(selectedOption.durationMinutes)
                  : '—'}
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-academy-muted">Total</span>
            <strong className="text-xl">
              {selectedOption
                ? formatPrice(selectedOption.priceMinor, selectedOption.currency)
                : '—'}
            </strong>
          </div>

          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              disabled={!selectedStart || !selectedOption || submitting}
              className="button-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Booking…' : 'Confirm booking'}
              {!submitting && <span aria-hidden="true">↗</span>}
            </button>
          </form>

          <p className="mt-4 text-[10px] leading-5 text-academy-muted">
            Your reservation is subject to availability at confirmation.
            The final price is calculated by the academy.
          </p>
        </aside>
      </div>
    </main>
  );
}
