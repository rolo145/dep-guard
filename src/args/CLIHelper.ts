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
  add <package>             Add a new package with security checks
  npq <package@version>     Run NPQ security check on a package
  scfw <package@version...> Install packages via SCFW (supply chain firewall)
  quality                   Run quality checks (lint, typecheck, test, build)

Options:
  -d, --days <number>       Safety buffer in days (default: ${SAFETY_BUFFER_DAYS})
  --allow-npm-install       Use npm install fallback when scfw is not available
  -D, --save-dev            Add as dev dependency [add only]
  --dry-run                 Show available updates without installing [update only]
  --json                    Output results as JSON [npq, scfw, quality, update --dry-run]
  --lint <script>           Lint script name (default: "${DEFAULT_SCRIPTS.lint}") [update, quality]
  --typecheck <script>      Type check script name (default: "${DEFAULT_SCRIPTS.typecheck}") [update, quality]
  --test <script>           Test script name (default: "${DEFAULT_SCRIPTS.test}") [update, quality]
  --build <script>          Build script name (default: "${DEFAULT_SCRIPTS.build}") [update, quality]
  -v, --version             Show version number
  -h, --help                Show this help message

Examples:
  dep-guard install                          Fresh install from package.json
  dep-guard install --days 14               Fresh install with 14-day safety buffer
  dep-guard update                          Run update workflow with defaults
  dep-guard update --dry-run                Show available updates without installing
  dep-guard update --dry-run --json         Show available updates as JSON
  dep-guard add vue                         Add latest safe version of vue
  dep-guard add vue@3.2.0                   Add specific version of vue
  dep-guard add @vue/cli -D                 Add @vue/cli as dev dependency
  dep-guard npq lodash@4.17.21              Check lodash with NPQ security scanner
  dep-guard npq lodash@4.17.21 --json       Check lodash and output JSON result
  dep-guard scfw lodash@4.17.21             Install lodash via SCFW
  dep-guard scfw lodash@4.17.21 chalk@5.0.0 --json  Install multiple packages, JSON output
  dep-guard quality                         Run all quality checks
  dep-guard quality --json                  Run quality checks and output JSON
`);
  }
}
