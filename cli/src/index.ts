#!/usr/bin/env node

import { installSkill } from "./commands/install";

const args = process.argv.slice(2);

function parseArgs(args: string[]): {
  command: string;
  slug: string;
  apiUrl: string;
  apiKey?: string;
} {
  let apiUrl = process.env.SKILLS_API_URL || "http://localhost:3000";
  let apiKey = process.env.SKILLS_API_KEY;
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

async function main() {
  const { command, slug, apiUrl, apiKey } = parseArgs(args);

  if (!command) {
    console.log(`Usage: skills <command> [options]

Commands:
  install <slug>    Install a skill from the directory

Options:
  --api-url <url>   Override the API server URL
  --api-key <key>   Provide an API key for authenticated tracking

Environment:
  SKILLS_API_URL    Default API server URL
  SKILLS_API_KEY    Default API key`);
    process.exit(0);
  }

  if (command === "install") {
    if (!slug) {
      console.error("Error: Please provide a skill slug");
      console.error("Usage: skills install <slug>");
      process.exit(1);
    }
    await installSkill(slug, apiUrl, apiKey);
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
