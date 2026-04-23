import type { ConfirmedPackage, InstalledPackage } from "../add/types";
import type { IExecutionContext } from "../../context/IExecutionContext";
import { SCFWRunner } from "../../install/scfw/SCFWRunner";
import { NpmInstallRunner } from "../../install/npm/NpmInstallRunner";
import { CIInstallService } from "../../install/ci/CIInstallService";
import { logger } from "../../logger";
import chalk from "chalk";

export interface InstallResult {
  success: boolean;
  package?: InstalledPackage;
  errorMessage?: string;
}

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

  private installPackage(packageSpec: string, saveDev: boolean): { success: boolean } {
    if (this.npmRunner) {
      return this.npmRunner.installSingle(packageSpec, saveDev);
    }

    if (this.scfwRunner) {
      return this.scfwRunner.installSingle(packageSpec, saveDev);
    }

    return { success: false };
  }

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
