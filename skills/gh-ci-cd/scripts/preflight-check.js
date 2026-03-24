import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { readFile } from "fs/promises";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function log(color, emoji, message) {
  console.log(`${color}${emoji} ${message}${RESET}`);
}

function checkNodeVersion() {
  const version = process.version.slice(1);
  const major = parseInt(version.split(".")[0]);
  
  if (major >= 20) {
    log(GREEN, "✅", `Node.js ${version} (>=20 required)`);
    return true;
  } else {
    log(RED, "❌", `Node.js ${version} - requires >=20`);
    return false;
  }
}

function checkPnpmLock() {
  const lockPath = join(process.cwd(), "pnpm-lock.yaml");
  
  if (existsSync(lockPath)) {
    log(GREEN, "✅", "pnpm-lock.yaml exists");
    return true;
  } else {
    log(RED, "❌", "pnpm-lock.yaml not found - run: pnpm install");
    return false;
  }
}

async function checkPackageJson() {
  const pkgPath = join(process.cwd(), "package.json");
  
  if (!existsSync(pkgPath)) {
    log(RED, "❌", "package.json not found");
    return false;
  }
  
  try {
    const content = await readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(content);
    
    if (pkg.engines?.node && pkg.engines.node.includes(">=20")) {
      log(GREEN, "✅", "package.json engines.node >=20");
      return true;
    } else {
      log(YELLOW, "⚠️", "Consider setting engines.node: >=20 in package.json");
      return true;
    }
  } catch {
    log(RED, "❌", "Failed to parse package.json");
    return false;
  }
}

console.log("\n🔍 GitHub CI/CD Pre-flight Check\n");
console.log("================================\n");

const checks = [
  checkNodeVersion(),
  checkPnpmLock(),
  await checkPackageJson(),
];

console.log("\n================================\n");

if (checks.every(Boolean)) {
  console.log("✅ All checks passed!");
  console.log("\nRun these commands to simulate CI:\n");
  console.log("  pnpm install");
  console.log("  pnpm run typecheck");
  console.log("  pnpm exec vitest --run");
  console.log("  pnpm run build");
  console.log("\n🚀 Ready to push to GitHub!\n");
  process.exit(0);
} else {
  console.log("❌ Some checks failed. Fix issues before pushing.\n");
  process.exit(1);
}
