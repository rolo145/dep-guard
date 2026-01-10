/**
 * Installation Service
 *
 * Handles secure package installation using scfw (Supply Chain Firewall).
 * Installs packages with security flags and time-based restrictions to prevent
 * supply chain attacks.
 *
 * Security measures:
 * - Uses scfw (Datadog's Supply Chain Firewall)
 * - --save-exact: Locks to exact versions (no range operators)
 * - --ignore-scripts: Prevents malicious install scripts
 * - --before flag: Only installs if package existed N days ago
 *
 * @module services/InstallationService
 * @see https://github.com/DataDog/supply-chain-firewall
 */
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import type { PackageSelection } from "../types/updates";
import { tryRunCommand, buildScfwBatchInstallArgs } from "../utils/utils";
import { logger } from "../utils/logger";

/**
 * Service for secure package installation via scfw.
 *
 * @example
 * ```typescript
 * const installer = new InstallationService();
 * await installer.install(packages);
 * ```
 */
export class InstallationService {
  /**
   * Installs packages using scfw with security flags
   *
   * Installs all packages in a single batch using Datadog's Supply Chain Firewall (scfw)
   * with the following security configurations:
   * - --save-exact: Prevents version drift by locking to exact versions
   * - --ignore-scripts: Blocks potentially malicious install/postinstall scripts
   * - --before: Only installs if the package version existed before cutoff date
   *
   * @param packages - Array of validated and confirmed packages to install
   * @returns True if installation succeeded, false if skipped
   * @throws Exits process if installation fails
   */
  async install(packages: PackageSelection[]): Promise<boolean> {
    const packageSpecs = packages.map(({ name, version }) => `${name}@${version}`);

    logger.header("Installing packages via scfw", "🔐");
    logger.info(`Packages to install: ${packageSpecs.map((p) => chalk.bold(p)).join(", ")}`);

    const shouldInstall = await confirm({
      message: "Do you want to install these packages via scfw?",
      default: false,
    });

    if (!shouldInstall) {
      logger.skip("Skipping scfw installation");
      return false;
    }

    const spinner = logger.spinner("Installing packages...");

    const passed = tryRunCommand("scfw", buildScfwBatchInstallArgs(packageSpecs));
    if (passed) {
      spinner.succeed("All packages installed successfully");
      return true;
    }

    spinner.fail("Failed to install packages");
    logger.error("Update process aborted");
    process.exit(1);
  }

  /**
   * Installs a single package using scfw
   *
   * @param name - Package name
   * @param version - Package version
   * @returns True if installation succeeded
   */
  async installSingle(name: string, version: string): Promise<boolean> {
    return this.install([{ name, version }]);
  }
}
