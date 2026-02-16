#!/bin/bash
set -e

DOCKER_USERNAME="arjunr2403"

echo "Using Docker Hub username: $DOCKER_USERNAME"

echo "Pulling images from Docker Hub..."
docker pull "$DOCKER_USERNAME/frontend:v1"
docker pull "$DOCKER_USERNAME/backend:v1"

echo "Running containers..."
# Stop existing containers if running
docker compose down || true

# Network creation if not exists
docker network create qt-blog_app-network || true

echo "Starting Backend on port 5001..."
docker run -d --rm --name deployed-backend \
  --network qt-blog_app-network \
  -p 5001:5000 \
  "$DOCKER_USERNAME/backend:v1"

echo "Starting Frontend on port 8081..."
docker run -d --rm --name deployed-frontend \
  --network qt-blog_app-network \
  -p 8081:80 \
  -e BACKEND_URL="http://deployed-backend:5000" \
  "$DOCKER_USERNAME/frontend:v1"

echo "Deployment complete!"
echo " - Frontend: http://localhost:8081"
echo " - Backend: http://localhost:5001"
