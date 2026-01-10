/**
 * Quality Checks Service
 *
 * Provides a unified interface for running code quality checks (lint, typecheck, test, build).
 * Handles user confirmation, spinner feedback, and result reporting.
 *
 * @module services/qualityChecksService
 */
import { confirm } from "@inquirer/prompts";
import { logger } from "../utils/logger";
import { tryRunCommand } from "../utils/utils";
import { WorkflowContext } from "../context";

export interface QualityCheckResults {
  lint: boolean | null;
  typeCheck: boolean | null;
  tests: boolean | null;
}

interface CheckConfig {
  scriptKey: "lint" | "typecheck" | "test" | "build";
  displayName: string;
  runningMessage: string;
  successMessage: string;
  failureMessage: string;
  warningMessage: string;
}

/**
 * Service for running code quality checks with user confirmation and feedback.
 *
 * Provides methods for running individual checks (lint, typecheck, test, build)
 * or all checks at once. Each check prompts for user confirmation before running.
 */
export class QualityChecksService {
  private static readonly CHECK_CONFIGS: Record<string, CheckConfig> = {
    lint: {
      scriptKey: "lint",
      displayName: "linter",
      runningMessage: "Running linter...",
      successMessage: "Lint passed",
      failureMessage: "Lint failed",
      warningMessage: "Linting errors detected. Please review and fix them.",
    },
    typecheck: {
      scriptKey: "typecheck",
      displayName: "type checks",
      runningMessage: "Running type checks...",
      successMessage: "Type checks passed",
      failureMessage: "Type checks failed",
      warningMessage: "Type errors detected. Please review and fix them.",
    },
    test: {
      scriptKey: "test",
      displayName: "tests",
      runningMessage: "Running tests...",
      successMessage: "Tests passed",
      failureMessage: "Tests failed",
      warningMessage: "Some tests failed. Please review and fix them.",
    },
    build: {
      scriptKey: "build",
      displayName: "build",
      runningMessage: "Building...",
      successMessage: "Build complete!",
      failureMessage: "Build failed",
      warningMessage: "Build errors detected. Please review and fix them.",
    },
  };

  /**
   * Runs a single quality check with user confirmation and spinner feedback
   */
  private async runCheck(config: CheckConfig): Promise<boolean | null> {
    const { scriptNames, scripts } = WorkflowContext.getInstance();
    const scriptName = scriptNames[config.scriptKey];

    if (!scripts[scriptName]) {
      logger.skip(`Skipping ${config.displayName} (script "${scriptName}" not found)`);
      return null;
    }

    const shouldRun = await confirm({
      message: `Do you want to run ${config.displayName} (npm run ${scriptName})?`,
      default: false,
    });

    if (!shouldRun) {
      logger.skip(`Skipping ${config.displayName}`);
      return null;
    }

    const spinner = logger.spinner(config.runningMessage);
    const passed = tryRunCommand("npm", ["run", scriptName]);

    if (passed) {
      spinner.succeed(config.successMessage);
    } else {
      spinner.fail(config.failureMessage);
      logger.warning(config.warningMessage);
    }

    return passed;
  }

  /**
   * Runs the linter
   * @returns true if passed, false if failed, null if skipped
   */
  async runLint(): Promise<boolean | null> {
    return this.runCheck(QualityChecksService.CHECK_CONFIGS.lint);
  }

  /**
   * Runs type checking
   * @returns true if passed, false if failed, null if skipped
   */
  async runTypeCheck(): Promise<boolean | null> {
    return this.runCheck(QualityChecksService.CHECK_CONFIGS.typecheck);
  }

  /**
   * Runs tests
   * @returns true if passed, false if failed, null if skipped
   */
  async runTests(): Promise<boolean | null> {
    return this.runCheck(QualityChecksService.CHECK_CONFIGS.test);
  }

  /**
   * Runs the build script
   * @returns true if passed, false if failed, null if skipped
   */
  async runBuild(): Promise<boolean | null> {
    return this.runCheck(QualityChecksService.CHECK_CONFIGS.build);
  }

  /**
   * Runs all quality checks: lint, type checking, and tests
   * @returns Object with pass/fail/skip status for each check
   */
  async runAll(): Promise<QualityCheckResults> {
    const results: QualityCheckResults = {
      lint: await this.runLint(),
      typeCheck: await this.runTypeCheck(),
      tests: await this.runTests(),
    };

    const failures = [
      results.lint === false && "lint",
      results.typeCheck === false && "type checks",
      results.tests === false && "tests",
    ].filter(Boolean);

    if (failures.length > 0) {
      logger.warning(`Quality checks completed with failures: ${failures.join(", ")}`);
    } else {
      logger.success("Quality checks complete!");
    }

    return results;
  }

  /**
   * Reinstalls all dependencies using npm ci with security flags
   */
  async reinstallDependencies(): Promise<void> {
    const shouldReinstall = await confirm({
      message: "Do you want to reinstall dependencies with npm ci?",
      default: false,
    });

    if (!shouldReinstall) {
      logger.skip("Skipping npm ci");
      return;
    }

    const spinner = logger.spinner("Reinstalling dependencies via npm ci...");
    const passed = tryRunCommand("npm", ["ci", "--ignore-scripts"]);

    if (passed) {
      spinner.succeed("Dependencies reinstalled successfully");
      return;
    }

    spinner.fail("Failed to reinstall dependencies");
    logger.error("Update process aborted");
    process.exit(1);
  }
}
