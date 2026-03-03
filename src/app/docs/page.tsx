import fs from "fs";
import path from "path";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocsPageProps {
  searchParams: Promise<{ page?: string }>;
}

const docPages = [
  { slug: "getting-started", title: "Getting Started" },
  { slug: "publishing", title: "Publishing Skills" },
  { slug: "cli", title: "CLI Tool" },
];

export default async function DocsPage({ searchParams }: DocsPageProps) {
  const { page } = await searchParams;
  const activeSlug = page || "getting-started";
  const activePage = docPages.find((p) => p.slug === activeSlug) || docPages[0];

  const filePath = path.join(
    process.cwd(),
    "docs",
    "content",
    `${activePage.slug}.md`
  );

  let content = "";
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    content = "# Page Not Found\n\nThis documentation page could not be found.";
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl flex gap-8">
        <nav className="w-48 shrink-0 hidden md:block">
          <h2 className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
            Documentation
          </h2>
          <ul className="space-y-1">
            {docPages.map((doc) => (
              <li key={doc.slug}>
                <a
                  href={`/docs?page=${doc.slug}`}
                  className={`block text-sm px-2 py-1.5 rounded transition-colors ${
                    activeSlug === doc.slug
                      ? "bg-[var(--muted)] text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {doc.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 min-w-0 prose prose-invert prose-sm max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-sm [&_p]:text-[var(--muted-foreground)] [&_p]:leading-relaxed [&_p]:mb-4 [&_code]:bg-[var(--muted)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-[var(--muted)] [&_pre]:border [&_pre]:border-[var(--border)] [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_a]:text-[var(--accent)] [&_a]:hover:underline [&_ul]:text-sm [&_ul]:text-[var(--muted-foreground)] [&_ul]:mb-4 [&_ol]:text-sm [&_ol]:text-[var(--muted-foreground)] [&_ol]:mb-4 [&_li]:mb-1 [&_strong]:text-[var(--foreground)]">
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        </div>
      </div>
    </main>
  );
}
