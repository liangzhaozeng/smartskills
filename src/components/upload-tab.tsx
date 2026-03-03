"use client";

import { useRef } from "react";

interface UploadFile {
  filename: string;
  content: string;
  path: string;
}

interface UploadTabProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  readme: string;
  setReadme: (readme: string) => void;
  category: string;
  setCategory: (cat: string) => void;
  tagsInput: string;
  setTagsInput: (tags: string) => void;
  files: UploadFile[];
  setFiles: (files: UploadFile[]) => void;
}

export function UploadTab({
  name,
  setName,
  description,
  setDescription,
  readme,
  setReadme,
  category,
  setCategory,
  tagsInput,
  setTagsInput,
  files,
  setFiles,
}: UploadTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList) {
    const newFiles: UploadFile[] = [];
    for (const file of Array.from(fileList)) {
      const content = await file.text();
      newFiles.push({ filename: file.name, content, path: "/" });
    }
    setFiles([...files, ...newFiles]);
  }

  return (
    <div className="space-y-4">
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
          placeholder="A brief description"
          className="w-full bg-[var(--muted)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">
            Category
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., workflow"
            className="w-full bg-[var(--muted)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g., testing, tdd"
            className="w-full bg-[var(--muted)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-[var(--muted-foreground)] mb-1">
          Skill Files
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
          className="w-full border-2 border-dashed border-[var(--border)] rounded p-6 text-center text-sm text-[var(--muted-foreground)] cursor-pointer hover:border-[var(--accent)] transition-colors"
        >
          Drop files here or click to browse
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />
        {files.length > 0 && (
          <div className="mt-2 space-y-1">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs bg-[var(--muted)] px-2 py-1 rounded"
              >
                <span>{f.filename}</span>
                <button
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
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
