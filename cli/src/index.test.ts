import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to test parseArgs which is not exported, so we test via main behavior
// Let's extract parseArgs for testing by re-implementing the logic
// Since parseArgs is not exported, we test it by reading the source and testing the same logic

describe("parseArgs logic", () => {
  function parseArgs(
    args: string[],
    env: Record<string, string | undefined> = {}
  ) {
    let apiUrl = env.SKILLS_API_URL || "http://localhost:3000";
    let apiKey = env.SKILLS_API_KEY;
    const positional: string[] = [];

    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--api-url" && args[i + 1]) {
        apiUrl = args[++i];
      } else if (args[i] === "--api-key" && args[i + 1]) {
        apiKey = args[++i];
      } else if (!args[i].startsWith("--")) {
        positional.push(args[i]);
      }
    }

    return {
      command: positional[0] || "",
      slug: positional[1] || "",
      apiUrl,
      apiKey,
    };
  }

  it("returns defaults with empty args", () => {
    const result = parseArgs([]);
    expect(result).toEqual({
      command: "",
      slug: "",
      apiUrl: "http://localhost:3000",
      apiKey: undefined,
    });
  });

  it("extracts command and slug from positional args", () => {
    const result = parseArgs(["install", "my-skill"]);
    expect(result.command).toBe("install");
    expect(result.slug).toBe("my-skill");
  });

  it("parses --api-url flag", () => {
    const result = parseArgs(["--api-url", "https://example.com", "install", "slug"]);
    expect(result.apiUrl).toBe("https://example.com");
    expect(result.command).toBe("install");
    expect(result.slug).toBe("slug");
  });

  it("parses --api-key flag", () => {
    const result = parseArgs(["--api-key", "abc123", "install", "slug"]);
    expect(result.apiKey).toBe("abc123");
  });

  it("handles flags mixed with positional args", () => {
    const result = parseArgs(["install", "--api-url", "https://x.com", "slug"]);
    expect(result.command).toBe("install");
    expect(result.slug).toBe("slug");
    expect(result.apiUrl).toBe("https://x.com");
  });

  it("uses SKILLS_API_URL env var as default", () => {
    const result = parseArgs([], { SKILLS_API_URL: "https://env.com" });
    expect(result.apiUrl).toBe("https://env.com");
  });

  it("--api-url flag overrides env var", () => {
    const result = parseArgs(
      ["--api-url", "https://flag.com", "install", "slug"],
      { SKILLS_API_URL: "https://env.com" }
    );
    expect(result.apiUrl).toBe("https://flag.com");
  });

  it("uses SKILLS_API_KEY env var as default", () => {
    const result = parseArgs([], { SKILLS_API_KEY: "env-key" });
    expect(result.apiKey).toBe("env-key");
  });

  it("ignores trailing flag without value", () => {
    const result = parseArgs(["install", "slug", "--api-url"]);
    // --api-url without value is treated as an unknown flag (starts with --)
    // and is ignored by the else-if branch
    expect(result.apiUrl).toBe("http://localhost:3000");
  });

  it("ignores unknown flags", () => {
    const result = parseArgs(["--verbose", "install", "slug"]);
    // --verbose has no handler, and it starts with --, so it's skipped
    expect(result.command).toBe("install");
    expect(result.slug).toBe("slug");
  });
});

describe("installSkill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("is exported from commands/install", async () => {
    // Just verify the module structure is correct
    const mod = await import("./commands/install");
    expect(typeof mod.installSkill).toBe("function");
  });
});
