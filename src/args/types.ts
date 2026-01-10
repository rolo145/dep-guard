/**
 * Argument Types
 *
 * Type definitions for CLI arguments and options.
 *
 * @module args/types
 */
import type { ScriptOptions } from "../constants/config";

/**
 * CLI options parsed from command-line arguments
 */
export interface CliOptions {
  /** Safety buffer in days for version filtering */
  days: number;
  /** Script names for quality checks */
  scripts: ScriptOptions;
}
