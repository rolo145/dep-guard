/**
 * UI Formatters
 *
 * Provides terminal output formatting utilities for displaying package updates
 * with color-coded version information.
 *
 * Color scheme:
 * - Red: Major version updates (breaking changes)
 * - Blue: Minor version updates (new features)
 * - Green: Patch version updates (bug fixes)
 *
 * @module ui/formatters
 */
import chalk from "chalk";
import type { VersionBumpType } from "../ncu";
import { VersionAnalyzer } from "../services/VersionAnalyzer";

/**
 * Formats a version comparison string with color highlighting
 *
 * Creates a formatted string showing the transition from current to new version,
 * with color highlighting based on the type of version bump:
 *
 * - Major updates: Entire new version in red
 * - Minor updates: Minor and patch numbers in blue
 * - Patch updates: Only patch number in green
 *
 * The highlighting helps users quickly assess the risk level of each update.
 *
 * @param currentVersion - Current installed version (may include ^ or ~)
 * @param newVersion - Available new version (may include ^ or ~)
 * @param bumpType - Type of version bump (major, minor, or patch)
 * @returns Formatted string with ANSI color codes
 */
export function formatVersionWithHighlight(
  currentVersion: string,
  newVersion: string,
  bumpType: VersionBumpType,
): string {
  // Remove version range prefixes (^ and ~) for clean display
  const cleanCurrent = VersionAnalyzer.cleanVersion(currentVersion);
  const cleanNext = VersionAnalyzer.cleanVersion(newVersion);

  if (!VersionAnalyzer.parseSemver(cleanCurrent) || !VersionAnalyzer.parseSemver(cleanNext)) {
    return `${cleanCurrent} → ${cleanNext}`;
  }

  // Split version into components
  const [nextMajor, nextMinor, nextPatch] = cleanNext.split(".");

  // Format based on bump type
  if (bumpType === "major") {
    // Highlight entire new version in red (breaking changes)
    return `${cleanCurrent} → ${chalk.red(cleanNext)}`;
  }

  if (bumpType === "minor") {
    // Highlight minor and patch numbers in blue (new features)
    return `${cleanCurrent} → ${nextMajor}.${chalk.blue(`${nextMinor}.${nextPatch}`)}`;
  }

  // Highlight only patch number in green (bug fixes)
  return `${cleanCurrent} → ${nextMajor}.${nextMinor}.${chalk.green(nextPatch)}`;
}
