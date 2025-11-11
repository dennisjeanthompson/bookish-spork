#!/bin/bash

# Render Deployment Script
# This script helps prepare and validate your app for Render deployment

set -e

echo "🚀 Preparing for Render deployment..."
echo ""

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found!"
    exit 1
fi

echo "✅ render.yaml found"

# Check if package.json has required scripts
if ! grep -q "\"build\"" package.json; then
    echo "❌ Build script not found in package.json"
    exit 1
fi

if ! grep -q "\"start\"" package.json; then
    echo "❌ Start script not found in package.json"
    exit 1
fi

echo "✅ Build and start scripts found"

# Test build locally
echo ""
echo "📦 Testing build locally..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Check if dist directory was created
if [ ! -d "dist" ]; then
    echo "❌ dist directory not created"
    exit 1
fi

echo "✅ dist directory created"

# Generate a session secret if not exists
if [ ! -f ".env.production" ]; then
    echo ""
    echo "🔐 Generating session secret..."
    SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    echo "SESSION_SECRET=$SESSION_SECRET" > .env.production
    echo "✅ Session secret generated in .env.production"
    echo ""
    echo "⚠️  IMPORTANT: Add this secret to Render environment variables:"
    echo "SESSION_SECRET=$SESSION_SECRET"
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "📋 Next steps:"
echo "1. Commit your changes:"
echo "   git add ."
echo "   git commit -m 'Prepare for Render deployment'"
echo "   git push origin main"
echo ""
echo "2. Go to https://dashboard.render.com"
echo "3. Click 'New +' → 'Blueprint'"
echo "4. Connect your GitHub repository"
echo "5. Click 'Apply' to deploy"
echo ""
echo "6. Add environment variable in Render dashboard:"
echo "   SESSION_SECRET=<copy from .env.production>"
echo ""
echo "🎉 Your app will be live in 5-10 minutes!"
