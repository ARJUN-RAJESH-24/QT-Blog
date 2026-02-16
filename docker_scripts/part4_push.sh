#!/bin/bash
set -e

# Ask for Docker Hub username
read -p "Enter your Docker Hub username: " DOCKER_USERNAME

if [ -z "$DOCKER_USERNAME" ]; then
    echo "Username cannot be empty."
    exit 1
fi

echo "Logging in to Docker Hub..."
docker login -u "$DOCKER_USERNAME"

echo "Building images..."
docker compose build

echo "Tagging images..."
docker tag qt-blog-frontend:latest "$DOCKER_USERNAME/frontend:v1"
docker tag qt-blog-backend:latest "$DOCKER_USERNAME/backend:v1"

echo "Pushing images to Docker Hub..."
docker push "$DOCKER_USERNAME/frontend:v1"
docker push "$DOCKER_USERNAME/backend:v1"

echo "Successfully pushed images:"
echo " - $DOCKER_USERNAME/frontend:v1"
echo " - $DOCKER_USERNAME/backend:v1"
