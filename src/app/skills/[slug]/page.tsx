import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CopyInstallButton } from "@/components/copy-install-button";
import { SkillStats } from "@/components/skill-stats";
import { FileBrowser } from "@/components/file-browser";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SkillPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SkillPage({ params }: SkillPageProps) {
  const { slug } = await params;

  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true, image: true } },
      files: true,
    },
  });

  if (!skill) notFound();

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{skill.name}</h1>
              {skill.verified && (
                <span className="text-xs bg-[var(--accent)] text-[var(--accent-foreground)] px-2 py-0.5 rounded">
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              by {skill.author.name || "Unknown"} &middot; v{skill.version}
            </p>
            {skill.tags.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {skill.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-[var(--muted)] border border-[var(--border)] px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <CopyInstallButton slug={skill.slug} />
        </div>

        <div className="mb-8">
          <SkillStats
            installCount={skill.installCount}
            clickCount={skill.clickCount}
            version={skill.version}
            createdAt={skill.createdAt}
          />
        </div>

        {skill.readme && (
          <div className="prose prose-invert prose-sm max-w-none mb-8 bg-[var(--muted)] border border-[var(--border)] rounded p-6 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold [&_p]:text-sm [&_p]:text-[var(--muted-foreground)] [&_p]:leading-relaxed [&_code]:bg-[var(--background)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-[var(--background)] [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_a]:text-[var(--accent)] [&_a]:hover:underline [&_ul]:text-sm [&_ul]:text-[var(--muted-foreground)] [&_ol]:text-sm [&_ol]:text-[var(--muted-foreground)]">
            <Markdown remarkPlugins={[remarkGfm]}>{skill.readme}</Markdown>
          </div>
        )}

        <FileBrowser
          files={skill.files}
          repoUrl={skill.repoUrl}
          sourceType={skill.sourceType}
        />
      </div>
    </main>
  );
}
