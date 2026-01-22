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
  /** Allow npm install fallback when scfw is not available */
  allowNpmInstall: boolean;
  /** Package specifications for add command (optional) */
  packages?: string[];
  /** Add as dev dependency (optional, for add command) */
  saveDev?: boolean;
  /** Show available updates without installing (optional, for update command) */
  show?: boolean;
}
