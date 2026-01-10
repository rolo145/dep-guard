/**
 * Argument Parser
 *
 * Parses and validates command-line arguments for the dep-guard CLI.
 * Provides a clean interface for handling flags and options.
 *
 * @module cli/ArgumentParser
 */
import { SAFETY_BUFFER_DAYS, DEFAULT_SCRIPTS, type ScriptOptions } from "../constants/config";

/** CLI options parsed from arguments */
export interface CliOptions {
  days: number;
  scripts: ScriptOptions;
}

/**
 * Parses command-line arguments into structured CLI options.
 *
 * Supports:
 * - Numeric options: --days/-d
 * - String options: --lint, --typecheck, --test, --build
 */
export class ArgumentParser {
  private args: string[];

  constructor(args: string[]) {
    this.args = args;
  }

  /**
   * Checks if a flag is present in the arguments
   */
  hasFlag(...flags: string[]): boolean {
    return flags.some((flag) => this.args.includes(flag));
  }

  /**
   * Parses a numeric option from arguments
   * @returns The parsed number or null if not found
   */
  private parseNumericOption(flag: string, shortFlag?: string): number | null {
    const index = this.args.findIndex((arg) => arg === flag || arg === shortFlag);
    if (index === -1) {
      return null;
    }

    const value = this.args[index + 1];
    if (!value || value.startsWith("-")) {
      console.error(`Error: ${flag} requires a number`);
      process.exit(1);
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      console.error(`Error: ${flag} must be a positive number`);
      process.exit(1);
    }

    return num;
  }

  /**
   * Parses a string option from arguments
   * @returns The parsed string or null if not found
   */
  private parseStringOption(flag: string): string | null {
    const index = this.args.findIndex((arg) => arg === flag);
    if (index === -1) {
      return null;
    }

    const value = this.args[index + 1];
    if (!value || value.startsWith("-")) {
      console.error(`Error: ${flag} requires a script name`);
      process.exit(1);
    }

    return value;
  }

  /**
   * Parses all arguments and returns CLI options
   */
  parse(): CliOptions {
    const options: CliOptions = {
      days: SAFETY_BUFFER_DAYS,
      scripts: { ...DEFAULT_SCRIPTS },
    };

    // Parse --days/-d
    const days = this.parseNumericOption("--days", "-d");
    if (days !== null) {
      options.days = days;
    }

    // Parse script options
    const lint = this.parseStringOption("--lint");
    if (lint) {
      options.scripts.lint = lint;
    }

    const typecheck = this.parseStringOption("--typecheck");
    if (typecheck) {
      options.scripts.typecheck = typecheck;
    }

    const test = this.parseStringOption("--test");
    if (test) {
      options.scripts.test = test;
    }

    const build = this.parseStringOption("--build");
    if (build) {
      options.scripts.build = build;
    }

    return options;
  }
}
