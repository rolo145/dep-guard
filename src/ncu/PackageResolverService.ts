/**
 * Package Resolver Service
 *
 * Handles package version resolution for the add command.
 * Resolves latest stable versions and validates specific versions
 * against the safety buffer requirement.
 *
 * @module ncu/PackageResolverService
 */
import type { NpmRegistryResponse } from "./types";
import type { IExecutionContext } from "../context/IExecutionContext";
import { VersionAnalyzer } from "./VersionAnalyzer";
import { NPM_REGISTRY_URL, REGISTRY_TIMEOUT_MS } from "../constants/network";
import { RegistryFetchError, RegistryParseError } from "./errors";

/**
 * Result of version resolution
 */
export interface VersionResolutionResult {
  /** The resolved version, or null if no safe version found */
  version: string | null;
  /** Whether the requested version was too new (within safety buffer) */
  tooNew: boolean;
  /** Age of the version in days (if found) */
  ageInDays?: number;
}

/**
 * Service for resolving package versions with safety buffer filtering.
 */
export class PackageResolverService {
  private readonly context: IExecutionContext;

  /**
   * Creates a new PackageResolverService instance.
   *
   * @param context - Execution context for accessing configuration
   */
  constructor(context: IExecutionContext) {
    this.context = context;
  }

  /**
   * Resolves the latest stable version that meets the safety buffer requirement
   *
   * @param packageName - Package name (e.g., "vue" or "@vue/cli")
   * @returns Resolution result with version and metadata
   */
  async resolveLatestSafeVersion(packageName: string): Promise<VersionResolutionResult> {
    try {
      const metadata = await this.fetchPackageMetadata(packageName);
      const { cutoff } = this.context;

      const versions = Object.keys(metadata.versions || {});
      const times = metadata.time || {};

      // Filter to stable versions published before the cutoff date
      const eligibleVersions = versions.filter((version) => {
        // Skip prerelease versions
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
        return {
          version: null,
          tooNew: true,
        };
      }

      // Sort by publish date (newest first)
      const sorted = eligibleVersions.sort((a, b) => {
        const dateA = new Date(times[a]);
        const dateB = new Date(times[b]);
        return dateB.getTime() - dateA.getTime();
      });

      const latestSafe = sorted[0];
      const publishDate = new Date(times[latestSafe]);
      const ageInDays = Math.floor((Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        version: latestSafe,
        tooNew: false,
        ageInDays,
      };
    } catch (error) {
      if (error instanceof RegistryFetchError || error instanceof RegistryParseError) {
        throw error;
      }
      throw new RegistryFetchError(packageName, 0);
    }
  }

  /**
   * Validates that a specific version exists and meets the safety buffer
   *
   * @param packageName - Package name (e.g., "vue")
   * @param version - Specific version to validate (e.g., "3.2.0")
   * @returns Resolution result with validation status
   */
  async validateVersion(packageName: string, version: string): Promise<VersionResolutionResult> {
    try {
      const metadata = await this.fetchPackageMetadata(packageName);
      const times = metadata.time || {};

      // Check if version exists
      if (!times[version]) {
        throw new Error(`Version ${version} not found for package ${packageName}`);
      }

      const publishDate = new Date(times[version]);
      const { cutoff } = this.context;
      const ageInDays = Math.floor((Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24));

      // Check if version is old enough
      const isOldEnough = publishDate <= cutoff;

      return {
        version,
        tooNew: !isOldEnough,
        ageInDays,
      };
    } catch (error) {
      if (error instanceof RegistryFetchError || error instanceof RegistryParseError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Fetches package metadata from npm registry with retry logic
   *
   * @param packageName - Package name to fetch
   * @returns Package metadata from registry
   * @throws RegistryFetchError if all retries fail
   * @throws RegistryParseError if response is malformed
   */
  private async fetchPackageMetadata(packageName: string): Promise<NpmRegistryResponse> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.attemptFetch(packageName);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on 404 or parse errors
        if (error instanceof RegistryFetchError && error.statusCode === 404) {
          throw error;
        }
        if (error instanceof RegistryParseError) {
          throw error;
        }

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new RegistryFetchError(packageName, 0);
  }

  /**
   * Attempts a single fetch to the npm registry
   *
   * @param packageName - Package name to fetch
   * @returns Package metadata from registry
   * @throws RegistryFetchError if request fails
   * @throws RegistryParseError if response is malformed
   */
  private async attemptFetch(packageName: string): Promise<NpmRegistryResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REGISTRY_TIMEOUT_MS);

    try {
      const encodedName = encodeURIComponent(packageName).replace(/^%40/, "@");
      const response = await fetch(`${NPM_REGISTRY_URL}/${encodedName}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new RegistryFetchError(packageName, response.status);
      }

      const data = (await response.json()) as NpmRegistryResponse;

      if (!data.versions || !data.time) {
        throw new RegistryParseError(packageName);
      }

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
