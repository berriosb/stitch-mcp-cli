#!/bin/bash
set -e

echo "[B] Building stitch-mcp-cli..."

# Build
npm run build

# Run tests
npm test

# Version bump
VERSION=$(node -p "require('./package.json').version")
echo "Current version: $VERSION"

# Ask for new version
read -p "Enter new version (or press Enter to keep $VERSION): " NEW_VERSION
NEW_VERSION=${NEW_VERSION:-$VERSION}

# Update version in package.json
npm version $NEW_VERSION --no-git-tag-version

# Commit changes
git add package.json pnpm-lock.yaml package-lock.json
git commit -m "chore: bump version to $NEW_VERSION"

# Create git tag
git tag -a "v$NEW_VERSION" -m "Release $NEW_VERSION"

echo "OK Version bumped to $NEW_VERSION"
echo "[i] Next steps:"
echo "   1. Push: git push && git push --tags"
echo "   2. Publish: npm publish --access public"
echo "   3. Create GitHub release with the tag"
