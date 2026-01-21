/**
 * Add Install Package Step
 *
 * Step 4 of add workflow: Installs the package
 * - Installs package using scfw or npm (with --save-dev if needed)
 * - Runs npm ci to reinstall all dependencies
 * - Updates package.json and package-lock.json
 *
 * @module workflows/steps/AddInstallPackageStep
 */
import type { ConfirmedPackage, InstalledPackage } from "../add/types";
import type { IExecutionContext } from "../../context/IExecutionContext";
import { SCFWRunner } from "../../install/scfw/SCFWRunner";
import { NpmInstallRunner } from "../../install/npm/NpmInstallRunner";
import { CIInstallService } from "../../install/ci/CIInstallService";
import { logger } from "../../logger";
import chalk from "chalk";

/**
 * Result of package installation
 */
export interface InstallResult {
  /** Whether installation was successful */
  success: boolean;
  /** Installed package (if successful) */
  package?: InstalledPackage;
  /** Error message (if failed) */
  errorMessage?: string;
}

/**
 * Installs package and reinstalls dependencies
 */
export class AddInstallPackageStep {
  private readonly context: IExecutionContext;
  private readonly scfwRunner: SCFWRunner | null;
  private readonly npmRunner: NpmInstallRunner | null;
  private readonly ciInstall: CIInstallService;

  constructor(context: IExecutionContext, useNpmFallback: boolean) {
    this.context = context;
    this.ciInstall = new CIInstallService();

    if (useNpmFallback) {
      this.scfwRunner = null;
      this.npmRunner = new NpmInstallRunner(context);
    } else {
      this.scfwRunner = new SCFWRunner(context);
      this.npmRunner = null;
    }
  }

  /**
   * Executes package installation
   *
   * @param confirmed - Confirmed package from previous step
   * @returns Installation result
   */
  async execute(confirmed: ConfirmedPackage): Promise<InstallResult> {
    const packageSpec = `${confirmed.name}@${confirmed.version}`;

    // Step 1: Install the package
    logger.newLine();
    const installSpinner = logger.spinner(`Installing ${packageSpec}...`);

    const installResult = this.installPackage(packageSpec, confirmed.saveDev);

    if (!installResult.success) {
      installSpinner.fail(`Failed to install ${packageSpec}`);
      return {
        success: false,
        errorMessage: `Installation failed for ${packageSpec}`,
      };
    }

    installSpinner.succeed(`Installed ${packageSpec}`);

    // Step 2: Run npm ci to reinstall all dependencies
    logger.newLine();
    logger.info(chalk.dim("Reinstalling all dependencies..."));
    const ciSuccess = await this.ciInstall.run();

    if (ciSuccess === false) {
      logger.error("Failed to reinstall dependencies");
      return {
        success: false,
        errorMessage: "Failed to reinstall dependencies after adding package",
      };
    }

    // Success!
    logger.newLine();
    logger.success(chalk.bold(`Successfully added ${confirmed.name}@${confirmed.version}!`));
    logger.newLine();
    this.showSummary(confirmed);

    return {
      success: true,
      package: {
        ...confirmed,
        installSuccess: true,
      },
    };
  }

  /**
   * Installs a single package using scfw or npm
   */
  private installPackage(packageSpec: string, saveDev: boolean): { success: boolean } {
    if (this.npmRunner) {
      return this.npmRunner.installSingle(packageSpec, saveDev);
    }

    if (this.scfwRunner) {
      return this.scfwRunner.installSingle(packageSpec, saveDev);
    }

    return { success: false };
  }

  /**
   * Shows installation summary
   */
  private showSummary(pkg: ConfirmedPackage): void {
    const location = pkg.saveDev ? "devDependencies" : "dependencies";

    logger.info(chalk.cyan("📦 Installed to:") + ` ${location}`);

    if (pkg.npqPassed) {
      logger.info(chalk.green("🔒 Security:") + " NPQ checks passed");
    }

    if (pkg.ageInDays !== undefined) {
      logger.info(chalk.blue("⏱️  Version age:") + ` ${pkg.ageInDays} days old`);
    }

    logger.newLine();
  }
}
