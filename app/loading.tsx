export default function Loading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8"
      aria-label="Loading page"
      aria-busy="true"
    >
      <div className="skeleton h-4 w-28 rounded" />
      <div className="skeleton mt-4 h-10 w-full max-w-md rounded-lg" />
      <div className="skeleton mt-4 h-5 w-full max-w-2xl rounded" />
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-52 rounded-xl border border-border bg-white p-5"
          >
            <div className="skeleton h-10 w-10 rounded-lg" />
            <div className="skeleton mt-8 h-5 w-2/3 rounded" />
            <div className="skeleton mt-3 h-4 w-full rounded" />
            <div className="skeleton mt-2 h-4 w-4/5 rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
