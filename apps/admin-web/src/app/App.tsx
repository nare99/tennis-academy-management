export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-academy-paper p-6">
      <section className="w-full max-w-lg rounded-xl border border-academy-line bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-academy-green">
          Tennis Academy
        </p>

        <h1 className="mt-4 text-3xl font-semibold text-academy-ink">
          Admin workspace
        </h1>

        <p className="mt-3 text-sm leading-6 text-academy-muted">
          The administration application is being initialized.
        </p>

        <div className="mt-6 rounded-lg bg-academy-paper p-4 text-sm">
          <p className="font-medium">Next steps</p>
          <p className="mt-1 text-academy-muted">
            Authentication, admin layout and court management.
          </p>
        </div>
      </section>
    </main>
  );
}
