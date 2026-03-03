export default function SkillLoading() {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl animate-pulse">
        <div className="h-8 bg-[var(--muted)] rounded w-64 mb-2" />
        <div className="h-4 bg-[var(--muted)] rounded w-32 mb-6" />
        <div className="h-10 bg-[var(--muted)] rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-[var(--muted)] rounded" />
          ))}
        </div>
        <div className="h-64 bg-[var(--muted)] rounded" />
      </div>
    </main>
  );
}
