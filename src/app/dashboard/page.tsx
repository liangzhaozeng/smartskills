import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardSkills } from "@/components/dashboard-skills";
import { formatCount } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const skills = await prisma.skill.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      name: true,
      installCount: true,
      clickCount: true,
      verified: true,
    },
  });

  const totalInstalls = skills.reduce((sum, s) => sum + s.installCount, 0);

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          {session.user.name || session.user.email} &middot;{" "}
          {session.user.role}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[var(--muted)] border border-[var(--border)] rounded p-4">
            <div className="text-xs text-[var(--muted-foreground)]">
              Skills Published
            </div>
            <div className="text-2xl font-bold mt-1">{skills.length}</div>
          </div>
          <div className="bg-[var(--muted)] border border-[var(--border)] rounded p-4">
            <div className="text-xs text-[var(--muted-foreground)]">
              Total Installs
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatCount(totalInstalls)}
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold mb-4">Your Skills</h2>
        <DashboardSkills skills={skills} />
      </div>
    </main>
  );
}
