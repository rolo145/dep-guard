/**
 * Subcommand Parser
 *
 * Parses subcommands from command-line arguments.
 *
 * @module args/SubcommandParser
 */

export type Subcommand = "update" | "install" | "add";

export interface ParsedCommand {
  subcommand: Subcommand;
  args: string[];
}

export class SubcommandParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubcommandParseError";
  }
}

/**
 * Parses subcommand from command-line arguments.
 *
 * Supports:
 * - "install" subcommand for fresh install workflow
 * - "update" subcommand for update workflow
 *
 * @throws SubcommandParseError if no subcommand or unknown subcommand
 */
export class SubcommandParser {
  /**
   * Parses the first positional argument as a subcommand
   *
   * @param args - Command-line arguments (excluding node and script path)
   * @returns Parsed subcommand and remaining arguments
   * @throws SubcommandParseError if no subcommand or unknown subcommand
   */
  static parse(args: string[]): ParsedCommand {
    // If no args or first arg is a flag, no subcommand provided
    if (args.length === 0 || args[0].startsWith("-")) {
      throw new SubcommandParseError(
        "Please specify a subcommand: install, update, or add\n\n" +
          "Usage:\n" +
          "  dep-guard install    Fresh install from package.json\n" +
          "  dep-guard update     Check for and install package updates\n" +
          "  dep-guard add        Add a new package with security checks\n\n" +
          "Run 'dep-guard --help' for more information.",
      );
    }

    const firstArg = args[0];
    const remainingArgs = args.slice(1);

    // Check for known subcommands
    if (firstArg === "install" || firstArg === "update" || firstArg === "add") {
      return {
        subcommand: firstArg,
        args: remainingArgs,
      };
    }

    // Unknown subcommand
    throw new SubcommandParseError(
      `Unknown subcommand: ${firstArg}\n\n` +
        "Valid subcommands are: install, update, add\n" +
        "Run 'dep-guard --help' for more information.",
    );
  }
}
