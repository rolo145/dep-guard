/**
 * Check Existing Package Step
 *
 * Step 2 of add workflow: Checks if package already exists in package.json
 * - Checks both dependencies and devDependencies
 * - If exists, shows current version vs. new version
 * - Offers options: Update / Keep current / Cancel
 * - Handles changing dep type (regular ↔ dev)
 *
 * @module workflows/steps/CheckExistingPackageStep
 */
import type { ResolvedPackage, PackageToAdd, ExistingPackageInfo } from "../add/types";
import type { IExecutionContext } from "../../context/IExecutionContext";
import { logger } from "../../logger";
import chalk from "chalk";
import { select } from "@inquirer/prompts";

/**
 * Result of existing package check
 */
export interface CheckExistingResult {
  /** Whether to proceed with installation */
  shouldProceed: boolean;
  /** Package to add (if proceeding) */
  package?: PackageToAdd;
  /** Reason for not proceeding (if cancelled) */
  cancelReason?: string;
}

/**
 * Checks if package exists and handles conflicts
 */
export class CheckExistingPackageStep {
  private readonly context: IExecutionContext;

  constructor(context: IExecutionContext) {
    this.context = context;
  }

  /**
   * Executes existing package check
   *
   * @param resolved - Resolved package from previous step
   * @param saveDev - Whether to save as dev dependency
   * @returns Check result
   */
  async execute(resolved: ResolvedPackage, saveDev: boolean): Promise<CheckExistingResult> {
    // Check if package exists
    const existing = this.getExistingPackageInfo(resolved.name);

    // If package doesn't exist, proceed with installation
    if (!existing.exists) {
      logger.info(`Package ${resolved.name} not found in package.json`);
      return {
        shouldProceed: true,
        package: {
          ...resolved,
          saveDev,
          existing,
        },
      };
    }

    // Package exists - show current vs. new version
    logger.newLine();
    logger.info(chalk.bold(`Package ${resolved.name} already exists:`));
    logger.info(`  Current: ${chalk.yellow(existing.currentVersion)} in ${chalk.cyan(existing.location!)}`);
    logger.info(`  New:     ${chalk.green(resolved.version)}`);

    const targetLocation = saveDev ? "devDependencies" : "dependencies";
    logger.info(`  Target:  ${chalk.cyan(targetLocation)}`);
    logger.newLine();

    // If versions are the same and location is the same, nothing to do
    if (existing.currentVersion === resolved.version && existing.location === targetLocation) {
      logger.info(chalk.yellow(`Package ${resolved.name}@${resolved.version} is already installed in ${targetLocation}`));
      return {
        shouldProceed: false,
        cancelReason: "Package already installed with same version and location",
      };
    }

    // Ask user what to do
    const choices = [];

    // Option 1: Update the package
    if (existing.currentVersion !== resolved.version) {
      choices.push({
        name: `Update to ${resolved.version}`,
        value: "update",
        description: `Replace ${existing.currentVersion} with ${resolved.version}`,
      });
    }

    // Option 2: Move to different dependency type (if changing)
    if (existing.location !== targetLocation) {
      const action = existing.currentVersion === resolved.version ? "Move" : "Update and move";
      choices.push({
        name: `${action} to ${targetLocation}`,
        value: "update",
        description: `Change from ${existing.location} to ${targetLocation}`,
      });
    }

    // Option 3: Keep current
    choices.push({
      name: "Keep current version",
      value: "keep",
      description: `Leave ${existing.currentVersion} in ${existing.location}`,
    });

    // Option 4: Cancel
    choices.push({
      name: "Cancel",
      value: "cancel",
      description: "Don't modify this package",
    });

    const action = await select({
      message: "What would you like to do?",
      choices,
    });

    if (action === "cancel" || !action) {
      return {
        shouldProceed: false,
        cancelReason: "Installation cancelled by user",
      };
    }

    if (action === "keep") {
      logger.info(chalk.gray(`Keeping ${resolved.name}@${existing.currentVersion}`));
      return {
        shouldProceed: false,
        cancelReason: "User chose to keep current version",
      };
    }

    // User chose to update
    logger.success(`Will update ${resolved.name} to ${resolved.version}`);
    return {
      shouldProceed: true,
      package: {
        ...resolved,
        saveDev,
        existing,
      },
    };
  }

  /**
   * Gets information about existing package
   */
  private getExistingPackageInfo(packageName: string): ExistingPackageInfo {
    // Check dependencies
    if (this.context.dependencies[packageName]) {
      return {
        exists: true,
        currentVersion: this.context.dependencies[packageName],
        location: "dependencies",
      };
    }

    // Check devDependencies
    if (this.context.devDependencies[packageName]) {
      return {
        exists: true,
        currentVersion: this.context.devDependencies[packageName],
        location: "devDependencies",
      };
    }

    // Package doesn't exist
    return {
      exists: false,
    };
  }
}
