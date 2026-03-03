"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitImportTab } from "./git-import-tab";
import { UploadTab } from "./upload-tab";

type Tab = "git" | "upload";

interface UploadFile {
  filename: string;
  content: string;
  path: string;
}

export function PublishForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("git");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Shared fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [readme, setReadme] = useState("");

  // Git tab
  const [repoUrl, setRepoUrl] = useState("");

  // Upload tab
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [files, setFiles] = useState<UploadFile[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body = {
      name,
      description,
      readme,
      sourceType: activeTab === "git" ? "GIT_REPO" : "UPLOAD",
      repoUrl: activeTab === "git" ? repoUrl : undefined,
      category: category || undefined,
      tags,
      files: activeTab === "upload" ? files : undefined,
    };

    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to publish skill");
        return;
      }

      const skill = await res.json();
      router.push(`/skills/${skill.slug}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-1 border-b border-[var(--border)] mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("git")}
          className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "git"
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          From Git Repo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "upload"
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Direct Upload
        </button>
      </div>

      {activeTab === "git" ? (
        <GitImportTab
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          readme={readme}
          setReadme={setReadme}
        />
      ) : (
        <UploadTab
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          readme={readme}
          setReadme={setReadme}
          category={category}
          setCategory={setCategory}
          tagsInput={tagsInput}
          setTagsInput={setTagsInput}
          files={files}
          setFiles={setFiles}
        />
      )}

      {error && (
        <div className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !name || !description}
        className="mt-6 w-full bg-[var(--accent)] text-[var(--accent-foreground)] rounded px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Publishing..." : "Publish Skill"}
      </button>
    </form>
  );
}
