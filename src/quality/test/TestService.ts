/**
 * Test Service
 *
 * Orchestrates test workflow including user confirmation,
 * command execution, and result display.
 *
 * @module quality/test/TestService
 */
import type { IWorkflowContext } from "../../context/IWorkflowContext";
import { TestRunner } from "./TestRunner";
import { TestConfirmation } from "./TestConfirmation";

/**
 * Service for orchestrating test workflow.
 *
 * Combines test command execution with user interaction and logging.
 */
export class TestService {
  private readonly context: IWorkflowContext;
  private runner: TestRunner;
  private confirmation: TestConfirmation;

  /**
   * Creates a new TestService instance.
   *
   * @param context - Workflow context for accessing configuration
   */
  constructor(context: IWorkflowContext) {
    this.context = context;
    this.runner = new TestRunner();
    this.confirmation = new TestConfirmation();
  }

  /**
   * Runs the test script if available and confirmed by the user
   *
   * @returns True if tests succeeded, false if failed, null if skipped
   */
  async run(): Promise<boolean | null> {
    const { scriptNames, scripts } = this.context;
    const scriptName = scriptNames.test;

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
