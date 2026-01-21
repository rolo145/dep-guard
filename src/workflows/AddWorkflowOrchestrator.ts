/**
 * Add Workflow Orchestrator
 *
 * Orchestrates the add command workflow for safely adding new dependencies.
 *
 * Workflow steps:
 * 1. Resolve version (user-specified or latest safe)
 * 2. Check if package already exists
 * 3. NPQ security validation + user confirmation
 * 4. Install package + reinstall dependencies
 *
 * @module workflows/AddWorkflowOrchestrator
 */
import type { AddWorkflowOptions, AddWorkflowResult } from "./add/types";
import { ExecutionContextFactory } from "../context/ExecutionContextFactory";
import { isUserCancellation, logCancellation, EXIT_CODE_CANCELLED } from "../errors";
import { ResolveVersionStep } from "./steps/ResolveVersionStep";
import { CheckExistingPackageStep } from "./steps/CheckExistingPackageStep";
import { AddSecurityValidationStep } from "./steps/AddSecurityValidationStep";
import { AddInstallPackageStep } from "./steps/AddInstallPackageStep";
import { NPQService } from "../npq";
import { logger } from "../logger";

/**
 * Orchestrates the add command workflow.
 *
 * Handles all steps from version resolution to package installation,
 * with proper error handling and user cancellation support.
 */
export class AddWorkflowOrchestrator {
  private readonly options: AddWorkflowOptions;
  private readonly startTime: number;

  constructor(options: AddWorkflowOptions) {
    this.options = options;
    this.startTime = Date.now();
  }

  /**
   * Executes the complete add workflow.
   *
   * Handles user cancellation (Ctrl+C) gracefully.
   *
   * @returns Promise resolving to workflow result
   */
  async execute(): Promise<AddWorkflowResult> {
    try {
      return await this.runSteps();
    } catch (error) {
      return this.handleUserCancellation(error);
    }
  }

  /**
   * Runs all workflow steps in sequence.
   */
  private async runSteps(): Promise<AddWorkflowResult> {
    // Create execution context
    const context = ExecutionContextFactory.create({
      days: this.options.days,
      scripts: this.options.scripts,
    });

    // Step 1: Resolve version
    logger.info(`Adding package: ${this.options.packageSpec.name}`);
    logger.newLine();

    const resolveStep = new ResolveVersionStep(context);
    const resolveResult = await resolveStep.execute(this.options.packageSpec);

    if (!resolveResult.success || !resolveResult.package) {
      return this.createFailureResult(
        resolveResult.errorMessage || "Failed to resolve package version",
      );
    }

    const resolved = resolveResult.package;

    // Step 2: Check if package already exists
    const checkExistingStep = new CheckExistingPackageStep(context);
    const checkResult = await checkExistingStep.execute(resolved, this.options.saveDev);

    if (!checkResult.shouldProceed) {
      return this.createCancelledResult(
        checkResult.cancelReason || "Installation cancelled",
      );
    }

    const packageToAdd = checkResult.package!;

    // Step 3: NPQ security validation
    const npqService = new NPQService(context);
    const securityStep = new AddSecurityValidationStep(npqService);
    const securityResult = await securityStep.execute(packageToAdd);

    if (!securityResult.confirmed || !securityResult.package) {
      return this.createCancelledResult(
        securityResult.cancelReason || "Security validation failed or user cancelled",
      );
    }

    const confirmed = securityResult.package;

    // Step 4: Install package
    const installStep = new AddInstallPackageStep(context, this.options.useNpmFallback);
    const installResult = await installStep.execute(confirmed);

    if (!installResult.success || !installResult.package) {
      return this.createFailureResult(
        installResult.errorMessage || "Installation failed",
      );
    }

    // Success!
    return this.createSuccessResult(installResult.package);
  }

  /**
   * Handles user cancellation (Ctrl+C) during prompts.
   *
   * @param error - The caught error
   * @returns AddWorkflowResult if user cancelled, otherwise re-throws
   */
  private handleUserCancellation(error: unknown): AddWorkflowResult {
    if (isUserCancellation(error)) {
      logCancellation();
      return {
        success: false,
        exitCode: EXIT_CODE_CANCELLED,
        errorMessage: "User cancelled",
      };
    }

    // Re-throw unexpected errors
    throw error;
  }

  /**
   * Creates a success result.
   */
  private createSuccessResult(installedPackage: any): AddWorkflowResult {
    return {
      success: true,
      exitCode: 0,
      package: installedPackage,
    };
  }

  /**
   * Creates a failure result.
   */
  private createFailureResult(errorMessage: string): AddWorkflowResult {
    logger.error(errorMessage);
    return {
      success: false,
      exitCode: 1,
      errorMessage,
    };
  }

  /**
   * Creates a cancelled result (not an error, just user choice).
   */
  private createCancelledResult(reason: string): AddWorkflowResult {
    logger.info(reason);
    return {
      success: false,
      exitCode: 0, // Exit 0 for user cancellation (not an error)
      errorMessage: reason,
    };
  }
}
