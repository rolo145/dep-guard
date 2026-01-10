/**
 * Security Validator Service
 *
 * Provides security validation pipeline for package installations.
 * Validates packages using NPQ before installation and manages user
 * confirmation workflow.
 *
 * @module services/securityValidator
 */
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import type { PackageSelection } from "../types/updates";
import { NPQService } from "./NPQService";
import { logger } from "../utils/logger";

/**
 * Prompts user to confirm installation of a package after NPQ check
 *
 * Shows NPQ result and asks user whether to proceed with installation.
 * Default is false (don't install) for safety.
 *
 * @param packageSpec - Package specification (e.g., "chalk@5.0.0")
 * @param npqPassed - Whether the NPQ check passed
 * @returns True if user confirms installation, false otherwise
 */
async function confirmPackageInstall(packageSpec: string, npqPassed: boolean): Promise<boolean> {
  const statusText = npqPassed
    ? chalk.green("(NPQ: passed)")
    : chalk.red("(NPQ: failed)");

  const confirmed = await confirm({
    message: `Install ${chalk.bold(packageSpec)}? ${statusText}`,
    default: false,
  });

  if (!confirmed) {
    logger.skip(`Skipping ${packageSpec}`);
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
  const npqService = new NPQService();
  const packagesToInstall: PackageSelection[] = [];

  for (const { name, version } of selected) {
    const packageSpec = `${name}@${version}`;

    logger.header(`Processing ${packageSpec}`, "🔐");

    const npqPassed = npqService.runSecurityCheck(packageSpec);

    const confirmed = await confirmPackageInstall(packageSpec, npqPassed);
    if (confirmed) {
      packagesToInstall.push({ name, version });
    }
  }

  return packagesToInstall;
}
