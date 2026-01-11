/**
 * Workflow Types
 *
 * Type definitions for the update workflow including configuration,
 * results, and step constants.
 *
 * @module workflows/types
 */
import type { ScriptOptions } from "../args/types";

/** Workflow configuration options */
export interface WorkflowOptions {
  days: number;
  scripts: ScriptOptions;
}

/** Reasons workflow may exit early */
export type WorkflowExitReason =
  | "user_cancelled"
  | "no_updates_available"
  | "all_updates_filtered"
  | "no_packages_selected"
  | "no_packages_confirmed"
  | "completed";

/** Statistics from workflow execution */
export interface WorkflowStats {
  packagesFound: number;
  packagesAfterFilter: number;
  packagesSelected: number;
  packagesInstalled: number;
  packagesSkipped: number;
  durationMs: number;
}

/** Result returned by workflow instead of process.exit() */
export interface WorkflowResult {
  success: boolean;
  /** Exit code: 0 = success, 1 = error, 130 = user cancelled (SIGINT) */
  exitCode: 0 | 1 | 130;
  reason: WorkflowExitReason;
  stats?: WorkflowStats;
}

/** Workflow step definition */
export interface WorkflowStepDef {
  readonly num: number;
  readonly total: number;
  readonly label: string;
}

/** Workflow step constants */
export const WORKFLOW_STEPS = {
  CHECK_UPDATES: { num: 1, total: 9, label: "Checking for available updates" },
  SAFETY_BUFFER: { num: 2, total: 9, label: "Applying safety buffer" },
  ORGANIZE: { num: 3, total: 9, label: "Organizing updates by type" },
  SELECT: { num: 4, total: 9, label: "Select packages to update" },
  SECURITY: { num: 5, total: 9, label: "Security validation" },
  INSTALL: { num: 6, total: 9, label: "Installing packages" },
  REINSTALL: { num: 7, total: 9, label: "Reinstalling all dependencies" },
  QUALITY: { num: 8, total: 9, label: "Quality checks" },
  BUILD: { num: 9, total: 9, label: "Build verification" },
} as const satisfies Record<string, WorkflowStepDef>;

/** Type for workflow step values */
export type WorkflowStep = (typeof WORKFLOW_STEPS)[keyof typeof WORKFLOW_STEPS];
