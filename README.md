# Smart Skills Directory

An internal platform for discovering, publishing, and installing reusable AI agent skills across your organization. Track installs, browse the leaderboard, and share skills with your team.

```
███████╗███╗   ███╗ █████╗ ██████╗ ████████╗    ███████╗██╗  ██╗██╗██╗     ██╗     ███████╗
██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝    ██╔════╝██║ ██╔╝██║██║     ██║     ██╔════╝
███████╗██╔████╔██║███████║██████╔╝   ██║       ███████╗█████╔╝ ██║██║     ██║     ███████╗
╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║       ╚════██║██╔═██╗ ██║██║     ██║     ╚════██║
███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║       ███████║██║  ██╗██║███████╗███████╗███████║
╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝       ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝
```

## Tech Stack

| Layer       | Technology                                    |
| ----------- | --------------------------------------------- |
| Framework   | Next.js 16 (App Router) + TypeScript          |
| Styling     | Tailwind CSS v4, dark theme, Fira Mono font   |
| Database    | PostgreSQL 14+ with Prisma v7 ORM             |
| Auth        | NextAuth.js v4 (JWT sessions, OIDC/Credentials) |
| CLI         | Node.js standalone CLI (`@yourorg/skills-cli`) |

## Features

- **Leaderboard** — Browse skills ranked by All Time, Trending (24h), or Hot (HN-style decay)
- **Search** — Full-text search with keyboard shortcut (`/`)
- **Skill Detail** — README rendering, install stats, file browser, one-click copy
- **Publish** — Register skills via Git repo URL or direct upload
- **Install Tracking** — CLI installs and web clicks are tracked separately
- **Audit Log** — Full history of publish, update, delete, and verify actions
- **Dashboard** — Authors manage their own published skills
- **Admin Panel** — Admins verify skills and manage user roles
- **Documentation** — Built-in docs with sidebar navigation
- **Agent Support** — Compatible with Claude Code, Cursor, Copilot, Windsurf, Cline, Aider, and more

## Quick Start

### Option A: Docker (Recommended)

Only requires [Docker Desktop](https://www.docker.com/products/docker-desktop).

```bash
git clone <your-repo-url> skills-directory
cd skills-directory
./scripts/setup-dev.sh
```

This starts PostgreSQL, Redis, and the app with hot reload. Migrations run automatically and demo data is seeded on first boot.

Visit [http://localhost:3000](http://localhost:3000). Click **Sign In** and select a demo user.

```bash
# Other useful commands
docker compose down          # Stop everything
docker compose up -d         # Start in background
./scripts/reset-db.sh        # Reset database to fresh seed data
docker compose logs -f app   # Tail app logs
```

### Option B: Manual Setup

Prerequisites: Node.js 20+, PostgreSQL 14+

```bash
git clone <your-repo-url> skills-directory
cd skills-directory
npm install

cp .env.example .env
# Edit .env — set DATABASE_URL to your PostgreSQL connection string
# Generate a secret: openssl rand -base64 32

createdb skills_directory
npx prisma migrate deploy
npx prisma generate
npm run seed
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). Click **Sign In** and select a demo user.

## Demo Users

| User         | Email                | Role   | Access                          |
| ------------ | -------------------- | ------ | ------------------------------- |
| Admin User   | admin@example.com    | ADMIN  | Full access + admin panel       |
| Member User  | member@example.com   | MEMBER | Dashboard, publish, browse      |

## Project Structure

```
├── cli/                    # Standalone CLI tool
│   └── src/commands/       # CLI commands (install)
├── docs/
│   ├── content/            # Markdown docs (getting-started, publishing, cli)
│   └── plans/              # Design & implementation plans
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Seed script
│   └── migrations/         # SQL migrations
├── src/
│   ├── app/                # Next.js App Router pages & API routes
│   │   ├── api/            # REST API (skills, audits, installs, admin)
│   │   ├── admin/          # Admin panel
│   │   ├── audits/         # Audit log viewer
│   │   ├── auth/signin/    # Custom sign-in page
│   │   ├── dashboard/      # Author dashboard
│   │   ├── docs/           # Documentation viewer
│   │   ├── publish/        # Skill publishing form
│   │   └── skills/[slug]/  # Skill detail pages
│   ├── components/         # React components
│   ├── lib/                # Auth config, Prisma client, utilities
│   ├── middleware.ts        # Route protection
│   └── types/              # TypeScript declarations
├── .env.example            # Environment template
├── prisma.config.ts        # Prisma v7 configuration
└── package.json
```

## API Endpoints

| Method | Endpoint              | Auth     | Description                    |
| ------ | --------------------- | -------- | ------------------------------ |
| GET    | `/api/skills`         | Public   | List/search skills (sort, q)   |
| POST   | `/api/skills`         | Required | Publish a new skill            |
| GET    | `/api/skills/[slug]`  | Public   | Get skill detail               |
| PUT    | `/api/skills/[slug]`  | Owner    | Update a skill                 |
| DELETE | `/api/skills/[slug]`  | Owner    | Delete a skill                 |
| POST   | `/api/installs`       | Public   | Record install/click event     |
| GET    | `/api/audits`         | Public   | List audit logs (paginated)    |
| GET    | `/api/admin/users`    | Admin    | List all users                 |
| PUT    | `/api/admin/users`    | Admin    | Update user role               |

## CLI Tool

```bash
# Build the CLI
cd cli && npm install && npm run build && cd ..

# Install a skill
node cli/dist/index.js install <skill-slug>

# Or link globally
cd cli && npm link && cd ..
skills install tdd-master
```

## SSO / OIDC Configuration

For production, configure an OIDC provider in `.env`:

```env
OIDC_ISSUER=https://your-identity-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
```

The credentials-based demo login remains available alongside OIDC when configured.

## Further Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) — Production deployment instructions
- [Operations Manual](docs/OPERATIONS.md) — Day-to-day operations and troubleshooting
- [Design Document](docs/plans/2026-02-28-internal-skills-directory-design.md) — Architecture decisions
- [Implementation Plan](docs/plans/2026-02-28-internal-skills-directory-plan.md) — Build plan

## License

Internal use only. Not for public distribution.
