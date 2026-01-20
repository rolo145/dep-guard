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
import { WorkflowOrchestrator } from "./workflows";
import { ScriptValidator } from "./quality/ScriptValidator";
import { ArgumentParser, CLIHelper, PrerequisiteValidator } from "./args";
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
 * 2. Handles --version/-v and --help/-h flags
 * 3. Parses CLI options
 * 4. Validates required security tools are installed (scfw)
 * 5. Executes the complete update workflow
 */
(async () => {
  // Setup Ctrl+C handler
  setupGracefulShutdown();

  const parser = new ArgumentParser(process.argv.slice(2));

  // Handle help flag
  if (parser.hasFlag("--help", "-h")) {
    CLIHelper.showHelp();
    process.exit(0);
  }

  // Handle version flag
  if (parser.hasFlag("--version", "-v")) {
    console.log(`dep-guard v${CLIHelper.getVersion()}`);
    process.exit(0);
  }

  // Parse CLI options
  const options = parser.parseOrExit();

  // Ensure required security tools (scfw) are installed or fallback is allowed
  const { useNpmFallback } = PrerequisiteValidator.checkPrerequisites(options.allowNpmInstall);

  // Validate configured script names and warn about missing ones
  ScriptValidator.validate(options.scripts);

  // Run the complete update workflow
  const orchestrator = new WorkflowOrchestrator({
    days: options.days,
    scripts: options.scripts,
    useNpmFallback,
  });
  const result = await orchestrator.execute();

  // Exit with the workflow's exit code
  process.exit(result.exitCode);
})().catch(handleFatalError);
