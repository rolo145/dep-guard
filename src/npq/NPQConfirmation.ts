/**
 * NPQ Confirmation
 *
 * Handles user confirmation prompts after NPQ security checks.
 * Displays check results and manages user interaction.
 *
 * @module npq/NPQConfirmation
 */
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import { logger } from "../logger";
import { withCancellationHandling } from "../errors";

/**
 * Handles user confirmation workflow for NPQ checks.
 *
 * @example
 * ```typescript
 * const confirmation = new NPQConfirmation();
 * const confirmed = await confirmation.confirm("chalk@5.0.0", true);
 * ```
 */
export class NPQConfirmation {
  /**
   * Displays the result of an NPQ security check
   *
   * @param packageSpec - Package specification
   * @param passed - Whether the check passed
   */
  displayResult(packageSpec: string, passed: boolean): void {
    if (passed) {
      logger.success("NPQ security check passed");
    } else {
      logger.warning(`NPQ security check failed for ${chalk.bold(packageSpec)}`);
    }
  }

  /**
   * Prompts user to confirm installation of a package after NPQ check
   *
   * @param packageSpec - Package specification (e.g., "chalk@5.0.0")
   * @param npqPassed - Whether the NPQ check passed
   * @returns True if user confirms installation, false otherwise
   */
  async confirm(packageSpec: string, npqPassed: boolean): Promise<boolean> {
    const statusText = npqPassed
      ? chalk.green("(NPQ: passed)")
      : chalk.red("(NPQ: failed)");

    const confirmed = await withCancellationHandling(() =>
      confirm({
        message: `Install ${chalk.bold(packageSpec)}? ${statusText}`,
        default: false,
      }),
    );

    if (!confirmed) {
      logger.skip(`Skipping ${packageSpec}`);
    }

    return confirmed;
  }

  /**
   * Shows package processing header
   *
   * @param packageSpec - Package specification
   */
  showPackageHeader(packageSpec: string): void {
    logger.header(`Processing ${packageSpec}`, "🔐");
  }

  /**
   * Shows info message before running check
   *
   * @param packageSpec - Package specification
   */
  showCheckStarted(packageSpec: string): void {
    logger.info(`Running npq security check for ${chalk.bold(packageSpec)}`);
  }
}
