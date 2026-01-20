/**
 * CLI Helper
 *
 * Provides utility methods for CLI display (help, version).
 *
 * @module args/CLIHelper
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { DEFAULT_SCRIPTS, SAFETY_BUFFER_DAYS } from "../defaults";

export class CLIHelper {
  /**
   * Get package version from package.json
   */
  static getVersion(): string {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    // Path is relative to dist/index.js after bundling
    const packageJsonPath = join(__dirname, "..", "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version;
  }

  /**
   * Display help message
   */
  static showHelp(): void {
    console.log(`
dep-guard v${CLIHelper.getVersion()}

Safe npm dependency updates with security checks.

Usage:
  dep-guard [options]

Options:
  -d, --days <number>       Safety buffer in days (default: ${SAFETY_BUFFER_DAYS})
  --allow-npm-install       Use npm install fallback when scfw is not available
  --lint <script>           Lint script name (default: "${DEFAULT_SCRIPTS.lint}")
  --typecheck <script>      Type check script name (default: "${DEFAULT_SCRIPTS.typecheck}")
  --test <script>           Test script name (default: "${DEFAULT_SCRIPTS.test}")
  --build <script>          Build script name (default: "${DEFAULT_SCRIPTS.build}")
  -v, --version             Show version number
  -h, --help                Show this help message

Examples:
  dep-guard                       Run with default settings
  dep-guard --days 14             Use 14-day safety buffer
  dep-guard --allow-npm-install   Use npm install when scfw is not installed
  dep-guard --lint eslint         Use "eslint" as lint script
  dep-guard --test test:all       Use "test:all" as test script
  dep-guard --build build:prod    Use "build:prod" as build script
`);
  }
}
