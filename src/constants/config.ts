/**
 * Configuration Constants
 *
 * Application-wide configuration values and constants.
 * Modify these values to adjust application behavior.
 *
 * @module constants/config
 */

/**
 * Number of days to wait before considering a package version safe to install
 *
 * Rationale: Waiting 7 days provides a buffer period for:
 * - Community security review and vulnerability discovery
 * - Detection of supply chain attacks or compromised packages
 * - Bug reports and critical issues to surface
 *
 * @default 7
 */
export const SAFETY_BUFFER_DAYS = 7;

/**
 * Visual separator for console output sections
 * Used to visually separate different workflow steps
 *
 * @example
 * console.log(SEPARATOR);
 * console.log("Processing package...");
 * console.log(SEPARATOR);
 */
export const SEPARATOR = "=".repeat(60);

/**
 * Number of items to display per page in the interactive package selection prompt
 * Set high to minimize scrolling (most projects have fewer than 50 outdated packages)
 *
 * @default 40
 */
export const PROMPT_PAGE_SIZE = 40;

/**
 * Default script names for quality checks and build
 * These can be overridden via CLI options
 */
export const DEFAULT_SCRIPTS = {
  /** Script name for linting (e.g., "lint", "lint:check") */
  lint: "lint",
  /** Script name for type checking (e.g., "typecheck", "check-types") */
  typecheck: "typecheck",
  /** Script name for running tests (e.g., "test", "test:all") */
  test: "test",
  /** Script name for building (e.g., "build", "build:all") */
  build: "build",
} as const;

/**
 * Type for script configuration options
 */
export interface ScriptOptions {
  lint: string;
  typecheck: string;
  test: string;
  build: string;
}