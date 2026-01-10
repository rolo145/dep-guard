/**
 * NCU Registry Service
 *
 * Handles interactions with the NPM registry API to fetch package metadata
 * and determine safe versions based on publish date filtering.
 *
 * Safety mechanism: Only considers versions published at least N days ago
 * to allow time for community security review and vulnerability discovery.
 *
 * @module ncu/NCURegistryService
 */
import type { NpmRegistryResponse } from "./types";
import { WorkflowContext } from "../context";
import { VersionAnalyzer } from "./VersionAnalyzer";
import { logger } from "../logger";

/**
 * Service for filtering updates based on publish date and registry data.
 */
export class NCURegistryService {
  /**
   * Finds the latest version of a package that was published at least N days ago
   *
   * This function queries the NPM registry to get all versions and their publish dates,
   * then filters to find the most recent version that meets the safety buffer requirement.
   * Uses cutoff date from WorkflowContext (cached).
   *
   * @param packageName - Full package name (e.g., "chalk" or "@vue/reactivity")
   * @param suggestedVersion - The latest version suggested by npm-check-updates
   * @returns The latest version that's old enough, null if none found, or suggestedVersion if API call fails
   */
  private async findLatestOldEnoughVersion(
    packageName: string,
    suggestedVersion: string,
  ): Promise<string | null> {
    const { cutoff } = WorkflowContext.getInstance();

    try {
      const encodedName = encodeURIComponent(packageName).replace(/^%40/, "@");
      // Fetch package metadata from NPM registry
      const response = await fetch(`https://registry.npmjs.org/${encodedName}`);

      // Fail open - if registry is unreachable, use suggested version
      if (!response.ok) {
        return suggestedVersion;
      }

      const data = (await response.json()) as NpmRegistryResponse;
      const versions = data.versions ? Object.keys(data.versions) : [];
      const times = data.time || {};

      // Filter to stable versions published before the cutoff date
      // Excludes prerelease versions (alpha, beta, rc, etc.)
      const eligibleVersions = versions.filter((version) => {
        // Skip prerelease versions (e.g., 1.0.0-beta.1, 2.0.0-alpha.3)
        if (!VersionAnalyzer.isStable(version)) {
          return false;
        }

        const publishDate = times[version];
        if (!publishDate) {
          return false;
        }
        return new Date(publishDate) <= cutoff;
      });

      // If no versions meet the criteria, return null
      if (eligibleVersions.length === 0) {
        return null;
      }

      // Sort by publish date (newest first) and return the most recent eligible version
      const sorted = eligibleVersions.sort((a, b) => {
        const dateA = new Date(times[a]);
        const dateB = new Date(times[b]);
        return dateB.getTime() - dateA.getTime();
      });

      return sorted[0];
    } catch {
      // If we can't check (network error, etc.), use suggested version (fail open)
      // This prevents the tool from being unusable due to temporary issues
      return suggestedVersion;
    }
  }

  /**
   * Filters package updates to only include versions published at least N days ago
   *
   * For packages where the latest version is too new, finds the most recent version
   * that's old enough. Skips packages where no safe version is available.
   * Uses WorkflowContext for cached data (dependencies, days).
   *
   * Logs progress to console:
   * - Skipped packages (no safe version or already up to date)
   * - Packages using older version due to recency filter
   *
   * @param updates - Raw updates from npm-check-updates (package name -> latest version)
   * @returns Filtered updates object with only safe versions
   */
  async filterUpdatesByAge(updates: Record<string, string>): Promise<Record<string, string>> {
    const { allDependencies, days } = WorkflowContext.getInstance();

    const filtered: Record<string, string> = {};

    const spinner = logger.spinner("Filtering versions by safety buffer...");
    const entries = Object.entries(updates);

    // Process each package update sequentially (required for API rate limiting)
    for (const [name, suggestedVersion] of entries) {
      spinner.text = `Checking ${name}...`;

      const safeVersion = await this.findLatestOldEnoughVersion(name, suggestedVersion);

      if (safeVersion) {
        // Clean version strings (remove ^ and ~ prefixes)
        const currentVersion = allDependencies[name]
          ? VersionAnalyzer.cleanVersion(allDependencies[name])
          : "";
        const cleanSafeVersion = VersionAnalyzer.cleanVersion(safeVersion);

        // Skip if the safe version is the same as current version (no update needed)
        if (cleanSafeVersion === currentVersion) {
          spinner.stopAndPersist({
            symbol: "⊘",
            text: `${name} (safe version matches current)`,
          });
        } else {
          filtered[name] = safeVersion;

          // Notify if we're using an older version than suggested
          if (safeVersion !== suggestedVersion) {
            spinner.stopAndPersist({
              symbol: "📅",
              text: `${name}: ${safeVersion} (newer ${suggestedVersion} not yet ${days} days old)`,
            });
          } else {
            spinner.stopAndPersist({
              symbol: "✓",
              text: `${name}: ${safeVersion}`,
            });
          }
          spinner.start();
        }
      } else {
        spinner.stopAndPersist({
          symbol: "⊘",
          text: `${name} (no version old enough found)`,
        });
        spinner.start();
      }
    }

    spinner.stop();
    logger.newLine();
    return filtered;
  }
}
