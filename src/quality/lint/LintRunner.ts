/**
 * Lint Runner
 *
 * Handles execution of lint commands.
 * Low-level runner that executes npm lint scripts.
 *
 * @module quality/lint/LintRunner
 */
import { tryRunCommand } from "../../utils/command";

export interface LintResult {
  scriptName: string;
  success: boolean;
}

/**
 * Runner for lint command execution.
 *
 * Handles the low-level execution of lint commands and returns
 * structured results.
 */
export class LintRunner {
  /**
   * Runs the lint script
   *
   * @param scriptName - Name of the script to run
   * @returns Result object with success status
   */
  run(scriptName: string): LintResult {
    const success = tryRunCommand("npm", ["run", scriptName]);

    return {
      scriptName,
      success,
    };
  }
}
