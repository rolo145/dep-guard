/**
 * Test Confirmation
 *
 * Handles user confirmation prompts and UI for test operations.
 * Displays test info and manages user interaction.
 *
 * @module quality/test/TestConfirmation
 */
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import { logger } from "../../logger";
import { withCancellationHandling } from "../../errors";

/**
 * Handles user confirmation workflow for test operations.
 */
export class TestConfirmation {
  /**
   * Shows test header
   */
  showHeader(): void {
    logger.header("Running tests", "🧪");
  }

  /**
   * Shows the test script that will be executed
   *
   * @param scriptName - Name of the script to run
   */
  showScriptName(scriptName: string): void {
    logger.info(`Test script: ${chalk.bold(scriptName)}`);
  }

  /**
   * Shows skip message when script is not found
   *
   * @param scriptName - Name of the script that was not found
   */
  showScriptNotFound(scriptName: string): void {
    logger.skip(`Skipping tests (script "${scriptName}" not found)`);
  }

  /**
   * Prompts user to confirm test execution
   *
   * @param scriptName - Name of the script to run
   * @returns True if user confirms, false otherwise
   */
  async confirmRun(scriptName: string): Promise<boolean> {
    const confirmed = await withCancellationHandling(() =>
      confirm({
        message: `Do you want to run tests (npm run ${scriptName})?`,
        default: false,
      }),
    );

    if (!confirmed) {
      logger.skip("Skipping tests");
    }

    return confirmed;
  }

  /**
   * Creates a spinner for test progress
   *
   * @returns Spinner instance
   */
  showProgress(): ReturnType<typeof logger.spinner> {
    return logger.spinner("Running tests...");
  }

  /**
   * Shows test success message
   *
   * @param spinner - Spinner to update
   */
  showSuccess(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.succeed("Tests passed");
  }

  /**
   * Shows test failure message
   *
   * @param spinner - Spinner to update
   */
  showFailure(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.fail("Tests failed");
    logger.warning("Some tests failed. Please review and fix them.");
  }
}
