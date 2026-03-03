# Internal Skills Directory — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an internal clone of skills.sh — a full-featured Agent Skills Directory with leaderboard, install tracking, and audit logging.

**Architecture:** Next.js 14+ App Router with PostgreSQL + Prisma. Server components for pages, client components for interactive elements (search, tabs, copy buttons). API routes for skill CRUD and install tracking. NextAuth.js for SSO.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS v4, Prisma, PostgreSQL, NextAuth.js, Fira Mono / Geist Mono fonts

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: entire project scaffold via `create-next-app`
- Modify: `package.json` (add dependencies)
- Modify: `tailwind.config.ts` (dark theme + fonts)
- Create: `src/app/layout.tsx` (root layout with dark theme)
- Create: `src/app/globals.css` (global styles)

**Step 1: Create Next.js project**

Run:
```bash
cd /Users/mlstudio/projects/skillsRepo
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Step 2: Install dependencies**

Run:
```bash
npm install prisma @prisma/client next-auth @auth/prisma-adapter
npm install react-markdown remark-gfm rehype-raw rehype-sanitize
npm install slugify
npm install -D @types/node
```

**Step 3: Add Fira Mono font import to layout**

In `src/app/layout.tsx`, import Fira Mono from `next/font/google` and apply as CSS variable `--font-mono`. Set `<html className="dark">` and `<body>` with the font class.

**Step 4: Configure dark theme globals**

In `src/app/globals.css`, set up CSS custom properties for the dark theme:
```css
:root {
  --background: #0a0a0a;
  --foreground: #ededed;
  --muted: #1a1a1a;
  --muted-foreground: #a0a0a0;
  --border: #2a2a2a;
  --accent: #3b82f6;
  --accent-foreground: #ffffff;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-mono), monospace;
}
```

**Step 5: Verify dev server starts**

Run: `npm run dev`
Expected: Server starts on localhost:3000, shows dark page

**Step 6: Commit**
```bash
git init
git add .
git commit -m "chore: scaffold Next.js project with dark theme and dependencies"
```

---

### Task 2: Set Up Prisma Schema & Database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env` (DATABASE_URL)

**Step 1: Initialize Prisma**

Run: `npx prisma init`

**Step 2: Write the full schema**

In `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model User {
  id        String         @id @default(cuid())
  email     String         @unique
  name      String?
  image     String?
  role      Role           @default(MEMBER)
  skills    Skill[]
  installs  InstallEvent[]
  audits    AuditLog[]
  accounts  Account[]
  sessions  Session[]
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
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
  id        String      @id @default(cuid())
  skillId   String
  skill     Skill       @relation(fields: [skillId], references: [id], onDelete: Cascade)
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  action    AuditAction
  details   Json?
  timestamp DateTime    @default(now())
}

enum AuditAction {
  PUBLISH
  UPDATE
  DELETE
  VERIFY
}
```

**Step 3: Set DATABASE_URL in `.env`**

```env
DATABASE_URL="postgresql://localhost:5432/skills_directory?schema=public"
```

**Step 4: Run migration**

Run: `npx prisma migrate dev --name init`
Expected: Migration created and applied

**Step 5: Create Prisma client singleton**

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 6: Commit**
```bash
git add prisma/ src/lib/prisma.ts .env.example
git commit -m "feat: add Prisma schema with all models and migrations"
```

---

### Task 3: Set Up NextAuth.js

**Files:**
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/auth.ts`
- Modify: `.env` (auth vars)

**Step 1: Create auth config**

In `src/lib/auth.ts`:
```typescript
import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    {
      id: "oidc",
      name: "SSO",
      type: "oauth",
      wellKnown: process.env.OIDC_ISSUER + "/.well-known/openid-configuration",
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      authorization: { params: { scope: "openid email profile" } },
      idToken: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    },
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id
        session.user.role = (user as any).role
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
```

**Step 2: Create route handler**

In `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

**Step 3: Create auth type declarations**

