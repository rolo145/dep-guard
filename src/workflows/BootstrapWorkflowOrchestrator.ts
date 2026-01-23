/**
 * Bootstrap Workflow Orchestrator
 *
 * Orchestrates the fresh install workflow for installing all dependencies
 * from package.json.
 *
 * @module workflows/BootstrapWorkflowOrchestrator
 */
import type { WorkflowResult, WorkflowStats } from "./types";
import { BootstrapInstallService } from "../install/bootstrap/BootstrapInstallService";
import { isUserCancellation, logCancellation } from "../errors";
import type { IExecutionContext } from "../context/IExecutionContext";
import type { ScriptOptions } from "../args/types";
import { ExecutionContextFactory } from "../context/ExecutionContextFactory";
import { ResultFactory } from "./ResultFactory";

export interface BootstrapWorkflowOptions {
  /** Number of days for safety buffer (default: 7) */
  days: number;
  /** Script options (install hooks, etc.) */
  scripts: ScriptOptions;
  /** Whether to use npm install fallback instead of scfw */
  useNpmFallback: boolean;
}

/**
 * Orchestrates the bootstrap (fresh install) workflow.
 *
 * This is a simpler workflow than the update workflow - it just:
 * 1. Confirms with user
 * 2. Runs fresh install from package.json
 * 3. Returns result
 *
 * No update checking, no package selection, no quality checks.
 */
export class BootstrapWorkflowOrchestrator {
  private readonly context: IExecutionContext;
  private readonly useNpmFallback: boolean;
  private readonly startTime: number;

  constructor(options: BootstrapWorkflowOptions) {
    this.useNpmFallback = options.useNpmFallback;
    this.startTime = Date.now();
    this.context = ExecutionContextFactory.create({
      days: options.days,
      scripts: options.scripts,
    });
  }

  /**
   * Executes the complete bootstrap workflow.
   *
   * Handles user cancellation (Ctrl+C) gracefully.
   *
   * @returns Promise resolving to workflow result
   */
  async execute(): Promise<WorkflowResult> {
    try {
      return await this.runInstall();
    } catch (error) {
      return this.handleUserCancellation(error);
    }
  }

  /**
   * Runs the fresh install workflow.
   */
  private async runInstall(): Promise<WorkflowResult> {
    const service = new BootstrapInstallService(this.context, this.useNpmFallback);
    const result = await service.run();

    // User skipped install
    if (result === null) {
      return this.createSkippedResult();
    }

    // Install succeeded
    if (result === true) {
      return this.createSuccessResult();
    }

    // Install failed (should not reach here as service exits on failure)
    return this.createFailureResult();
  }

  /**
   * Handles user cancellation (Ctrl+C) during prompts.
   *
   * @param error - The caught error
   * @returns WorkflowResult if user cancelled, otherwise re-throws
   */
  private handleUserCancellation(error: unknown): WorkflowResult {
    if (isUserCancellation(error)) {
      logCancellation();
      return this.createCancellationResult();
    }

    // Re-throw unexpected errors
    throw error;
  }

  /**
   * Creates stats object for workflow result.
   */
  private createStats(): WorkflowStats {
    return {
      packagesFound: 0,
      packagesAfterFilter: 0,
      packagesSelected: 0,
      packagesInstalled: 0,
      packagesSkipped: 0,
      durationMs: Date.now() - this.startTime,
    };
  }

  /**
   * Creates a success result after install completes.
   */
  private createSuccessResult(): WorkflowResult {
    return ResultFactory.success("completed", this.createStats());
  }

  /**
   * Creates a skipped result when user declines install.
   */
  private createSkippedResult(): WorkflowResult {
    return ResultFactory.earlyExit("no_packages_selected", this.createStats());
  }

  /**
   * Creates a failure result when install fails.
   */
  private createFailureResult(): WorkflowResult {
    return ResultFactory.failure("completed", this.createStats());
  }

  /**
   * Creates a cancellation result with standard SIGINT exit code.
   */
  private createCancellationResult(): WorkflowResult {
    return ResultFactory.cancelled(this.createStats());
  }
}
