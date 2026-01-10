/**
 * Argument Types
 *
 * Type definitions for CLI arguments and options.
 *
 * @module args/types
 */
/**
 * Type for script configuration options
 */
export interface ScriptOptions {
  lint: string;
  typecheck: string;
  test: string;
  build: string;
}

/**
 * CLI options parsed from command-line arguments
 */
export interface CliOptions {
  /** Safety buffer in days for version filtering */
  days: number;
  /** Script names for quality checks */
  scripts: ScriptOptions;
}
