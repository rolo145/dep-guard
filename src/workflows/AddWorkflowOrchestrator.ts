import type { AddWorkflowOptions, AddWorkflowResult, InstalledPackage } from "./add/types";
import { ExecutionContextFactory } from "../context/ExecutionContextFactory";
import { isUserCancellation, logCancellation, EXIT_CODE_CANCELLED } from "../errors";
import { ResolveVersionStep } from "./steps/ResolveVersionStep";
import { CheckExistingPackageStep } from "./steps/CheckExistingPackageStep";
import { AddSecurityValidationStep } from "./steps/AddSecurityValidationStep";
import { AddInstallPackageStep } from "./steps/AddInstallPackageStep";
import { NPQService } from "../npq";
import { logger } from "../logger";

export class AddWorkflowOrchestrator {
  private readonly options: AddWorkflowOptions;
  constructor(options: AddWorkflowOptions) {
    this.options = options;
  }

  async execute(): Promise<AddWorkflowResult> {
    try {
      return await this.runSteps();
    } catch (error) {
      return this.handleUserCancellation(error);
    }
  }

  private async runSteps(): Promise<AddWorkflowResult> {
    const context = ExecutionContextFactory.create({
      days: this.options.days,
      scripts: this.options.scripts,
    });
    const npqService = new NPQService(context);

    const resolveStep = new ResolveVersionStep(context);
    const checkStep = new CheckExistingPackageStep(context);
    const securityStep = new AddSecurityValidationStep(npqService);
    const installStep = new AddInstallPackageStep(context, this.options.useNpmFallback);

    logger.info(`Adding package: ${this.options.packageSpec.name}`);
    logger.newLine();

    const resolveResult = await resolveStep.execute(this.options.packageSpec);
    if (!resolveResult.success || !resolveResult.package) {
      return this.createFailureResult(resolveResult.errorMessage ?? "Failed to resolve package version");
    }

    const checkResult = await checkStep.execute(resolveResult.package, this.options.saveDev);
    if (!checkResult.shouldProceed || !checkResult.package) {
      return this.createCancelledResult(checkResult.cancelReason ?? "Installation cancelled");
    }

    const securityResult = await securityStep.execute(checkResult.package);
    if (!securityResult.confirmed || !securityResult.package) {
      return this.createCancelledResult(securityResult.cancelReason ?? "Security validation failed");
    }

    const installResult = await installStep.execute(securityResult.package);
    if (!installResult.success || !installResult.package) {
      return this.createFailureResult(installResult.errorMessage ?? "Installation failed");
    }

    return this.createSuccessResult(installResult.package);
  }

  private handleUserCancellation(error: unknown): AddWorkflowResult {
    if (isUserCancellation(error)) {
      logCancellation();
      return {
        success: false,
        exitCode: EXIT_CODE_CANCELLED,
        errorMessage: "User cancelled",
      };
    }
    throw error;
  }

  private createSuccessResult(installedPackage: InstalledPackage): AddWorkflowResult {
    return {
      success: true,
      exitCode: 0,
      package: installedPackage,
    };
  }

  private createFailureResult(errorMessage: string): AddWorkflowResult {
    logger.error(errorMessage);
    return {
      success: false,
      exitCode: 1,
      errorMessage,
    };
  }

  private createCancelledResult(reason: string): AddWorkflowResult {
    logger.info(reason);
    return {
      success: false,
      exitCode: 0,
      errorMessage: reason,
    };
  }
}
