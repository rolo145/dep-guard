/**
 * Type Check Confirmation
 *
 * Handles user confirmation prompts and UI for type check operations.
 * Displays type check info and manages user interaction.
 *
 * @module quality/typecheck/TypeCheckConfirmation
 */
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import { logger } from "../../logger";

/**
 * Handles user confirmation workflow for type check operations.
 */
export class TypeCheckConfirmation {
  /**
   * Shows type check header
   */
  showHeader(): void {
    logger.header("Running type checks", "🔍");
  }

  /**
   * Shows the type check script that will be executed
   *
   * @param scriptName - Name of the script to run
   */
  showScriptName(scriptName: string): void {
    logger.info(`Type check script: ${chalk.bold(scriptName)}`);
  }

  /**
   * Shows skip message when script is not found
   *
   * @param scriptName - Name of the script that was not found
   */
  showScriptNotFound(scriptName: string): void {
    logger.skip(`Skipping type checks (script "${scriptName}" not found)`);
  }

  /**
   * Prompts user to confirm type check execution
   *
   * @param scriptName - Name of the script to run
   * @returns True if user confirms, false otherwise
   */
  async confirmRun(scriptName: string): Promise<boolean> {
    const confirmed = await confirm({
      message: `Do you want to run type checks (npm run ${scriptName})?`,
      default: false,
    });

    if (!confirmed) {
      logger.skip("Skipping type checks");
    }

    return confirmed;
  }

  /**
   * Creates a spinner for type check progress
   *
   * @returns Spinner instance
   */
  showProgress(): ReturnType<typeof logger.spinner> {
    return logger.spinner("Running type checks...");
  }

  /**
   * Shows type check success message
   *
   * @param spinner - Spinner to update
   */
  showSuccess(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.succeed("Type checks passed");
  }

  /**
   * Shows type check failure message
   *
   * @param spinner - Spinner to update
   */
  showFailure(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.fail("Type checks failed");
    logger.warning("Type errors detected. Please review and fix them.");
  }
}
