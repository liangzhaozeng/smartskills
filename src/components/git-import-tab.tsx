"use client";

interface GitImportTabProps {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  readme: string;
  setReadme: (readme: string) => void;
}

export function GitImportTab({
  repoUrl,
  setRepoUrl,
  name,
  setName,
  description,
  setDescription,
  readme,
  setReadme,
}: GitImportTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-[var(--muted-foreground)] mb-1">
          Repository URL
        </label>
        <input
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/org/repo"
          className="w-full bg-[var(--muted)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>
      <div>
        <label className="block text-xs text-[var(--muted-foreground)] mb-1">
          Skill Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Awesome Skill"
          className="w-full bg-[var(--muted)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>
      <div>
        <label className="block text-xs text-[var(--muted-foreground)] mb-1">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief description of what this skill does"
          className="w-full bg-[var(--muted)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>
      <div>
        <label className="block text-xs text-[var(--muted-foreground)] mb-1">
          README (Markdown)
        </label>
        <textarea
          value={readme}
          onChange={(e) => setReadme(e.target.value)}
          rows={8}
          placeholder="# My Skill\n\nDescribe your skill here..."
          className="w-full bg-[var(--muted)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)] resize-y"
        />
      </div>
    </div>
  );
}
