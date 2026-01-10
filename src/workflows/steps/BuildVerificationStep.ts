/**
 * Build Verification Step
 *
 * Step 9: Runs build verification to ensure project still builds.
 *
 * @module workflows/steps/BuildVerificationStep
 */
import type { IWorkflowStep, StepContext, StepResult } from "./IWorkflowStep";
import type { WorkflowStepDef } from "../types";
import type { QualityChecksOutput } from "./QualityChecksStep";
import type { PackageSelection } from "../../ncu/types";
import { continueWith } from "./IWorkflowStep";
import { WORKFLOW_STEPS } from "../types";

/** Output type for this step - final packages installed */
export type BuildVerificationOutput = PackageSelection[];

/**
 * Verifies the project build.
 *
 * Optionally runs the build script to ensure the project
 * still builds successfully after updates.
 */
export class BuildVerificationStep
  implements IWorkflowStep<QualityChecksOutput, BuildVerificationOutput>
{
  readonly name = "BuildVerification";
  readonly stepDef: WorkflowStepDef = WORKFLOW_STEPS.BUILD;

  async execute(
    packagesToInstall: QualityChecksOutput,
    context: StepContext,
  ): Promise<StepResult<BuildVerificationOutput>> {
    const { services } = context;

    // Optional: ensure project still builds successfully
    await services.quality.runBuild();

    return continueWith(packagesToInstall);
  }
}
