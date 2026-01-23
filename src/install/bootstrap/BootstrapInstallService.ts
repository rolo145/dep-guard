/**
 * Bootstrap Install Service
 *
 * Orchestrates fresh install workflow including user confirmation,
 * command execution, and result display.
 *
 * @module install/bootstrap/BootstrapInstallService
 */
import { BootstrapInstallRunner } from "./BootstrapInstallRunner";
import { BootstrapInstallConfirmation } from "./BootstrapInstallConfirmation";
import type { IExecutionContext } from "../../context/IExecutionContext";
import { InstallationFailureError } from "../../errors";
import type { ServiceResult } from "../../types/ServiceResult";

/**
 * Service for orchestrating fresh install workflow from package.json.
 *
 * Runs `npm install` (or `scfw run npm install`) with no package arguments
 * to install all dependencies and regenerate package-lock.json.
 */
export class BootstrapInstallService {
  private readonly runner: BootstrapInstallRunner;
  private readonly confirmation: BootstrapInstallConfirmation;

  constructor(context: IExecutionContext, useNpmFallback: boolean) {
    this.runner = new BootstrapInstallRunner(context, useNpmFallback);
    this.confirmation = new BootstrapInstallConfirmation(context, useNpmFallback);
  }

  /**
   * Performs fresh install from package.json
   *
   * Workflow:
   * 1. Show header explaining what will happen
   * 2. Ask user for confirmation
   * 3. Execute install command
   * 4. Show result
   *
   * @returns ServiceResult - true if succeeded, false if failed, null if skipped
   */
  async run(): Promise<ServiceResult> {
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
    throw new InstallationFailureError("Bootstrap installation failed");
  }
}
