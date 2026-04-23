import { WorkflowOrchestrator } from "./workflows";
import { BootstrapWorkflowOrchestrator } from "./workflows/BootstrapWorkflowOrchestrator";
import { AddWorkflowOrchestrator } from "./workflows/AddWorkflowOrchestrator";
import { NpqWorkflowOrchestrator } from "./workflows/NpqWorkflowOrchestrator";
import { ScfwWorkflowOrchestrator } from "./workflows/ScfwWorkflowOrchestrator";
import { QualityWorkflowOrchestrator } from "./workflows/QualityWorkflowOrchestrator";
import { ScriptValidator } from "./quality/ScriptValidator";
import { ArgumentParser, CLIHelper, PrerequisiteValidator, SubcommandParser } from "./args";
import { ArgumentValidator } from "./args/ArgumentValidator";
import { EXIT_CODE_CANCELLED, exitWithError, handleFatalError } from "./errors";

function setupGracefulShutdown(): void {
  const handleShutdown = (signal: string): void => {
    console.log(`\n\nReceived ${signal}. Shutting down gracefully...`);
    console.log("No changes were made to your dependencies.");
    process.exit(EXIT_CODE_CANCELLED);
  };

  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
}

(async () => {
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
  let subcommand: "install" | "update" | "add" | "npq" | "scfw" | "quality";
  let args: string[];

  try {
    const parsed = SubcommandParser.parse(rawArgs);
    subcommand = parsed.subcommand;
    args = parsed.args;
  } catch (error) {
    if (error instanceof Error) {
      exitWithError(error.message);
    }
    throw error;
  }

  const parser = new ArgumentParser(args, subcommand);

  const options = parser.parseOrExit();

  // npq, quality, and update --dry-run don't shell out to scfw, so skip the check.
  const skipPrerequisiteCheck =
    subcommand === "npq" ||
    subcommand === "quality" ||
    (subcommand === "update" && options.dryRun);
  const useNpmFallback = skipPrerequisiteCheck
    ? false
    : PrerequisiteValidator.checkPrerequisites(options.allowNpmInstall).useNpmFallback;

  if (subcommand === "install") {
    const orchestrator = new BootstrapWorkflowOrchestrator({
      days: options.days,
      scripts: options.scripts,
      useNpmFallback,
    });
    const result = await orchestrator.execute();
    process.exit(result.exitCode);
  } else if (subcommand === "add") {
    const packageArgs = parser.parsePackageArgs();

    if (packageArgs.length === 0) {
      exitWithError(
        "Error: No package specified\n" +
        "Usage: dep-guard add <package> [options]\n" +
        "\n" +
        "Examples:\n" +
        "  dep-guard add vue\n" +
        "  dep-guard add vue@3.2.0\n" +
        "  dep-guard add @vue/cli -D"
      );
    }

    if (packageArgs.length > 1) {
      exitWithError(
        "Error: Only one package can be added at a time\n" +
        "Usage: dep-guard add <package> [options]\n" +
        "\n" +
        "Examples:\n" +
        "  dep-guard add vue\n" +
        "  dep-guard add vue@3.2.0"
      );
    }

    let packageSpec;
    try {
      packageSpec = ArgumentValidator.validatePackageName(packageArgs[0]);
    } catch (error) {
      if (error instanceof Error) {
        exitWithError(`Error: ${error.message}`);
      }
      throw error;
    }

    const saveDev = parser.hasSaveDevFlag();
    const orchestrator = new AddWorkflowOrchestrator({
      packageSpec,
      days: options.days,
      scripts: options.scripts,
      useNpmFallback,
      saveDev,
    });

    const result = await orchestrator.execute();
    process.exit(result.exitCode);
  } else if (subcommand === "npq") {
    const packageArgs = parser.parsePackageArgs();

    if (packageArgs.length === 0) {
      exitWithError(
        "Error: No package specified\n" +
        "Usage: dep-guard npq <package[@version]> [--json]\n" +
        "\n" +
        "Example:\n" +
        "  dep-guard npq lodash\n" +
        "  dep-guard npq lodash@4.17.21 --json"
      );
    }

    if (packageArgs.length > 1) {
      exitWithError(
        "Error: Only one package can be checked at a time\n" +
        "Usage: dep-guard npq <package[@version]> [--json]\n" +
        "\n" +
        "Example:\n" +
        "  dep-guard npq lodash\n" +
        "  dep-guard npq lodash@4.17.21 --json"
      );
    }

    let packageSpec: string;
    try {
      const parsed = ArgumentValidator.validatePackageName(packageArgs[0]);
      packageSpec = parsed.version ? `${parsed.name}@${parsed.version}` : parsed.name;
    } catch (error) {
      if (error instanceof Error) {
        exitWithError(`Error: ${error.message}`);
      }
      throw error;
    }

    const orchestrator = new NpqWorkflowOrchestrator({
      packageSpec,
      json: options.json ?? false,
      days: options.days,
    });
    const result = await orchestrator.execute();
    process.exit(result.exitCode);
  } else if (subcommand === "scfw") {
    const packageArgs = parser.parsePackageArgs();

    if (packageArgs.length === 0) {
      exitWithError(
        "Error: No packages specified\n" +
        "Usage: dep-guard scfw <package@version> [package@version...] [--json]\n" +
        "\n" +
        "Example:\n" +
        "  dep-guard scfw lodash@4.17.21\n" +
        "  dep-guard scfw lodash@4.17.21 chalk@5.0.0 --json"
      );
    }

    const orchestrator = new ScfwWorkflowOrchestrator({
      packageSpecs: packageArgs,
      useNpmFallback,
      days: options.days,
      scripts: options.scripts,
      json: options.json ?? false,
    });
    const result = await orchestrator.execute();
    process.exit(result.exitCode);
  } else if (subcommand === "quality") {
    const orchestrator = new QualityWorkflowOrchestrator({
      scripts: options.scripts,
      days: options.days,
      json: options.json ?? false,
    });
    const result = await orchestrator.execute();
    process.exit(result.exitCode);
  } else {
    ScriptValidator.validate(options.scripts);

    const orchestrator = new WorkflowOrchestrator({
      days: options.days,
      scripts: options.scripts,
      useNpmFallback,
      dryRun: options.dryRun,
      json: options.json,
    });
    const result = await orchestrator.execute();
    process.exit(result.exitCode);
  }
})().catch(handleFatalError);
