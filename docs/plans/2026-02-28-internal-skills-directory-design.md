# Internal Skills Directory — Design Document

**Date:** 2026-02-28
**Status:** Approved

## Overview

An internal clone of [skills.sh](https://skills.sh) — a full-featured Agent Skills Directory for organizational use. Teams can publish, discover, and install reusable AI agent skills with install tracking, leaderboard rankings, and audit logging.

## Tech Stack

- **Framework:** Next.js 14+ (App Router) + TypeScript
- **Styling:** Tailwind CSS, dark theme, Fira Mono monospace typography
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js with generic OIDC/SAML adapter
- **Deployment:** Self-hosted or Vercel (internal)

## Architecture

```
┌─────────────────────────────────────────────┐
│              Next.js App (App Router)        │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ Web UI   │  │ API      │  │ Auth      │ │
│  │ (React)  │  │ Routes   │  │ NextAuth  │ │
│  └──────────┘  └──────────┘  └───────────┘ │
│                     │                       │
│              ┌──────┴──────┐                │
│              │   Prisma    │                │
│              └──────┬──────┘                │
│                     │                       │
│              ┌──────┴──────┐                │
│              │ PostgreSQL  │                │
│              └─────────────┘                │
└─────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
    ┌────┴────┐         ┌────┴────┐
    │   CLI   │         │  Git    │
    │  Tool   │         │ Repos   │
    └─────────┘         └─────────┘
```

**Key flows:**
- **Publish:** Authors register skills via git repo URL or direct upload through the web UI
- **Discover:** Users browse the leaderboard, search, filter by trending/hot/all-time
- **Install:** CLI tool installs skills and pings the API; web UI tracks copy/clicks
- **Auth:** NextAuth.js with generic SAML/OIDC adapter for SSO

## Data Model

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  role      Role     @default(MEMBER)
  skills    Skill[]
  installs  InstallEvent[]
  audits    AuditLog[]
  accounts  Account[]
  sessions  Session[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  MEMBER
}

model Skill {
  id           String         @id @default(cuid())
  slug         String         @unique
  name         String
  description  String
  readme       String?        @db.Text
  authorId     String
  author       User           @relation(fields: [authorId], references: [id])
  sourceType   SourceType
  repoUrl      String?
  version      String         @default("1.0.0")
  category     String?
  tags         String[]
  installCount Int            @default(0)
  clickCount   Int            @default(0)
  verified     Boolean        @default(false)
  files        SkillFile[]
  installs     InstallEvent[]
  audits       AuditLog[]
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
}

enum SourceType {
  GIT_REPO
  UPLOAD
}

model SkillFile {
  id       String @id @default(cuid())
  skillId  String
  skill    Skill  @relation(fields: [skillId], references: [id], onDelete: Cascade)
  filename String
  content  String @db.Text
  path     String
}

model InstallEvent {
  id        String        @id @default(cuid())
  skillId   String
  skill     Skill         @relation(fields: [skillId], references: [id], onDelete: Cascade)
  source    InstallSource
  userId    String?
  user      User?         @relation(fields: [userId], references: [id])
  timestamp DateTime      @default(now())
}

enum InstallSource {
  CLI
  WEB_CLICK
}

model AuditLog {
  id        String   @id @default(cuid())
  skillId   String
  skill     Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    AuditAction
  details   Json?
  timestamp DateTime @default(now())
}

enum AuditAction {
  PUBLISH
  UPDATE
  DELETE
  VERIFY
}
```

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | ASCII art hero + agent grid + leaderboard with search/filter |
| `/skills/[slug]` | Skill Detail | README, install command, stats chart, source browser |
| `/publish` | Publish | Two-tab form: git repo URL or direct upload |
| `/audits` | Audits | Chronological feed of all skill mutations |
| `/docs` | Docs | Documentation pages |
| `/dashboard` | Dashboard | User's published skills and stats |
| `/admin` | Admin | Verify skills, manage users (admin only) |

### Home Page (`/`)
- Sticky header: org logo, "Skills" branding, nav links (Audits, Docs, Dashboard)
- ASCII art hero with org name, tagline "Internal Agent Skills Directory"
- Agent support grid (logos of platforms the org uses)
- Leaderboard table with tabs: All Time | Trending (24h) | Hot
- Search bar with real-time filtering
- Each row: rank, skill name, repo/source, install count, link to detail

### Skill Detail (`/skills/[slug]`)
- Skill name, author, version, tags
- Install command with copy button (tracks click)
- README rendered as markdown
- Install stats chart (over time)
- Source link (git repo) or file browser (uploads)

### Publish (`/publish`)
- Two-tab form: "From Git Repo" | "Direct Upload"
- Git tab: paste repo URL, auto-fetch name, description, README
- Upload tab: name, description, file drop zone, category/tags
- Preview before submit

## Install Tracking & Ranking

### CLI Tool (`@yourorg/skills-cli`)
- Lightweight Node.js CLI
- Usage: `npx @yourorg/skills-cli install <skill-slug>`
- On install: fetches skill files from API, writes locally, POSTs to `/api/installs` with `source: CLI`
- Optional API key auth for user-linked tracking

### Web Click Tracking
- "Copy install command" button on skill detail page
- On click: copies to clipboard AND POSTs to `/api/installs` with `source: WEB_CLICK`

### Ranking Algorithms

```
All Time:  ORDER BY installCount DESC

Trending:  COUNT installs WHERE timestamp > NOW() - 24h
           ORDER BY count DESC

Hot:       Score = installs_24h / (hours_since_publish + 2)^1.5
           (Hacker News-style decay)
```

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/installs` | Record install event |
| `GET` | `/api/skills` | List skills (with sort param) |
| `GET` | `/api/skills/[slug]` | Skill detail + stats |
| `POST` | `/api/skills` | Publish new skill |
| `PUT` | `/api/skills/[slug]` | Update skill |
| `GET` | `/api/skills/[slug]/stats` | Install time-series data |

## Auth & Permissions

### Authentication
- NextAuth.js with generic OIDC/SAML provider
- Configured via environment variables — swap in Google, Azure AD, Okta, etc.
- Session-based auth with JWT strategy
- First login auto-creates User record with MEMBER role

### Roles

| Permission | MEMBER | ADMIN |
|------------|--------|-------|
| Browse & search skills | Y | Y |
| Install skills | Y | Y |
| Publish new skills | Y | Y |
| Edit/delete own skills | Y | Y |
| Verify/unverify skills | - | Y |
| Edit/delete any skill | - | Y |
| Manage users | - | Y |
| View all audit logs | - | Y |

### Environment Configuration

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://skills.internal.yourorg.com
NEXTAUTH_SECRET=...
OIDC_ISSUER=https://accounts.google.com
OIDC_CLIENT_ID=...
OIDC_CLIENT_SECRET=...
```

## Design System

- **Theme:** Dark mode exclusively, matching skills.sh aesthetic
- **Typography:** Fira Mono (monospace) for all text
- **Hero:** ASCII art with org name
- **Colors:** High contrast, minimal palette (dark backgrounds, light text, accent highlights)
- **Components:** Tailwind CSS utility classes, no component library dependency
