/**
 * Lint Service
 *
 * Orchestrates lint workflow including user confirmation,
 * command execution, and result display.
 *
 * @module quality/lint/LintService
 */
import { WorkflowContext } from "../../context";
import { LintRunner } from "./LintRunner";
import { LintConfirmation } from "./LintConfirmation";

/**
 * Service for orchestrating lint workflow.
 *
 * Combines lint command execution with user interaction and logging.
 */
export class LintService {
  private runner: LintRunner;
  private confirmation: LintConfirmation;

  constructor() {
    this.runner = new LintRunner();
    this.confirmation = new LintConfirmation();
  }

  /**
   * Runs the lint script if available and confirmed by the user
   *
   * @returns True if lint succeeded, false if failed, null if skipped
   */
  async run(): Promise<boolean | null> {
    const { scriptNames, scripts } = WorkflowContext.getInstance();
    const scriptName = scriptNames.lint;

    if (!scripts[scriptName]) {
      this.confirmation.showScriptNotFound(scriptName);
      return null;
    }

    this.confirmation.showHeader();
    this.confirmation.showScriptName(scriptName);

    const shouldRun = await this.confirmation.confirmRun(scriptName);
    if (!shouldRun) {
      return null;
    }

    const spinner = this.confirmation.showProgress();
    const result = this.runner.run(scriptName);

    if (result.success) {
      this.confirmation.showSuccess(spinner);
      return true;
    }

    this.confirmation.showFailure(spinner);
    return false;
  }
}
