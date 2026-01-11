/**
 * CI Install Confirmation
 *
 * Handles user confirmation prompts and UI for dependency reinstall operations.
 *
 * @module install/ci/CIInstallConfirmation
 */
import { confirm } from "@inquirer/prompts";
import { logger } from "../../logger";
import { withCancellationHandling } from "../../errors";

/**
 * Handles user confirmation workflow for dependency reinstall.
 */
export class CIInstallConfirmation {
  /**
   * Shows reinstall header
   */
  showHeader(): void {
    logger.header("Reinstalling dependencies", "📦");
  }

  /**
   * Prompts user to confirm reinstall
   *
   * @returns True if user confirms, false otherwise
   */
  async confirmRun(): Promise<boolean> {
    const confirmed = await withCancellationHandling(() =>
      confirm({
        message: "Do you want to reinstall dependencies with npm ci?",
        default: false,
      }),
    );

    if (!confirmed) {
      logger.skip("Skipping npm ci");
    }

    return confirmed;
  }

  /**
   * Creates a spinner for reinstall progress
   *
   * @returns Spinner instance
   */
  showProgress(): ReturnType<typeof logger.spinner> {
    return logger.spinner("Reinstalling dependencies via npm ci...");
  }

  /**
   * Shows reinstall success message
   *
   * @param spinner - Spinner to update
   */
  showSuccess(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.succeed("Dependencies reinstalled successfully");
  }

  /**
   * Shows reinstall failure message
   *
   * @param spinner - Spinner to update
   */
  showFailure(spinner: ReturnType<typeof logger.spinner>): void {
    spinner.fail("Failed to reinstall dependencies");
    logger.error("Update process aborted");
  }
}
