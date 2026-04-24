/**
 * SCFW Workflow Orchestrator
 *
 * Standalone orchestrator for the `dep-guard scfw <package@version...>` subcommand.
 * Installs one or more packages via the Supply Chain Firewall (or npm fallback),
 * and outputs either a human-readable summary or structured JSON.
 *
 * @module workflows/ScfwWorkflowOrchestrator
 */
import type { ScriptOptions } from "../args/types";
import { ArgumentValidator } from "../args/ArgumentValidator";
import { ExecutionContextFactory } from "../context/ExecutionContextFactory";
import { SCFWRunner } from "../install/scfw/SCFWRunner";
import { NpmInstallRunner } from "../install/npm/NpmInstallRunner";
import { logger } from "../logger";
import chalk from "chalk";

export interface ScfwWorkflowOptions {
  /** Package specifications to install, e.g. ["lodash@4.17.21", "chalk@5.0.0"] */
  packageSpecs: string[];
  /** Use npm install instead of scfw */
  useNpmFallback: boolean;
  /** Safety buffer in days */
  days: number;
  /** Script options (needed for execution context) */
  scripts: ScriptOptions;
  /** Output as JSON instead of human-readable */
  json: boolean;
}

export interface ScfwJsonOutput {
  success: boolean;
  packages: string[];
  error: string | null;
}

export interface ScfwWorkflowResult {
  exitCode: 0 | 1;
}

/**
 * Orchestrates the `dep-guard scfw` subcommand.
 */
export class ScfwWorkflowOrchestrator {
  private readonly options: ScfwWorkflowOptions;

  constructor(options: ScfwWorkflowOptions) {
    this.options = options;
  }

  async execute(): Promise<ScfwWorkflowResult> {
    const { packageSpecs, useNpmFallback, days, scripts, json } = this.options;

    if (packageSpecs.length === 0) {
      if (json) {
        const output: ScfwJsonOutput = { success: false, packages: [], error: "No packages specified" };
        process.stdout.write(JSON.stringify(output, null, 2) + "\n");
      } else {
        logger.error("No packages specified");
        logger.info("Usage: dep-guard scfw <package@version> [package@version...]");
      }
      return { exitCode: 1 };
    }

    for (const spec of packageSpecs) {
      const parsed = ArgumentValidator.validatePackageName(spec);
      if (!parsed.version) {
        const error = `"${spec}" must include a version (e.g., ${parsed.name}@1.2.3)`;
        if (json) {
          const output: ScfwJsonOutput = { success: false, packages: [], error };
          process.stdout.write(JSON.stringify(output, null, 2) + "\n");
        } else {
          logger.error(error);
          logger.info("Usage: dep-guard scfw <package@version> [package@version...]");
        }
        return { exitCode: 1 };
      }
    }

    const context = ExecutionContextFactory.create({ days, scripts });

    let success: boolean;
    let errorMessage: string | null = null;

    try {
      if (useNpmFallback) {
        const runner = new NpmInstallRunner(context);
        const result = runner.install(packageSpecs);
        success = result.success;
      } else {
        const runner = new SCFWRunner(context);
        const result = runner.install(packageSpecs);
        success = result.success;
      }
    } catch (err) {
      success = false;
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    if (json) {
      const output: ScfwJsonOutput = {
        success,
        packages: packageSpecs,
        error: success ? null : (errorMessage ?? "Installation failed"),
      };
      process.stdout.write(JSON.stringify(output, null, 2) + "\n");
      return { exitCode: success ? 0 : 1 };
    }

    // Human-readable output
    if (success) {
      logger.success(
        `Installed ${packageSpecs.map((p) => chalk.bold(p)).join(", ")}`
      );
    } else {
      logger.error(
        `Installation failed for ${packageSpecs.map((p) => chalk.bold(p)).join(", ")}`
      );
      if (errorMessage) {
        logger.info(errorMessage);
      }
    }

    return { exitCode: success ? 0 : 1 };
  }
}
