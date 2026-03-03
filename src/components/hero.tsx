export function Hero() {
  return (
    <section className="px-4 pt-12 pb-8">
      <div className="mx-auto max-w-4xl grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-start">
        <pre className="text-[var(--accent)] text-xs leading-tight select-none hidden sm:block">
{`███████╗██╗  ██╗██╗██╗     ██╗     ███████╗
██╔════╝██║ ██╔╝██║██║     ██║     ██╔════╝
███████╗█████╔╝ ██║██║     ██║     ███████╗
╚════██║██╔═██╗ ██║██║     ██║     ╚════██║
███████║██║  ██╗██║███████╗███████╗███████║
╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝`}
        </pre>
        <div className="flex flex-col gap-4">
          <h1 className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-medium">
            Internal Agent Skills Directory
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] max-w-lg leading-relaxed">
            Discover, publish, and install reusable AI agent skills across your
            organization. Track installs, browse the leaderboard, and share
            skills with your team.
          </p>
        </div>
      </div>
    </section>
  );
}
