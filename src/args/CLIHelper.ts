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

Safe npm dependency management with security checks.

Usage:
  dep-guard <subcommand> [options]

Subcommands:
  install                   Fresh install from package.json
  update                    Check for and install package updates

Options:
  -d, --days <number>       Safety buffer in days (default: ${SAFETY_BUFFER_DAYS})
  --allow-npm-install       Use npm install fallback when scfw is not available
  --lint <script>           Lint script name (default: "${DEFAULT_SCRIPTS.lint}") [update only]
  --typecheck <script>      Type check script name (default: "${DEFAULT_SCRIPTS.typecheck}") [update only]
  --test <script>           Test script name (default: "${DEFAULT_SCRIPTS.test}") [update only]
  --build <script>          Build script name (default: "${DEFAULT_SCRIPTS.build}") [update only]
  -v, --version             Show version number
  -h, --help                Show this help message

Examples:
  dep-guard install                     Fresh install from package.json
  dep-guard install --days 14           Fresh install with 14-day safety buffer
  dep-guard install --allow-npm-install Use npm fallback for fresh install
  dep-guard update                      Run update workflow with defaults
  dep-guard update --days 14            Update with 14-day safety buffer
  dep-guard update --allow-npm-install  Update using npm install fallback
  dep-guard update --lint eslint        Use "eslint" as lint script
  dep-guard update --test test:all      Use "test:all" as test script
`);
  }
}
