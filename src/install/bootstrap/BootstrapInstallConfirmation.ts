/**
 * Bootstrap Install Confirmation
 *
 * Handles user confirmation prompts and UI for fresh install operations.
 *
 * @module install/bootstrap/BootstrapInstallConfirmation.ts
 */
import { confirm } from "@inquirer/prompts";
import { logger } from "../../logger";
import { withCancellationHandling } from "../../errors";
import type { IExecutionContext } from "../../context/IExecutionContext";

/**
 * Handles user confirmation workflow for fresh install from package.json.
 *
 * This confirmation is shown when user runs `dep-guard install` to perform
 * a fresh installation of all dependencies from package.json.
 */
export class BootstrapInstallConfirmation {
  private readonly context: IExecutionContext;
  private readonly useNpmFallback: boolean;

  constructor(context: IExecutionContext, useNpmFallback: boolean) {
    this.context = context;
    this.useNpmFallback = useNpmFallback;
  }

  /**
   * Shows fresh install header
   */
  showHeader(): void {
    logger.header("Fresh install from package.json", "📦");

    const method = this.useNpmFallback ? "npm install" : "scfw run npm install";
    logger.info(`This will run '${method} --ignore-scripts --before <date>' to:`);
    logger.info("  • Install all dependencies from package.json");
    logger.info("  • Regenerate package-lock.json");
    const cutoffDate = this.context.cutoff.toLocaleDateString();
    logger.info(`  • Only install versions published before ${cutoffDate} (${this.context.days} day safety buffer)`);
    logger.info("");
  }

  /**
   * Prompts user to confirm fresh install
   *
   * @returns True if user confirms, false otherwise
   */
  async confirmRun(): Promise<boolean> {
    const confirmed = await withCancellationHandling(() =>
      confirm({
        message: "Do you want to proceed with fresh install?",
        default: true,
      }),
    );

    if (!confirmed) {
      logger.skip("Skipping fresh install");
    }

    return confirmed;
  }

  /**
   * Creates a spinner for install progress
   *
   * @returns Spinner instance
   */
  showProgress(): ReturnType<typeof logger.spinner> {
    const method = this.useNpmFallback ? "npm" : "scfw";
    return logger.spinner(`Installing dependencies via ${method}...`);
  }

  /**
   * Shows install success message
   *
   * @param spinner - Spinner to update
   */
  showSuccess(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.succeed("Dependencies installed successfully");
    logger.success("Fresh install complete!");
  }

  /**
   * Shows install failure message
   *
   * @param spinner - Spinner to update
   */
  showFailure(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.fail("Failed to install dependencies");
    logger.error("Install process aborted");
  }
}
