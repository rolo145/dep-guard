/**
 * NPM Registry Types
 *
 * Type definitions for NCU operations, including registry responses
 * and update grouping.
 *
 * @module ncu/types
 * @see https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
 */

/**
 * Response structure from NPM registry API
 * Contains package metadata including all versions and their publish times
 *
 * ```typescript
 * const response = await fetch('https://registry.npmjs.org/chalk');
 * const data: NpmRegistryResponse = await response.json();
 * const versions = Object.keys(data.versions || {});
 * const publishDate = data.time?.['5.0.0'];
 * ```
 */
export interface NpmRegistryResponse {
  /**
   * All available versions of the package
   * Key: version string (e.g., "5.0.0")
   * Value: version metadata (not used in this application)
   */
  versions?: Record<string, unknown>;

  /**
   * Publish timestamps for each version
   * Key: version string (e.g., "5.0.0")
   * Value: ISO 8601 timestamp string (e.g., "2021-05-10T14:23:45.123Z")
   */
  time?: Record<string, string>;
}

/**
 * Represents the type of semantic version change
 * - major: Breaking changes (1.0.0 -> 2.0.0)
 * - minor: New features, backwards compatible (1.0.0 -> 1.1.0)
 * - patch: Bug fixes, backwards compatible (1.0.0 -> 1.0.1)
 */
export type VersionBumpType = "major" | "minor" | "patch";

/**
 * Represents a single package update with version information
 */
export interface PackageUpdate {
  /** Package name (may include scope, e.g., @vue/reactivity) */
  name: string;
  /** Current installed version */
  currentVersion: string;
  /** Available new version */
  newVersion: string;
}

/**
 * Package updates grouped by their semantic version bump type
 * Used for organizing and displaying updates by risk level
 */
export interface GroupedUpdates {
  /** Major version updates (highest risk) */
  major: PackageUpdate[];
  /** Minor version updates (medium risk) */
  minor: PackageUpdate[];
  /** Patch version updates (lowest risk) */
  patch: PackageUpdate[];
}

/**
 * Represents a user's selection of a package to install
 * Returned from interactive prompts
 */
export interface PackageSelection {
  /** Package name */
  name: string;
  /** Selected version to install */
  version: string;
}
