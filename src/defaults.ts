/**
 * Default Constants
 *
 * Default values used across the application.
 *
 * @module defaults
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
