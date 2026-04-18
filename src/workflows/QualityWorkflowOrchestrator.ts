/**
 * Quality Workflow Orchestrator
 *
 * Standalone orchestrator for the `dep-guard quality` subcommand.
 * Runs quality checks (lint, typecheck, test, build) non-interactively
 * and outputs either a human-readable summary or structured JSON.
 *
 * Unlike the update workflow's QualityChecksStep (which asks for confirmation
 * before each check), this orchestrator runs all available checks automatically.
 *
 * @module workflows/QualityWorkflowOrchestrator
 */
import type { ScriptOptions } from "../args/types";
import { ExecutionContextFactory } from "../context/ExecutionContextFactory";
import { LintRunner } from "../quality/lint/LintRunner";
import { TypeCheckRunner } from "../quality/typecheck/TypeCheckRunner";
import { TestRunner } from "../quality/test/TestRunner";
import { BuildRunner } from "../quality/build/BuildRunner";
import { logger } from "../logger";
import chalk from "chalk";

export interface QualityWorkflowOptions {
  /** Script options for quality checks */
  scripts: ScriptOptions;
  /** Safety buffer in days (needed for execution context) */
  days: number;
  /** Output as JSON instead of human-readable */
  json: boolean;
}

export interface QualityCheckJsonEntry {
  ran: boolean;
  passed: boolean | null;
  skipped: boolean;
}

export interface QualityJsonOutput {
  success: boolean;
  checks: {
    lint: QualityCheckJsonEntry;
    typecheck: QualityCheckJsonEntry;
    test: QualityCheckJsonEntry;
    build: QualityCheckJsonEntry;
  };
}

export interface QualityWorkflowResult {
  exitCode: 0 | 1;
}

function toEntry(result: boolean | null): QualityCheckJsonEntry {
  if (result === null) {
    return { ran: false, passed: null, skipped: true };
  }
  return { ran: true, passed: result, skipped: false };
}

/**
 * Orchestrates the `dep-guard quality` subcommand.
 *
 * Runs all quality checks directly via runners (bypassing interactive
 * confirmation prompts) and reports results.
 */
export class QualityWorkflowOrchestrator {
  private readonly options: QualityWorkflowOptions;

  constructor(options: QualityWorkflowOptions) {
    this.options = options;
  }

  async execute(): Promise<QualityWorkflowResult> {
    const { scripts, days, json } = this.options;
    const context = ExecutionContextFactory.create({ days, scripts });

    const results = {
      lint: null as boolean | null,
      typecheck: null as boolean | null,
      test: null as boolean | null,
      build: null as boolean | null,
    };

    // Run lint
    if (context.hasScript(scripts.lint)) {
      if (!json) logger.info(`Running lint (npm run ${chalk.bold(scripts.lint)})...`);
      results.lint = new LintRunner().run(scripts.lint).success;
    } else if (!json) {
      logger.skip(`Skipping lint (script "${scripts.lint}" not found)`);
    }

    // Run typecheck
    if (context.hasScript(scripts.typecheck)) {
      if (!json) logger.info(`Running typecheck (npm run ${chalk.bold(scripts.typecheck)})...`);
      results.typecheck = new TypeCheckRunner().run(scripts.typecheck).success;
    } else if (!json) {
      logger.skip(`Skipping typecheck (script "${scripts.typecheck}" not found)`);
    }

    // Run tests
    if (context.hasScript(scripts.test)) {
      if (!json) logger.info(`Running tests (npm run ${chalk.bold(scripts.test)})...`);
      results.test = new TestRunner().run(scripts.test).success;
    } else if (!json) {
      logger.skip(`Skipping test (script "${scripts.test}" not found)`);
    }

    // Run build
    if (context.hasScript(scripts.build)) {
      if (!json) logger.info(`Running build (npm run ${chalk.bold(scripts.build)})...`);
      results.build = new BuildRunner().run(scripts.build).success;
    } else if (!json) {
      logger.skip(`Skipping build (script "${scripts.build}" not found)`);
    }

    const anyFailed = Object.values(results).some((r) => r === false);
    const success = !anyFailed;

    if (json) {
      const output: QualityJsonOutput = {
        success,
        checks: {
          lint: toEntry(results.lint),
          typecheck: toEntry(results.typecheck),
          test: toEntry(results.test),
          build: toEntry(results.build),
        },
      };
      process.stdout.write(JSON.stringify(output, null, 2) + "\n");
      return { exitCode: success ? 0 : 1 };
    }

    // Human-readable summary
    logger.newLine();
    if (success) {
      logger.success("All quality checks passed");
    } else {
      const failed = Object.entries(results)
        .filter(([, v]) => v === false)
        .map(([k]) => k);
      logger.warning(`Quality checks failed: ${failed.join(", ")}`);
    }

    return { exitCode: success ? 0 : 1 };
  }
}
