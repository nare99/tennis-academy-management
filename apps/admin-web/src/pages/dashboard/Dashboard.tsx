export default function Dashboard() {
  return (
    <section>
      <p className="text-sm font-medium text-academy-green">
        Overview
      </p>

      <h2 className="mt-2 text-2xl font-semibold text-academy-ink">
        Dashboard
      </h2>

      <p className="mt-2 text-sm text-academy-muted">
        Welcome to the Tennis Academy administration workspace.
      </p>

      <div className="mt-8 rounded-xl border border-academy-line bg-white p-6">
        <h3 className="font-semibold text-academy-ink">
          Getting started
        </h3>

        <p className="mt-2 text-sm leading-6 text-academy-muted">
          Your admin workspace is ready. Court management is the next
          feature to be connected to the API.
        </p>
      </div>
    </section>
  );
}
