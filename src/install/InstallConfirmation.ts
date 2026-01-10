/**
 * Install Confirmation
 *
 * Handles user confirmation prompts and UI for the orchestrated install workflow.
 * Coordinates UI for both CI reinstall and SCFW package installation operations.
 *
 * @module install/InstallConfirmation
 */
import { logger } from "../logger";

/**
 * Handles user confirmation workflow for orchestrated install operations.
 */
export class InstallConfirmation {
  /**
   * Shows installation workflow header
   */
  showHeader(): void {
    logger.header("Installing dependencies", "📦");
  }

  /**
   * Creates a spinner for installation progress
   *
   * @param message - Custom progress message
   * @returns Spinner instance
   */
  showProgress(message: string): ReturnType<typeof logger.spinner> {
    return logger.spinner(message);
  }

  /**
   * Shows installation success message
   *
   * @param spinner - Spinner to update
   * @param message - Custom success message
   */
  showSuccess(spinner: ReturnType<typeof logger.spinner>, message: string): void {
    spinner.succeed(message);
  }

  /**
   * Shows installation failure message
   *
   * @param spinner - Spinner to update
   * @param message - Custom failure message
   */
  showFailure(spinner: ReturnType<typeof logger.spinner>, message: string): void {
    spinner.fail(message);
    logger.error("Installation process aborted");
  }

  /**
   * Shows final success summary
   */
  showFinalSuccess(): void {
    logger.success("All installation operations completed successfully");
  }
}
