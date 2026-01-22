/**
 * Workflow Orchestrator
 *
 * Main orchestration class for the safe package update workflow.
 * Coordinates step execution and manages workflow state.
 *
 * @module workflows/WorkflowOrchestrator
 */
import type { IExecutionContext } from "../context/IExecutionContext";
import type { WorkflowOptions, WorkflowResult, WorkflowStats, WorkflowStepDef } from "./types";
import type { IWorkflowStep, StepContext, StepResult, WorkflowServices, StepData } from "./steps";
import type { PackageSelection, VersionBumpType, PackageUpdate, GroupedUpdates } from "../ncu/types";
import type { OrganizeUpdatesOutput } from "./steps/OrganizeUpdatesStep";
import { ExecutionContextFactory } from "../context/ExecutionContextFactory";
import { NCUService } from "../ncu";
import { NPQService } from "../npq";
import { InstallService } from "../install";
import { QualityService } from "../quality";
import { VersionAnalyzer } from "../ncu/VersionAnalyzer";
import { VersionFormatter } from "../ncu/VersionFormatter";
import { logger } from "../logger";
import { isUserCancellation, logCancellation, EXIT_CODE_CANCELLED } from "../errors";
import chalk from "chalk";
import {
  CheckUpdatesStep,
  SafetyBufferStep,
  OrganizeUpdatesStep,
  SelectPackagesStep,
  SecurityValidationStep,
  InstallPackagesStep,
  ReinstallDependenciesStep,
  QualityChecksStep,
  BuildVerificationStep,
} from "./steps";

/**
 * Orchestrates the update workflow by executing steps in sequence.
 *
 * The orchestrator is responsible for:
 * - Creating the workflow context and services
 * - Instantiating and executing steps in order
 * - Managing state (stats) across steps
 * - Handling early exits and final results
 */
export class WorkflowOrchestrator {
  private readonly options: WorkflowOptions;
  private readonly context: IExecutionContext;
  private readonly services: WorkflowServices;
  private readonly stats: WorkflowStats;
  private readonly startTime: number;

  /**
   * Creates a new WorkflowOrchestrator instance.
   *
   * @param options - Workflow configuration options
   */
  constructor(options: WorkflowOptions) {
    this.options = options;
    this.startTime = Date.now();

    // Create workflow context using factory (enables DI and testing)
    this.context = ExecutionContextFactory.create({
      days: options.days,
      scripts: options.scripts,
    });

    // Create all services
    this.services = this.createServices();

    // Initialize stats
    this.stats = this.initializeStats();
  }

  /**
   * Executes the complete update workflow.
   *
   * Handles user cancellation (Ctrl+C) gracefully.
   *
   * @returns Promise resolving to workflow result
   */
  async execute(): Promise<WorkflowResult> {
    try {
      return await this.runSteps();
    } catch (error) {
      return this.handleUserCancellation(error);
    }
  }

  /**
   * Runs all workflow steps in sequence.
   */
  private async runSteps(): Promise<WorkflowResult> {
    const stepContext = this.createStepContext();

    // Define step pipeline
    const steps: IWorkflowStep[] = [
      new CheckUpdatesStep(),
      new SafetyBufferStep(),
      new OrganizeUpdatesStep(),
      new SelectPackagesStep(),
      new SecurityValidationStep(),
      new InstallPackagesStep(),
      new ReinstallDependenciesStep(),
      new QualityChecksStep(),
      new BuildVerificationStep(),
    ];

    // Execute steps in sequence with typed step data
    let currentStepData: StepData = { step: "init", data: undefined };

    for (const step of steps) {
      this.logStep(step.stepDef);

      const result: StepResult = await step.execute(currentStepData.data, stepContext);

      if (!result.continue) {
        return this.createEarlyExitResult(result.exitReason!);
      }

      // Use stepData if provided, otherwise wrap raw data
      currentStepData = result.stepData ?? { step: "init", data: result.data as undefined };

      // Intercept workflow if in show mode after organizing updates
      if (this.options.show && step instanceof OrganizeUpdatesStep) {
        return this.createShowModeResult(currentStepData.data as OrganizeUpdatesOutput);
      }
    }

    // All steps completed successfully
    return this.createSuccessResult(currentStepData.data as PackageSelection[]);
  }

  /**
   * Handles user cancellation (Ctrl+C) during prompts.
   *
   * @param error - The caught error
   * @returns WorkflowResult if user cancelled, otherwise re-throws
   */
  private handleUserCancellation(error: unknown): WorkflowResult {
    if (isUserCancellation(error)) {
      logCancellation();
      return this.createCancellationResult();
    }

    // Re-throw unexpected errors
    throw error;
  }

