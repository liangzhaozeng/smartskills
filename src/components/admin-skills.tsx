"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCount } from "@/lib/utils";

interface AdminSkill {
  slug: string;
  name: string;
  installCount: number;
  verified: boolean;
  author: { name: string | null };
}

export function AdminSkills({ skills }: { skills: AdminSkill[] }) {
  const router = useRouter();

  async function toggleVerify(slug: string, verified: boolean) {
    await fetch(`/api/skills/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: !verified }),
    });
    router.refresh();
  }

  async function handleDelete(slug: string) {
    if (!confirm("Are you sure you want to delete this skill?")) return;
    await fetch(`/api/skills/${slug}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[var(--muted-foreground)] text-xs border-b border-[var(--border)]">
          <th className="text-left py-2 px-2">Skill</th>
          <th className="text-left py-2 px-2">Author</th>
          <th className="text-right py-2 px-2">Installs</th>
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
            <td className="py-3 px-2 text-[var(--muted-foreground)]">
              {skill.author.name || "Unknown"}
            </td>
            <td className="py-3 px-2 text-right text-[var(--muted-foreground)]">
              {formatCount(skill.installCount)}
            </td>
            <td className="py-3 px-2 text-center">
              {skill.verified ? (
                <span className="text-xs text-green-400">Verified</span>
              ) : (
                <span className="text-xs text-[var(--muted-foreground)]">
                  Unverified
                </span>
              )}
            </td>
            <td className="py-3 px-2 text-right">
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => toggleVerify(skill.slug, skill.verified)}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  {skill.verified ? "Unverify" : "Verify"}
                </button>
                <button
                  onClick={() => handleDelete(skill.slug)}
                  className="text-xs text-red-400 hover:text-red-300"
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
