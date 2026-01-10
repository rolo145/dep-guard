/**
 * Build Confirmation
 *
 * Handles user confirmation prompts and UI for build operations.
 * Displays build info and manages user interaction.
 *
 * @module quality/build/BuildConfirmation
 */
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import { logger } from "../../utils/logger";

/**
 * Handles user confirmation workflow for build operations.
 */
export class BuildConfirmation {
  /**
   * Shows build header
   */
  showHeader(): void {
    logger.header("Running build", "🏗️");
  }

  /**
   * Shows the build script that will be executed
   *
   * @param scriptName - Name of the script to run
   */
  showScriptName(scriptName: string): void {
    logger.info(`Build script: ${chalk.bold(scriptName)}`);
  }

  /**
   * Shows skip message when script is not found
   *
   * @param scriptName - Name of the script that was not found
   */
  showScriptNotFound(scriptName: string): void {
    logger.skip(`Skipping build (script "${scriptName}" not found)`);
  }

  /**
   * Prompts user to confirm build execution
   *
   * @param scriptName - Name of the script to run
   * @returns True if user confirms, false otherwise
   */
  async confirmRun(scriptName: string): Promise<boolean> {
    const confirmed = await confirm({
      message: `Do you want to run build (npm run ${scriptName})?`,
      default: false,
    });

    if (!confirmed) {
      logger.skip("Skipping build");
    }

    return confirmed;
  }

  /**
   * Creates a spinner for build progress
   *
   * @returns Spinner instance
   */
  showProgress(): ReturnType<typeof logger.spinner> {
    return logger.spinner("Building...");
  }

  /**
   * Shows build success message
   *
   * @param spinner - Spinner to update
   */
  showSuccess(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.succeed("Build complete!");
  }

  /**
   * Shows build failure message
   *
   * @param spinner - Spinner to update
   */
  showFailure(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.fail("Build failed");
    logger.warning("Build errors detected. Please review and fix them.");
  }
}
