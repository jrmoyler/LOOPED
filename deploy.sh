#!/bin/bash
# LOOPED Deploy Script
# Run from repo root: bash deploy.sh

set -e

echo "🎮 LOOPED Deploy"
echo "================"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Push schema
echo "🗄️  Pushing DB schema..."
npx prisma db push

# Seed database
echo "🌱 Seeding database..."
npx tsx prisma/seed.ts

# Build
echo "🏗️  Building..."
npm run build

echo ""
echo "✅ Build successful!"
echo ""
echo "To deploy to Vercel:"
echo "  vercel --prod"
echo ""
echo "Or connect your GitHub repo at https://vercel.com/new"
echo "Required env vars:"
echo "  DATABASE_URL  — e.g. file:./prod.db (or Turso/Postgres for prod)"
echo "  ADMIN_TOKEN   — any secret string"
