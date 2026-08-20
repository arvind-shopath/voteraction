#!/bin/bash

# Build Script for CreatiAV Apps
echo "Starting App Build Process..."

# 1. Build Next.js
echo "Building Web Content..."
npm run build
npm run export # This generates the 'out' directory

# 2. Sync with Capacitor (Android)
echo "Syncing Android..."
npx cap sync android

# 3. Build Electron (Windows) - This will create a 'dist' folder
echo "Building Windows App (might take time)..."
npx electron-builder --windows --dir # --dir creates a folder, faster for testing

echo "Build complete! Artifacts are ready in 'out', 'android', and 'dist'."
