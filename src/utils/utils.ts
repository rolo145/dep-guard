import {
  spawnSync,
  type SpawnSyncOptions,
} from "child_process";
import fs from "fs";
import { confirm } from "@inquirer/prompts";
import { SPAWN_OPTIONS } from "../constants/setup";
import { logger } from "./logger";
import { WorkflowContext } from "../context/WorkflowContext";

/**
 * Runs a command synchronously and automatically exits the process if it fails
 * @param cmd - command to execute
 * @param args - command arguments
 * @param options - spawn options (defaults to SPAWN_OPTIONS)
 */
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

/**
 * Reinstalls all dependencies using npm ci with security flags
 * Prompts user for confirmation before running npm ci --ignore-scripts
 */
export async function reinstallWithNpmCi(): Promise<void> {
  const shouldReinstall = await confirm({
    message: "Do you want to reinstall dependencies with npm ci?",
    default: false,
  });

  if (!shouldReinstall) {
    logger.skip("Skipping npm ci");
    return;
  }

  const spinner = logger.spinner("Reinstalling dependencies via npm ci...");
  const passed = tryRunCommand("npm", ["ci", "--ignore-scripts"]);
  if (passed) {
    spinner.succeed("Dependencies reinstalled successfully");
    return;
  }

  spinner.fail("Failed to reinstall dependencies");
  logger.error("Update process aborted");
  process.exit(1);
}

/**
 * Runs quality checks: lint, type checking, and all tests
 * Prompts user for confirmation before each check (lint, type checks, tests)
 * Shows warnings if any check fails but continues execution.
 * Uses script names from WorkflowContext.
 *
 * @returns Object with pass/fail status for each check
 */
export async function runQualityChecks(): Promise<{
  lint: boolean | null;
  typeCheck: boolean | null;
  tests: boolean | null;
}> {
  const ctx = WorkflowContext.getInstance();
  const scriptNames = ctx.scriptNames;
  const scripts = ctx.scripts;

  const results = {
    lint: null as boolean | null,
    typeCheck: null as boolean | null,
    tests: null as boolean | null,
  };

  // Lint
  if (!scripts[scriptNames.lint]) {
    logger.skip(`Skipping linter (script "${scriptNames.lint}" not found)`);
  } else {
    const shouldRunLint = await confirm({
      message: `Do you want to run linter (npm run ${scriptNames.lint})?`,
      default: false,
    });

    if (shouldRunLint) {
      const spinner = logger.spinner("Running linter...");
      const passed = tryRunCommand("npm", ["run", scriptNames.lint]);
      results.lint = passed;
      if (passed) {
        spinner.succeed("Lint passed");
      } else {
        spinner.fail("Lint failed");
        logger.warning("Linting errors detected. Please review and fix them.");
      }
    } else {
      logger.skip("Skipping linter");
    }
  }

  // Type checks
  if (!scripts[scriptNames.typecheck]) {
    logger.skip(`Skipping type checks (script "${scriptNames.typecheck}" not found)`);
  } else {
    const shouldRunTypeCheck = await confirm({
      message: `Do you want to run type checks (npm run ${scriptNames.typecheck})?`,
      default: false,
    });

    if (shouldRunTypeCheck) {
      const spinner = logger.spinner("Running type checks...");
      const passed = tryRunCommand("npm", ["run", scriptNames.typecheck]);
      results.typeCheck = passed;
      if (passed) {
        spinner.succeed("Type checks passed");
      } else {
        spinner.fail("Type checks failed");
        logger.warning("Type errors detected. Please review and fix them.");
      }
    } else {
      logger.skip("Skipping type checks");
    }
  }

  // Tests
  if (!scripts[scriptNames.test]) {
    logger.skip(`Skipping tests (script "${scriptNames.test}" not found)`);
  } else {
    const shouldRunTests = await confirm({
      message: `Do you want to run tests (npm run ${scriptNames.test})?`,
      default: false,
    });

    if (shouldRunTests) {
      const spinner = logger.spinner("Running tests...");
      const passed = tryRunCommand("npm", ["run", scriptNames.test]);
      results.tests = passed;
      if (passed) {
        spinner.succeed("Tests passed");
      } else {
        spinner.fail("Tests failed");
        logger.warning("Some tests failed. Please review and fix them.");
      }
    } else {
      logger.skip("Skipping tests");
    }
  }

  // Summary
  const failures = [
    results.lint === false && "lint",
    results.typeCheck === false && "type checks",
    results.tests === false && "tests",
  ].filter(Boolean);

  if (failures.length > 0) {
    logger.warning(`Quality checks completed with failures: ${failures.join(", ")}`);
  } else {
    logger.success("Quality checks complete!");
  }

  return results;
}

/**
 * Builds the application
 * Prompts user for confirmation before running the build script.
 * Uses build script name from WorkflowContext.
 *
 * @returns true if build passed, false if failed, null if skipped
 */
export async function runBuild(): Promise<boolean | null> {
  const { scriptNames, scripts } = WorkflowContext.getInstance();
  const buildScriptName = scriptNames.build;

  if (!scripts[buildScriptName]) {
    logger.skip(`Skipping build (script "${buildScriptName}" not found)`);
    return null;
  }

  const shouldBuild = await confirm({
    message: `Do you want to run build (npm run ${buildScriptName})?`,
    default: false,
  });

  if (!shouldBuild) {
    logger.skip("Skipping build");
    return null;
  }

  const spinner = logger.spinner("Building...");
  const passed = tryRunCommand("npm", ["run", buildScriptName]);

  if (passed) {
    spinner.succeed("Build complete!");
  } else {
    spinner.fail("Build failed");
    logger.warning("Build errors detected. Please review and fix them.");
  }

  return passed;
}
