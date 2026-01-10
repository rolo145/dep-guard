/**
 * Workflow Step Interface
 *
 * Defines the contract for workflow steps and related types
 * for the step-based orchestration pattern.
 *
 * @module workflows/steps/IWorkflowStep
 */
import type { IWorkflowContext } from "../../context/IWorkflowContext";
import type { WorkflowExitReason, WorkflowStepDef, WorkflowStats } from "../types";
import type { NCUService } from "../../ncu";
import type { NPQService } from "../../npq";
import type { InstallService } from "../../install";
import type { QualityService } from "../../quality";

/** Container for all workflow services */
export interface WorkflowServices {
  ncu: NCUService;
  npq: NPQService;
  install: InstallService;
  quality: QualityService;
}

/** Context passed to each step during execution */
export interface StepContext {
  /** Workflow configuration and package data */
  workflow: IWorkflowContext;
  /** All available services */
  services: WorkflowServices;
  /** Accumulated statistics */
  stats: WorkflowStats;
  /** Safety buffer in days */
  days: number;
}

/** Result returned by a step after execution */
export interface StepResult<T = unknown> {
  /** Whether to continue to next step (false = early exit) */
  continue: boolean;
  /** Reason for early exit (required if continue=false) */
  exitReason?: WorkflowExitReason;
  /** Output data to pass to next step */
  data?: T;
}

/**
 * Interface for workflow steps.
 *
 * Each step receives input from the previous step and produces
 * output for the next step. Steps can signal early exit by
 * returning continue=false.
 *
 * @typeParam TInput - Type of input from previous step
 * @typeParam TOutput - Type of output for next step
 */
export interface IWorkflowStep<TInput = unknown, TOutput = unknown> {
  /** Human-readable step name */
  readonly name: string;

  /** Step definition with number, total, and label for logging */
  readonly stepDef: WorkflowStepDef;

  /**
   * Executes the step logic.
   *
   * @param input - Data from previous step
   * @param context - Step execution context with services and stats
   * @returns Promise resolving to step result
   */
  execute(input: TInput, context: StepContext): Promise<StepResult<TOutput>>;
}

/**
 * Helper to create a continue result with data.
 */
export function continueWith<T>(data: T): StepResult<T> {
  return { continue: true, data };
}

/**
 * Helper to create an early exit result.
 */
export function exitWith(reason: WorkflowExitReason): StepResult<never> {
  return { continue: false, exitReason: reason };
}
