import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminSkills } from "@/components/admin-skills";
import { AdminUsers } from "@/components/admin-users";

interface AdminPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");
  if (session.user.role !== "ADMIN") redirect("/");

  const { tab } = await searchParams;
  const activeTab = tab || "skills";

  const [skills, users] = await Promise.all([
    prisma.skill.findMany({
      orderBy: { installCount: "desc" },
      select: {
        slug: true,
        name: true,
        installCount: true,
        verified: true,
        author: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: { select: { skills: true } },
      },
    }),
  ]);

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Manage skills and users.
        </p>

        <div className="flex gap-1 border-b border-[var(--border)] mb-6">
          <a
            href="/admin?tab=skills"
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "skills"
                ? "border-[var(--accent)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Skills ({skills.length})
          </a>
          <a
            href="/admin?tab=users"
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "users"
                ? "border-[var(--accent)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Users ({users.length})
          </a>
        </div>

        {activeTab === "skills" ? (
          <AdminSkills skills={skills} />
        ) : (
          <AdminUsers users={users} />
        )}
      </div>
    </main>
  );
}