Create `src/types/next-auth.d.ts`:
```typescript
import { Role } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
```

**Step 4: Add env vars to `.env`**

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production
OIDC_ISSUER=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
```

**Step 5: Create SessionProvider wrapper**

Create `src/components/providers.tsx`:
```typescript
"use client"
import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

Wrap in `src/app/layout.tsx`.

**Step 6: Commit**
```bash
git add src/lib/auth.ts src/app/api/auth/ src/types/ src/components/providers.tsx
git commit -m "feat: add NextAuth.js with generic OIDC provider"
```

---

### Task 4: Build Header & Layout Shell

**Files:**
- Create: `src/components/header.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Build the sticky header**

Create `src/components/header.tsx` with:
- Sticky top bar, `h-14`, dark background, border-bottom
- Left: org logo/icon + separator + "Skills" heading
- Right: nav links — Audits, Docs, Dashboard (if authed), user avatar/sign-in

Match skills.sh structure: `flex h-14 items-center justify-between px-4 gap-6`

**Step 2: Wire header into root layout**

In `src/app/layout.tsx`, add `<Header />` above `{children}`.

**Step 3: Verify visually**

Run: `npm run dev`
Expected: Dark page with sticky header showing "Skills" branding and nav links

**Step 4: Commit**
```bash
git add src/components/header.tsx src/app/layout.tsx
git commit -m "feat: add sticky header with navigation"
```

---

### Task 5: Build Home Page — Hero Section

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/hero.tsx`
- Create: `src/components/agent-grid.tsx`

**Step 1: Create ASCII art hero component**

Create `src/components/hero.tsx` with:
- ASCII art block using `<pre>` tag with the org name in block letters
- Subtitle: "Internal Agent Skills Directory" (uppercase, mono, medium weight)
- Description paragraph explaining the platform
- Two-column grid on desktop: `grid-cols-1 lg:grid-cols-[auto_1fr]`

Use the same ASCII art style as skills.sh:
```
███████╗██╗  ██╗██╗██╗     ██╗     ███████╗
██╔════╝██║ ██╔╝██║██║     ██║     ██╔════╝
...
```
(But with the org name or "SKILLS" as placeholder)

**Step 2: Create agent support grid**

Create `src/components/agent-grid.tsx`:
- Grid of platform logos the org supports (Claude Code, Cursor, Copilot, etc.)
- Responsive grid with small icons and labels
- Links to platform pages

**Step 3: Compose on home page**

In `src/app/page.tsx`, render `<Hero />` and `<AgentGrid />`.

**Step 4: Verify visually**

Run: `npm run dev`
Expected: Dark page with ASCII art hero and agent logos grid

**Step 5: Commit**
```bash
git add src/components/hero.tsx src/components/agent-grid.tsx src/app/page.tsx
git commit -m "feat: add hero section with ASCII art and agent grid"
```

---

### Task 6: Build Home Page — Leaderboard

**Files:**
- Create: `src/components/leaderboard.tsx`
- Create: `src/components/search-input.tsx`
- Create: `src/components/leaderboard-tabs.tsx`
- Create: `src/app/api/skills/route.ts`

**Step 1: Create the skills API route**

In `src/app/api/skills/route.ts`, create GET handler:
- Query params: `sort` (all-time | trending | hot), `search` (string)
- `all-time`: `ORDER BY installCount DESC`
- `trending`: subquery counting InstallEvents in last 24h
- `hot`: computed score with decay formula
- Returns JSON array of skills with author info

**Step 2: Create search input component**

Create `src/components/search-input.tsx` (client component):
- Styled input with placeholder "Search skills..."
- Keyboard shortcut "/" to focus
- Debounced onChange updates URL search params

**Step 3: Create tab switcher component**

Create `src/components/leaderboard-tabs.tsx` (client component):
- Three tabs: "All Time (count)" | "Trending (24h)" | "Hot"
- Active tab highlighted
- Clicking updates URL search params

**Step 4: Create leaderboard table**

