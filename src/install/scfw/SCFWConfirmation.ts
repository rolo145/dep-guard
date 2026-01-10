/**
 * SCFW Confirmation
 *
 * Handles user confirmation prompts and UI for scfw installation.
 * Displays package info and manages user interaction.
 *
 * @module install/scfw/SCFWConfirmation
 */
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import { logger } from "../../utils/logger";

/**
 * Handles user confirmation workflow for scfw installation.
 */
export class SCFWConfirmation {
  /**
   * Shows installation header
   */
  showHeader(): void {
    logger.header("Installing packages via scfw", "🔐");
  }

  /**
   * Shows list of packages to be installed
   *
   * @param packageSpecs - Array of package specs
   */
  showPackageList(packageSpecs: string[]): void {
    logger.info(`Packages to install: ${packageSpecs.map((p) => chalk.bold(p)).join(", ")}`);
  }

  /**
   * Prompts user to confirm installation
   *
   * @returns True if user confirms, false otherwise
   */
  async confirmInstall(): Promise<boolean> {
    const confirmed = await confirm({
      message: "Do you want to install these packages via scfw?",
      default: false,
    });

    if (!confirmed) {
      logger.skip("Skipping scfw installation");
    }

    return confirmed;
  }

  /**
   * Creates a spinner for installation progress
   *
   * @returns Spinner instance
   */
  showInstallProgress(): ReturnType<typeof logger.spinner> {
    return logger.spinner("Installing packages...");
  }

  /**
   * Shows installation success message
   *
   * @param spinner - Spinner to update
   */
  showSuccess(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.succeed("All packages installed successfully");
  }

  /**
   * Shows installation failure message
   *
   * @param spinner - Spinner to update
   */
  showFailure(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.fail("Failed to install packages");
    logger.error("Update process aborted");
  }
}
