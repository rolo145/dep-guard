/**
 * CI Install Runner
 *
 * Handles execution of dependency reinstall commands.
 *
 * @module install/ci/CIInstallRunner
 */
import { tryRunCommand } from "../../utils/command";

export interface CIInstallResult {
  success: boolean;
}

/**
 * Runner for dependency reinstall command execution.
 */
export class CIInstallRunner {
  /**
   * Runs npm ci with security flags
   *
   * @returns Result object with success status
   */
  run(): CIInstallResult {
    const success = tryRunCommand("npm", ["ci", "--ignore-scripts"]);

    return {
      success,
    };
  }
}
