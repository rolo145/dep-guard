/**
 * Install Runner
 *
 * Orchestrates the execution of child install services (CI, SCFW, or npm fallback).
 * Coordinates running multiple install operations in sequence.
 *
 * @module install/InstallRunner
 */
import type { PackageSelection } from "../ncu";
import type { IExecutionContext } from "../context/IExecutionContext";
import { CIInstallService } from "./ci/CIInstallService";
import { SCFWService } from "./scfw/SCFWService";
import { NpmInstallService } from "./npm/NpmInstallService";

export interface InstallRunnerResult {
  scfwSuccess: boolean;
  ciSuccess: boolean | null;
}

/**
 * Runner that coordinates CI reinstall and SCFW/npm package installation.
 */
export class InstallRunner {
  private ciInstallService: CIInstallService;
  private scfwService: SCFWService | null;
  private npmInstallService: NpmInstallService | null;
  private useNpmFallback: boolean;

  /**
   * Creates a new InstallRunner instance.
   *
   * @param context - Workflow context for accessing configuration
   * @param useNpmFallback - If true, use npm install instead of scfw
   */
  constructor(context: IExecutionContext, useNpmFallback: boolean = false) {
    this.ciInstallService = new CIInstallService();
    this.useNpmFallback = useNpmFallback;

    if (useNpmFallback) {
      this.scfwService = null;
      this.npmInstallService = new NpmInstallService(context);
    } else {
      this.scfwService = new SCFWService(context);
      this.npmInstallService = null;
    }
  }

  /**
   * Runs the complete install workflow
   *
   * @param packages - Optional packages to install via SCFW or npm
   * @returns Result object with status of both operations
   */
  async run(packages?: PackageSelection[]): Promise<InstallRunnerResult> {
    let scfwSuccess = false;
    let ciSuccess: boolean | null = null;

    // Install new packages via SCFW or npm fallback if provided
    if (packages && packages.length > 0) {
      if (this.useNpmFallback && this.npmInstallService) {
        scfwSuccess = await this.npmInstallService.install(packages);
      } else if (this.scfwService) {
        scfwSuccess = await this.scfwService.install(packages);
      }
    }

    // Always run CI reinstall
    ciSuccess = await this.ciInstallService.run();

    return {
      scfwSuccess,
      ciSuccess,
    };
  }

  /**
   * Runs only SCFW or npm package installation
   *
   * @param packages - Packages to install via SCFW or npm
   * @returns True if installation succeeded, false if skipped
   */
  async runSCFW(packages: PackageSelection[]): Promise<boolean> {
    if (this.useNpmFallback && this.npmInstallService) {
      return await this.npmInstallService.install(packages);
    }
    if (this.scfwService) {
      return await this.scfwService.install(packages);
    }
    return false;
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
