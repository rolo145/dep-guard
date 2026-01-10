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
import type { ScriptOptions } from "../args/types";
import { WorkflowContext } from "../context";

/** Workflow options */
export interface WorkflowOptions {
  days: number;
  scripts: ScriptOptions;
}
import { NPQService } from "../npq";
import { InstallService } from "../install";
import { QualityService } from "../quality";
import { logger } from "../logger";
import { NCUService } from "../ncu";

/**
 * Handles user cancellation (Ctrl+C) during prompts
 */
function handleUserCancellation(error: unknown): void {
  // Check if this is a user cancellation (Ctrl+C in inquirer)
  const isUserCancellation =
    error instanceof Error &&
    (error.name === "ExitPromptError" || error.message.includes("User force closed"));

  if (isUserCancellation) {
    console.log("\n");
    logger.info("Operation cancelled by user");
    logger.info("No changes were made to your dependencies.");
    process.exit(0);
  }

  // Re-throw unexpected errors
  throw error;
}

export async function executeUpdateWorkflow(options: WorkflowOptions): Promise<void> {
  try {
    await runWorkflow(options);
  } catch (error) {
    handleUserCancellation(error);
  }
}

async function runWorkflow(options: WorkflowOptions): Promise<void> {
  const { days, scripts } = options;
  const startTime = Date.now();

  // Initialize workflow context (caches package.json and cutoff date)
  const { allDependencies} = WorkflowContext.create(days, scripts);

  // ============================================================================
  // Step 1: Check for available updates
  // ============================================================================
  logger.step(1, 9, "Checking for available updates");

  const ncuService = new NCUService();
  const rawUpdates = await ncuService.loadUpdates();

  // Exit if no updates available
  if (!rawUpdates || Object.keys(rawUpdates).length === 0) {
    ncuService.showNoUpdates();
    process.exit(0);
  }

  ncuService.showPotentialUpdates(Object.keys(rawUpdates).length);

  // ============================================================================
  // Step 2: Apply safety buffer (7-day filter by default)
  // ============================================================================
  logger.step(2, 9, `Applying ${days}-day safety buffer`);

  const updates = await ncuService.filterByAge(rawUpdates as Record<string, string>);

  // Exit if all updates filtered out
  if (Object.keys(updates).length === 0) {
    ncuService.showNoSafeUpdates(days);
    process.exit(0);
  }

  ncuService.showSafeUpdates(Object.keys(updates).length);

  // ============================================================================
  // Step 3: Group updates by type and prepare display
  // ============================================================================
  logger.step(3, 9, "Organizing updates by type");

  const { grouped, choices } = ncuService.buildChoices(
    updates as Record<string, string>,
    allDependencies,
  );
  ncuService.showGroupSummary(grouped);

  // ============================================================================
  // Step 4: Interactive package selection
  // ============================================================================
  logger.step(4, 9, "Select packages to update");

  const selected = await ncuService.promptSelection(choices);

  // Exit if no packages selected
  if (selected.length === 0) {
    logger.warning("No packages selected");
    process.exit(0);
  }

  logger.success(`Selected ${selected.length} package(s) for update`);

  // ============================================================================
  // Step 5: Security validation pipeline
  // ============================================================================
  logger.step(5, 9, "Security validation");

  // Validates each package with NPQ and gets user confirmation
  const npqService = new NPQService();
  const packagesToInstall = await npqService.processSelection(selected);

  // Exit if no packages passed validation and confirmation
  if (packagesToInstall.length === 0) {
    logger.warning("No packages confirmed for installation");
    process.exit(0);
  }

  // ============================================================================
  // Step 6: Install packages via scfw
  // ============================================================================
  logger.step(6, 9, "Installing packages");

  // Orchestrates SCFW package installation
  const installService = new InstallService();
  await installService.installPackages(packagesToInstall);

  // ============================================================================
  // Step 7: Reinstall all dependencies
  // ============================================================================
  logger.step(7, 9, "Reinstalling all dependencies");

  // Ensures package-lock.json is consistent and all transitive deps are correct
  await installService.reinstall();

  const qualityChecks = new QualityService();

  // ============================================================================
  // Step 8: Quality checks
  // ============================================================================
  logger.step(8, 9, "Quality checks");

  // Optional: lint, type checking, tests
  await qualityChecks.runAll();

  // ============================================================================
  // Step 9: Build verification
  // ============================================================================
  logger.step(9, 9, "Build verification");

  // Optional: ensure project still builds successfully
  await qualityChecks.runBuild();

  // ============================================================================
  // Success!
  // ============================================================================
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  logger.summaryTable("UPDATE COMPLETE", {
    "Packages updated": packagesToInstall.length,
    "Packages skipped": selected.length - packagesToInstall.length,
    "Time taken": `${duration}s`,
  });
}
