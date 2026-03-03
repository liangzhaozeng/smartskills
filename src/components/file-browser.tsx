interface SkillFile {
  id: string;
  filename: string;
  content: string;
  path: string;
}

interface FileBrowserProps {
  files: SkillFile[];
  repoUrl?: string | null;
  sourceType: string;
}

export function FileBrowser({ files, repoUrl, sourceType }: FileBrowserProps) {
  if (sourceType === "GIT_REPO" && repoUrl) {
    return (
      <div className="bg-[var(--muted)] border border-[var(--border)] rounded p-4">
        <h3 className="text-sm font-medium mb-2">Source</h3>
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          {repoUrl}
        </a>
      </div>
    );
  }

  if (files.length === 0) return null;

  return (
    <div className="bg-[var(--muted)] border border-[var(--border)] rounded">
      <h3 className="text-sm font-medium p-4 border-b border-[var(--border)]">
        Files
      </h3>
      {files.map((file) => (
        <details key={file.id} className="border-b border-[var(--border)] last:border-b-0">
          <summary className="px-4 py-2 text-sm cursor-pointer hover:bg-[var(--background)] transition-colors">
            {file.path}/{file.filename}
          </summary>
          <pre className="px-4 py-3 text-xs overflow-x-auto bg-[var(--background)]">
            <code>{file.content}</code>
          </pre>
        </details>
      ))}
    </div>
  );
}