Create `src/components/leaderboard.tsx`:
- Server component that fetches skills from DB
- Table with columns: #, Skill, Installs
- Each row links to `/skills/[slug]`
- Install counts formatted with K suffix (e.g., 358.9K)
- Ranked numbering

**Step 5: Compose on home page**

In `src/app/page.tsx`, add search + tabs + leaderboard below hero.

**Step 6: Seed database with sample data**

Create `prisma/seed.ts` with 10-15 sample skills for visual testing.
Add seed script to `package.json`.
Run: `npx prisma db seed`

**Step 7: Verify visually**

Expected: Leaderboard with tabs, search, and sample data

**Step 8: Commit**
```bash
git add src/components/leaderboard.tsx src/components/search-input.tsx src/components/leaderboard-tabs.tsx src/app/api/skills/route.ts prisma/seed.ts
git commit -m "feat: add leaderboard with search, tabs, and API route"
```

---

### Task 7: Build Skill Detail Page

**Files:**
- Create: `src/app/skills/[slug]/page.tsx`
- Create: `src/components/copy-install-button.tsx`
- Create: `src/components/skill-stats.tsx`
- Create: `src/components/file-browser.tsx`
- Create: `src/app/api/installs/route.ts`

**Step 1: Create install tracking API route**

In `src/app/api/installs/route.ts`, create POST handler:
- Body: `{ skillSlug, source: "CLI" | "WEB_CLICK", userId? }`
- Creates InstallEvent record
- Increments Skill.installCount (or clickCount for WEB_CLICK)
- Returns 201

**Step 2: Create copy install button**

Create `src/components/copy-install-button.tsx` (client component):
- Displays install command: `npx @yourorg/skills-cli install <slug>`
- Click copies to clipboard
- POSTs to `/api/installs` with source WEB_CLICK
- Shows "Copied!" toast

**Step 3: Create skill stats component**

Create `src/components/skill-stats.tsx`:
- Shows install count, click count, version, created date
- Simple bar chart or sparkline of installs over time (optional, can use a lightweight chart lib or skip for MVP)

**Step 4: Create file browser component**

Create `src/components/file-browser.tsx`:
- For UPLOAD skills: tree view of SkillFiles with content preview
- For GIT_REPO skills: link to repo URL

**Step 5: Build the detail page**

In `src/app/skills/[slug]/page.tsx`:
- Fetch skill by slug with author, files
- Layout: skill name, author, version, tags, verified badge
- Copy install button
- README rendered as markdown (react-markdown + remark-gfm)
- Stats section
- File browser or repo link

**Step 6: Verify with a seeded skill**

Navigate to `/skills/<seeded-slug>`
Expected: Full detail page with README, install button, stats

**Step 7: Commit**
```bash
git add src/app/skills/ src/components/copy-install-button.tsx src/components/skill-stats.tsx src/components/file-browser.tsx src/app/api/installs/
git commit -m "feat: add skill detail page with install tracking"
```

---

### Task 8: Build Publish Page

**Files:**
- Create: `src/app/publish/page.tsx`
- Create: `src/components/publish-form.tsx`
- Create: `src/components/git-import-tab.tsx`
- Create: `src/components/upload-tab.tsx`
- Modify: `src/app/api/skills/route.ts` (add POST handler)

**Step 1: Add POST handler to skills API**

In `src/app/api/skills/route.ts`, add POST:
- Requires auth (check session)
- Accepts: name, description, readme, sourceType, repoUrl, category, tags, files
- Auto-generates slug from name using `slugify`
- Creates Skill record (and SkillFiles if upload)
- Creates AuditLog entry with action PUBLISH
- Returns 201 with skill data

**Step 2: Build git import tab**

Create `src/components/git-import-tab.tsx` (client component):
- Input for repo URL
- "Fetch" button that calls an API to extract repo metadata (name, description, README.md)
- Preview of fetched data before submit

**Step 3: Build upload tab**

Create `src/components/upload-tab.tsx` (client component):
- Inputs: name, description, category, tags
- File drop zone for skill files
- Textarea for README (markdown)
- Preview before submit

