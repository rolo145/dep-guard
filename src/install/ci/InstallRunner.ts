/**
 * Install Runner
 *
 * Handles execution of dependency reinstall commands.
 *
 * @module install/ci/InstallRunner
 */
import { tryRunCommand } from "../../utils/utils";

export interface InstallResult {
  success: boolean;
}

/**
 * Runner for dependency reinstall command execution.
 */
export class InstallRunner {
  /**
   * Runs npm ci with security flags
   *
   * @returns Result object with success status
   */
  run(): InstallResult {
    const success = tryRunCommand("npm", ["ci", "--ignore-scripts"]);

    return {
      success,
    };
  }
}
