/**
 * Update Workflow
 *
 * Main orchestration logic for the safe package update workflow.
 * Coordinates all services and UI components to provide a complete,
 * secure dependency update experience.
 *
 * Workflow steps:
 * 1. Check for available updates (npm-check-updates)
 * 2. Filter by 7-day safety buffer
 * 3. Group and display by update type
 * 4. User selection (interactive prompt)
 * 5. Security validation (NPQ)
 * 6. Secure installation (scfw)
 * 7. Dependency reinstall (npm ci)
 * 8. Quality checks (lint, types, tests)
 * 9. Build verification
 *
 * @module workflows/updateWorkflow
 */
import type { IWorkflowContext } from "../context/IWorkflowContext";
import type {
  WorkflowOptions,
  WorkflowResult,
  WorkflowStats,
  WorkflowStepDef,
} from "./types";
import { WORKFLOW_STEPS } from "./types";
import { WorkflowContextFactory } from "../context/WorkflowContextFactory";
import { NPQService } from "../npq";
import { InstallService } from "../install";
import { QualityService } from "../quality";
import { logger } from "../logger";
import { NCUService } from "../ncu";

/** Workflow services container */
interface WorkflowServices {
  ncu: NCUService;
  npq: NPQService;
  install: InstallService;
  quality: QualityService;
}

/**
 * Creates all workflow services with the given context.
 *
 * @param context - Workflow context for dependency injection
 * @returns Container with all initialized services
 */
function createServices(context: IWorkflowContext): WorkflowServices {
  return {
    ncu: new NCUService(context),
    npq: new NPQService(context),
    install: new InstallService(context),
    quality: new QualityService(context),
  };
}

/**
 * Logs a workflow step using the step definition.
 *
 * @param step - Step definition with number, total, and label
 */
function logStep(step: WorkflowStepDef): void {
  logger.step(step.num, step.total, step.label);
}

/**
 * Creates a successful early exit result.
 *
 * @param reason - The reason for early exit
 * @param stats - Optional partial stats collected so far
 * @returns WorkflowResult with success=true, exitCode=0
 */
function earlyExit(
  reason: WorkflowResult["reason"],
  stats?: Partial<WorkflowStats>,
): WorkflowResult {
  return {
    success: true,
    exitCode: 0,
    reason,
    stats: stats as WorkflowStats | undefined,
  };
}

/**
 * Handles user cancellation (Ctrl+C) during prompts.
 * Returns a result instead of calling process.exit().
 *
 * @param error - The caught error
 * @returns WorkflowResult if user cancelled, otherwise re-throws
 */
function handleUserCancellation(error: unknown): WorkflowResult {
  // Check if this is a user cancellation (Ctrl+C in inquirer)
  const isUserCancellation =
    error instanceof Error &&
    (error.name === "ExitPromptError" || error.message.includes("User force closed"));

  if (isUserCancellation) {
    console.log("\n");
    logger.info("Operation cancelled by user");
    logger.info("No changes were made to your dependencies.");
    return earlyExit("user_cancelled");
  }

  // Re-throw unexpected errors
  throw error;
}

/**
 * Executes the complete update workflow.
 *
 * @param options - Workflow configuration options
 * @returns Promise resolving to workflow result
 */
export async function executeUpdateWorkflow(
  options: WorkflowOptions,
): Promise<WorkflowResult> {
  try {
    return await runWorkflow(options);
  } catch (error) {
    return handleUserCancellation(error);
  }
}

/**
 * Runs the main workflow logic.
 *
 * @param options - Workflow configuration options
 * @returns Promise resolving to workflow result
 */
