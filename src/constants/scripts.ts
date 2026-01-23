/**
 * Script Constants
 *
 * Centralized constants for npm script names and quality check identifiers.
 *
 * @module constants/scripts
 */

/**
 * Quality check script names.
 *
 * These correspond to package.json script fields and command-line flags.
 */
export const QUALITY_SCRIPTS = {
  LINT: "lint",
  TYPECHECK: "typecheck",
  TEST: "test",
  BUILD: "build",
} as const;

/** Type for quality script names */
export type QualityScriptName = (typeof QUALITY_SCRIPTS)[keyof typeof QUALITY_SCRIPTS];
