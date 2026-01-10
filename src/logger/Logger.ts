/**
 * Logger Utility
 *
 * Professional CLI logging with consistent formatting, colors, and visual hierarchy.
 * Provides box headers, status messages, spinners, and summary tables.
 *
 * @module logger
 */
import chalk from "chalk";
import ora, { type Ora } from "ora";
import Table from "cli-table3";
import type { PackageUpdate, SummaryData } from "./types";

// ============================================================================
// Box Drawing Characters
// ============================================================================

const BOX = {
  topLeft: "┏",
  topRight: "┓",
  bottomLeft: "┗",
  bottomRight: "┛",
  horizontal: "━",
  vertical: "┃",
  divider: "┣",
  dividerRight: "┫",
} as const;

// ============================================================================
// Logger Class
// ============================================================================

/**
 * Professional CLI logger with consistent formatting and visual hierarchy
 */
class Logger {
  private activeSpinner: Ora | null = null;

  /**
   * Creates a boxed header for major sections
   * @param title - Header title
   * @param emoji - Optional emoji prefix
   */
  header(title: string, emoji?: string): void {
    const displayTitle = emoji ? `${emoji}  ${title}` : title;

    const table = new Table({
      style: {
        border: ["cyan"],
      },
      colWidths: [58],
      chars: {
        top: BOX.horizontal,
        "top-mid": BOX.horizontal,
        "top-left": BOX.topLeft,
        "top-right": BOX.topRight,
        bottom: BOX.horizontal,
        "bottom-mid": BOX.horizontal,
        "bottom-left": BOX.bottomLeft,
        "bottom-right": BOX.bottomRight,
        left: BOX.vertical,
        "left-mid": BOX.divider,
        mid: BOX.horizontal,
        "mid-mid": "╋",
        right: BOX.vertical,
        "right-mid": BOX.dividerRight,
        middle: BOX.vertical,
      },
    });

    table.push([chalk.bold.white(displayTitle)]);
    console.log(`\n${table.toString()}`);
  }

  /**
   * Creates a divider line
   */
  divider(): void {
    console.log(chalk.dim("─".repeat(60)));
  }

  /**
   * Success message with green checkmark
   */
  success(message: string): void {
    console.log(chalk.green("✓") + " " + message);
  }

  /**
   * Error message with red X
   */
  error(message: string): void {
    console.log(chalk.red("✗") + " " + chalk.red(message));
  }

  /**
   * Warning message with yellow warning icon
   */
  warning(message: string): void {
    console.log(chalk.yellow("⚠") + " " + chalk.yellow(message));
  }

  /**
   * Info message with blue info icon
   */
  info(message: string): void {
    console.log(chalk.blue("ℹ") + " " + chalk.cyan(message));
  }

  /**
   * Progress/sub-item message (indented, dimmed)
   */
  progress(message: string): void {
    console.log(chalk.dim("  → " + message));
  }

  /**
   * Skip message with skip icon
   */
  skip(message: string): void {
    console.log(chalk.gray("⊘") + " " + chalk.dim(message));
  }

  /**
   * Package processing message
   */
  package(name: string, action: string): void {
    console.log(`\n${chalk.bold("📦")} ${chalk.bold(name)} ${chalk.dim("→")} ${action}`);
  }

  /**
   * Step message with number
   */
  step(number: number, total: number, message: string): void {
    const stepText = chalk.bold.cyan(`[${number}/${total}]`);
    console.log(`\n${stepText} ${message}`);
  }

  /**
   * Creates and starts a spinner for long operations
   * @param text - Spinner text
   * @returns Spinner instance for control
   */
  spinner(text: string): Ora {
    // Stop any existing spinner
    if (this.activeSpinner) {
      this.activeSpinner.stop();
    }

    this.activeSpinner = ora({
      text,
      color: "cyan",
      spinner: "dots",
    }).start();

    return this.activeSpinner;
  }

  /**
   * Stops the active spinner
   */
  stopSpinner(): void {
    if (this.activeSpinner) {
      this.activeSpinner.stop();
      this.activeSpinner = null;
    }
  }

  /**
   * Creates a summary table
   * @param title - Table title
   * @param data - Key-value pairs for the table
   */
  summaryTable(title: string, data: SummaryData): void {
    const table = new Table({
      head: [{ content: chalk.bold.white(title), colSpan: 2 }] as any,
      style: {
        head: ["cyan"],
        border: ["cyan"],
      },
      colWidths: [35, 25],
      chars: {
        top: BOX.horizontal,
        "top-mid": BOX.horizontal,
        "top-left": BOX.topLeft,
        "top-right": BOX.topRight,
        bottom: BOX.horizontal,
        "bottom-mid": BOX.horizontal,
        "bottom-left": BOX.bottomLeft,
        "bottom-right": BOX.bottomRight,
        left: BOX.vertical,
        "left-mid": BOX.divider,
        mid: BOX.horizontal,
        "mid-mid": "╋",
        right: BOX.vertical,
        "right-mid": BOX.dividerRight,
        middle: BOX.vertical,
      },
    });

    Object.entries(data).forEach(([key, value]) => {
      table.push([chalk.white(key), { content: chalk.bold(String(value)), hAlign: "right" }]);
    });

    console.log(`\n${table.toString()}\n`);
  }

  /**
   * Creates a comparison table for package updates
   * @param updates - Array of package updates
   */
  updatesTable(updates: PackageUpdate[]): void {
    const table = new Table({
      head: [
        chalk.bold("Package"),
        chalk.bold("Current"),
        chalk.bold("New"),
        chalk.bold("Type"),
      ],
      style: {
        head: ["cyan"],
        border: ["dim"],
      },
      colWidths: [30, 15, 15, 10],
    });

    updates.forEach(({ name, current, new: newVer, type }) => {
      const typeColor =
        type === "major"
          ? chalk.red(type)
          : type === "minor"
            ? chalk.blue(type)
            : chalk.green(type);

      table.push([name, chalk.dim(current), chalk.bold(newVer), typeColor]);
    });

    console.log(table.toString());
  }

  /**
   * Blank line for spacing
   */
  newLine(): void {
    console.log("");
  }
}

// Export singleton instance
export const logger = new Logger();
