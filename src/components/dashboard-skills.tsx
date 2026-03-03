"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCount } from "@/lib/utils";

interface DashboardSkill {
  slug: string;
  name: string;
  installCount: number;
  clickCount: number;
  verified: boolean;
}

export function DashboardSkills({ skills }: { skills: DashboardSkill[] }) {
  const router = useRouter();

  async function handleDelete(slug: string) {
    if (!confirm("Are you sure you want to delete this skill?")) return;

    const res = await fetch(`/api/skills/${slug}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
  }

  if (skills.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--muted-foreground)] text-sm">
        You haven&apos;t published any skills yet.{" "}
        <Link href="/publish" className="text-[var(--accent)] hover:underline">
          Publish one
        </Link>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[var(--muted-foreground)] text-xs border-b border-[var(--border)]">
          <th className="text-left py-2 px-2">Name</th>
          <th className="text-right py-2 px-2">Installs</th>
          <th className="text-right py-2 px-2">Clicks</th>
          <th className="text-center py-2 px-2">Status</th>
          <th className="text-right py-2 px-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {skills.map((skill) => (
          <tr
            key={skill.slug}
            className="border-b border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
          >
            <td className="py-3 px-2">
              <Link
                href={`/skills/${skill.slug}`}
                className="hover:text-[var(--accent)] transition-colors"
              >
                {skill.name}
              </Link>
            </td>
            <td className="py-3 px-2 text-right text-[var(--muted-foreground)]">
              {formatCount(skill.installCount)}
            </td>
            <td className="py-3 px-2 text-right text-[var(--muted-foreground)]">
              {formatCount(skill.clickCount)}
            </td>
            <td className="py-3 px-2 text-center">
              {skill.verified ? (
                <span className="text-xs bg-[var(--accent)] text-[var(--accent-foreground)] px-2 py-0.5 rounded">
                  Verified
                </span>
              ) : (
                <span className="text-xs text-[var(--muted-foreground)]">
                  Unverified
                </span>
              )}
            </td>
            <td className="py-3 px-2 text-right">
              <div className="flex gap-2 justify-end">
                <Link
                  href={`/publish?edit=${skill.slug}`}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(skill.slug)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
