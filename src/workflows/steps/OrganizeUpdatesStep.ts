/**
 * Organize Updates Step
 *
 * Step 3: Groups updates by type (major/minor/patch) and prepares
 * choices for the interactive selection prompt.
 *
 * @module workflows/steps/OrganizeUpdatesStep
 */
import type { IWorkflowStep, StepContext, StepResult } from "./IWorkflowStep";
import type { WorkflowStepDef } from "../types";
import type { SafetyBufferOutput } from "./SafetyBufferStep";
import type { GroupedUpdates } from "../../ncu/types";
import type { PromptChoice } from "../../ncu/PromptChoiceBuilder";
import { continueWith } from "./IWorkflowStep";
import { WORKFLOW_STEPS } from "../types";

/** Output type for this step */
export interface OrganizeUpdatesOutput {
  grouped: GroupedUpdates;
  choices: PromptChoice[];
}

/**
 * Organizes updates by version bump type.
 *
 * Groups packages into major, minor, and patch updates,
 * then builds prompt choices for user selection.
 */
export class OrganizeUpdatesStep implements IWorkflowStep<SafetyBufferOutput, OrganizeUpdatesOutput> {
  readonly name = "OrganizeUpdates";
  readonly stepDef: WorkflowStepDef = WORKFLOW_STEPS.ORGANIZE;

  async execute(
    updates: SafetyBufferOutput,
    context: StepContext,
  ): Promise<StepResult<OrganizeUpdatesOutput>> {
    const { services, workflow } = context;

    const { grouped, choices } = services.ncu.buildChoices(updates, workflow.allDependencies);
    services.ncu.showGroupSummary(grouped);

    return continueWith({ grouped, choices });
  }
}
