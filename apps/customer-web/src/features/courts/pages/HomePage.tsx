
import { useEffect, useState } from 'react';

import { Footer } from '../../../components/layout/Footer';
import { apiRequest } from '../../../lib/api-client';
import { CourtCard } from '../components/CourtCard';
import type { Court } from '../courts.types';

export function HomePage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    apiRequest<Court[]>('/api/courts')
      .then((data) => {
        if (!cancelled) setCourts(data);
      })
      .catch(() => {
        if (!cancelled) {
          setError('We couldn’t load the courts. Please try again shortly.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <main>
        <section className="relative grid gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16 lg:px-[11%] lg:py-20">
          <div className="relative z-10">
            <p className="eyebrow">
              <span className="size-2 rounded-full bg-lime-600" />
              YOUR NEXT MATCH STARTS HERE
            </p>

            <h1 className="mt-7 text-6xl font-medium leading-[0.98] tracking-[-0.065em] sm:text-7xl lg:text-[88px]">
              Make time
              <br />
              for <span className="font-editorial italic text-academy-green">your game.</span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-academy-muted sm:text-base">
              Find your court. Meet your coach. Play a little more.
              Your tennis routine starts with one booking.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#courts" className="button-primary">
                Find your court <span aria-hidden="true">↗</span>
              </a>
              <a href="#approach" className="button-secondary">
                Discover Baseline
              </a>
            </div>

            <p className="mt-10 flex items-center gap-3 text-xs text-stone-500">
              <span className="text-xl text-academy-green">✳</span>
              Good tennis. Good people. More often.
            </p>
          </div>

          <div
            className="relative flex min-h-[340px] items-center justify-center overflow-hidden bg-[#e7ebd9] sm:min-h-[430px]"
            role="img"
            aria-label="Illustrated green tennis court"
          >
            <span className="absolute left-5 top-5 text-[9px] font-bold tracking-[0.2em] text-[#66775e]">
              PLAY YOUR WAY
            </span>
            <div className="aspect-[0.8] w-[53%] rotate-[-7deg] bg-[#6e9469] p-3 shadow-2xl shadow-green-950/15">
              <div className="relative h-full border-2 border-[#f7f7e8]">
                <div className="absolute inset-x-0 bottom-1/4 top-1/4 border-y-2 border-[#f7f7e8]" />
                <div className="absolute bottom-1/4 left-1/2 top-1/4 border-l-2 border-[#f7f7e8]" />
                <div className="absolute inset-x-[-2px] top-1/2 border-t-[4px] border-[#263d2e]" />
              </div>
            </div>
            <div className="absolute bottom-[16%] right-[7%] flex size-[88px] rotate-6 flex-col items-center justify-center rounded-full bg-academy-lime text-academy-ink">
              <span className="text-[11px] tracking-[0.2em]">LOVE</span>
              <strong className="text-2xl tracking-tight">ALL.</strong>
            </div>
            <div className="absolute inset-x-5 bottom-4 flex justify-between text-[8px] font-bold tracking-widest text-[#64745d]">
              <span>01 / THE COURT</span>
              <span>YOUR TIME, YOUR GAME</span>
            </div>
          </div>
        </section>

        <section id="approach" className="grid gap-8 border-y border-academy-line bg-[#f1f2e9] px-6 py-10 sm:grid-cols-3 sm:px-10 lg:gap-12 lg:px-[11%]">
          {[
            ['01', 'Find your rhythm', 'Choose a court that fits your day and your style of play.'],
            ['02', 'Keep getting better', 'Build your skills with coaching and structured practice.'],
            ['03', 'Play together', 'Make room for friendly matches and group sessions.'],
          ].map(([number, title, description]) => (
            <article key={number}>
              <span className="text-xs tracking-widest text-[#789065]">{number}</span>
              <h2 className="mt-3 text-base font-semibold tracking-tight">{title}</h2>
              <p className="mt-2 max-w-xs text-xs leading-6 text-academy-muted">{description}</p>
            </article>
          ))}
        </section>

        <section id="courts" className="px-6 py-16 sm:px-10 lg:px-[11%] lg:py-24">
          <div className="mb-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">YOUR PLACE TO PLAY</p>
              <h2 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
                Meet the <span className="font-editorial italic text-academy-green">courts.</span>
              </h2>
            </div>
            <p className="text-xs text-academy-muted">Every great rally starts somewhere.</p>
          </div>

          {loading && <p className="py-8 text-sm text-academy-muted">Finding your courts…</p>}
          {error && <p role="alert" className="py-8 text-sm text-red-700">{error}</p>}
          {!loading && !error && courts.length === 0 && (
            <p className="py-8 text-sm text-academy-muted">No active courts are available right now.</p>
          )}

          {!loading && !error && courts.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              {courts.map((court, index) => (
                <CourtCard key={court.id} court={court} index={index} />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col items-start justify-between gap-6 bg-[#e8ecdd] px-6 py-12 sm:flex-row sm:items-center sm:px-10 lg:px-[11%]">
          <div>
            <p className="eyebrow">THE COURT IS CALLING</p>
            <h2 className="mt-3 max-w-lg text-3xl font-medium tracking-tight sm:text-4xl">
              A little more tennis goes a long way.
            </h2>
          </div>
          <a href="/register" className="button-primary shrink-0">
            Join the academy <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
