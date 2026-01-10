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
 * Checks if a command is available in the system PATH
 */
function isCommandAvailable(command: string): boolean {
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
   * Exits with helpful error message if any are missing
   *
   * Note: npq is bundled as a dependency, only scfw needs external installation
   */
  static checkPrerequisites(): void {
    if (!isCommandAvailable("scfw")) {
      logger.header("Missing Required Security Tool", "❌");
      logger.warning("dep-guard requires scfw (Datadog's Supply Chain Firewall) to be installed:");
      logger.newLine();

      logger.error(`${chalk.bold("scfw")} not found`);
      logger.progress("Install with pipx (recommended): pipx install scfw");
      logger.progress("Or with pip: pip install scfw");

      logger.newLine();
      logger.info("For more information, see: https://github.com/DataDog/supply-chain-firewall");

      process.exit(1);
    }
  }
}
