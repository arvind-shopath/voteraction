#!/bin/bash

# Quick Production Rebuild Script
# Optimized for minimal build time

echo "🚀 Starting optimized production build..."

# Step 1: Prepare
echo "📦 Generating Prisma client..."
npx prisma generate

# Step 2: Build with stability optimizations
echo "🔨 Building (Optimized for speed and memory)..."
# Using environment variable to skip lint and 2.5GB limit
NODE_OPTIONS='--max-old-space-size=2560' NEXT_DISABLE_ESLINT=1 npx next build

# Step 3: Restart PM2
echo "♻️  Restarting PM2..."
pm2 restart voteraction --update-env

echo "✅ Build complete! App restarted successfully."
