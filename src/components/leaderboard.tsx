import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCount } from "@/lib/utils";

interface LeaderboardProps {
  sort?: string;
  search?: string;
}

export async function Leaderboard({ sort = "all-time", search }: LeaderboardProps) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  let skills;

  if (sort === "trending") {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await prisma.skill.findMany({
      where,
      include: {
        author: { select: { name: true, image: true } },
        _count: {
          select: {
            installs: {
              where: { timestamp: { gte: twentyFourHoursAgo } },
            },
          },
        },
      },
    });
    result.sort((a, b) => b._count.installs - a._count.installs);
    skills = result;
  } else if (sort === "hot") {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await prisma.skill.findMany({
      where,
      include: {
        author: { select: { name: true, image: true } },
        _count: {
          select: {
            installs: {
              where: { timestamp: { gte: twentyFourHoursAgo } },
            },
          },
        },
      },
    });
    const now = Date.now();
    result.sort((a, b) => {
      const hoursA = (now - new Date(a.createdAt).getTime()) / 3600000;
      const hoursB = (now - new Date(b.createdAt).getTime()) / 3600000;
      const scoreA = a._count.installs / Math.pow(hoursA + 2, 1.5);
      const scoreB = b._count.installs / Math.pow(hoursB + 2, 1.5);
      return scoreB - scoreA;
    });
    skills = result;
  } else {
    skills = await prisma.skill.findMany({
      where,
      orderBy: { installCount: "desc" },
      include: {
        author: { select: { name: true, image: true } },
      },
    });
  }

  if (skills.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--muted-foreground)] text-sm">
        No skills found.
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[var(--muted-foreground)] text-xs border-b border-[var(--border)]">
          <th className="text-left py-2 px-2 w-10">#</th>
          <th className="text-left py-2 px-2">Skill</th>
          <th className="text-right py-2 px-2 w-24">Installs</th>
        </tr>
      </thead>
      <tbody>
        {skills.map((skill, index) => (
          <tr
            key={skill.id}
            className="border-b border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
          >
            <td className="py-3 px-2 text-[var(--muted-foreground)]">
              {index + 1}
            </td>
            <td className="py-3 px-2">
              <Link
                href={`/skills/${skill.slug}`}
                className="hover:text-[var(--accent)] transition-colors"
              >
                <div className="font-medium">{skill.name}</div>
                <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {skill.description}
                </div>
              </Link>
            </td>
            <td className="py-3 px-2 text-right text-[var(--muted-foreground)]">
              {formatCount(skill.installCount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
