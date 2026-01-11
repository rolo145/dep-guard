/**
 * Build Service
 *
 * Orchestrates build workflow including user confirmation,
 * command execution, and result display.
 *
 * @module quality/build/BuildService
 */
import type { IExecutionContext } from "../../context/IExecutionContext";
import { BuildRunner } from "./BuildRunner";
import { BuildConfirmation } from "./BuildConfirmation";

/**
 * Service for orchestrating build workflow.
 *
 * Combines build command execution with user interaction and logging.
 */
export class BuildService {
  private readonly context: IExecutionContext;
  private runner: BuildRunner;
  private confirmation: BuildConfirmation;

  /**
   * Creates a new BuildService instance.
   *
   * @param context - Workflow context for accessing configuration
   */
  constructor(context: IExecutionContext) {
    this.context = context;
    this.runner = new BuildRunner();
    this.confirmation = new BuildConfirmation();
  }

  /**
   * Runs the build script if available and confirmed by the user
   *
   * @returns True if build succeeded, false if failed, null if skipped
   */
  async run(): Promise<boolean | null> {
    const scriptName = this.context.scriptNames.build;

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
