/**
 * Logger Types
 *
 * Type definitions for CLI logging functionality.
 *
 * @module logger/types
 */

/**
 * Package update information for display in updates table
 */
export interface PackageUpdate {
  /** Package name */
  name: string;
  /** Current installed version */
  current: string;
  /** New available version */
  new: string;
  /** Type of version bump (major, minor, patch) */
  type: string;
}

/**
 * Summary data for display in summary tables
 */
export type SummaryData = Record<string, string | number>;
