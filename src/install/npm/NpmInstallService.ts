/**
 * NPM Install Service
 *
 * Orchestrates npm install workflow (fallback mode) including user confirmation,
 * command execution, and result display.
 *
 * Used as fallback when scfw is not available.
 *
 * @module install/npm/NpmInstallService
 */
import type { PackageSelection } from "../../ncu";
import type { IExecutionContext } from "../../context/IExecutionContext";
import { NpmInstallRunner } from "./NpmInstallRunner";
import { NpmInstallConfirmation } from "./NpmInstallConfirmation";
import { InstallationFailureError } from "../../errors";

/**
 * Service for orchestrating npm install workflow (fallback mode).
 *
 * Combines npm command execution with user interaction and logging.
 */
export class NpmInstallService {
  private runner: NpmInstallRunner;
  private confirmation: NpmInstallConfirmation;

  /**
   * Creates a new NpmInstallService instance.
   *
   * @param context - Workflow context for accessing configuration
   */
  constructor(context: IExecutionContext) {
    this.runner = new NpmInstallRunner(context);
    this.confirmation = new NpmInstallConfirmation();
  }

  /**
   * Installs packages using npm with security flags
   *
   * Shows confirmation prompt, runs installation, and displays results.
   *
   * @param packages - Array of packages to install
   * @returns True if installation succeeded, false if skipped
   * @throws InstallationFailureError if installation fails
   */
  async install(packages: PackageSelection[]): Promise<boolean> {
    const packageSpecs = packages.map(({ name, version }) => `${name}@${version}`);

    this.confirmation.showHeader();
    this.confirmation.showPackageList(packageSpecs);

    const shouldInstall = await this.confirmation.confirmInstall();
    if (!shouldInstall) {
      return false;
    }

    const spinner = this.confirmation.showInstallProgress();
    const result = this.runner.install(packageSpecs);

    if (result.success) {
      this.confirmation.showSuccess(spinner);
      return true;
    }

    this.confirmation.showFailure(spinner);
    throw new InstallationFailureError("npm installation failed");
  }

  /**
   * Installs a single package using npm
   *
   * @param name - Package name
   * @param version - Package version
   * @returns True if installation succeeded
   */
  async installSingle(name: string, version: string): Promise<boolean> {
    return this.install([{ name, version }]);
  }
}
