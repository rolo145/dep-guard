/**
 * Select Packages Step
 *
 * Step 4: Prompts user to select which packages to update
 * from the organized list.
 *
 * @module workflows/steps/SelectPackagesStep
 */
import type { IWorkflowStep, StepContext, StepResult } from "./IWorkflowStep";
import type { WorkflowStepDef } from "../types";
import type { OrganizeUpdatesOutput } from "./OrganizeUpdatesStep";
import type { PackageSelection } from "../../ncu/types";
import { continueWith, exitWith } from "./IWorkflowStep";
import { WORKFLOW_STEPS } from "../types";
import { logger } from "../../logger";

/** Output type for this step */
export type SelectPackagesOutput = PackageSelection[];

/**
 * Prompts user to select packages for update.
 *
 * Displays an interactive checkbox prompt with grouped packages.
 * Exits early if no packages are selected.
 */
export class SelectPackagesStep implements IWorkflowStep<OrganizeUpdatesOutput, SelectPackagesOutput> {
  readonly name = "SelectPackages";
  readonly stepDef: WorkflowStepDef = WORKFLOW_STEPS.SELECT;

  async execute(
    input: OrganizeUpdatesOutput,
    context: StepContext,
  ): Promise<StepResult<SelectPackagesOutput>> {
    const { services, stats } = context;

    const selected = await services.ncu.promptSelection(input.choices);

    // Exit if no packages selected
    if (selected.length === 0) {
      logger.warning("No packages selected");
      return exitWith("no_packages_selected");
    }

    stats.packagesSelected = selected.length;
    logger.success(`Selected ${stats.packagesSelected} package(s) for update`);

    return continueWith(selected);
  }
}
