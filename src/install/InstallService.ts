/**
 * Install Service
 *
 * Root orchestrator for dependency installation workflow.
 * Coordinates CI reinstall and SCFW package installation operations.
 *
 * @module install/InstallService
 */
import type { PackageSelection } from "../ncu";
import type { IExecutionContext } from "../context/IExecutionContext";
import { InstallRunner } from "./InstallRunner";

/**
 * Service for orchestrating the complete install workflow.
 *
 * Provides public API for running install operations with CI reinstall
 * and SCFW/npm package installation, coordinating user interaction and execution.
 */
export class InstallService {
  private runner: InstallRunner;

  /**
   * Creates a new InstallService instance.
   *
   * @param context - Workflow context for accessing configuration
   * @param useNpmFallback - If true, use npm install instead of scfw
   */
  constructor(context: IExecutionContext, useNpmFallback: boolean = false) {
    this.runner = new InstallRunner(context, useNpmFallback);
  }

  /**
   * Runs the complete install workflow
   *
   * Optionally installs packages via SCFW, then runs CI reinstall.
   *
   * @param packages - Optional packages to install via SCFW
   * @returns True if all operations succeeded, false otherwise
   */
  async run(packages?: PackageSelection[]): Promise<boolean> {
    const result = await this.runner.run(packages);

    // Consider successful if CI succeeded (or was skipped) and SCFW succeeded if packages were provided
    const success =
      (result.ciSuccess === true || result.ciSuccess === null) &&
      (!packages || packages.length === 0 || result.scfwSuccess);

    return success;
  }

  /**
   * Installs packages via SCFW only
   *
   * @param packages - Packages to install via SCFW
   * @returns True if installation succeeded, false if skipped
   */
  async installPackages(packages: PackageSelection[]): Promise<boolean> {
    return await this.runner.runSCFW(packages);
  }

  /**
   * Runs CI reinstall only
   *
   * @returns True if succeeded, false if failed, null if skipped
   */
  async reinstall(): Promise<boolean | null> {
    return await this.runner.runCI();
  }
}
