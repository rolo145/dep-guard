/**
 * Quality Checks Step
 *
 * Step 8: Runs optional quality checks (lint, type checking, tests).
 *
 * @module workflows/steps/QualityChecksStep
 */
import type { IWorkflowStep, StepContext, StepResult } from "./IWorkflowStep";
import type { WorkflowStepDef } from "../types";
import type { ReinstallDependenciesOutput } from "./ReinstallDependenciesStep";
import type { PackageSelection } from "../../ncu/types";
import { continueWith } from "./IWorkflowStep";
import { WORKFLOW_STEPS } from "../types";

/** Output type for this step - passes through packages for stats */
export type QualityChecksOutput = PackageSelection[];

/**
 * Runs quality checks on the updated codebase.
 *
 * Optionally runs lint, type checking, and tests based on
 * configured script names. Each check prompts for confirmation.
 */
export class QualityChecksStep
  implements IWorkflowStep<ReinstallDependenciesOutput, QualityChecksOutput>
{
  readonly name = "QualityChecks";
  readonly stepDef: WorkflowStepDef = WORKFLOW_STEPS.QUALITY;

  async execute(
    packagesToInstall: ReinstallDependenciesOutput,
    context: StepContext,
  ): Promise<StepResult<QualityChecksOutput>> {
    const { services } = context;

    // Optional: lint, type checking, tests
    await services.quality.runAll();

    return continueWith(packagesToInstall);
  }
}
