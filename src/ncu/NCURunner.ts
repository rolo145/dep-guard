/**
 * NCU Runner
 *
 * Handles execution of npm-check-updates.
 *
 * @module ncu/NCURunner
 */
import { run as ncuRun } from "npm-check-updates";

/**
 * Runner for npm-check-updates execution.
 */
export class NCURunner {
  /**
   * Loads available package updates without modifying package.json
   *
   * @returns Object of package name -> latest version
   */
  async loadUpdates(): Promise<Record<string, string>> {
    const updates = await ncuRun({
      packageFile: "package.json",
      upgrade: false,
      jsonUpgraded: true,
    });

    return (updates ?? {}) as Record<string, string>;
  }
}
