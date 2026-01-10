/**
 * Update Types
 *
 * Type definitions for package update operations, including version bump
 * categorization and update grouping.
 *
 * @module types/updates
 */

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