async function runWorkflow(options: WorkflowOptions): Promise<WorkflowResult> {
  const { days, scripts } = options;
  const startTime = Date.now();

  // Create workflow context using factory (enables DI and testing)
  const context = WorkflowContextFactory.create({ days, scripts });
  const { allDependencies } = context;

  // Create all services upfront
  const services = createServices(context);

  // Initialize stats tracking
  const stats: Partial<WorkflowStats> = {
    packagesFound: 0,
    packagesAfterFilter: 0,
    packagesSelected: 0,
    packagesInstalled: 0,
    packagesSkipped: 0,
    durationMs: 0,
  };

  // ============================================================================
  // Step 1: Check for available updates
  // ============================================================================
  logStep(WORKFLOW_STEPS.CHECK_UPDATES);

  const rawUpdates = await services.ncu.loadUpdates();

  // Exit if no updates available
  if (!rawUpdates || Object.keys(rawUpdates).length === 0) {
    services.ncu.showNoUpdates();
    return earlyExit("no_updates_available", stats);
  }

  stats.packagesFound = Object.keys(rawUpdates).length;
  services.ncu.showPotentialUpdates(stats.packagesFound);

  // ============================================================================
  // Step 2: Apply safety buffer (7-day filter by default)
  // ============================================================================
  logStep(WORKFLOW_STEPS.SAFETY_BUFFER);

  const updates = await services.ncu.filterByAge(rawUpdates);

  // Exit if all updates filtered out
  if (Object.keys(updates).length === 0) {
    services.ncu.showNoSafeUpdates(days);
    return earlyExit("all_updates_filtered", stats);
  }

  stats.packagesAfterFilter = Object.keys(updates).length;
  services.ncu.showSafeUpdates(stats.packagesAfterFilter);

  // ============================================================================
  // Step 3: Group updates by type and prepare display
  // ============================================================================
  logStep(WORKFLOW_STEPS.ORGANIZE);

  const { grouped, choices } = services.ncu.buildChoices(updates, allDependencies);
  services.ncu.showGroupSummary(grouped);

  // ============================================================================
  // Step 4: Interactive package selection
  // ============================================================================
  logStep(WORKFLOW_STEPS.SELECT);

  const selected = await services.ncu.promptSelection(choices);

  // Exit if no packages selected
  if (selected.length === 0) {
    logger.warning("No packages selected");
    return earlyExit("no_packages_selected", stats);
  }

  stats.packagesSelected = selected.length;
  logger.success(`Selected ${stats.packagesSelected} package(s) for update`);

  // ============================================================================
  // Step 5: Security validation pipeline
  // ============================================================================
  logStep(WORKFLOW_STEPS.SECURITY);

  // Validates each package with NPQ and gets user confirmation
  const packagesToInstall = await services.npq.processSelection(selected);

  // Exit if no packages passed validation and confirmation
  if (packagesToInstall.length === 0) {
    logger.warning("No packages confirmed for installation");
    return earlyExit("no_packages_confirmed", stats);
  }

  // ============================================================================
  // Step 6: Install packages via scfw
  // ============================================================================
  logStep(WORKFLOW_STEPS.INSTALL);

  // Orchestrates SCFW package installation
  await services.install.installPackages(packagesToInstall);

  // ============================================================================
  // Step 7: Reinstall all dependencies
  // ============================================================================
  logStep(WORKFLOW_STEPS.REINSTALL);

  // Ensures package-lock.json is consistent and all transitive deps are correct
  await services.install.reinstall();

  // ============================================================================
  // Step 8: Quality checks
  // ============================================================================
  logStep(WORKFLOW_STEPS.QUALITY);

  // Optional: lint, type checking, tests
  await services.quality.runAll();

  // ============================================================================
  // Step 9: Build verification
  // ============================================================================
  logStep(WORKFLOW_STEPS.BUILD);

  // Optional: ensure project still builds successfully
  await services.quality.runBuild();

  // ============================================================================
  // Success!
  // ============================================================================
  const endTime = Date.now();
  stats.durationMs = endTime - startTime;
  stats.packagesInstalled = packagesToInstall.length;
  stats.packagesSkipped = selected.length - packagesToInstall.length;

  logger.summaryTable("UPDATE COMPLETE", {
    "Packages updated": stats.packagesInstalled,
    "Packages skipped": stats.packagesSkipped,
    "Time taken": `${(stats.durationMs / 1000).toFixed(1)}s`,
  });

  return {
    success: true,
    exitCode: 0,
    reason: "completed",
    stats: stats as WorkflowStats,
  };
}