**Step 4: Build publish form shell**

Create `src/components/publish-form.tsx` (client component):
- Two tabs: "From Git Repo" | "Direct Upload"
- Renders GitImportTab or UploadTab based on active tab
- Submit handler POSTs to `/api/skills`
- Redirects to `/skills/[slug]` on success

**Step 5: Build publish page**

In `src/app/publish/page.tsx`:
- Protected page (redirect to sign-in if not authed)
- Renders PublishForm

**Step 6: Test the publish flow end-to-end**

Expected: Can publish a skill via upload, appears on leaderboard

**Step 7: Commit**
```bash
git add src/app/publish/ src/components/publish-form.tsx src/components/git-import-tab.tsx src/components/upload-tab.tsx
git commit -m "feat: add publish page with git import and direct upload"
```

---

### Task 9: Build Audits Page

**Files:**
- Create: `src/app/audits/page.tsx`
- Create: `src/components/audit-feed.tsx`
- Create: `src/app/api/audits/route.ts`

**Step 1: Create audits API route**

In `src/app/api/audits/route.ts`, GET handler:
- Returns paginated AuditLog entries with user and skill relations
- Filter params: action, userId, skillId, dateFrom, dateTo
- Admins see all; members see only their own
- Ordered by timestamp DESC

**Step 2: Build audit feed component**

Create `src/components/audit-feed.tsx`:
- Chronological feed of audit entries
- Each entry: timestamp, user name/avatar, action verb, skill name (linked)
- Action badges with colors (PUBLISH=green, UPDATE=blue, DELETE=red, VERIFY=yellow)
- Filter controls: action type dropdown, date range

**Step 3: Build audits page**

In `src/app/audits/page.tsx`:
- Server component, fetches initial audit data
- Renders filter controls + audit feed
- Pagination (load more button)

**Step 4: Verify with seeded audit data**

Add some AuditLog entries in seed script. Navigate to `/audits`.
Expected: Chronological feed with filters

**Step 5: Commit**
```bash
git add src/app/audits/ src/components/audit-feed.tsx src/app/api/audits/
git commit -m "feat: add audits page with filterable feed"
```

---

### Task 10: Build Dashboard Page

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/dashboard-skills.tsx`

**Step 1: Build dashboard skills list**

Create `src/components/dashboard-skills.tsx`:
- Table of user's published skills
- Columns: name, installs, clicks, status (verified badge), actions (edit, delete)
- Edit links to `/publish?edit=[slug]`
- Delete shows confirmation dialog, calls DELETE `/api/skills/[slug]`

**Step 2: Build dashboard page**

In `src/app/dashboard/page.tsx`:
- Protected page
- Shows user info (name, email, role)
- Summary stats: total skills published, total installs across all skills
- Skills list component

**Step 3: Add DELETE and PUT handlers**

Create `src/app/api/skills/[slug]/route.ts`:
- GET: returns skill detail
- PUT: updates skill (auth required, must be author or admin)
- DELETE: deletes skill (auth required, must be author or admin)
- Both create AuditLog entries

**Step 4: Verify**

Expected: Dashboard shows user's skills with edit/delete actions

**Step 5: Commit**
```bash
git add src/app/dashboard/ src/components/dashboard-skills.tsx src/app/api/skills/[slug]/
git commit -m "feat: add user dashboard with skill management"
```

---

### Task 11: Build Admin Panel

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin-skills.tsx`
- Create: `src/components/admin-users.tsx`
- Create: `src/app/api/admin/users/route.ts`

**Step 1: Create admin users API**

In `src/app/api/admin/users/route.ts`:
- GET: list all users with role info (admin only)
- PUT: update user role (admin only)

**Step 2: Build admin skills management**

Create `src/components/admin-skills.tsx`:
- Table of all skills
- Verify/unverify toggle button per skill
- Delete button
- Calls PUT `/api/skills/[slug]` to toggle verified

