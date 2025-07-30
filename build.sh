#!/bin/bash

# Railway build script for Afelu Guardian
set -e

echo "🚀 Starting Afelu Guardian build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Prisma is available
echo "🔍 Checking Prisma installation..."
if ! command -v npx prisma &> /dev/null; then
    echo "❌ Prisma CLI not found, installing..."
    npm install prisma @prisma/client
fi

# Generate Prisma client
echo "⚙️  Generating Prisma client..."
npx prisma generate

# Verify Prisma client was generated
if [ -d "node_modules/.prisma/client" ]; then
    echo "✅ Prisma client generated successfully!"
else
    echo "❌ Prisma client generation failed!"
    exit 1
fi

echo "🎉 Build completed successfully!"
