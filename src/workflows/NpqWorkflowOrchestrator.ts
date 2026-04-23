import { NPQRunner } from "../npq/NPQRunner";
import { AllowlistReader } from "../allowlist/AllowlistReader";
import { PackageResolverService } from "../ncu/PackageResolverService";
import { ExecutionContextFactory } from "../context/ExecutionContextFactory";
import { logger } from "../logger";
import chalk from "chalk";

export interface NpqWorkflowOptions {
  /** Package specification — "lodash@4.17.21" or bare "lodash" (version resolved automatically) */
  packageSpec: string;
  json: boolean;
  days: number;
}

export interface NpqJsonOutput {
  package: string;
  /**
   * True if NPQ found no issues. False if issues were found — even if all are allowlisted.
   * Check `requiresUserDecision` to determine whether human input is needed.
   */
  passed: boolean;
  /**
   * True only when there are unallowlisted issues that a human must review.
   * `passed: false` + `requiresUserDecision: false` means automation can proceed.
   */
  requiresUserDecision: boolean;
  issues: string[];
  allowlisted: string[];
}

export interface NpqWorkflowResult {
  exitCode: 0 | 1;
}

function extractPackageName(packageSpec: string): string {
  if (packageSpec.startsWith("@")) {
    const secondAt = packageSpec.indexOf("@", 1);
    return secondAt === -1 ? packageSpec : packageSpec.slice(0, secondAt);
  }
  const atIndex = packageSpec.indexOf("@");
  return atIndex === -1 ? packageSpec : packageSpec.slice(0, atIndex);
}

export class NpqWorkflowOrchestrator {
  private readonly options: NpqWorkflowOptions;
  private readonly runner: NPQRunner;
  private readonly allowlist: AllowlistReader;
  private readonly resolver: PackageResolverService;

  constructor(options: NpqWorkflowOptions) {
    this.options = options;
    this.runner = new NPQRunner();
    this.allowlist = new AllowlistReader();
    this.resolver = new PackageResolverService(
      ExecutionContextFactory.createWithDefaults(options.days)
    );
  }

  async execute(): Promise<NpqWorkflowResult> {
    const { json } = this.options;
    const packageName = extractPackageName(this.options.packageSpec);

    // Resolve version if not specified
    let packageSpec = this.options.packageSpec;
    if (packageSpec === packageName) {
      const resolved = await this.resolveVersion(packageName, json);
      if (!resolved) return { exitCode: 1 };
      packageSpec = `${packageName}@${resolved}`;
      if (!json) {
        logger.info(`Resolved to ${chalk.bold(packageSpec)}`);
        logger.newLine();
      }
    }

    let result: ReturnType<NPQRunner["checkCapturingOutput"]>;
    try {
      result = this.runner.checkCapturingOutput(packageSpec);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (json) {
        this.writeJsonError(packageSpec, errorMessage);
      } else {
        logger.error(`NPQ check failed: ${errorMessage}`);
      }
      return { exitCode: 1 };
    }

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

  private writeJsonError(packageSpec: string, message: string): void {
    const output: NpqJsonOutput = {
      package: packageSpec,
      passed: false,
      requiresUserDecision: true,
      issues: [message],
      allowlisted: [],
    };
    process.stdout.write(JSON.stringify(output, null, 2) + "\n");
  }

  private async resolveVersion(packageName: string, json: boolean): Promise<string | null> {
    if (!json) {
      logger.info(`Resolving latest safe version for ${chalk.bold(packageName)}...`);
    }

    try {
      const result = await this.resolver.resolveLatestSafeVersion(packageName);

      if (!result.version) {
        const msg = `No safe version of ${packageName} found (all versions within the ${this.options.days}-day safety buffer)`;
        if (json) {
          this.writeJsonError(packageName, msg);
        } else {
          logger.error(msg);
        }
        return null;
      }

      return result.version;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (json) {
        this.writeJsonError(packageName, errorMessage);
      } else {
        logger.error(`Failed to resolve version: ${errorMessage}`);
      }
      return null;
    }
  }
}
