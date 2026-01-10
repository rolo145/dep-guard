/**
 * Install Service
 *
 * Orchestrates dependency reinstall workflow including user confirmation,
 * command execution, and result display.
 *
 * @module install/ci/InstallService
 */
import { InstallRunner } from "./InstallRunner";
import { InstallConfirmation } from "./InstallConfirmation";

/**
 * Service for orchestrating dependency reinstall workflow.
 */
export class InstallService {
  private runner: InstallRunner;
  private confirmation: InstallConfirmation;

  constructor() {
    this.runner = new InstallRunner();
    this.confirmation = new InstallConfirmation();
  }

  /**
   * Reinstalls dependencies with npm ci
   *
   * @returns True if reinstall succeeded, false if failed, null if skipped
   */
  async run(): Promise<boolean | null> {
    this.confirmation.showHeader();

    const shouldRun = await this.confirmation.confirmRun();
    if (!shouldRun) {
      return null;
    }

    const spinner = this.confirmation.showProgress();
    const result = this.runner.run();

    if (result.success) {
      this.confirmation.showSuccess(spinner);
      return true;
    }

    this.confirmation.showFailure(spinner);
    process.exit(1);
  }
}
