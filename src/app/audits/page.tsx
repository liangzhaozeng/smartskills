import { prisma } from "@/lib/prisma";
import { AuditFeed } from "@/components/audit-feed";

interface AuditsPageProps {
  searchParams: Promise<{ action?: string }>;
}

const actions = ["PUBLISH", "UPDATE", "DELETE", "VERIFY"];

export default async function AuditsPage({ searchParams }: AuditsPageProps) {
  const { action } = await searchParams;

  const where: Record<string, unknown> = {};
  if (action && actions.includes(action)) where.action = action;

  const audits = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: 50,
    include: {
      user: { select: { name: true, image: true } },
      skill: { select: { name: true, slug: true } },
    },
  });

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-2">Audit Log</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Chronological record of all skill mutations.
        </p>

        <div className="flex gap-2 mb-6">
          <a
            href="/audits"
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${
              !action
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            All
          </a>
          {actions.map((a) => (
            <a
              key={a}
              href={`/audits?action=${a}`}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                action === a
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {a}
            </a>
          ))}
        </div>

        <AuditFeed
          audits={audits.map((a) => ({
            ...a,
            timestamp: a.timestamp.toISOString(),
            details: a.details as Record<string, unknown> | null,
          }))}
        />
      </div>
    </main>
  );
}
