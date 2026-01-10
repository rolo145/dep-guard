/**
 * Type Check Runner
 *
 * Handles execution of type check commands.
 * Low-level runner that executes npm typecheck scripts.
 *
 * @module quality/typecheck/TypeCheckRunner
 */
import { tryRunCommand } from "../../utils/command";

export interface TypeCheckResult {
  scriptName: string;
  success: boolean;
}

/**
 * Runner for type check command execution.
 *
 * Handles the low-level execution of type check commands and returns
 * structured results.
 */
export class TypeCheckRunner {
  /**
   * Runs the type check script
   *
   * @param scriptName - Name of the script to run
   * @returns Result object with success status
   */
  run(scriptName: string): TypeCheckResult {
    const success = tryRunCommand("npm", ["run", scriptName]);

    return {
      scriptName,
      success,
    };
  }
}
