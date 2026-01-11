/**
 * Lint Confirmation
 *
 * Handles user confirmation prompts and UI for lint operations.
 * Displays lint info and manages user interaction.
 *
 * @module quality/lint/LintConfirmation
 */
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import { logger } from "../../logger";
import { withCancellationHandling } from "../../errors";

/**
 * Handles user confirmation workflow for lint operations.
 */
export class LintConfirmation {
  /**
   * Shows lint header
   */
  showHeader(): void {
    logger.header("Running linter", "🧹");
  }

  /**
   * Shows the lint script that will be executed
   *
   * @param scriptName - Name of the script to run
   */
  showScriptName(scriptName: string): void {
    logger.info(`Lint script: ${chalk.bold(scriptName)}`);
  }

  /**
   * Shows skip message when script is not found
   *
   * @param scriptName - Name of the script that was not found
   */
  showScriptNotFound(scriptName: string): void {
    logger.skip(`Skipping linter (script "${scriptName}" not found)`);
  }

  /**
   * Prompts user to confirm lint execution
   *
   * @param scriptName - Name of the script to run
   * @returns True if user confirms, false otherwise
   */
  async confirmRun(scriptName: string): Promise<boolean> {
    const confirmed = await withCancellationHandling(() =>
      confirm({
        message: `Do you want to run linter (npm run ${scriptName})?`,
        default: false,
      }),
    );

    if (!confirmed) {
      logger.skip("Skipping linter");
    }

    return confirmed;
  }

  /**
   * Creates a spinner for lint progress
   *
   * @returns Spinner instance
   */
  showProgress(): ReturnType<typeof logger.spinner> {
    return logger.spinner("Running linter...");
  }

  /**
   * Shows lint success message
   *
   * @param spinner - Spinner to update
   */
  showSuccess(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.succeed("Lint passed");
  }

  /**
   * Shows lint failure message
   *
   * @param spinner - Spinner to update
   */
  showFailure(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.fail("Lint failed");
    logger.warning("Linting errors detected. Please review and fix them.");
  }
}
