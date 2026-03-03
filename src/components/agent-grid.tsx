const agents = [
  { name: "Claude Code", icon: "CC" },
  { name: "Cursor", icon: "Cu" },
  { name: "Copilot", icon: "Co" },
  { name: "Windsurf", icon: "Ws" },
  { name: "Cline", icon: "Cl" },
  { name: "Aider", icon: "Ai" },
  { name: "Roo Code", icon: "Rc" },
  { name: "Custom", icon: "++" },
];

export function AgentGrid() {
  return (
    <section className="px-4 pb-8">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] mb-4">
          Supported Agents
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="flex flex-col items-center gap-1.5 p-2 rounded border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
            >
              <div className="w-8 h-8 rounded bg-[var(--muted)] flex items-center justify-center text-xs font-bold text-[var(--muted-foreground)]">
                {agent.icon}
              </div>
              <span className="text-[10px] text-[var(--muted-foreground)] truncate w-full text-center">
                {agent.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
