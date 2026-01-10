/**
 * Test Runner
 *
 * Handles execution of test commands.
 * Low-level runner that executes npm test scripts.
 *
 * @module quality/test/TestRunner
 */
import { tryRunCommand } from "../../utils/utils";

export interface TestResult {
  scriptName: string;
  success: boolean;
}

/**
 * Runner for test command execution.
 *
 * Handles the low-level execution of test commands and returns
 * structured results.
 */
export class TestRunner {
  /**
   * Runs the test script
   *
   * @param scriptName - Name of the script to run
   * @returns Result object with success status
   */
  run(scriptName: string): TestResult {
    const success = tryRunCommand("npm", ["run", scriptName]);

    return {
      scriptName,
      success,
    };
  }
}
