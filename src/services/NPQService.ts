/**
 * NPQ Service
 *
 * Provides security validation for npm packages using NPQ
 * (npm package quality analyzer). Runs security checks before installation.
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
import { tryRunCommand } from "../utils/utils";
import { logger } from "../utils/logger";

/**
 * Service for running NPQ security validation on packages.
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
   * Runs NPQ security checks on multiple packages
   *
   * @param packageSpecs - Array of package specifications
   * @returns Map of package spec to pass/fail status
   */
  runBatchSecurityCheck(packageSpecs: string[]): Map<string, boolean> {
    const results = new Map<string, boolean>();

    for (const spec of packageSpecs) {
      results.set(spec, this.runSecurityCheck(spec));
    }

    return results;
  }
}
