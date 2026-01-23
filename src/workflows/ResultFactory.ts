/**
 * Result Factory
 *
 * Factory for creating standardized workflow result objects.
 * Eliminates duplication of result-building logic across workflow orchestrators.
 *
 * @module workflows/ResultFactory
 */
import type { WorkflowResult, WorkflowExitReason, WorkflowStats } from "./types";
import { EXIT_CODE_CANCELLED } from "../errors";

/**
 * Factory for creating workflow results with consistent structure.
 *
 * Centralizes result creation logic to ensure all workflows return
 * properly formatted results with correct exit codes.
 */
export class ResultFactory {
  /**
   * Creates a success result.
   *
   * @param reason - Reason for workflow completion
   * @param stats - Optional workflow statistics
   * @returns WorkflowResult with success=true, exitCode=0
   */
  static success(reason: WorkflowExitReason, stats?: WorkflowStats): WorkflowResult {
    return {
      success: true,
      exitCode: 0,
      reason,
      stats,
    };
  }

  /**
   * Creates a failure result.
   *
   * @param reason - Reason for workflow failure
   * @param stats - Optional workflow statistics
   * @returns WorkflowResult with success=false, exitCode=1
   */
  static failure(reason: WorkflowExitReason, stats?: WorkflowStats): WorkflowResult {
    return {
      success: false,
      exitCode: 1,
      reason,
      stats,
    };
  }

  /**
   * Creates a cancellation result (user cancelled via Ctrl+C or prompt).
   *
   * Uses exit code 130 (SIGINT standard).
   *
   * @param stats - Optional workflow statistics
   * @returns WorkflowResult with success=false, exitCode=130, reason="user_cancelled"
   */
  static cancelled(stats?: WorkflowStats): WorkflowResult {
    return {
      success: false,
      exitCode: EXIT_CODE_CANCELLED,
      reason: "user_cancelled",
      stats,
    };
  }

  /**
   * Creates an early exit result (successful but incomplete).
   *
   * Used when workflow exits early due to no updates, no selection, etc.
   * These are not errors - just early completion scenarios.
   *
   * @param reason - Reason for early exit (e.g., "no_updates_available")
   * @param stats - Optional workflow statistics
   * @returns WorkflowResult with success=true, exitCode=0
   */
  static earlyExit(reason: WorkflowExitReason, stats?: WorkflowStats): WorkflowResult {
    return {
      success: true,
      exitCode: 0,
      reason,
      stats,
    };
  }
}
