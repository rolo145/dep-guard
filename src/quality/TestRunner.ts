/**
 * Test Runner
 *
 * Handles test execution with user confirmation and feedback.
 *
 * @module quality/TestRunner
 */
import { confirm } from "@inquirer/prompts";
import { logger } from "../utils/logger";
import { tryRunCommand } from "../utils/utils";
import { WorkflowContext } from "../context";

/**
 * Runner class for executing tests.
 *
 * Prompts for user confirmation before running and provides
 * spinner feedback during execution.
 */
export class TestRunner {
  private static readonly CONFIG = {
    scriptKey: "test" as const,
    displayName: "tests",
    runningMessage: "Running tests...",
    successMessage: "Tests passed",
    failureMessage: "Tests failed",
    warningMessage: "Some tests failed. Please review and fix them.",
  };

  /**
   * Runs the tests with user confirmation
   * @returns true if passed, false if failed, null if skipped
   */
  async run(): Promise<boolean | null> {
    const { scriptNames, scripts } = WorkflowContext.getInstance();
    const scriptName = scriptNames[TestRunner.CONFIG.scriptKey];

    if (!scripts[scriptName]) {
      logger.skip(`Skipping ${TestRunner.CONFIG.displayName} (script "${scriptName}" not found)`);
      return null;
    }

    const shouldRun = await confirm({
      message: `Do you want to run ${TestRunner.CONFIG.displayName} (npm run ${scriptName})?`,
      default: false,
    });

    if (!shouldRun) {
      logger.skip(`Skipping ${TestRunner.CONFIG.displayName}`);
      return null;
    }

    const spinner = logger.spinner(TestRunner.CONFIG.runningMessage);
    const passed = tryRunCommand("npm", ["run", scriptName]);

    if (passed) {
      spinner.succeed(TestRunner.CONFIG.successMessage);
    } else {
      spinner.fail(TestRunner.CONFIG.failureMessage);
      logger.warning(TestRunner.CONFIG.warningMessage);
    }

    return passed;
  }
}
