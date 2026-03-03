#!/bin/bash
set -e

echo "=== Resetting Database ==="
echo "This will destroy all data and re-seed from scratch."
echo ""

# Check if running via Docker Compose
if docker compose ps db --status running 2>/dev/null | grep -q "db"; then
  echo "Stopping app..."
  docker compose stop app

  echo "Dropping and recreating database..."
  docker compose exec db psql -U skills -c "DROP DATABASE IF EXISTS skills_directory;"
  docker compose exec db psql -U skills -c "CREATE DATABASE skills_directory;"

  echo "Starting app (will auto-run migrations and seed)..."
  docker compose up -d app

  echo ""
  echo "Database reset complete. Waiting for app to start..."
  sleep 5
  echo "App should be ready at http://localhost:3000"
else
  echo "Docker Compose is not running. Starting fresh..."
  docker compose down -v
  docker compose up --build -d
  echo ""
  echo "Full reset complete. App starting at http://localhost:3000"
fi
