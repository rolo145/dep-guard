/**
 * NCU Confirmation
 *
 * Handles user prompts and UI for npm-check-updates.
 *
 * @module ncu/NCUConfirmation
 */
import { checkbox } from "@inquirer/prompts";
import { logger } from "../utils/logger";
import { PROMPT_PAGE_SIZE } from "./constants";
import type { GroupedUpdates, PackageSelection } from "./types";
import type { PromptChoice } from "./PromptChoiceBuilder";

/**
 * Handles user interaction for update discovery and selection.
 */
export class NCUConfirmation {
  /**
   * Shows spinner while querying updates
   */
  showQueryingUpdates(): ReturnType<typeof logger.spinner> {
    return logger.spinner("Querying npm-check-updates...");
  }

  /**
   * Shows message when no updates are found
   */
  showNoUpdates(): void {
    logger.success("All dependencies are up to date!");
  }

  /**
   * Shows message with potential update count
   */
  showPotentialUpdates(count: number): void {
    logger.success(`Found ${count} potential updates`);
  }

  /**
   * Shows message when no safe updates remain after filtering
   */
  showNoSafeUpdates(days: number): void {
    logger.warning(`No updates available (all recent versions are less than ${days} days old)`);
  }

  /**
   * Shows message with safe update count
   */
  showSafeUpdates(count: number): void {
    logger.success(`${count} safe updates available`);
  }

  /**
   * Shows summary of grouped updates
   */
  showGroupSummary(grouped: GroupedUpdates): void {
    logger.info(
      `Major: ${grouped.major.length}, Minor: ${grouped.minor.length}, Patch: ${grouped.patch.length}`,
    );
    logger.newLine();
  }

  /**
   * Prompts user to select packages to update
   *
   * @param choices - Prompt choices array
   * @returns Array of selected packages
   */
  async promptSelection(choices: PromptChoice[]): Promise<PackageSelection[]> {
    return checkbox({
      message: "Select packages to update (Space to select, Enter to confirm):",
      choices,
      loop: false,
      pageSize: PROMPT_PAGE_SIZE,
    });
  }
}
