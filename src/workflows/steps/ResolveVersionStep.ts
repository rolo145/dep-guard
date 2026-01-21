/**
 * Resolve Version Step
 *
 * Step 1 of add workflow: Resolves the package version
 * - If user specifies version, validates it exists and meets safety buffer
 * - If user doesn't specify version, fetches latest safe version
 * - Handles cases where version is too new
 *
 * @module workflows/steps/ResolveVersionStep
 */
import type { PackageSpec, ResolvedPackage } from "../add/types";
import type { IExecutionContext } from "../../context/IExecutionContext";
import { PackageResolverService } from "../../ncu/PackageResolverService";
import { logger } from "../../logger";
import chalk from "chalk";
import { select } from "@inquirer/prompts";

/**
 * Result of version resolution
 */
export interface ResolveVersionResult {
  /** Whether resolution was successful */
  success: boolean;
  /** Resolved package (if successful) */
  package?: ResolvedPackage;
  /** Error message (if failed) */
  errorMessage?: string;
}

/**
 * Resolves package version based on user input and safety buffer
 */
export class ResolveVersionStep {
  private readonly context: IExecutionContext;
  private readonly resolver: PackageResolverService;

  constructor(context: IExecutionContext) {
    this.context = context;
    this.resolver = new PackageResolverService(context);
  }

  /**
   * Executes version resolution
   *
   * @param packageSpec - Package specification from user
   * @returns Resolution result
   */
  async execute(packageSpec: PackageSpec): Promise<ResolveVersionResult> {
    const spinner = logger.spinner(`Resolving version for ${packageSpec.name}...`);

    try {
      // If user specified a version, validate it
      if (packageSpec.version) {
        spinner.text = `Validating ${packageSpec.name}@${packageSpec.version}...`;
        const result = await this.resolver.validateVersion(
          packageSpec.name,
          packageSpec.version,
        );

        if (!result.version) {
          spinner.fail(`Version ${packageSpec.version} not found for ${packageSpec.name}`);
          return {
            success: false,
            errorMessage: `Version ${packageSpec.version} not found for package ${packageSpec.name}`,
          };
        }

        // If version is too new, ask user what to do
        if (result.tooNew) {
          spinner.stop();
          logger.newLine();
          logger.warning(
            `Version ${packageSpec.version} of ${packageSpec.name} was published only ${result.ageInDays} days ago`,
          );
          logger.info(
            `Safety buffer requires versions to be at least ${this.context.days} days old`,
          );
          logger.newLine();

          const action = await select({
            message: "What would you like to do?",
            choices: [
              {
                name: "Find latest safe version instead",
                value: "latest_safe",
                description: `Use the latest version that is at least ${this.context.days} days old`,
              },
              {
                name: "Continue anyway (skip safety check)",
                value: "continue",
                description: "Install the requested version despite being too new",
              },
              {
                name: "Cancel",
                value: "cancel",
                description: "Don't install this package",
              },
            ],
          });

          if (action === "cancel" || !action) {
            return {
              success: false,
              errorMessage: "Installation cancelled by user",
            };
          }

          if (action === "continue") {
            logger.success(`Using ${packageSpec.name}@${packageSpec.version}`);
            return {
              success: true,
              package: {
                name: packageSpec.name,
                version: packageSpec.version,
                wasSpecified: true,
                ageInDays: result.ageInDays,
              },
            };
          }

          // User chose to find latest safe version
          spinner.start(`Finding latest safe version for ${packageSpec.name}...`);
          const latestResult = await this.resolver.resolveLatestSafeVersion(packageSpec.name);

          if (!latestResult.version) {
            spinner.fail(`No safe version found for ${packageSpec.name}`);
            return {
              success: false,
              errorMessage: `No version of ${packageSpec.name} is at least ${this.context.days} days old`,
            };
          }

          spinner.succeed(
            `Resolved ${packageSpec.name}@${latestResult.version} (${latestResult.ageInDays} days old)`,
          );
          return {
            success: true,
            package: {
              name: packageSpec.name,
              version: latestResult.version,
              wasSpecified: false,
              ageInDays: latestResult.ageInDays,
            },
          };
        }

        // Version is old enough
        spinner.succeed(
          `Validated ${packageSpec.name}@${packageSpec.version} (${result.ageInDays} days old)`,
        );
        return {
          success: true,
          package: {
            name: packageSpec.name,
            version: packageSpec.version,
            wasSpecified: true,
            ageInDays: result.ageInDays,
          },
        };
      }

      // User didn't specify version, fetch latest safe version
      spinner.text = `Finding latest safe version for ${packageSpec.name}...`;
      const result = await this.resolver.resolveLatestSafeVersion(packageSpec.name);

      if (!result.version) {
        spinner.fail(`No safe version found for ${packageSpec.name}`);
        return {
          success: false,
          errorMessage: `No version of ${packageSpec.name} is at least ${this.context.days} days old`,
        };
      }

      spinner.succeed(
        `Resolved ${packageSpec.name}@${result.version} (${result.ageInDays} days old)`,
      );
      return {
        success: true,
        package: {
          name: packageSpec.name,
          version: result.version,
          wasSpecified: false,
          ageInDays: result.ageInDays,
        },
      };
    } catch (error) {
      spinner.fail(`Failed to resolve version for ${packageSpec.name}`);
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(chalk.red(message));
      return {
        success: false,
        errorMessage: message,
      };
    }
  }
}
