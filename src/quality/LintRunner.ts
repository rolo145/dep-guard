/**
 * Lint Runner
 *
 * Handles linting operations with user confirmation and feedback.
 *
 * @module quality/LintRunner
 */
import { confirm } from "@inquirer/prompts";
import { logger } from "../utils/logger";
import { tryRunCommand } from "../utils/utils";
import { WorkflowContext } from "../context";

/**
 * Runner class for executing lint checks.
 *
 * Prompts for user confirmation before running and provides
 * spinner feedback during execution.
 */
export class LintRunner {
  private static readonly CONFIG = {
    scriptKey: "lint" as const,
    displayName: "linter",
    runningMessage: "Running linter...",
    successMessage: "Lint passed",
    failureMessage: "Lint failed",
    warningMessage: "Linting errors detected. Please review and fix them.",
  };

  /**
   * Runs the lint check with user confirmation
   * @returns true if passed, false if failed, null if skipped
   */
  async run(): Promise<boolean | null> {
    const { scriptNames, scripts } = WorkflowContext.getInstance();
    const scriptName = scriptNames[LintRunner.CONFIG.scriptKey];

    if (!scripts[scriptName]) {
      logger.skip(`Skipping ${LintRunner.CONFIG.displayName} (script "${scriptName}" not found)`);
      return null;
    }

    const shouldRun = await confirm({
      message: `Do you want to run ${LintRunner.CONFIG.displayName} (npm run ${scriptName})?`,
      default: false,
    });

    if (!shouldRun) {
      logger.skip(`Skipping ${LintRunner.CONFIG.displayName}`);
      return null;
    }

    const spinner = logger.spinner(LintRunner.CONFIG.runningMessage);
    const passed = tryRunCommand("npm", ["run", scriptName]);

    if (passed) {
      spinner.succeed(LintRunner.CONFIG.successMessage);
    } else {
      spinner.fail(LintRunner.CONFIG.failureMessage);
      logger.warning(LintRunner.CONFIG.warningMessage);
    }

    return passed;
  }
}
