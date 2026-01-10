/**
 * dep-guard CLI Entry Point
 *
 * Main entry point for the dep-guard command-line tool.
 * Provides safe, security-focused npm dependency updates with:
 * - Configurable safety buffer for new versions
 * - NPQ security validation
 * - scfw secure installation
 * - Interactive package selection
 * - Quality checks and build verification
 *
 * @module index
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { checkPrerequisites } from "./utils/checkPrerequisites";
import { executeUpdateWorkflow } from "./workflows/updateWorkflow";
import { validateScriptNames } from "./utils/utils";
import { SAFETY_BUFFER_DAYS, DEFAULT_SCRIPTS, type ScriptOptions } from "./constants/config";

/** CLI options parsed from arguments */
interface CliOptions {
  days: number;
  scripts: ScriptOptions;
}

/**
 * Handle graceful shutdown on Ctrl+C (SIGINT) and SIGTERM
 */
function setupGracefulShutdown(): void {
  const handleShutdown = (signal: string): void => {
    console.log(`\n\nReceived ${signal}. Shutting down gracefully...`);
    console.log("No changes were made to your dependencies.");
    process.exit(0);
  };

  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
}

/**
 * Get package version from package.json
 */
function getVersion(): string {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const packageJsonPath = join(__dirname, "..", "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

/**
 * Display help message
 */
function showHelp(): void {
  console.log(`
dep-guard v${getVersion()}

Safe npm dependency updates with security checks.

Usage:
  dep-guard [options]

Options:
  -d, --days <number>       Safety buffer in days (default: ${SAFETY_BUFFER_DAYS})
  --lint <script>           Lint script name (default: "${DEFAULT_SCRIPTS.lint}")
  --typecheck <script>      Type check script name (default: "${DEFAULT_SCRIPTS.typecheck}")
  --test <script>           Test script name (default: "${DEFAULT_SCRIPTS.test}")
  --build <script>          Build script name (default: "${DEFAULT_SCRIPTS.build}")
  -v, --version             Show version number
  -h, --help                Show this help message

Examples:
  dep-guard                       Run with default settings
  dep-guard --days 14             Use 14-day safety buffer
  dep-guard --lint eslint         Use "eslint" as lint script
  dep-guard --test test:all       Use "test:all" as test script
  dep-guard --build build:prod    Use "build:prod" as build script
`);
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    days: SAFETY_BUFFER_DAYS,
    scripts: { ...DEFAULT_SCRIPTS },
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--days" || arg === "-d") {
      const value = args[i + 1];
      if (!value || value.startsWith("-")) {
        console.error("Error: --days requires a number");
        process.exit(1);
      }
      const days = parseInt(value, 10);
      if (isNaN(days) || days < 0) {
        console.error("Error: --days must be a positive number");
        process.exit(1);
      }
      options.days = days;
      i++; // Skip next arg (the value)
    } else if (arg === "--lint") {
      const value = args[i + 1];
      if (!value || value.startsWith("-")) {
        console.error("Error: --lint requires a script name");
        process.exit(1);
      }
      options.scripts.lint = value;
      i++;
    } else if (arg === "--typecheck") {
      const value = args[i + 1];
      if (!value || value.startsWith("-")) {
        console.error("Error: --typecheck requires a script name");
        process.exit(1);
      }
      options.scripts.typecheck = value;
      i++;
    } else if (arg === "--test") {
      const value = args[i + 1];
      if (!value || value.startsWith("-")) {
        console.error("Error: --test requires a script name");
        process.exit(1);
      }
      options.scripts.test = value;
      i++;
    } else if (arg === "--build") {
      const value = args[i + 1];
      if (!value || value.startsWith("-")) {
        console.error("Error: --build requires a script name");
        process.exit(1);
      }
      options.scripts.build = value;
      i++;
    }
  }

  return options;
}

/**
 * Main CLI execution
 *
 * 1. Sets up graceful shutdown handlers
 * 2. Handles --version/-v and --help/-h flags
 * 3. Parses CLI options
 * 4. Validates required security tools are installed (scfw)
 * 5. Executes the complete update workflow
 */
(async () => {
  // Setup Ctrl+C handler
  setupGracefulShutdown();

  const args = process.argv.slice(2);

  // Handle help flag
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  // Handle version flag
  if (args.includes("--version") || args.includes("-v")) {
    console.log(`dep-guard v${getVersion()}`);
    process.exit(0);
  }

  // Parse CLI options
  const options = parseArgs(args);

  // Ensure required security tools (scfw) are installed
  checkPrerequisites();

  // Validate configured script names and warn about missing ones
  validateScriptNames(options.scripts);

  // Run the complete update workflow
  await executeUpdateWorkflow({ days: options.days, scripts: options.scripts });
})();
