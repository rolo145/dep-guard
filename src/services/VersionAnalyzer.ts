/**
 * Version Analyzer
 *
 * Provides utilities for analyzing and categorizing semantic version changes.
 * Determines the type of version bump (major, minor, patch) and groups updates
 * accordingly for organized display and risk assessment.
 *
 * @module services/VersionAnalyzer
 */
import type { VersionBumpType, GroupedUpdates, PackageUpdate } from "../types/updates";

interface SemverParts {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Utility class for semantic version analysis and categorization.
 *
 * All methods are static as they are pure utility functions.
 *
 * @example
 * ```typescript
 * const cleaned = VersionAnalyzer.cleanVersion("^1.2.3");  // "1.2.3"
 * const parts = VersionAnalyzer.parseSemver("1.2.3");      // { major: 1, minor: 2, patch: 3 }
 * const type = VersionAnalyzer.getBumpType("1.0.0", "2.0.0");  // "major"
 * ```
 */
export class VersionAnalyzer {
  /**
   * Removes version prefix characters (^ and ~) from a version string
   *
   * NPM uses these characters to specify version ranges:
   * - ^ (caret): Allows changes that do not modify the left-most non-zero digit
   * - ~ (tilde): Allows patch-level changes only
   *
   * @param version - Version string that may include prefix (e.g., "^1.2.3")
   * @returns Clean version string without prefix (e.g., "1.2.3")
   */
  static cleanVersion(version: string): string {
    return version.replace(/^[\^~]/, "");
  }

  /**
   * Checks if a version string is a stable release (major.minor.patch only)
   *
   * Excludes prerelease versions like:
   * - 1.0.0-alpha.1
   * - 2.0.0-beta.3
   * - 3.0.0-rc.1
   * - 1.0.0-next.5
   *
   * @param version - Version string to check
   * @returns True if version is stable (e.g., "1.2.3"), false if prerelease
   */
  static isStable(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version);
  }

  /**
   * Parses a semantic version string into its component parts
   *
   * Extracts major, minor, and patch numbers from a version string.
   * Handles version prefixes (^ and ~) by stripping them before parsing.
   *
   * @param version - Version string to parse (e.g., "1.2.3" or "^1.2.3")
   * @returns Object with major, minor, patch numbers, or null if invalid format
   */
  static parseSemver(version: string): SemverParts | null {
    const cleaned = VersionAnalyzer.cleanVersion(version);
    if (!/^\d+\.\d+\.\d+$/.test(cleaned)) {
      return null;
    }

    const [major, minor, patch] = cleaned.split(".").map(Number);
    return { major, minor, patch };
  }

  /**
   * Determines the type of semantic version bump between two versions
   *
   * Compares the major, minor, and patch numbers to identify which component changed.
   * Follows semantic versioning rules (semver.org):
   * - MAJOR: Breaking changes, incompatible API changes
   * - MINOR: New features, backwards compatible
   * - PATCH: Bug fixes, backwards compatible
   *
   * @param current - Current version string (e.g., "1.2.3" or "^1.2.3")
   * @param next - New version string (e.g., "2.0.0" or "^2.0.0")
   * @returns Type of version bump ("major", "minor", or "patch")
   */
  static getBumpType(current: string, next: string): VersionBumpType {
    if (!current || !next) {
      return "patch";
    }

    const currentParsed = VersionAnalyzer.parseSemver(current);
    const nextParsed = VersionAnalyzer.parseSemver(next);

    if (!currentParsed || !nextParsed) {
      return "patch";
    }

    if (nextParsed.major > currentParsed.major) {
      return "major";
    }

    if (nextParsed.minor > currentParsed.minor) {
      return "minor";
    }

    if (nextParsed.patch > currentParsed.patch) {
      return "patch";
    }

    return "patch";
  }

  /**
   * Groups available package updates by their semantic version bump type
   *
   * Categorizes each update as major, minor, or patch based on the version change.
   * This grouping is used for:
   * - Organized display (showing updates by risk level)
   * - Color coding (red for major, blue for minor, green for patch)
   * - User decision making (assess risk before updating)
   *
   * @param updates - Available updates (package name -> new version)
   * @param allDeps - Current dependencies (package name -> current version)
   * @returns Updates grouped by version bump type
   */
  static groupByType(
    updates: Record<string, string>,
    allDeps: Record<string, string>,
  ): GroupedUpdates {
    const grouped: GroupedUpdates = {
      major: [],
      minor: [],
      patch: [],
    };

    Object.entries(updates).forEach(([name, newVersion]) => {
      const currentVersion = allDeps[name];
      const bumpType = VersionAnalyzer.getBumpType(currentVersion, newVersion);

      grouped[bumpType].push({
        name,
        currentVersion,
        newVersion,
      });
    });

    return grouped;
  }

  /**
   * Calculates the maximum package name length from grouped updates
   *
   * Used for terminal output alignment - ensures version information lines up
   * across all packages regardless of name length.
   *
   * @param grouped - Package updates grouped by type
   * @returns Maximum character length of package names
   */
  static getMaxPackageNameLength(grouped: GroupedUpdates): number {
    const allPackages: PackageUpdate[] = [
      ...grouped.major,
      ...grouped.minor,
      ...grouped.patch,
    ];

    if (allPackages.length === 0) {
      return 0;
    }

    return Math.max(...allPackages.map(({ name }) => name.length));
  }
}
