/**
 * Argument Parser
 *
 * Parses command-line arguments for the dep-guard CLI.
 * Uses ArgumentValidator for validation.
 *
 * @module args/ArgumentParser
 */
import { DEFAULT_SCRIPTS, SAFETY_BUFFER_DAYS } from "../defaults";
import { ArgumentValidator } from "./ArgumentValidator";
import { ValidationError } from "./errors";
import type { CliOptions } from "./types";

/** Script flags that can be configured via CLI */
const SCRIPT_FLAGS = ["lint", "typecheck", "test", "build"] as const;
type ScriptFlag = typeof SCRIPT_FLAGS[number];

/**
 * Parses command-line arguments into structured CLI options.
 *
 * Supports:
 * - Numeric options: --days/-d
 * - String options: --lint, --typecheck, --test, --build
 */
export class ArgumentParser {
  private args: string[];
  private validator: ArgumentValidator;

  constructor(args: string[]) {
    this.args = args;
    this.validator = new ArgumentValidator();
  }

  /**
   * Checks if a flag is present in the arguments
   */
  hasFlag(...flags: string[]): boolean {
    return flags.some((flag) => this.args.includes(flag));
  }

  /**
   * Extracts non-flag arguments (package names)
   * Returns all arguments that are not flags or flag values
   *
   * Filters out:
   * - Flags (arguments starting with -)
   * - Values following flags that require values (--days, --lint, etc.)
   */
  parsePackageArgs(): string[] {
    const result: string[] = [];
    const flagsWithValues = [
      "--days", "-d",
      "--lint", "--typecheck", "--test", "--build",
    ];

    for (let i = 0; i < this.args.length; i++) {
      const arg = this.args[i];

      // Skip flags
      if (arg.startsWith("-")) {
        // If this flag requires a value, skip the next argument too
        if (flagsWithValues.includes(arg)) {
          i++; // Skip the value
        }
        continue;
      }

      // This is not a flag, include it
      result.push(arg);
    }

    return result;
  }

  /**
   * Checks if the save-dev flag is present (-D or --save-dev)
   */
  hasSaveDevFlag(): boolean {
    return this.hasFlag("-D", "--save-dev");
  }

  /**
   * Finds the index of a flag in the arguments
   */
  private findFlagIndex(flag: string, shortFlag?: string): number {
    return this.args.findIndex((arg) => arg === flag || arg === shortFlag);
  }

  /**
   * Gets the value following a flag
   */
  private getFlagValue(index: number): string | undefined {
    return this.args[index + 1];
  }

  /**
   * Parses a numeric option from arguments
   *
   * @returns The parsed number or null if not found
   * @throws ValidationError if value is invalid
   */
  private parseNumericOption(flag: string, shortFlag?: string): number | null {
    const index = this.findFlagIndex(flag, shortFlag);
    if (index === -1) {
      return null;
    }

    const value = this.getFlagValue(index);
    return this.validator.validateNumeric(flag, value as string);
  }

  /**
   * Parses a string option from arguments
   *
   * @returns The parsed string or null if not found
   * @throws ValidationError if value is invalid
   */
  private parseStringOption(flag: string): string | null {
    const index = this.findFlagIndex(flag);
    if (index === -1) {
      return null;
    }

    const value = this.getFlagValue(index);
    return this.validator.validateString(flag, value as string);
  }

  /**
   * Parses all script options using config-driven approach
   */
  private parseScriptOptions(scripts: Record<ScriptFlag, string>): void {
    for (const flag of SCRIPT_FLAGS) {
      const value = this.parseStringOption(`--${flag}`);
      if (value) {
        scripts[flag] = value;
      }
    }
  }

  /**
   * Parses all arguments and returns CLI options
   *
   * @throws ValidationError if any argument is invalid
   */
  parse(): CliOptions {
    const options: CliOptions = {
      days: SAFETY_BUFFER_DAYS,
      scripts: { ...DEFAULT_SCRIPTS },
      allowNpmInstall: false,
    };

    // Parse --days/-d
    const days = this.parseNumericOption("--days", "-d");
    if (days !== null) {
      options.days = days;
    }

    // Parse --allow-npm-install flag
    if (this.hasFlag("--allow-npm-install")) {
      options.allowNpmInstall = true;
    }

    // Parse all script options
    this.parseScriptOptions(options.scripts);

    return options;
  }

  /**
   * Parses arguments with error handling
   * Prints error message and exits on validation failure
   */
  parseOrExit(): CliOptions {
    try {
      return this.parse();
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
      throw error;
    }
  }
}
