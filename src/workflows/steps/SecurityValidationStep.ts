/**
 * Security Validation Step
 *
 * Step 5: Validates each selected package through NPQ security checks
 * and prompts user for confirmation.
 *
 * @module workflows/steps/SecurityValidationStep
 */
import type { IWorkflowStep, StepContext, StepResult } from "./IWorkflowStep";
import type { WorkflowStepDef } from "../types";
import type { SelectPackagesOutput } from "./SelectPackagesStep";
import type { PackageSelection } from "../../ncu/types";
import { continueWith, exitWith } from "./IWorkflowStep";
import { WORKFLOW_STEPS } from "../types";
import { logger } from "../../logger";

/** Output type for this step */
export type SecurityValidationOutput = PackageSelection[];

/**
 * Validates packages through security pipeline.
 *
 * Runs NPQ security checks on each selected package and prompts
 * user to confirm installation. Exits early if no packages are confirmed.
 */
export class SecurityValidationStep
  implements IWorkflowStep<SelectPackagesOutput, SecurityValidationOutput>
{
  readonly name = "SecurityValidation";
  readonly stepDef: WorkflowStepDef = WORKFLOW_STEPS.SECURITY;

  async execute(
    selected: SelectPackagesOutput,
    context: StepContext,
  ): Promise<StepResult<SecurityValidationOutput>> {
    const { services } = context;

    // Validates each package with NPQ and gets user confirmation
    const packagesToInstall = await services.npq.processSelection(selected);

    // Exit if no packages passed validation and confirmation
    if (packagesToInstall.length === 0) {
      logger.warning("No packages confirmed for installation");
      return exitWith("no_packages_confirmed");
    }

    return continueWith(packagesToInstall);
  }
}
