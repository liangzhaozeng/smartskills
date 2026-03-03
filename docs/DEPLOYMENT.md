# Deployment Guide

This guide covers deploying the Smart Skills Directory to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Option 1: Docker Compose (Recommended)](#option-1-docker-compose-recommended)
- [Option 2: Manual Deployment](#option-2-manual-deployment)
- [Option 3: Vercel](#option-3-vercel)
- [Option 4: AWS EKS](#option-4-aws-eks)
- [Database Setup](#database-setup)
- [OIDC / SSO Configuration](#oidc--sso-configuration)
- [Reverse Proxy](#reverse-proxy)
- [SSL / TLS](#ssl--tls)
- [Health Checks](#health-checks)

---

## Prerequisites

| Requirement    | Minimum Version |
| -------------- | --------------- |
| Node.js        | 20.x            |
| PostgreSQL     | 14.x            |
| npm            | 10.x            |
| Docker (optional) | 24.x         |

## Environment Variables

All configuration is via environment variables. Copy `.env.example` and fill in production values:

```env
# Database — use a connection string with SSL in production
DATABASE_URL="postgresql://user:password@db-host:5432/skills_directory?sslmode=require"

# NextAuth — MUST match your public URL
NEXTAUTH_URL=https://skills.yourcompany.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# OIDC Provider (required for production SSO)
OIDC_ISSUER=https://login.yourcompany.com
OIDC_CLIENT_ID=skills-directory
OIDC_CLIENT_SECRET=<your-oidc-client-secret>
```

### Variable Reference

| Variable            | Required | Description                                              |
| ------------------- | -------- | -------------------------------------------------------- |
| `DATABASE_URL`      | Yes      | PostgreSQL connection string                             |
| `NEXTAUTH_URL`      | Yes      | Public base URL of the application                       |
| `NEXTAUTH_SECRET`   | Yes      | Random secret for JWT signing (min 32 chars)             |
| `OIDC_ISSUER`       | No       | OIDC provider issuer URL (enables SSO)                   |
| `OIDC_CLIENT_ID`    | No       | OIDC client ID (required if OIDC_ISSUER is set)          |
| `OIDC_CLIENT_SECRET`| No       | OIDC client secret (required if OIDC_ISSUER is set)      |
| `PORT`              | No       | Server port (default: 3000)                              |
| `NODE_ENV`          | No       | Set to `production` for production builds                |

---

## Option 1: Docker Compose (Recommended)

### Dockerfile

Create `Dockerfile` in the project root:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Build
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/src/generated ./src/generated
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: skills_directory
      POSTGRES_USER: skills
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U skills -d skills_directory"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "postgresql://skills:${POSTGRES_PASSWORD:-changeme}@db:5432/skills_directory"
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      OIDC_ISSUER: ${OIDC_ISSUER:-}
      OIDC_CLIENT_ID: ${OIDC_CLIENT_ID:-}
      OIDC_CLIENT_SECRET: ${OIDC_CLIENT_SECRET:-}

volumes:
  pgdata:
```

### Deploy with Docker Compose

```bash
# Set secrets
export POSTGRES_PASSWORD=$(openssl rand -base64 16)
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
export NEXTAUTH_URL=https://skills.yourcompany.com

# Build and start
docker compose up -d --build

# Run migrations
docker compose exec app npx prisma migrate deploy

# Seed initial data (optional)
docker compose exec app npx tsx prisma/seed.ts

# View logs
docker compose logs -f app
```

---

## Option 2: Manual Deployment

### 1. Provision the server

- Ubuntu 22.04+ or similar Linux
- At least 1 GB RAM, 1 vCPU
- PostgreSQL 14+ (local or managed, e.g. AWS RDS, Supabase)

### 2. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Clone and build

```bash
git clone <your-repo-url> /opt/skills-directory
cd /opt/skills-directory
npm ci
npx prisma generate
npm run build
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env with production values
nano .env
```

### 5. Run database migrations

```bash
npx prisma migrate deploy
```

### 6. Set up as a systemd service

Create `/etc/systemd/system/skills-directory.service`:

```ini
[Unit]
Description=Smart Skills Directory
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/skills-directory
EnvironmentFile=/opt/skills-directory/.env
ExecStart=/usr/bin/node /opt/skills-directory/.next/standalone/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable skills-directory
sudo systemctl start skills-directory
```

### 7. Verify

```bash
curl http://localhost:3000
sudo systemctl status skills-directory
```

---

## Option 3: Vercel

### 1. Add Next.js standalone output

Add to `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: "standalone",
};
```

### 2. Set up Vercel project

```bash
npx vercel
```

### 3. Configure environment variables

In the Vercel dashboard, add all variables from the [Variable Reference](#variable-reference) above.

### 4. Connect a managed PostgreSQL

Use Vercel Postgres, Supabase, Neon, or any PostgreSQL provider. Set the `DATABASE_URL` in Vercel environment variables.

### 5. Deploy

```bash
npx vercel --prod
```

Vercel will automatically run `prisma generate` during build if you add it to the build command:

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

---

## Option 4: AWS EKS

### Prerequisites

- AWS CLI configured with appropriate permissions
- `kubectl` configured for your EKS cluster
- AWS Load Balancer Controller installed in the cluster
- Amazon RDS PostgreSQL instance
- Amazon ElastiCache Redis instance (optional but recommended)
- Amazon ECR repository

### 1. Push image to ECR

```bash
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=ap-southeast-1
./scripts/ecr-push.sh
```

### 2. Configure secrets

```bash
kubectl create namespace skills-directory

kubectl create secret generic skills-directory-secrets \
  --namespace=skills-directory \
  --from-literal=DATABASE_URL="postgresql://user:pass@your-rds-host:5432/skills_directory?sslmode=require" \
  --from-literal=NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=REDIS_URL="redis://your-elasticache-host:6379" \
  --from-literal=OIDC_ISSUER="" \
  --from-literal=OIDC_CLIENT_ID="" \
  --from-literal=OIDC_CLIENT_SECRET=""
```

### 3. Update manifests

Edit `k8s/deployment.yaml`:
- Replace `ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/skills-directory:latest` with your ECR URI

Edit `k8s/configmap.yaml`:
- Set `NEXTAUTH_URL` to your domain

Edit `k8s/ingress.yaml`:
- Replace the ACM certificate ARN
- Replace `skills.yourcompany.com` with your domain

### 4. Apply manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

### 5. Run database migrations

```bash
kubectl run migrate --rm -it --restart=Never \
  --namespace=skills-directory \
  --image=YOUR_ECR_URI:latest \
  --env="DATABASE_URL=YOUR_RDS_URL" \
  -- npx prisma migrate deploy
```

### 6. Verify

```bash
kubectl get pods -n skills-directory
kubectl get ingress -n skills-directory
kubectl logs -n skills-directory -l app.kubernetes.io/name=skills-directory --tail=50
```

### Architecture

```
Internet → ALB (HTTPS/ACM) → EKS Pods (3-10, HPA)
                                  ├── RDS PostgreSQL
                                  └── ElastiCache Redis
```

| Resource | Purpose |
|----------|---------|
| EKS Pods | Next.js app (3 min, 10 max via HPA) |
| RDS PostgreSQL | Database with connection pooling (10/pod) |
| ElastiCache Redis | Distributed rate limiting |
| ALB | HTTPS termination, health checks |
| ECR | Container image registry |
| ACM | SSL certificate |

### Updating

```bash
# Build and push new image
IMAGE_TAG=v1.1.0 ./scripts/ecr-push.sh

# Update deployment
kubectl set image deployment/skills-directory \
  app=YOUR_ECR_URI:v1.1.0 \
  --namespace=skills-directory

# Watch rollout
kubectl rollout status deployment/skills-directory -n skills-directory
```

---

## Database Setup

### Create the database

```bash
createdb skills_directory
```

### Run migrations

```bash
# Apply all pending migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

### Seed data (optional)

```bash
npm run seed
```

This creates:
- Admin user (`admin@example.com`)
- Member user (`member@example.com`)
- 12 sample skills with install counts
- 5 audit log entries

### Backups

```bash
# Full backup
pg_dump skills_directory > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql skills_directory < backup_20260302_120000.sql
```

---

## OIDC / SSO Configuration

The app supports any OpenID Connect provider (Okta, Auth0, Azure AD, Keycloak, etc.).

### 1. Register the application with your provider

- **Redirect URI:** `https://skills.yourcompany.com/api/auth/callback/oidc`
- **Scopes:** `openid email profile`
- **Grant type:** Authorization Code

### 2. Set environment variables

```env
OIDC_ISSUER=https://login.yourcompany.com
OIDC_CLIENT_ID=skills-directory-client
OIDC_CLIENT_SECRET=your-secret-here
```

### 3. Verify

The sign-in page will show an **SSO** button alongside the demo credentials login.

### Disabling demo login

To disable the credentials provider in production, remove or guard the `CredentialsProvider` block in `src/lib/auth.ts`:

```typescript
// Only include credentials provider in development
...(process.env.NODE_ENV === "development"
  ? [CredentialsProvider({ /* ... */ })]
  : []),
```

---

## Reverse Proxy

### Nginx

```nginx
server {
    listen 80;
    server_name skills.yourcompany.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name skills.yourcompany.com;

    ssl_certificate     /etc/ssl/certs/skills.crt;
    ssl_certificate_key /etc/ssl/private/skills.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## SSL / TLS

### Let's Encrypt (certbot)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d skills.yourcompany.com
```

Certbot auto-renews via systemd timer.

---

## Health Checks

The application provides a dedicated health check endpoint at `/api/health`:

```bash
curl -s http://localhost:3000/api/health | jq
```

Response (healthy):
```json
{
  "status": "healthy",
  "checks": { "database": "healthy", "redis": "healthy" },
  "uptime": 3600,
  "pod": "skills-directory-abc123",
  "node": "ip-10-0-1-50"
}
```

Response (unhealthy — returns HTTP 503):
```json
{
  "status": "unhealthy",
  "checks": { "database": "unhealthy", "redis": "healthy" }
}
```

### Kubernetes probes

Already configured in `k8s/deployment.yaml`:
- **Startup probe:** every 5s, 12 attempts (60s total startup window)
- **Readiness probe:** every 10s (removes pod from service on failure)
- **Liveness probe:** every 30s (restarts pod on failure)

### Docker health check

Built into the Dockerfile:
```
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health
```

---

## Checklist

Before going live, verify:

- [ ] `NEXTAUTH_SECRET` is a strong random value (not the default)
- [ ] `NEXTAUTH_URL` matches your public URL exactly
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`) for remote databases
- [ ] OIDC provider is configured and tested
- [ ] Demo credentials provider is disabled (or guarded for dev only)
- [ ] Database migrations are applied (`npx prisma migrate deploy`)
- [ ] Reverse proxy is configured with HTTPS
- [ ] Backups are scheduled for the PostgreSQL database
- [ ] Firewall rules allow only port 443 (and 80 for redirect)
- [ ] Application logs are being collected
