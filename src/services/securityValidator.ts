/**
 * Security Validator Service
 *
 * Provides security validation pipeline for package installations using NPQ
 * (npm package quality analyzer). Validates packages before installation and
 * manages user confirmation workflow.
 *
 * Security tools used:
 * - npq: Static analysis and security checks for npm packages
 *
 * @module services/securityValidator
 * @see https://github.com/lirantal/npq
 */
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import type { PackageSelection } from "../types/updates";
import { tryRunCommand } from "../utils/utils";
import { logger } from "../utils/logger";

/**
 * Runs NPQ security check on a package (dry-run mode)
 *
 * NPQ checks for:
 * - Known vulnerabilities
 * - Suspicious package characteristics
 * - Malware signatures
 * - Package quality indicators
 *
 * @param pkgSpec - Package specification (e.g., "chalk@5.0.0")
 * @returns True if NPQ check passed, false if failed
 */
function runNpqCheck(pkgSpec: string): boolean {
  logger.info(`Running npq security check for ${chalk.bold(pkgSpec)}`);

  // Run NPQ in dry-run mode (no actual installation)
  const passed = tryRunCommand("npq", ["install", pkgSpec, "--dry-run"]);

  if (passed) {
    logger.success("NPQ security check passed");
  } else {
    logger.warning(`NPQ security check failed for ${chalk.bold(pkgSpec)}`);
  }

  return passed;
}

/**
 * Prompts user to confirm installation of a package after NPQ check
 *
 * Shows NPQ result and asks user whether to proceed with installation.
 * Default is false (don't install) for safety.
 *
 * @param pkgSpec - Package specification (e.g., "chalk@5.0.0")
 * @param npqPassed - Whether the NPQ check passed
 * @returns True if user confirms installation, false otherwise
 */
async function confirmPackageInstall(pkgSpec: string, npqPassed: boolean): Promise<boolean> {
  const statusText = npqPassed
    ? chalk.green("(NPQ: passed)")
    : chalk.red("(NPQ: failed)");

  const confirmed = await confirm({
    message: `Install ${chalk.bold(pkgSpec)}? ${statusText}`,
    default: false,
  });

  if (!confirmed) {
    logger.skip(`Skipping ${pkgSpec}`);
  }

  return confirmed;
}

/**
 * Processes user-selected packages through the security validation pipeline
 *
 * For each selected package:
 * 1. Runs NPQ security validation (dry-run)
 * 2. Shows NPQ result (pass/fail)
 * 3. Asks user to confirm installation (default: false for safety)
 * 4. Adds to installation list if user confirms
 *
 * Packages that are declined are skipped without affecting the rest of the workflow.
 *
 * @param selected - Array of user-selected packages from interactive prompt
 * @returns Array of packages that user confirmed for installation
 */
export async function processPackageSelection(
  selected: PackageSelection[],
): Promise<PackageSelection[]> {
  const packagesToInstall: PackageSelection[] = [];

  // Process each package sequentially (required for user prompts)
  for (const { name, version } of selected) {
    const pkgSpec = `${name}@${version}`;

    // Display package header
    logger.header(`Processing ${pkgSpec}`, "🔐");

    // Step 1: Run NPQ security check
    const npqPassed = runNpqCheck(pkgSpec);

    // Step 2: Ask user to confirm installation (showing NPQ result)
    const confirmed = await confirmPackageInstall(pkgSpec, npqPassed);
    if (confirmed) {
      packagesToInstall.push({ name, version });
    }
  }

  return packagesToInstall;
}
