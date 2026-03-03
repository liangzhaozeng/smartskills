#!/bin/bash
set -e

echo "=== Smart Skills Directory — Local Setup ==="
echo ""

# Check Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is not installed."
  echo "Install Docker Desktop from https://www.docker.com/products/docker-desktop"
  exit 1
fi

# Check Docker Compose is available
if ! docker compose version &> /dev/null; then
  echo "Error: Docker Compose is not available."
  echo "Make sure Docker Desktop is running (includes Compose V2)."
  exit 1
fi

# Copy .env.example if .env doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "Done. Edit .env if you need custom values."
  echo ""
fi

echo "Starting PostgreSQL, Redis, and the app..."
echo "This may take a few minutes on first run (building the image)."
echo ""
echo "  App:        http://localhost:3000"
echo "  PostgreSQL: localhost:5432 (user: skills / pass: skills_local)"
echo "  Redis:      localhost:6379"
echo ""
echo "Demo credentials:"
echo "  Admin:  admin@example.com  / password"
echo "  Member: member@example.com / password"
echo ""

docker compose up --build "$@"
