"use client";

import { useState } from "react";

export function CopyInstallButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const command = `npx @yourorg/skills-cli install ${slug}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    fetch("/api/installs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillSlug: slug, source: "WEB_CLICK" }),
    }).catch(() => {});
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 w-full bg-[var(--muted)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--foreground)] hover:border-[var(--accent)] transition-colors text-left"
    >
      <code className="flex-1 truncate">{command}</code>
      <span className="text-xs text-[var(--muted-foreground)] shrink-0">
        {copied ? "Copied!" : "Copy"}
      </span>
    </button>
  );
}
