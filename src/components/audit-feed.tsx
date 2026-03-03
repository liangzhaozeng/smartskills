import Link from "next/link";

interface AuditEntry {
  id: string;
  action: string;
  timestamp: string;
  user: { name: string | null; image: string | null };
  skill: { name: string; slug: string };
  details: Record<string, unknown> | null;
}

const actionStyles: Record<string, string> = {
  PUBLISH: "bg-green-500/10 text-green-400 border-green-500/20",
  UPDATE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  VERIFY: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const actionVerbs: Record<string, string> = {
  PUBLISH: "published",
  UPDATE: "updated",
  DELETE: "deleted",
  VERIFY: "verified",
};

export function AuditFeed({ audits }: { audits: AuditEntry[] }) {
  if (audits.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--muted-foreground)] text-sm">
        No audit entries found.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {audits.map((audit) => (
        <div
          key={audit.id}
          className="flex items-center gap-3 bg-[var(--muted)] border border-[var(--border)] rounded px-4 py-3"
        >
          <span
            className={`text-xs px-2 py-0.5 rounded border font-medium shrink-0 ${
              actionStyles[audit.action] || ""
            }`}
          >
            {audit.action}
          </span>
          <div className="flex-1 text-sm min-w-0">
            <span className="text-[var(--foreground)]">
              {audit.user.name || "Unknown"}
            </span>{" "}
            <span className="text-[var(--muted-foreground)]">
              {actionVerbs[audit.action] || audit.action.toLowerCase()}
            </span>{" "}
            <Link
              href={`/skills/${audit.skill.slug}`}
              className="text-[var(--accent)] hover:underline"
            >
              {audit.skill.name}
            </Link>
          </div>
          <time className="text-xs text-[var(--muted-foreground)] shrink-0">
            {new Date(audit.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
      ))}
    </div>
  );
}
