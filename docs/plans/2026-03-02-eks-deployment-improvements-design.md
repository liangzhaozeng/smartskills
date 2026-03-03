# EKS Deployment Improvements — Design Document

**Date:** 2026-03-02
**Status:** Approved

## Overview

Functional improvements to make the Smart Skills Directory production-ready for deployment on AWS EKS (Elastic Kubernetes Service). Covers code changes, Dockerfile, Kubernetes manifests, and AWS service integration.

## AWS Architecture

```
┌──────────────────────────────────────────────────────┐
│                      AWS VPC                         │
│                                                      │
│  ┌──────────────┐     ┌───────────────────────────┐  │
│  │    ALB        │────▶│        EKS Cluster        │  │
│  │ (Ingress)     │     │                           │  │
│  │ HTTPS/ACM     │     │  ┌─────┐ ┌─────┐ ┌─────┐ │  │
│  └──────────────┘     │  │Pod 1│ │Pod 2│ │Pod 3│ │  │
│                       │  └──┬──┘ └──┬──┘ └──┬──┘ │  │
│                       │     │       │       │     │  │
│                       └─────┼───────┼───────┼─────┘  │
│                             │       │       │        │
│                    ┌────────┴───────┴───────┴──┐     │
│                    │                           │     │
│              ┌─────┴─────┐           ┌─────────┴──┐  │
│              │ RDS        │           │ ElastiCache │  │
│              │ PostgreSQL │           │ Redis       │  │
│              └───────────┘           └────────────┘  │
│                                                      │
│  ┌───────────┐                                       │
│  │   ECR     │  Container registry                   │
│  └───────────┘                                       │
└──────────────────────────────────────────────────────┘
```

## Changes

### 1. Health Check Endpoint (`/api/health`)

New API route for Kubernetes liveness/readiness probes.

- Checks database connectivity via `SELECT 1`
- Returns pod name and uptime for debugging
- Returns `200 { status: "healthy" }` or `503 { status: "unhealthy" }`
- No auth required

### 2. Redis Rate Limiting

Replace in-memory `Map` with Redis-backed rate limiter.

- Uses `ioredis` client
- Atomic `INCR` + `EXPIRE` for distributed counting
- Graceful fallback: if Redis is unavailable, allow the request (fail-open)
- Shared `src/lib/redis.ts` client singleton
- Env var: `REDIS_URL`

### 3. Connection Pooling

Configure Prisma PrismaPg adapter with explicit pool settings.

- `max: 10` per pod (50 total for 5 pods, within RDS default of 100)
- `idleTimeoutMillis: 30000`
- `connectionTimeoutMillis: 5000`

### 4. Next.js Standalone Output

- Set `output: "standalone"` in `next.config.ts`
- Update build script: `"build": "prisma generate && next build"`
- Produces minimal `server.js` (~100MB vs ~1GB)

### 5. Production Dockerfile

Multi-stage build:
1. `deps` — install production dependencies
2. `builder` — install all deps, generate Prisma, build Next.js
3. `runner` — copy standalone output, run as non-root user

### 6. Kubernetes Manifests (`k8s/`)

| File | Purpose |
|------|---------|
| `namespace.yaml` | `skills-directory` namespace |
| `configmap.yaml` | Non-sensitive env vars |
| `secret.yaml` | Template for sensitive values |
| `deployment.yaml` | 3 replicas, rolling update, probes, resources |
| `service.yaml` | ClusterIP on port 3000 |
| `ingress.yaml` | ALB Ingress with HTTPS/ACM |
| `hpa.yaml` | Autoscale 3-10 pods at 70% CPU |

### 7. ECR Push Script

Shell script to build, tag, and push Docker image to ECR.

### 8. Updated Deployment Docs

Add AWS EKS deployment section to `docs/DEPLOYMENT.md`.

## Files to Create/Modify

**Create:**
- `src/app/api/health/route.ts`
- `src/lib/redis.ts`
- `k8s/namespace.yaml`
- `k8s/configmap.yaml`
- `k8s/secret.yaml`
- `k8s/deployment.yaml`
- `k8s/service.yaml`
- `k8s/ingress.yaml`
- `k8s/hpa.yaml`
- `Dockerfile`
- `scripts/ecr-push.sh`

**Modify:**
- `src/lib/rate-limit.ts` — Redis-backed
- `src/lib/prisma.ts` — connection pool config
- `next.config.ts` — standalone output
- `package.json` — build script
- `.env.example` — new env vars
- `docs/DEPLOYMENT.md` — EKS section
- `.dockerignore` — for efficient builds
