export default function AuditsLoading() {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl animate-pulse">
        <div className="h-8 bg-[var(--muted)] rounded w-32 mb-2" />
        <div className="h-4 bg-[var(--muted)] rounded w-64 mb-6" />
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-[var(--muted)] rounded" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-[var(--muted)] rounded" />
          ))}
        </div>
      </div>
    </main>
  );
}
