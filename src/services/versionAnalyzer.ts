/**
 * Version Analyzer Service
 *
 * Provides utilities for analyzing and categorizing semantic version changes.
 * Determines the type of version bump (major, minor, patch) and groups updates
 * accordingly for organized display and risk assessment.
 *
 * @module services/versionAnalyzer
 */
import type { VersionBumpType, GroupedUpdates, PackageUpdate } from "../types/updates";

/**
 * Removes version prefix characters (^ and ~) from a version string
 *
 * NPM uses these characters to specify version ranges:
 * - ^ (caret): Allows changes that do not modify the left-most non-zero digit
 * - ~ (tilde): Allows patch-level changes only
 *
 * @param version - Version string that may include prefix (e.g., "^1.2.3")
 * @returns Clean version string without prefix (e.g., "1.2.3")
 *
 * @internal
 */
export function cleanVersion(version: string): string {
  return version.replace(/^[\^~]/, "");
}

/**
 * Parses a semantic version string into its component parts
 *
 * Extracts major, minor, and patch numbers from a version string.
 * Handles version prefixes (^ and ~) by stripping them before parsing.
 *
 * @param version - Version string to parse (e.g., "1.2.3" or "^1.2.3")
 * @returns Object with major, minor, patch numbers, or null if invalid format
 *
 * @internal
 */
export function parseSemver(version: string): { major: number; minor: number; patch: number } | null {
  const cleaned = cleanVersion(version);
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
export function getVersionBumpType(current: string, next: string): VersionBumpType {
  if (!current || !next) {
    return "patch";
  }

  const currentParsed = parseSemver(current);
  const nextParsed = parseSemver(next);

  if (!currentParsed || !nextParsed) {
    return "patch";
  }

  // Check which component changed (in order of precedence)
  if (nextParsed.major > currentParsed.major) {
    return "major";
  }

  if (nextParsed.minor > currentParsed.minor) {
    return "minor";
  }

  if (nextParsed.patch > currentParsed.patch) {
    return "patch";
  }

  // Fallback to patch if no increase detected (shouldn't happen in normal usage)
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
export function groupUpdatesByType(
  updates: Record<string, string>,
  allDeps: Record<string, string>,
): GroupedUpdates {
  // Initialize empty groups
  const grouped: GroupedUpdates = {
    major: [],
    minor: [],
    patch: [],
  };

  // Categorize each update by its bump type
  Object.entries(updates).forEach(([name, newVersion]) => {
    const currentVersion = allDeps[name];
    const bumpType = getVersionBumpType(currentVersion, newVersion);

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
export function calculateMaxPackageNameLength(grouped: GroupedUpdates): number {
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
