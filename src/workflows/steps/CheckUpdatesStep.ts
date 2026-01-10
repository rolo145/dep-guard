/**
 * Check Updates Step
 *
 * Step 1: Checks for available package updates using npm-check-updates.
 *
 * @module workflows/steps/CheckUpdatesStep
 */
import type { IWorkflowStep, StepContext, StepResult } from "./IWorkflowStep";
import type { WorkflowStepDef } from "../types";
import { continueWith, exitWith } from "./IWorkflowStep";
import { WORKFLOW_STEPS } from "../types";

/** Output type for this step */
export type CheckUpdatesOutput = Record<string, string>;

/**
 * Checks for available package updates.
 *
 * Queries npm-check-updates to find packages with newer versions.
 * Exits early if no updates are available.
 */
export class CheckUpdatesStep implements IWorkflowStep<void, CheckUpdatesOutput> {
  readonly name = "CheckUpdates";
  readonly stepDef: WorkflowStepDef = WORKFLOW_STEPS.CHECK_UPDATES;

  async execute(_input: void, context: StepContext): Promise<StepResult<CheckUpdatesOutput>> {
    const { services, stats } = context;

    const rawUpdates = await services.ncu.loadUpdates();

    // Exit if no updates available
    if (!rawUpdates || Object.keys(rawUpdates).length === 0) {
      services.ncu.showNoUpdates();
      return exitWith("no_updates_available");
    }

    stats.packagesFound = Object.keys(rawUpdates).length;
    services.ncu.showPotentialUpdates(stats.packagesFound);

    return continueWith(rawUpdates);
  }
}
