/**
 * SCFW Service
 *
 * Orchestrates scfw (Supply Chain Firewall) installation workflow
 * including user confirmation, command execution, and result display.
 *
 * @module install/scfw/SCFWService
 */
import type { PackageSelection } from "../../ncu";
import type { IExecutionContext } from "../../context/IExecutionContext";
import { SCFWRunner } from "./SCFWRunner";
import { SCFWConfirmation } from "./SCFWConfirmation";

/**
 * Service for orchestrating scfw installation workflow.
 *
 * Combines scfw command execution with user interaction and logging.
 */
export class SCFWService {
  private runner: SCFWRunner;
  private confirmation: SCFWConfirmation;

  /**
   * Creates a new SCFWService instance.
   *
   * @param context - Workflow context for accessing configuration
   */
  constructor(context: IExecutionContext) {
    this.runner = new SCFWRunner(context);
    this.confirmation = new SCFWConfirmation();
  }

  /**
   * Installs packages using scfw with security flags
   *
   * Shows confirmation prompt, runs installation, and displays results.
   *
   * @param packages - Array of packages to install
   * @returns True if installation succeeded, false if skipped
   * @throws Exits process if installation fails
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
    process.exit(1);
  }

  /**
   * Installs a single package using scfw
   *
   * @param name - Package name
   * @param version - Package version
   * @returns True if installation succeeded
   */
  async installSingle(name: string, version: string): Promise<boolean> {
    return this.install([{ name, version }]);
  }
}
