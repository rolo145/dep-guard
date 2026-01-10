/**
 * Package Installer Service
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
 * @module services/packageInstaller
 * @see https://github.com/DataDog/supply-chain-firewall
 */
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import type { PackageSelection } from "../types/updates";
import { tryRunCommand, buildScfwBatchInstallArgs } from "../utils/utils";
import { logger } from "../utils/logger";

/**
 * Installs confirmed packages using scfw with security flags
 *
 * Installs all packages in a single batch using Datadog's Supply Chain Firewall (scfw)
 * with the following security configurations:
 * - --save-exact: Prevents version drift by locking to exact versions
 * - --ignore-scripts: Blocks potentially malicious install/postinstall scripts
 * - --before: Only installs if the package version existed before cutoff date (from context)
 *
 * @param packagesToInstall - Array of validated and confirmed packages to install
 * @throws Exits process if installation fails
 */
export async function installPackages(packagesToInstall: PackageSelection[]): Promise<boolean> {
  // Build list of package specs
  const pkgSpecs = packagesToInstall.map(({ name, version }) => `${name}@${version}`);

  logger.header("Installing packages via scfw", "🔐");
  logger.info(`Packages to install: ${pkgSpecs.map((p) => chalk.bold(p)).join(", ")}`);

  const shouldInstall = await confirm({
    message: "Do you want to install these packages via scfw?",
    default: false,
  });

  if (!shouldInstall) {
    logger.skip("Skipping scfw installation");
    return false;
  }

  const spinner = logger.spinner("Installing packages...");

  // Install all packages in a single scfw call
  const passed = tryRunCommand("scfw", buildScfwBatchInstallArgs(pkgSpecs));
  if (passed) {
    spinner.succeed("All packages installed successfully");
    return true;
  }

  spinner.fail("Failed to install packages");
  logger.error("Update process aborted");
  process.exit(1);
}
