import { Suspense } from "react";
import { Hero } from "@/components/hero";
import { AgentGrid } from "@/components/agent-grid";
import { Leaderboard } from "@/components/leaderboard";
import { SearchInput } from "@/components/search-input";
import { LeaderboardTabs } from "@/components/leaderboard-tabs";

interface HomeProps {
  searchParams: Promise<{ sort?: string; search?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { sort, search } = await searchParams;

  return (
    <main className="min-h-screen">
      <Hero />
      <AgentGrid />
      <section className="px-4 pb-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4">
            <Suspense>
              <SearchInput />
            </Suspense>
          </div>
          <Suspense>
            <LeaderboardTabs />
          </Suspense>
          <div className="mt-2">
            <Leaderboard sort={sort} search={search} />
          </div>
        </div>
      </section>
    </main>
  );
}
