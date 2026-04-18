/**
 * NPQ Workflow Orchestrator
 *
 * Standalone orchestrator for the `dep-guard npq <package@version>` subcommand.
 * Runs an NPQ security check on a single package, consults the allowlist,
 * and outputs either a human-readable summary or structured JSON.
 *
 * @module workflows/NpqWorkflowOrchestrator
 */
import { NPQRunner } from "../npq/NPQRunner";
import { AllowlistReader } from "../allowlist/AllowlistReader";
import { logger } from "../logger";
import chalk from "chalk";

export interface NpqWorkflowOptions {
  /** Package specification, e.g. "lodash@4.17.21" */
  packageSpec: string;
  /** Output as JSON instead of human-readable */
  json: boolean;
}

export interface NpqJsonOutput {
  package: string;
  /**
   * True if NPQ found no issues. False if issues were found — even if all
   * of them are allowlisted. Check `requiresUserDecision` to determine
   * whether human input is needed.
   */
  passed: boolean;
  /**
   * True only when there are unallowlisted issues that a human must review.
   * `passed: false` + `requiresUserDecision: false` means issues exist but
   * are all covered by the allowlist — automation can proceed.
   */
  requiresUserDecision: boolean;
  issues: string[];
  allowlisted: string[];
}

export interface NpqWorkflowResult {
  exitCode: 0 | 1;
}

/**
 * Parses a package spec ("name@version") into its name and version components.
 * Handles scoped packages like "@vue/reactivity@3.0.0".
 */
function parsePackageName(packageSpec: string): string {
  // Scoped package: starts with @
  if (packageSpec.startsWith("@")) {
    const secondAt = packageSpec.indexOf("@", 1);
    return secondAt === -1 ? packageSpec : packageSpec.slice(0, secondAt);
  }
  const atIndex = packageSpec.indexOf("@");
  return atIndex === -1 ? packageSpec : packageSpec.slice(0, atIndex);
}

/**
 * Orchestrates the `dep-guard npq` subcommand.
 */
export class NpqWorkflowOrchestrator {
  private readonly options: NpqWorkflowOptions;
  private readonly runner: NPQRunner;
  private readonly allowlist: AllowlistReader;

  constructor(options: NpqWorkflowOptions) {
    this.options = options;
    this.runner = new NPQRunner();
    this.allowlist = new AllowlistReader();
  }

  async execute(): Promise<NpqWorkflowResult> {
    const { packageSpec, json } = this.options;
    const packageName = parsePackageName(packageSpec);

    // Always capture output so we can check the allowlist
    let result: ReturnType<NPQRunner["checkCapturingOutput"]>;
    try {
      result = this.runner.checkCapturingOutput(packageSpec);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (json) {
        const output: NpqJsonOutput = {
          package: packageSpec,
          passed: false,
          requiresUserDecision: true,
          issues: [errorMessage],
          allowlisted: [],
        };
        process.stdout.write(JSON.stringify(output, null, 2) + "\n");
      } else {
        logger.error(`NPQ check failed: ${errorMessage}`);
      }
      return { exitCode: 1 };
    }

    // When NPQ passes there are no issues to check
    const issueLines = result.passed ? [] : result.outputLines;
    const allowlistResult = this.allowlist.check(packageName, issueLines);

    const requiresUserDecision = !result.passed && !allowlistResult.allAllowlisted;

    if (json) {
      const output: NpqJsonOutput = {
        package: packageSpec,
        passed: result.passed,
        requiresUserDecision,
        issues: issueLines,
        allowlisted: allowlistResult.allowlisted,
      };
      process.stdout.write(JSON.stringify(output, null, 2) + "\n");
      return { exitCode: requiresUserDecision ? 1 : 0 };
    }

    // Human-readable output
    logger.header(`NPQ Security Check: ${chalk.bold(packageSpec)}`, "🔐");
    logger.newLine();

    if (result.outputLines.length > 0) {
      result.outputLines.forEach((line) => console.log("  " + line));
      logger.newLine();
    }

    if (result.passed) {
      logger.success("NPQ security check passed");
    } else {
      logger.warning(`NPQ security check failed for ${chalk.bold(packageSpec)}`);

      if (allowlistResult.allowlisted.length > 0) {
        logger.newLine();
        logger.info(chalk.dim(`Allowlisted (${allowlistResult.allowlisted.length}):`));
        allowlistResult.allowlisted.forEach((msg) =>
          logger.info(chalk.dim(`  ✓ ${msg}`))
        );
      }

      if (allowlistResult.unmatched.length > 0) {
        logger.newLine();
        logger.info(chalk.yellow(`Requires review (${allowlistResult.unmatched.length}):`));
        allowlistResult.unmatched.forEach((msg) =>
          logger.info(chalk.yellow(`  ! ${msg}`))
        );
        logger.newLine();
        logger.info(
          `Add these messages to ${chalk.bold("dep-guard-allowlist.json")} under ` +
          `"${packageName}" to skip this prompt in future runs.`
        );
      } else {
        logger.newLine();
        logger.success("All issues are covered by the allowlist — no user decision required");
      }
    }

    return { exitCode: requiresUserDecision ? 1 : 0 };
  }
}
