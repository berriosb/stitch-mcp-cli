# GitHub CI/CD Skill

Configure and validate GitHub Actions CI/CD workflows for Node.js projects before pushing to GitHub.

## Purpose

Avoid common CI/CD failures by:
1. Using correct workflow syntax
2. Running pre-flight checks locally
3. Properly configuring secrets

## Quick Start

### 1. Create Workflows

Use the provided templates in `.github/workflows/`:

**ci.yml** - For continuous integration:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test on Node ${{ matrix.node-version }}
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [20, 22]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm run typecheck

      - name: Run tests
        run: pnpm exec vitest --run

      - name: Build
        run: pnpm run build
```

**release.yml** - For npm publishing:
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm run typecheck

      - name: Run tests
        run: pnpm exec vitest --run

      - name: Build
        run: pnpm run build

  publish:
    name: Publish to npm
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm run build

      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 2. Prerequisites

**package.json must have:**
```json
{
  "engines": {
    "node": ">=20",
    "pnpm": ">=9.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

**pnpm-lock.yaml must exist and be committed**

### 3. Pre-flight Check (LOCAL)

Run BEFORE pushing to GitHub:

```bash
node skills/gh-ci-cd/scripts/preflight-check.js
```

### 4. Setup npm Token

1. Go to https://www.npmjs.com/settings/[username]/tokens
2. Generate new token → Classic token → Automation
3. Copy token
4. Go to GitHub → Settings → Secrets → New secret:
   - Name: `NPM_TOKEN`
   - Secret: [paste token]

### 5. Publish

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Common Errors

| Error | Solution |
|-------|----------|
| `pnpm test --run` unknown option | Use `pnpm exec vitest --run` |
| `thread-stream@4.0.0 requires Node >=20` | Change matrix to `[20, 22]` only |
| `Multiple versions of pnpm specified` | Remove `version` from action-setup (uses packageManager) |
| Lockfile not found | Ensure `pnpm-lock.yaml` is committed |
| `NPM_TOKEN` secret not found | Add secret in GitHub Settings |
