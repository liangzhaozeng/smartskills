import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const skillsData = [
  {
    name: "TDD Master",
    slug: "tdd-master",
    description: "Test-driven development workflow for any language",
    installCount: 358900,
    category: "workflow",
    tags: ["testing", "tdd", "quality"],
  },
  {
    name: "Git Wizard",
    slug: "git-wizard",
    description: "Advanced git operations and conflict resolution",
    installCount: 245300,
    category: "tools",
    tags: ["git", "vcs", "workflow"],
  },
  {
    name: "API Builder",
    slug: "api-builder",
    description: "REST and GraphQL API scaffolding with best practices",
    installCount: 198700,
    category: "backend",
    tags: ["api", "rest", "graphql"],
  },
  {
    name: "Debug Pro",
    slug: "debug-pro",
    description: "Systematic debugging methodology for complex issues",
    installCount: 176400,
    category: "workflow",
    tags: ["debugging", "troubleshooting"],
  },
  {
    name: "React Patterns",
    slug: "react-patterns",
    description: "Modern React component patterns and best practices",
    installCount: 152100,
    category: "frontend",
    tags: ["react", "patterns", "components"],
  },
  {
    name: "SQL Optimizer",
    slug: "sql-optimizer",
    description: "Database query optimization and schema design",
    installCount: 134800,
    category: "database",
    tags: ["sql", "performance", "database"],
  },
  {
    name: "Docker Compose",
    slug: "docker-compose",
    description: "Container orchestration and service configuration",
    installCount: 121500,
    category: "devops",
    tags: ["docker", "containers", "devops"],
  },
  {
    name: "Code Reviewer",
    slug: "code-reviewer",
    description: "Automated code review with quality checks and suggestions",
    installCount: 98200,
    category: "workflow",
    tags: ["review", "quality", "collaboration"],
  },
  {
    name: "Auth Patterns",
    slug: "auth-patterns",
    description: "Authentication and authorization implementation patterns",
    installCount: 87600,
    category: "security",
    tags: ["auth", "security", "jwt", "oauth"],
  },
  {
    name: "Markdown Docs",
    slug: "markdown-docs",
    description: "Documentation generation and formatting tools",
    installCount: 76300,
    category: "docs",
    tags: ["markdown", "documentation", "writing"],
  },
  {
    name: "TypeScript Strict",
    slug: "typescript-strict",
    description: "Strict TypeScript configuration and type-safe patterns",
    installCount: 65400,
    category: "tools",
    tags: ["typescript", "types", "strict"],
  },
  {
    name: "CI/CD Pipeline",
    slug: "cicd-pipeline",
    description: "Continuous integration and deployment workflows",
    installCount: 54200,
    category: "devops",
    tags: ["ci", "cd", "automation", "pipeline"],
  },
];

async function main() {
  // Create seed users
  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: {
      email: "member@example.com",
      name: "Member User",
      role: "MEMBER",
    },
  });

  // Create skills
  for (const data of skillsData) {
    await prisma.skill.upsert({
      where: { slug: data.slug },
      update: { installCount: data.installCount },
      create: {
        ...data,
        sourceType: "GIT_REPO",
        repoUrl: `https://github.com/yourorg/${data.slug}`,
        readme: `# ${data.name}\n\n${data.description}\n\n## Installation\n\n\`\`\`bash\nnpx @yourorg/skills-cli install ${data.slug}\n\`\`\`\n\n## Usage\n\nThis skill provides automated workflows for ${data.tags.join(", ")}.\n`,
        authorId: user.id,
        verified: data.installCount > 100000,
      },
    });
  }

  // Create some audit logs
  const skills = await prisma.skill.findMany({ take: 5 });
  for (const skill of skills) {
    await prisma.auditLog.create({
      data: {
        skillId: skill.id,
        userId: user.id,
        action: "PUBLISH",
        details: { version: "1.0.0" },
      },
    });
  }

  console.log(`Seeded ${skillsData.length} skills and ${skills.length} audit logs`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
