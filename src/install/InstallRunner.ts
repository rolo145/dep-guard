/**
 * Install Runner
 *
 * Orchestrates the execution of child install services (CI and SCFW).
 * Coordinates running multiple install operations in sequence.
 *
 * @module install/InstallRunner
 */
import type { PackageSelection } from "../ncu";
import type { IWorkflowContext } from "../context/IWorkflowContext";
import { CIInstallService } from "./ci/CIInstallService";
import { SCFWService } from "./scfw/SCFWService";

export interface InstallRunnerResult {
  scfwSuccess: boolean;
  ciSuccess: boolean | null;
}

/**
 * Runner that coordinates CI reinstall and SCFW package installation.
 */
export class InstallRunner {
  private ciInstallService: CIInstallService;
  private scfwService: SCFWService;

  /**
   * Creates a new InstallRunner instance.
   *
   * @param context - Workflow context for accessing configuration
   */
  constructor(context: IWorkflowContext) {
    this.ciInstallService = new CIInstallService();
    this.scfwService = new SCFWService(context);
  }

  /**
   * Runs the complete install workflow
   *
   * @param packages - Optional packages to install via SCFW
   * @returns Result object with status of both operations
   */
  async run(packages?: PackageSelection[]): Promise<InstallRunnerResult> {
    let scfwSuccess = false;
    let ciSuccess: boolean | null = null;

    // Install new packages via SCFW if provided
    if (packages && packages.length > 0) {
      scfwSuccess = await this.scfwService.install(packages);
    }

    // Always run CI reinstall
    ciSuccess = await this.ciInstallService.run();

    return {
      scfwSuccess,
      ciSuccess,
    };
  }

  /**
   * Runs only SCFW package installation
   *
   * @param packages - Packages to install via SCFW
   * @returns True if installation succeeded, false if skipped
   */
  async runSCFW(packages: PackageSelection[]): Promise<boolean> {
    return await this.scfwService.install(packages);
  }

  /**
   * Runs only CI reinstall
   *
   * @returns True if succeeded, false if failed, null if skipped
   */
  async runCI(): Promise<boolean | null> {
    return await this.ciInstallService.run();
  }
}