  /**
   * Creates all workflow services.
   */
  private createServices(): WorkflowServices {
    return {
      ncu: new NCUService(this.context),
      npq: new NPQService(this.context),
      install: new InstallService(this.context, this.options.useNpmFallback ?? false),
      quality: new QualityService(this.context),
    };
  }

  /**
   * Initializes workflow statistics.
   */
  private initializeStats(): WorkflowStats {
    return {
      packagesFound: 0,
      packagesAfterFilter: 0,
      packagesSelected: 0,
      packagesInstalled: 0,
      packagesSkipped: 0,
      durationMs: 0,
    };
  }

  /**
   * Creates the context passed to each step.
   */
  private createStepContext(): StepContext {
    return {
      workflow: this.context,
      services: this.services,
      stats: this.stats,
      days: this.options.days,
    };
  }

  /**
   * Logs a workflow step.
   */
  private logStep(stepDef: WorkflowStepDef): void {
    logger.step(stepDef.num, stepDef.total, stepDef.label);
  }

  /**
   * Creates an early exit result.
   */
  private createEarlyExitResult(reason: WorkflowResult["reason"]): WorkflowResult {
    this.stats.durationMs = Date.now() - this.startTime;

    return {
      success: true,
      exitCode: 0,
      reason,
      stats: this.stats,
    };
  }

  /**
   * Creates a cancellation result with standard SIGINT exit code.
   */
  private createCancellationResult(): WorkflowResult {
    this.stats.durationMs = Date.now() - this.startTime;

    return {
      success: false,
      exitCode: EXIT_CODE_CANCELLED,
      reason: "user_cancelled",
      stats: this.stats,
    };
  }

  /**
   * Creates a success result after all steps complete.
   */
  private createSuccessResult(packagesToInstall: PackageSelection[]): WorkflowResult {
    this.stats.durationMs = Date.now() - this.startTime;
    this.stats.packagesInstalled = packagesToInstall.length;
    this.stats.packagesSkipped = this.stats.packagesSelected - packagesToInstall.length;

    logger.summaryTable("UPDATE COMPLETE", {
      "Packages updated": this.stats.packagesInstalled,
      "Packages skipped": this.stats.packagesSkipped,
      "Time taken": `${(this.stats.durationMs / 1000).toFixed(1)}s`,
    });

    return {
      success: true,
      exitCode: 0,
      reason: "completed",
      stats: this.stats,
    };
  }

  /**
   * Creates result for show mode display.
   * Displays available updates and exits without installing.
   */
  private createShowModeResult(organizedData: OrganizeUpdatesOutput): WorkflowResult {
    this.stats.durationMs = Date.now() - this.startTime;

    const { grouped } = organizedData;
    this.displayShowModeUpdates(grouped);

    return {
      success: true,
      exitCode: 0,
      reason: "completed",
      stats: this.stats,
    };
  }

  /**
   * Displays available updates in show mode.
   */
  private displayShowModeUpdates(grouped: GroupedUpdates): void {
    logger.newLine();
    logger.header("Available Updates", "📋");
    logger.newLine();

    const totalUpdates = grouped.major.length + grouped.minor.length + grouped.patch.length;

    if (totalUpdates === 0) {
      logger.info("No updates available");
      return;
    }

    // Display each group
    this.displayUpdateGroup("Patch Updates", grouped.patch, "patch", chalk.green);
    this.displayUpdateGroup("Minor Updates", grouped.minor, "minor", chalk.blue);
    this.displayUpdateGroup("Major Updates", grouped.major, "major", chalk.red);

    // Summary
    logger.newLine();
    logger.summaryTable("UPDATE SUMMARY", {
      "Total updates available": totalUpdates,
      "Patch updates": grouped.patch.length,
      "Minor updates": grouped.minor.length,
      "Major updates": grouped.major.length,
      "Safety buffer applied": `${this.options.days} days`,
    });

    logger.info("Run 'dep-guard update' without --show to install these updates");
  }

  /**
   * Displays a single update group.
   */
  private displayUpdateGroup(
    title: string,
    packages: PackageUpdate[],
    bumpType: VersionBumpType,
    colorFn: (text: string) => string
  ): void {
    if (packages.length === 0) {
      return;
    }

    logger.newLine();
    logger.info(colorFn(`${title} (${packages.length})`));
    logger.divider();

    const maxNameLength = VersionAnalyzer.getMaxPackageNameLength({
      major: bumpType === "major" ? packages : [],
      minor: bumpType === "minor" ? packages : [],
      patch: bumpType === "patch" ? packages : [],
    });

    packages.forEach((pkg) => {
      const padding = " ".repeat(maxNameLength - pkg.name.length + 2);
      const versionDisplay = VersionFormatter.formatWithHighlight(
        pkg.currentVersion,
        pkg.newVersion,
        bumpType
      );
      console.log(`  ${pkg.name}${padding}${versionDisplay}`);
    });
  }
}
