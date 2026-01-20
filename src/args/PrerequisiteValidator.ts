/**
 * Prerequisite Validator
 *
 * Validates that required external tools are installed before workflow execution.
 * This is part of the pre-flight validation layer along with argument validation.
 *
 * @module args/PrerequisiteValidator
 */
import { spawnSync } from "child_process";
import chalk from "chalk";
import { logger } from "../logger";

/**
 * Result of prerequisite check
 */
export interface PrerequisiteCheckResult {
  /** Whether scfw is available on the system */
  scfwAvailable: boolean;
  /** Whether to use npm install fallback instead of scfw */
  useNpmFallback: boolean;
}

/**
 * Checks if a command is available in the system PATH
 */
export function isCommandAvailable(command: string): boolean {
  const result = spawnSync(command, ["--version"], {
    stdio: "ignore",
    shell: false,
  });
  return result.status === 0;
}

/**
 * Handles validation of system prerequisites.
 */
export class PrerequisiteValidator {
  /**
   * Checks if all required prerequisites are installed
   *
   * @param allowNpmInstall - If true, allow npm install fallback when scfw is missing
   * @returns Result indicating scfw availability and whether to use npm fallback
   *
   * Note: npq is bundled as a dependency, only scfw needs external installation
   */
  static checkPrerequisites(allowNpmInstall: boolean = false): PrerequisiteCheckResult {
    const scfwAvailable = isCommandAvailable("scfw");

    if (scfwAvailable) {
      // If scfw is available, disallow --allow-npm-install flag
      if (allowNpmInstall) {
        logger.header("Invalid Flag Usage", "❌");
        logger.error("--allow-npm-install can only be used when scfw is NOT installed");
        logger.info("Since scfw is available, please run without this flag to use scfw");
        process.exit(1);
      }
      return { scfwAvailable: true, useNpmFallback: false };
    }

    // scfw is not available
    if (allowNpmInstall) {
      // Show info message about fallback mode
      logger.header("Using npm install fallback mode", "📦");
      logger.info("scfw (Supply Chain Firewall) is not installed");
      logger.info("Packages will be installed via: npm install --ignore-scripts --before <date>");
      logger.newLine();
      return { scfwAvailable: false, useNpmFallback: true };
    }

    // scfw not available and no fallback flag - exit with error
    logger.header("Missing Required Security Tool", "❌");
    logger.warning("dep-guard requires scfw (Datadog's Supply Chain Firewall) to be installed:");
    logger.newLine();

    logger.error(`${chalk.bold("scfw")} not found`);
    logger.progress("Install with pipx (recommended): pipx install scfw");
    logger.progress("Or with pip: pip install scfw");

    logger.newLine();
    logger.info("Alternatively, use --allow-npm-install to use npm install fallback");
    logger.newLine();
    logger.info("For more information, see: https://github.com/DataDog/supply-chain-firewall");

    process.exit(1);
  }
}
