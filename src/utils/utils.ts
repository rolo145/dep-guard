import {
  spawnSync,
  type SpawnSyncOptions,
} from "child_process";
import fs from "fs";
import { SPAWN_OPTIONS } from "../constants/setup";
import { logger } from "./logger";
import { WorkflowContext } from "../context/WorkflowContext";

/**
 * Runs a command synchronously and returns success/failure (doesn't exit on failure)
 * @param cmd - command to execute
 * @param args - command arguments
 * @param options - spawn options (defaults to SPAWN_OPTIONS)
 * @returns true if command succeeded (exit code 0), false otherwise
 */
export function tryRunCommand(
  cmd: string,
  args: string[],
  options: SpawnSyncOptions = SPAWN_OPTIONS,
): boolean {
  const result = spawnSync(cmd, args, options);
  return result.status === 0;
}

// ============================================================================
// Package Management Utilities
// ============================================================================

/**
 * Extracts the package name from a package spec (handles scoped packages)
 * @param pkgSpec - package spec like "@vue/reactivity@3.5.0" or "axios@1.7.0"
 * @returns package name like "@vue/reactivity" or "axios"
 */
export function extractPackageName(pkgSpec: string): string {
  return pkgSpec.startsWith("@")
    ? pkgSpec.split("@").slice(0, 2).join("@")
    : pkgSpec.split("@")[0];
}

/**
 * Reads and parses package.json from the current directory
 * @returns parsed package.json object
 */
export function readPackageJson(): {
  scripts?: Record<string, string>,
  dependencies?: Record<string, string>,
  devDependencies?: Record<string, string>,
  [key: string]: unknown,
} {
  return JSON.parse(fs.readFileSync("package.json", "utf8"));
}

function getPackageScripts(): Record<string, string> {
  const pkgJson = readPackageJson();
  return pkgJson.scripts ?? {};
}

/**
 * Validates that configured script names exist in the target project's package.json
 * Shows warnings for any scripts that don't exist
 *
 * @param scriptNames - Object with script names to validate (lint, typecheck, test, build)
 * @returns Object indicating which scripts are available
 */
export function validateScriptNames(scriptNames: {
  lint: string;
  typecheck: string;
  test: string;
  build: string;
}): { lint: boolean; typecheck: boolean; test: boolean; build: boolean } {
  const scripts = getPackageScripts();
  const results = {
    lint: !!scripts[scriptNames.lint],
    typecheck: !!scripts[scriptNames.typecheck],
    test: !!scripts[scriptNames.test],
    build: !!scripts[scriptNames.build],
  };

  const missing: string[] = [];

  if (!results.lint) {
    missing.push(`lint: "${scriptNames.lint}"`);
  }
  if (!results.typecheck) {
    missing.push(`typecheck: "${scriptNames.typecheck}"`);
  }
  if (!results.test) {
    missing.push(`test: "${scriptNames.test}"`);
  }
  if (!results.build) {
    missing.push(`build: "${scriptNames.build}"`);
  }

  if (missing.length > 0) {
    logger.warning(`The following scripts were not found in package.json:`);
    missing.forEach((script) => {
      logger.info(`  - ${script}`);
    });
    logger.info("These quality checks will be skipped. Use --lint, --typecheck, --test, --build to specify custom script names.");
    logger.newLine();
  }

  return results;
}

/**
 * Checks if a package is already installed in package.json
 * @param pkgName - package name to check
 * @returns true if package exists in dependencies or devDependencies
 */
export function isPackageInstalled(pkgName: string): boolean {
  const pkgJson = readPackageJson();
  return !!(pkgJson.dependencies?.[pkgName] || pkgJson.devDependencies?.[pkgName]);
}

/**
 * Builds scfw install command arguments with security flags for multiple packages
 * Uses cutoff date from WorkflowContext (cached).
 *
 * @param pkgSpecs - array of package specs to install (e.g., ["chalk@5.0.0", "axios@1.0.0"])
 * @returns array of command arguments for scfw
 */
export function buildScfwBatchInstallArgs(pkgSpecs: string[]): string[] {
  const ctx = WorkflowContext.getInstance();
  return [
    "run",
    "npm",
    "install",
    ...pkgSpecs,
    "--save-exact",
    "--ignore-scripts",
    "--before",
    ctx.cutoffIso,
  ];
}
