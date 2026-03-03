# Getting Started

## What is the Skills Directory?

The Skills Directory is an internal platform for discovering, publishing, and installing reusable AI agent skills. Skills are portable configurations that enhance AI coding assistants like Claude Code, Cursor, Copilot, and others.

## Browsing Skills

Visit the home page to see the leaderboard of all published skills. You can:

- **Search** for skills by name or description
- **Sort** by All Time (total installs), Trending (last 24h), or Hot (decay-weighted)
- **Click** any skill to view its detail page with README, stats, and install command

## Installing a Skill

### Via CLI

```bash
npx @yourorg/skills-cli install <skill-slug>
```

This downloads the skill files to your current directory and records the install.

### Via Web

On any skill detail page, click the **Copy** button next to the install command. This copies the command to your clipboard and records the click.

## Creating an Account

Sign in using your organization's SSO provider. Your account is automatically created on first login with MEMBER role.
