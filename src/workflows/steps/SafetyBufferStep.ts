/**
 * Safety Buffer Step
 *
 * Step 2: Filters updates by the safety buffer (default 7 days).
 * Only includes packages published at least N days ago.
 *
 * @module workflows/steps/SafetyBufferStep
 */
import type { IWorkflowStep, StepContext, StepResult } from "./IWorkflowStep";
import type { WorkflowStepDef } from "../types";
import type { CheckUpdatesOutput } from "./CheckUpdatesStep";
import { continueWith, exitWith } from "./IWorkflowStep";
import { WORKFLOW_STEPS } from "../types";

/** Output type for this step */
export type SafetyBufferOutput = Record<string, string>;

/**
 * Filters updates by safety buffer.
 *
 * Queries the NPM registry to check publish dates and filters out
 * packages that were published too recently.
 */
export class SafetyBufferStep implements IWorkflowStep<CheckUpdatesOutput, SafetyBufferOutput> {
  readonly name = "SafetyBuffer";
  readonly stepDef: WorkflowStepDef = WORKFLOW_STEPS.SAFETY_BUFFER;

  async execute(
    rawUpdates: CheckUpdatesOutput,
    context: StepContext,
  ): Promise<StepResult<SafetyBufferOutput>> {
    const { services, stats, days } = context;

    const updates = await services.ncu.filterByAge(rawUpdates);

    // Exit if all updates filtered out
    if (Object.keys(updates).length === 0) {
      services.ncu.showNoSafeUpdates(days);
      return exitWith("all_updates_filtered");
    }

    stats.packagesAfterFilter = Object.keys(updates).length;
    services.ncu.showSafeUpdates(stats.packagesAfterFilter);

    return continueWith(updates);
  }
}
