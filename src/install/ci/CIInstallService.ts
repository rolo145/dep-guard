/**
 * CI Install Service
 *
 * Orchestrates dependency reinstall workflow including user confirmation,
 * command execution, and result display.
 *
 * @module install/ci/CIInstallService
 */
import { CIInstallRunner } from "./CIInstallRunner";
import { CIInstallConfirmation } from "./CIInstallConfirmation";

/**
 * Service for orchestrating dependency reinstall workflow.
 */
export class CIInstallService {
  private runner: CIInstallRunner;
  private confirmation: CIInstallConfirmation;

  constructor() {
    this.runner = new CIInstallRunner();
    this.confirmation = new CIInstallConfirmation();
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
