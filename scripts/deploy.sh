#!/usr/bin/env bash
set -e

echo "=========================================="
echo "🚀 Running Frontend Deployment (rags-development)..."
echo "=========================================="

echo "🔨 Building and starting frontend container..."
docker compose up -d --build

echo ""
echo "=========================================="
echo "✅ Frontend deployment completed successfully!"
echo "=========================================="
