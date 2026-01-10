/**
 * Install Packages Step
 *
 * Step 6: Installs confirmed packages via SCFW (Supply Chain Firewall).
 *
 * @module workflows/steps/InstallPackagesStep
 */
import type { IWorkflowStep, StepContext, StepResult } from "./IWorkflowStep";
import type { WorkflowStepDef } from "../types";
import type { SecurityValidationOutput } from "./SecurityValidationStep";
import type { PackageSelection } from "../../ncu/types";
import { continueWith } from "./IWorkflowStep";
import { WORKFLOW_STEPS } from "../types";

/** Output type for this step - passes through packages for stats */
export type InstallPackagesOutput = PackageSelection[];

/**
 * Installs packages via SCFW.
 *
 * Uses Supply Chain Firewall with security flags:
 * - --save-exact: Locks exact versions
 * - --ignore-scripts: Prevents malicious install scripts
 * - --before: Only installs if package existed N days ago
 */
export class InstallPackagesStep
  implements IWorkflowStep<SecurityValidationOutput, InstallPackagesOutput>
{
  readonly name = "InstallPackages";
  readonly stepDef: WorkflowStepDef = WORKFLOW_STEPS.INSTALL;

  async execute(
    packagesToInstall: SecurityValidationOutput,
    context: StepContext,
  ): Promise<StepResult<InstallPackagesOutput>> {
    const { services } = context;

    // Orchestrates SCFW package installation
    await services.install.installPackages(packagesToInstall);

    return continueWith(packagesToInstall);
  }
}
