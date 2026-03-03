"use client";

import { useRouter, useSearchParams } from "next/navigation";

const tabs = [
  { key: "all-time", label: "All Time" },
  { key: "trending", label: "Trending (24h)" },
  { key: "hot", label: "Hot" },
];

export function LeaderboardTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSort = searchParams.get("sort") || "all-time";

  function handleTabClick(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", key);
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 border-b border-[var(--border)]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleTabClick(tab.key)}
          className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
            activeSort === tab.key
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
