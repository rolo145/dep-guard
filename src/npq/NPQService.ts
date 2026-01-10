/**
 * NPQ Service
 *
 * Orchestrates NPQ security validation workflow including
 * running checks, displaying results, and handling user confirmation.
 *
 * @module npq/NPQService
 */
import type { PackageSelection } from "../ncu";
import { NPQRunner } from "./NPQRunner";
import { NPQConfirmation } from "./NPQConfirmation";

/**
 * Service for orchestrating NPQ security validation workflow.
 *
 * Combines NPQ command execution with user interaction and logging.
 */
export class NPQService {
  private runner: NPQRunner;
  private confirmation: NPQConfirmation;

  constructor() {
    this.runner = new NPQRunner();
    this.confirmation = new NPQConfirmation();
  }

  /**
   * Runs NPQ security check and displays the result
   *
   * @param packageSpec - Package specification (e.g., "chalk@5.0.0")
   * @returns True if NPQ check passed, false if failed
   */
  runSecurityCheck(packageSpec: string): boolean {
    this.confirmation.showCheckStarted(packageSpec);

    const result = this.runner.check(packageSpec);
    this.confirmation.displayResult(packageSpec, result.passed);

    return result.passed;
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

    this.confirmation.showPackageHeader(packageSpec);

    const npqPassed = this.runSecurityCheck(packageSpec);
    return this.confirmation.confirm(packageSpec, npqPassed);
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
