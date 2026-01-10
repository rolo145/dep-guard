/**
 * Build Runner
 *
 * Handles execution of build commands.
 * Low-level runner that executes npm build scripts.
 *
 * @module quality/build/BuildRunner
 */
import { tryRunCommand } from "../../utils/command";

export interface BuildResult {
  scriptName: string;
  success: boolean;
}

/**
 * Runner for build command execution.
 *
 * Handles the low-level execution of build commands and returns
 * structured results.
 */
export class BuildRunner {
  /**
   * Runs the build script
   *
   * @param scriptName - Name of the script to run
   * @returns Result object with success status
   */
  run(scriptName: string): BuildResult {
    const success = tryRunCommand("npm", ["run", scriptName]);

    return {
      scriptName,
      success,
    };
  }
}
