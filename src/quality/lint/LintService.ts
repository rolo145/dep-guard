/**
 * Lint Service
 *
 * Orchestrates lint workflow including user confirmation,
 * command execution, and result display.
 *
 * @module quality/lint/LintService
 */
import type { IExecutionContext } from "../../context/IExecutionContext";
import { LintRunner } from "./LintRunner";
import { LintConfirmation } from "./LintConfirmation";

/**
 * Service for orchestrating lint workflow.
 *
 * Combines lint command execution with user interaction and logging.
 */
export class LintService {
  private readonly context: IExecutionContext;
  private runner: LintRunner;
  private confirmation: LintConfirmation;

  /**
   * Creates a new LintService instance.
   *
   * @param context - Workflow context for accessing configuration
   */
  constructor(context: IExecutionContext) {
    this.context = context;
    this.runner = new LintRunner();
    this.confirmation = new LintConfirmation();
  }

  /**
   * Runs the lint script if available and confirmed by the user
   *
   * @returns True if lint succeeded, false if failed, null if skipped
   */
  async run(): Promise<boolean | null> {
    const scriptName = this.context.scriptNames.lint;

    if (!this.context.hasScript(scriptName)) {
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
