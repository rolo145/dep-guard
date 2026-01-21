/**
 * Bootstrap Install Runner
 *
 * Handles execution of fresh install commands from package.json.
 *
 * @module install/bootstrap/BootstrapInstallRunner
 */
import { tryRunCommand } from "../../utils/command";
import type { IExecutionContext } from "../../context/IExecutionContext";

export interface BootstrapInstallResult {
  success: boolean;
}

/**
 * Runner for fresh install command execution.
 *
 * Executes `npm install` (or `scfw run npm install`) with no package arguments,
 * installing all dependencies from package.json and regenerating package-lock.json.
 */
export class BootstrapInstallRunner {
  private readonly context: IExecutionContext;
  private readonly useNpmFallback: boolean;

  constructor(context: IExecutionContext, useNpmFallback: boolean) {
    this.context = context;
    this.useNpmFallback = useNpmFallback;
  }

  /**
   * Runs fresh install with scfw or npm fallback
   *
   * @returns Result object with success status
   */
  run(): BootstrapInstallResult {
    if (this.useNpmFallback) {
      return this.runNpm();
    }
    return this.runScfw();
  }

  /**
   * Runs fresh install via scfw with security flags
   *
   * Command: scfw run npm install --ignore-scripts --before <date>
   *
   * @returns Result object with success status
   */
  private runScfw(): BootstrapInstallResult {
    const success = tryRunCommand("scfw", [
      "run",
      "npm",
      "install",
      "--ignore-scripts",
      "--before",
      this.context.cutoffIso,
    ]);

    return {
      success,
    };
  }

  /**
   * Runs fresh install via npm with security flags
   *
   * Command: npm install --ignore-scripts --before <date>
   *
   * @returns Result object with success status
   */
  private runNpm(): BootstrapInstallResult {
    const success = tryRunCommand("npm", [
      "install",
      "--ignore-scripts",
      "--before",
      this.context.cutoffIso,
    ]);

    return {
      success,
    };
  }
}
