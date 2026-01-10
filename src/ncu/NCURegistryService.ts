/**
 * NCU Registry Service
 *
 * Handles interactions with the NPM registry API to fetch package metadata
 * and determine safe versions based on publish date filtering.
 *
 * Safety mechanism: Only considers versions published at least N days ago
 * to allow time for community security review and vulnerability discovery.
 *
 * Performance: Batches registry requests with concurrency control to optimize
 * API calls while respecting rate limits.
 *
 * @module ncu/NCURegistryService
 */
import type { NpmRegistryResponse } from "./types";
import type { IWorkflowContext } from "../context/IWorkflowContext";
import { VersionAnalyzer } from "./VersionAnalyzer";
import { logger } from "../logger";
import { MAX_CONCURRENT_REQUESTS, NPM_REGISTRY_URL, REGISTRY_TIMEOUT_MS } from "../constants/network";
import { RegistryFetchError, RegistryParseError } from "./errors";

/**
 * Service for filtering updates based on publish date and registry data.
 */
export class NCURegistryService {
  private readonly context: IWorkflowContext;

  /**
   * Creates a new NCURegistryService instance.
   *
   * @param context - Workflow context for accessing configuration and dependencies
   */
  constructor(context: IWorkflowContext) {
    this.context = context;
  }

  /**
   * Finds the latest version of a package that was published at least N days ago
   *
   * This function queries the NPM registry to get all versions and their publish dates,
   * then filters to find the most recent version that meets the safety buffer requirement.
   *
   * @param packageName - Full package name (e.g., "chalk" or "@vue/reactivity")
   * @param suggestedVersion - The latest version suggested by npm-check-updates
   * @returns The latest version that's old enough, null if none found, or suggestedVersion if API call fails
   * @throws RegistryFetchError if registry request fails (caught and handled gracefully)
   * @throws RegistryParseError if registry response is malformed (caught and handled gracefully)
   */
  private async findLatestOldEnoughVersion(
    packageName: string,
    suggestedVersion: string,
  ): Promise<string | null> {
    const { cutoff } = this.context;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REGISTRY_TIMEOUT_MS);

    try {
      const encodedName = encodeURIComponent(packageName).replace(/^%40/, "@");

      // Fetch package metadata from NPM registry with timeout
      const response = await fetch(`${NPM_REGISTRY_URL}/${encodedName}`, {
        signal: controller.signal,
      });

      // Fail open - if registry is unreachable, use suggested version
      if (!response.ok) {
        throw new RegistryFetchError(packageName, response.status);
      }

      const data = (await response.json()) as NpmRegistryResponse;

      if (!data.versions || !data.time) {
        throw new RegistryParseError(packageName);
      }

      const versions = Object.keys(data.versions);
      const times = data.time;

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
    } catch (error) {
      // If we can't check (network error, etc.), use suggested version (fail open)
      // This prevents the tool from being unusable due to temporary issues
      if (error instanceof RegistryFetchError || error instanceof RegistryParseError) {
        // Log the specific error but continue gracefully
        logger.progress(`Registry error for ${packageName}, using suggested version`);
      }
      return suggestedVersion;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Processes a batch of packages with concurrency control
   *
   * @param batch - Array of [packageName, suggestedVersion] tuples
   * @returns Array of results for each package in the batch
   */
  private async processBatch(
    batch: Array<[string, string]>,
  ): Promise<Array<{ name: string; suggestedVersion: string; safeVersion: string | null }>> {
    const promises = batch.map(async ([name, suggestedVersion]) => {
      const safeVersion = await this.findLatestOldEnoughVersion(name, suggestedVersion);
      return { name, suggestedVersion, safeVersion };
    });

    return Promise.all(promises);
  }

  /**
   * Filters package updates to only include versions published at least N days ago
   *
   * For packages where the latest version is too new, finds the most recent version
   * that's old enough. Skips packages where no safe version is available.
   *
   * Performance: Processes packages in batches with controlled concurrency
   * to optimize API calls while respecting registry rate limits.
   *
   * Logs progress to console:
   * - Skipped packages (no safe version or already up to date)
   * - Packages using older version due to recency filter
   *
   * @param updates - Raw updates from npm-check-updates (package name -> latest version)
   * @returns Filtered updates object with only safe versions
   */
  async filterUpdatesByAge(updates: Record<string, string>): Promise<Record<string, string>> {
    const { allDependencies, days } = this.context;

    const filtered: Record<string, string> = {};
    const entries = Object.entries(updates);

    const spinner = logger.spinner("Filtering versions by safety buffer...");

    // Process packages in batches with controlled concurrency
    for (let i = 0; i < entries.length; i += MAX_CONCURRENT_REQUESTS) {
      const batch = entries.slice(i, i + MAX_CONCURRENT_REQUESTS);
      const batchNum = Math.floor(i / MAX_CONCURRENT_REQUESTS) + 1;
      const totalBatches = Math.ceil(entries.length / MAX_CONCURRENT_REQUESTS);

      spinner.text = `Checking batch ${batchNum}/${totalBatches} (${batch.length} packages)...`;

      // Process batch in parallel
      const results = await this.processBatch(batch);

      // Process results and update filtered object
      for (const { name, suggestedVersion, safeVersion } of results) {
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
            spinner.start();
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
    }

    spinner.stop();
    logger.newLine();
    return filtered;
  }
}
