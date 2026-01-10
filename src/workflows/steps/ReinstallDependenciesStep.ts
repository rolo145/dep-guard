/**
 * Reinstall Dependencies Step
 *
 * Step 7: Reinstalls all dependencies via npm ci to ensure
 * package-lock.json consistency.
 *
 * @module workflows/steps/ReinstallDependenciesStep
 */
import type { IWorkflowStep, StepContext, StepResult } from "./IWorkflowStep";
import type { WorkflowStepDef } from "../types";
import type { InstallPackagesOutput } from "./InstallPackagesStep";
import type { PackageSelection } from "../../ncu/types";
import { continueWith } from "./IWorkflowStep";
import { WORKFLOW_STEPS } from "../types";

/** Output type for this step - passes through packages for stats */
export type ReinstallDependenciesOutput = PackageSelection[];

/**
 * Reinstalls all dependencies.
 *
 * Runs npm ci to ensure package-lock.json is consistent
 * and all transitive dependencies are correct.
 */
export class ReinstallDependenciesStep
  implements IWorkflowStep<InstallPackagesOutput, ReinstallDependenciesOutput>
{
  readonly name = "ReinstallDependencies";
  readonly stepDef: WorkflowStepDef = WORKFLOW_STEPS.REINSTALL;

  async execute(
    packagesToInstall: InstallPackagesOutput,
    context: StepContext,
  ): Promise<StepResult<ReinstallDependenciesOutput>> {
    const { services } = context;

    // Ensures package-lock.json is consistent and all transitive deps are correct
    await services.install.reinstall();

    return continueWith(packagesToInstall);
  }
}
