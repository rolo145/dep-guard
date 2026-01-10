/**
 * Workflows Module
 *
 * Exports workflow functions, classes, and types.
 *
 * @module workflows
 */

// Orchestrator class
export { WorkflowOrchestrator } from "./WorkflowOrchestrator";

// Types
export type {
  WorkflowOptions,
  WorkflowResult,
  WorkflowStats,
  WorkflowExitReason,
  WorkflowStep,
  WorkflowStepDef,
} from "./types";
export { WORKFLOW_STEPS } from "./types";

// Steps (re-export from steps module)
export type {
  IWorkflowStep,
  StepContext,
  StepResult,
  WorkflowServices,
  StepData,
  StepDataFor,
} from "./steps";
export {
  CheckUpdatesStep,
  SafetyBufferStep,
  OrganizeUpdatesStep,
  SelectPackagesStep,
  SecurityValidationStep,
  InstallPackagesStep,
  ReinstallDependenciesStep,
  QualityChecksStep,
  BuildVerificationStep,
  continueWith,
  continueWithStep,
  exitWith,
} from "./steps";
