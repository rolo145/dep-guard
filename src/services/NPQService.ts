/**
 * NPQ Service
 *
 * Provides security validation for npm packages using NPQ
 * (npm package quality analyzer). Runs security checks before installation
 * and manages user confirmation workflow.
 *
 * NPQ checks for:
 * - Known vulnerabilities
 * - Suspicious package characteristics
 * - Malware signatures
 * - Package quality indicators
 *
 * @module services/NPQService
 * @see https://github.com/lirantal/npq
 */
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import type { PackageSelection } from "../types/updates";
import { tryRunCommand } from "../utils/utils";
import { logger } from "../utils/logger";

/**
 * Service for running NPQ security validation on packages.
 *
 * @example
 * ```typescript
 * const npq = new NPQService();
 * const passed = npq.runSecurityCheck("chalk@5.0.0");
 * const confirmed = await npq.processSelection(selectedPackages);
 * ```
 */
export class NPQService {
  /**
   * Runs NPQ security check on a package (dry-run mode)
   *
   * @param packageSpec - Package specification (e.g., "chalk@5.0.0")
   * @returns True if NPQ check passed, false if failed
   */
  runSecurityCheck(packageSpec: string): boolean {
    logger.info(`Running npq security check for ${chalk.bold(packageSpec)}`);

    const passed = tryRunCommand("npq", ["install", packageSpec, "--dry-run"]);

    if (passed) {
      logger.success("NPQ security check passed");
    } else {
      logger.warning(`NPQ security check failed for ${chalk.bold(packageSpec)}`);
    }

    return passed;
  }

  /**
   * Prompts user to confirm installation of a package after NPQ check
   *
   * @param packageSpec - Package specification (e.g., "chalk@5.0.0")
   * @param npqPassed - Whether the NPQ check passed
   * @returns True if user confirms installation, false otherwise
   */
  private async confirmInstall(packageSpec: string, npqPassed: boolean): Promise<boolean> {
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
   * Validates and confirms a single package
   *
   * @param name - Package name
   * @param version - Package version
   * @returns True if package passed validation and user confirmed
   */
  async validateAndConfirm(name: string, version: string): Promise<boolean> {
    const packageSpec = `${name}@${version}`;

    logger.header(`Processing ${packageSpec}`, "🔐");

    const npqPassed = this.runSecurityCheck(packageSpec);
    return this.confirmInstall(packageSpec, npqPassed);
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
   * @param selected - Array of user-selected packages from interactive prompt
   * @returns Array of packages that user confirmed for installation
   */
  async processSelection(selected: PackageSelection[]): Promise<PackageSelection[]> {
    const packagesToInstall: PackageSelection[] = [];

    for (const { name, version } of selected) {
      const confirmed = await this.validateAndConfirm(name, version);
      if (confirmed) {
        packagesToInstall.push({ name, version });
      }
    }

    return packagesToInstall;
  }
}
