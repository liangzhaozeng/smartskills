import { formatCount } from "@/lib/utils";

interface SkillStatsProps {
  installCount: number;
  clickCount: number;
  version: string;
  createdAt: Date;
}

export function SkillStats({
  installCount,
  clickCount,
  version,
  createdAt,
}: SkillStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-[var(--muted)] border border-[var(--border)] rounded p-3">
        <div className="text-xs text-[var(--muted-foreground)]">Installs</div>
        <div className="text-lg font-bold mt-1">{formatCount(installCount)}</div>
      </div>
      <div className="bg-[var(--muted)] border border-[var(--border)] rounded p-3">
        <div className="text-xs text-[var(--muted-foreground)]">Clicks</div>
        <div className="text-lg font-bold mt-1">{formatCount(clickCount)}</div>
      </div>
      <div className="bg-[var(--muted)] border border-[var(--border)] rounded p-3">
        <div className="text-xs text-[var(--muted-foreground)]">Version</div>
        <div className="text-lg font-bold mt-1">{version}</div>
      </div>
      <div className="bg-[var(--muted)] border border-[var(--border)] rounded p-3">
        <div className="text-xs text-[var(--muted-foreground)]">Published</div>
        <div className="text-lg font-bold mt-1">
          {new Date(createdAt).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>
    </div>
  );
}
