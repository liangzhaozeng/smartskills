import { Hero } from "@/components/hero";
import { AgentGrid } from "@/components/agent-grid";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <AgentGrid />
    </main>
  );
}
