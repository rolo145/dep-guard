/**
 * SCFW Runner
 *
 * Handles execution of scfw (Supply Chain Firewall) commands.
 * Installs packages with security flags and time-based restrictions.
 *
 * Security measures:
 * - --save-exact: Locks to exact versions (no range operators)
 * - --ignore-scripts: Prevents malicious install scripts
 * - --before flag: Only installs if package existed N days ago
 *
 * @module install/scfw/SCFWRunner
 * @see https://github.com/DataDog/supply-chain-firewall
 */
import type { IWorkflowContext } from "../../context/IWorkflowContext";
import { tryRunCommand } from "../../utils/command";

export interface SCFWInstallResult {
  packageSpecs: string[];
  success: boolean;
}

/**
 * Runner for SCFW command execution.
 *
 * Handles the low-level execution of scfw commands and returns
 * structured results.
 */
export class SCFWRunner {
  private readonly context: IWorkflowContext;

  /**
   * Creates a new SCFWRunner instance.
   *
   * @param context - Workflow context for accessing configuration
   */
  constructor(context: IWorkflowContext) {
    this.context = context;
  }

  /**
   * Builds scfw install command arguments with security flags
   *
   * @param packageSpecs - Array of package specs (e.g., ["chalk@5.0.0"])
   * @returns Array of command arguments for scfw
   */
  private buildInstallArgs(packageSpecs: string[]): string[] {
    return [
      "run",
      "npm",
      "install",
      ...packageSpecs,
      "--save-exact",
      "--ignore-scripts",
      "--before",
      this.context.cutoffIso,
    ];
  }

  /**
   * Installs packages using scfw with security flags
   *
   * @param packageSpecs - Array of package specs (e.g., ["chalk@5.0.0"])
   * @returns Result object with success status
   */
  install(packageSpecs: string[]): SCFWInstallResult {
    const args = this.buildInstallArgs(packageSpecs);
    const success = tryRunCommand("scfw", args);

    return {
      packageSpecs,
      success,
    };
  }

  /**
   * Installs a single package using scfw
   *
   * @param packageSpec - Package spec (e.g., "chalk@5.0.0")
   * @returns Result object with success status
   */
  installSingle(packageSpec: string): SCFWInstallResult {
    return this.install([packageSpec]);
  }
}
