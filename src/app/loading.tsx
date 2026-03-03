export default function Loading() {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl animate-pulse">
        <div className="h-32 bg-[var(--muted)] rounded mb-8" />
        <div className="h-8 bg-[var(--muted)] rounded w-48 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-[var(--muted)] rounded" />
          ))}
        </div>
      </div>
    </main>
  );
}