**Step 3: Build admin users management**

Create `src/components/admin-users.tsx`:
- Table of all users
- Role dropdown (MEMBER / ADMIN)
- Calls PUT `/api/admin/users` to change role

**Step 4: Build admin page**

In `src/app/admin/page.tsx`:
- Protected: redirect if not ADMIN role
- Two tabs: "Skills" | "Users"
- Renders AdminSkills or AdminUsers

**Step 5: Commit**
```bash
git add src/app/admin/ src/components/admin-skills.tsx src/components/admin-users.tsx src/app/api/admin/
git commit -m "feat: add admin panel for skill verification and user management"
```

---

### Task 12: Build Docs Page

**Files:**
- Create: `src/app/docs/page.tsx`
- Create: `docs/content/getting-started.md`
- Create: `docs/content/publishing.md`
- Create: `docs/content/cli.md`

**Step 1: Create documentation content**

Write markdown docs:
- `getting-started.md`: What is the skills directory, how to browse, how to install
- `publishing.md`: How to publish via git repo and direct upload
- `cli.md`: CLI tool usage, installation, commands

**Step 2: Build docs page**

In `src/app/docs/page.tsx`:
- Sidebar navigation listing doc pages
- Main content area rendering markdown
- Use react-markdown for rendering

**Step 3: Commit**
```bash
git add src/app/docs/ docs/content/
git commit -m "feat: add documentation pages"
```

---

### Task 13: Build CLI Tool

**Files:**
- Create: `cli/package.json`
- Create: `cli/src/index.ts`
- Create: `cli/src/commands/install.ts`
- Create: `cli/tsconfig.json`

**Step 1: Scaffold CLI package**

Create `cli/` directory with package.json:
```json
{
  "name": "@yourorg/skills-cli",
  "version": "1.0.0",
  "bin": { "skills": "./dist/index.js" },
  "scripts": { "build": "tsc" }
}
```

**Step 2: Build install command**

In `cli/src/commands/install.ts`:
- Takes skill slug as argument
- GET `/api/skills/[slug]` to fetch skill metadata and files
- Writes files to current directory
- POST `/api/installs` with source CLI
- Prints success message with install count

**Step 3: Build CLI entry point**

In `cli/src/index.ts`:
- Parse args: `skills install <slug>`
- Route to install command
- `--api-url` flag to set server URL (defaults to env var)
- `--api-key` flag for optional auth

**Step 4: Test CLI locally**

Run: `cd cli && npm run build && node dist/index.js install <seeded-slug>`
Expected: Skill files downloaded, install event recorded

**Step 5: Commit**
```bash
git add cli/
git commit -m "feat: add CLI tool for installing skills"
```

---

### Task 14: Polish & Final Integration

**Files:**
- Various components for polish
- Create: `src/middleware.ts` (auth protection)

**Step 1: Add auth middleware**

Create `src/middleware.ts`:
- Protect routes: `/publish`, `/dashboard`, `/admin`
- Redirect to `/auth/signin` if not authenticated

**Step 2: Add loading states**

Add skeleton loaders for:
- Leaderboard table
- Skill detail page
- Audit feed

Create `src/app/skills/[slug]/loading.tsx`, `src/app/loading.tsx`, `src/app/audits/loading.tsx`

**Step 3: Add error boundaries**

Create `src/app/error.tsx` and `src/app/not-found.tsx` with styled error pages.

**Step 4: Format install counts**

Utility function `formatCount(n)`: 1000 → "1.0K", 1000000 → "1.0M"
Create `src/lib/utils.ts`

**Step 5: Add keyboard shortcut "/" to focus search**

In search-input.tsx, add `useEffect` with keydown listener for "/".

**Step 6: Final visual polish pass**

- Ensure all spacing, typography, colors match skills.sh
- Test responsive layouts (mobile, tablet, desktop)
- Verify dark theme consistency

**Step 7: Commit**
```bash
git add .
git commit -m "feat: add auth middleware, loading states, error pages, and polish"
```
