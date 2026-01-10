/**
 * Type Check Service
 *
 * Orchestrates type check workflow including user confirmation,
 * command execution, and result display.
 *
 * @module quality/typecheck/TypeCheckService
 */
import type { IExecutionContext } from "../../context/IExecutionContext";
import { TypeCheckRunner } from "./TypeCheckRunner";
import { TypeCheckConfirmation } from "./TypeCheckConfirmation";

/**
 * Service for orchestrating type check workflow.
 *
 * Combines type check command execution with user interaction and logging.
 */
export class TypeCheckService {
  private readonly context: IExecutionContext;
  private runner: TypeCheckRunner;
  private confirmation: TypeCheckConfirmation;

  /**
   * Creates a new TypeCheckService instance.
   *
   * @param context - Workflow context for accessing configuration
   */
  constructor(context: IExecutionContext) {
    this.context = context;
    this.runner = new TypeCheckRunner();
    this.confirmation = new TypeCheckConfirmation();
  }

  /**
   * Runs the type check script if available and confirmed by the user
   *
   * @returns True if type check succeeded, false if failed, null if skipped
   */
  async run(): Promise<boolean | null> {
    const { scriptNames, scripts } = this.context;
    const scriptName = scriptNames.typecheck;

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
