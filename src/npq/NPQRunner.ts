/**
 * NPQ Runner
 *
 * Handles execution of NPQ (npm package quality) commands.
 * Runs security checks in dry-run mode to validate packages
 * before installation.
 *
 * @module npq/NPQRunner
 * @see https://github.com/lirantal/npq
 */
import { tryRunCommand } from "../utils/utils";

export interface NPQCheckResult {
  packageSpec: string;
  passed: boolean;
}

/**
 * Runner for NPQ command execution.
 *
 * Handles the low-level execution of NPQ commands and returns
 * structured results.
 */
export class NPQRunner {
  /**
   * Runs NPQ security check on a package (dry-run mode)
   *
   * NPQ checks for:
   * - Known vulnerabilities
   * - Suspicious package characteristics
   * - Malware signatures
   * - Package quality indicators
   *
   * @param packageSpec - Package specification (e.g., "chalk@5.0.0")
   * @returns Result object with pass/fail status
   */
  check(packageSpec: string): NPQCheckResult {
    const passed = tryRunCommand("npq", ["install", packageSpec, "--dry-run"]);

    return {
      packageSpec,
      passed,
    };
  }

  /**
   * Runs NPQ security checks on multiple packages
   *
   * @param packageSpecs - Array of package specifications
   * @returns Array of check results
   */
  checkBatch(packageSpecs: string[]): NPQCheckResult[] {
    return packageSpecs.map((spec) => this.check(spec));
  }
}
