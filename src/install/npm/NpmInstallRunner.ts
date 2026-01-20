/**
 * NPM Install Runner
 *
 * Handles execution of npm install commands as a fallback when scfw is not available.
 * Installs packages with security flags and time-based restrictions.
 *
 * Security measures:
 * - --save-exact: Locks to exact versions (no range operators)
 * - --ignore-scripts: Prevents malicious install scripts
 * - --before flag: Only installs if package existed N days ago
 *
 * @module install/npm/NpmInstallRunner
 */
import type { IExecutionContext } from "../../context/IExecutionContext";
import { tryRunCommand } from "../../utils/command";

export interface NpmInstallResult {
  packageSpecs: string[];
  success: boolean;
}

/**
 * Runner for npm install command execution (fallback mode).
 *
 * Handles the low-level execution of npm install commands and returns
 * structured results.
 */
export class NpmInstallRunner {
  private readonly context: IExecutionContext;

  /**
   * Creates a new NpmInstallRunner instance.
   *
   * @param context - Workflow context for accessing configuration
   */
  constructor(context: IExecutionContext) {
    this.context = context;
  }

  /**
   * Builds npm install command arguments with security flags
   *
   * @param packageSpecs - Array of package specs (e.g., ["chalk@5.0.0"])
   * @returns Array of command arguments for npm
   */
  private buildInstallArgs(packageSpecs: string[]): string[] {
    return [
      "install",
      ...packageSpecs,
      "--save-exact",
      "--ignore-scripts",
      "--before",
      this.context.cutoffIso,
    ];
  }

  /**
   * Installs packages using npm with security flags
   *
   * @param packageSpecs - Array of package specs (e.g., ["chalk@5.0.0"])
   * @returns Result object with success status
   */
  install(packageSpecs: string[]): NpmInstallResult {
    const args = this.buildInstallArgs(packageSpecs);
    const success = tryRunCommand("npm", args);

    return {
      packageSpecs,
      success,
    };
  }

  /**
   * Installs a single package using npm
   *
   * @param packageSpec - Package spec (e.g., "chalk@5.0.0")
   * @returns Result object with success status
   */
  installSingle(packageSpec: string): NpmInstallResult {
    return this.install([packageSpec]);
  }
}
