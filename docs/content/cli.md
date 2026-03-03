# CLI Tool

## Installation

The Skills CLI is available as an npx command:

```bash
npx @yourorg/skills-cli install <skill-slug>
```

Or install globally:

```bash
npm install -g @yourorg/skills-cli
```

## Commands

### install

Download and install a skill to your current directory.

```bash
skills install <skill-slug>
```

**Options:**

- `--api-url <url>` — Override the API server URL (default: `SKILLS_API_URL` env var)
- `--api-key <key>` — Provide an API key for authenticated tracking

**Example:**

```bash
skills install tdd-master
```

This will:

1. Fetch the skill metadata and files from the API
2. Write the skill files to your current directory
3. Record the install event on the server
4. Display the install count

## Configuration

Set the `SKILLS_API_URL` environment variable to point to your Skills Directory instance:

```bash
export SKILLS_API_URL=https://skills.internal.yourorg.com
```

## Authentication

For user-linked install tracking, provide an API key:

```bash
export SKILLS_API_KEY=your-api-key
```

Installs without an API key are recorded as anonymous.
