# Operations Manual

Day-to-day operations, administration, monitoring, and troubleshooting for the Smart Skills Directory.

## Table of Contents

- [User Management](#user-management)
- [Skill Management](#skill-management)
- [Database Operations](#database-operations)
- [Monitoring and Logs](#monitoring-and-logs)
- [Backup and Recovery](#backup-and-recovery)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

---

## User Management

### Roles

| Role   | Permissions                                                  |
| ------ | ------------------------------------------------------------ |
| MEMBER | Browse skills, publish own skills, manage own dashboard      |
| ADMIN  | All MEMBER permissions + admin panel, verify skills, manage users |

### Creating Users

Users are created automatically on first sign-in via OIDC/SSO. In demo mode, any email can sign in and a MEMBER account is created.

### Promoting a user to Admin

**Via Admin Panel:**
1. Sign in as an existing admin
2. Navigate to `/admin`
3. Click the **Users** tab
4. Click **Make Admin** next to the target user

**Via API:**
```bash
curl -X PUT http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin-session-cookie>" \
  -d '{"userId": "<user-id>", "role": "ADMIN"}'
```

**Via Database (emergency):**
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'user@yourcompany.com';
```

### Listing Users

**Via Admin Panel:** Navigate to `/admin` > **Users** tab.

**Via Database:**
```sql
SELECT id, email, name, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC;
```

---

## Skill Management

### Skill Lifecycle

```
Author publishes  →  Skill created (unverified)
                  →  Admin verifies  →  Skill shows "verified" badge
                  →  Users install via CLI or web
                  →  Author updates version/readme
                  →  Author or admin deletes
```

### Verifying Skills

Verified skills display a badge on the leaderboard and detail pages.

**Via Admin Panel:**
1. Navigate to `/admin`
2. Click the **Skills** tab
3. Click **Verify** on unverified skills

### Viewing Skill Stats

Each skill tracks:
- **Install count** — CLI-based installs
- **Click count** — Web copy-button clicks
- **Created/updated timestamps**
- **Author information**

**Via skill detail page:** Visit `/skills/<slug>`

**Via Database:**
```sql
SELECT name, slug, "installCount", "clickCount", verified, "createdAt"
FROM "Skill"
ORDER BY "installCount" DESC;
```

### Removing a Skill

**Via Dashboard (owner):** Navigate to `/dashboard`, click **Delete** on the skill.

**Via Admin Panel:** Navigate to `/admin` > **Skills** tab.

**Via API:**
```bash
curl -X DELETE http://localhost:3000/api/skills/<slug> \
  -H "Cookie: <session-cookie>"
```

---

## Database Operations

### Connection

```bash
# Connect via psql
psql $DATABASE_URL

# Or explicitly
psql -h localhost -U your_user -d skills_directory
```

### Migration Management

```bash
# Check current migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy

# Create a new migration (development only)
npx prisma migrate dev --name describe_the_change
```

### Useful Queries

**Skill leaderboard:**
```sql
SELECT s.name, s.slug, s."installCount", s."clickCount", s.verified, u.name AS author
FROM "Skill" s
JOIN "User" u ON s."authorId" = u.id
ORDER BY s."installCount" DESC
LIMIT 20;
```

**Recent installs (last 24h):**
```sql
SELECT s.name, ie.source, ie.timestamp
FROM "InstallEvent" ie
JOIN "Skill" s ON ie."skillId" = s.id
WHERE ie.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY ie.timestamp DESC;
```

**Audit log (last 50 actions):**
```sql
SELECT al.action, s.name AS skill, u.name AS user, al.details, al.timestamp
FROM "AuditLog" al
JOIN "Skill" s ON al."skillId" = s.id
JOIN "User" u ON al."userId" = u.id
ORDER BY al.timestamp DESC
LIMIT 50;
```

**User activity summary:**
```sql
SELECT u.email, u.role,
       COUNT(DISTINCT s.id) AS skills_published,
       COUNT(DISTINCT ie.id) AS installs_triggered
FROM "User" u
LEFT JOIN "Skill" s ON s."authorId" = u.id
LEFT JOIN "InstallEvent" ie ON ie."userId" = u.id
GROUP BY u.id
ORDER BY skills_published DESC;
```

**Database size:**
```sql
SELECT pg_size_pretty(pg_database_size('skills_directory'));
```

**Table row counts:**
```sql
SELECT 'User' AS table_name, COUNT(*) FROM "User"
UNION ALL SELECT 'Skill', COUNT(*) FROM "Skill"
UNION ALL SELECT 'InstallEvent', COUNT(*) FROM "InstallEvent"
UNION ALL SELECT 'AuditLog', COUNT(*) FROM "AuditLog";
```

---

## Monitoring and Logs

### Application Logs

**Systemd:**
```bash
# Follow live logs
sudo journalctl -u skills-directory -f

# Last 100 lines
sudo journalctl -u skills-directory -n 100

# Logs since today
sudo journalctl -u skills-directory --since today
```

**Docker Compose:**
```bash
# Follow live logs
docker compose logs -f app

# Last 100 lines
docker compose logs --tail 100 app
```

### Key Metrics to Monitor

| Metric                    | How to check                                    | Alert threshold       |
| ------------------------- | ----------------------------------------------- | --------------------- |
| App responding            | `curl -f http://localhost:3000/`                 | Fails for > 30s       |
| API responding            | `curl -f http://localhost:3000/api/skills`       | Fails for > 30s       |
| Database connections      | `SELECT count(*) FROM pg_stat_activity;`         | > 80% of max          |
| Disk usage                | `df -h /var/lib/postgresql`                      | > 80%                 |
| Memory usage              | `free -m`                                        | > 90%                 |
| Error rate in logs        | Grep logs for `error` / `Error`                  | Sustained errors      |

### Simple Uptime Check Script

```bash
#!/bin/bash
# save as /opt/scripts/healthcheck.sh
ENDPOINT="http://localhost:3000/api/skills"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$ENDPOINT")
if [ "$RESPONSE" != "200" ]; then
  echo "[$(date)] Health check failed: HTTP $RESPONSE" >> /var/log/skills-healthcheck.log
  # Add alerting here (email, Slack webhook, PagerDuty, etc.)
fi
```

Add to crontab:
```cron
*/5 * * * * /opt/scripts/healthcheck.sh
```

---

## Backup and Recovery

### Automated Backups

```bash
#!/bin/bash
# save as /opt/scripts/backup-db.sh
BACKUP_DIR=/opt/backups/skills-directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Keep last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "[$(date)] Backup completed: backup_$TIMESTAMP.sql.gz"
```

Schedule daily at 2 AM:
```cron
0 2 * * * /opt/scripts/backup-db.sh >> /var/log/skills-backup.log 2>&1
```

### Manual Backup

```bash
# Full database backup
pg_dump skills_directory > backup.sql

# Compressed
pg_dump skills_directory | gzip > backup.sql.gz

# Specific tables only
pg_dump skills_directory -t '"Skill"' -t '"User"' > skills_users_backup.sql
```

### Restore from Backup

```bash
# Drop and recreate (destructive!)
dropdb skills_directory
createdb skills_directory

# Restore
gunzip -c backup.sql.gz | psql skills_directory

# Or from uncompressed
psql skills_directory < backup.sql
```

### Point-in-Time Recovery

For production, enable PostgreSQL WAL archiving for point-in-time recovery. Refer to the [PostgreSQL documentation](https://www.postgresql.org/docs/current/continuous-archiving.html).

---

## Common Tasks

### Re-seeding Demo Data

```bash
npm run seed
```

This is idempotent — it uses `upsert` so existing records are updated, not duplicated.

### Resetting the Database

```bash
# Drop all tables and re-migrate
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Create the database
# 3. Apply all migrations
# 4. Run the seed script
```

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update non-breaking changes
npm update

# Update a specific package
npm install next@latest

# Regenerate Prisma client after updates
npx prisma generate
```

### Adding a New Database Migration

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name describe_the_change

# 3. Test locally
npm run dev

# 4. Deploy to production
npx prisma migrate deploy
```

### Building the CLI

```bash
cd cli
npm install
npm run build
cd ..

# Test locally
node cli/dist/index.js install tdd-master
```

### Clearing Install Events (Analytics Reset)

```sql
-- Clear all install events
TRUNCATE "InstallEvent";

-- Reset install counts on skills
UPDATE "Skill" SET "installCount" = 0, "clickCount" = 0;
```

---

## Troubleshooting

### Application won't start

**Symptom:** `Error: Cannot find module`
```bash
# Rebuild dependencies and Prisma client
rm -rf node_modules .next
npm install
npx prisma generate
npm run build
```

**Symptom:** `PrismaClientInitializationError`
```bash
# Check database is reachable
psql $DATABASE_URL -c "SELECT 1;"

# Check migrations are applied
npx prisma migrate status
```

**Symptom:** `NEXTAUTH_SECRET` error
```bash
# Ensure the secret is set
echo $NEXTAUTH_SECRET

# Generate a new one if needed
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### Database connection issues

**Symptom:** `ECONNREFUSED` or `Connection refused`
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check the connection string
psql $DATABASE_URL -c "SELECT 1;"

# Restart PostgreSQL if needed
sudo systemctl restart postgresql
```

**Symptom:** `too many connections`
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'skills_directory';

-- Kill idle connections (use with caution)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'skills_directory'
  AND state = 'idle'
  AND pid <> pg_backend_pid();
```

### Auth / sign-in issues

**Symptom:** Redirect loop at sign-in
- Verify `NEXTAUTH_URL` matches the actual URL (including protocol)
- Check that `NEXTAUTH_SECRET` is set and consistent across restarts

**Symptom:** OIDC "invalid_client" error
- Verify `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET` are correct
- Check the redirect URI is registered: `https://your-domain/api/auth/callback/oidc`

**Symptom:** "CSRF token mismatch"
- Clear browser cookies for the domain
- Verify `NEXTAUTH_URL` matches the URL in the browser

### Build failures

**Symptom:** `Type error` during build
```bash
# Check TypeScript errors
npx tsc --noEmit

# Regenerate Prisma types
npx prisma generate
```

**Symptom:** Out of memory during build
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Performance issues

**Symptom:** Slow skill listing
```sql
-- Check if indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'Skill';

-- Add index on installCount if missing
CREATE INDEX IF NOT EXISTS "Skill_installCount_idx" ON "Skill" ("installCount" DESC);
```

**Symptom:** Large database size
```sql
-- Check table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Vacuum and analyze
VACUUM ANALYZE;
```

---

## Security

### Checklist

- [ ] `NEXTAUTH_SECRET` is a strong random value, not committed to version control
- [ ] `.env` file is in `.gitignore` and not tracked
- [ ] Database uses SSL in production (`?sslmode=require`)
- [ ] Demo credentials provider is disabled in production
- [ ] Admin accounts are limited to trusted users
- [ ] PostgreSQL user has minimal required permissions
- [ ] Application runs as a non-root user
- [ ] HTTPS is enforced via reverse proxy
- [ ] Rate limiting is configured at the reverse proxy level
- [ ] Database backups are encrypted and stored securely

### Minimal Database Permissions

```sql
-- Create a dedicated user for the app
CREATE USER skills_app WITH PASSWORD 'strong-password-here';
GRANT CONNECT ON DATABASE skills_directory TO skills_app;
GRANT USAGE ON SCHEMA public TO skills_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO skills_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO skills_app;

-- For migrations (use a separate user or run manually)
-- GRANT CREATE ON SCHEMA public TO skills_migrations;
```

### Rotating NEXTAUTH_SECRET

1. Generate a new secret: `openssl rand -base64 32`
2. Update the environment variable
3. Restart the application
4. All existing sessions will be invalidated — users must sign in again

### Audit Trail

All skill publish, update, delete, and verify actions are logged in the `AuditLog` table. View them at `/audits` or query directly:

```sql
SELECT al.action, s.name, u.email, al.details, al.timestamp
FROM "AuditLog" al
JOIN "Skill" s ON al."skillId" = s.id
JOIN "User" u ON al."userId" = u.id
ORDER BY al.timestamp DESC;
```
