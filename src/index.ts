/**
 * dep-guard CLI Entry Point
 *
 * Main entry point for the dep-guard command-line tool.
 * Provides safe, security-focused npm dependency management with:
 * - Fresh install from package.json (install subcommand)
 * - Safe dependency updates (update subcommand)
 * - Configurable safety buffer for new versions
 * - NPQ security validation
 * - scfw secure installation
 * - Interactive package selection
 * - Quality checks and build verification
 *
 * @module index
 */
import { WorkflowOrchestrator } from "./workflows";
import { BootstrapWorkflowOrchestrator } from "./workflows/BootstrapWorkflowOrchestrator";
import { ScriptValidator } from "./quality/ScriptValidator";
import { ArgumentParser, CLIHelper, PrerequisiteValidator, SubcommandParser } from "./args";
import { EXIT_CODE_CANCELLED, handleFatalError } from "./errors";

/**
 * Handle graceful shutdown on Ctrl+C (SIGINT) and SIGTERM
 */
function setupGracefulShutdown(): void {
  const handleShutdown = (signal: string): void => {
    console.log(`\n\nReceived ${signal}. Shutting down gracefully...`);
    console.log("No changes were made to your dependencies.");
    process.exit(EXIT_CODE_CANCELLED);
  };

  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
}

/**
 * Main CLI execution
 *
 * 1. Sets up graceful shutdown handlers
 * 2. Handles --version/-v and --help/-h flags (before subcommand parsing)
 * 3. Parses subcommand (install or update)
 * 4. Parses CLI options
 * 5. Validates required security tools are installed (scfw)
 * 6. Executes appropriate workflow based on subcommand
 */
(async () => {
  // Setup Ctrl+C handler
  setupGracefulShutdown();

  const rawArgs = process.argv.slice(2);

  // Check for help/version flags first (before subcommand parsing)
  // This allows --help and --version to work without specifying a subcommand
  if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
    CLIHelper.showHelp();
    process.exit(0);
  }

  if (rawArgs.includes("--version") || rawArgs.includes("-v")) {
    console.log(`dep-guard v${CLIHelper.getVersion()}`);
    process.exit(0);
  }

  // Parse subcommand
  let subcommand: "install" | "update";
  let args: string[];

  try {
    const parsed = SubcommandParser.parse(rawArgs);
    subcommand = parsed.subcommand;
    args = parsed.args;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }

  const parser = new ArgumentParser(args);

  // Parse CLI options
  const options = parser.parseOrExit();

  // Ensure required security tools (scfw) are installed or fallback is allowed
  const { useNpmFallback } = PrerequisiteValidator.checkPrerequisites(options.allowNpmInstall);

  // Route to appropriate workflow based on subcommand
  if (subcommand === "install") {
    // Run fresh install workflow
    const orchestrator = new BootstrapWorkflowOrchestrator({
      days: options.days,
      scripts: options.scripts,
      useNpmFallback,
    });
    const result = await orchestrator.execute();
    process.exit(result.exitCode);
  } else {
    // Run update workflow
    // Validate configured script names and warn about missing ones
    ScriptValidator.validate(options.scripts);

    const orchestrator = new WorkflowOrchestrator({
      days: options.days,
      scripts: options.scripts,
      useNpmFallback,
    });
    const result = await orchestrator.execute();
    process.exit(result.exitCode);
  }
})().catch(handleFatalError);
