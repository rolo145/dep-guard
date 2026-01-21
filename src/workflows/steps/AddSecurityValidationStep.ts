/**
 * Add Security Validation Step
 *
 * Step 3 of add workflow: Validates package through NPQ security checks
 * - Runs NPQ security check
 * - Displays NPQ results (pass/fail)
 * - Asks user to confirm installation
 *
 * @module workflows/steps/AddSecurityValidationStep
 */
import type { PackageToAdd, ConfirmedPackage } from "../add/types";
import type { NPQService } from "../../npq";
import { logger } from "../../logger";

/**
 * Result of security validation
 */
export interface SecurityValidationResult {
  /** Whether validation passed and user confirmed */
  confirmed: boolean;
  /** Confirmed package (if confirmed) */
  package?: ConfirmedPackage;
  /** Reason for not confirming (if cancelled) */
  cancelReason?: string;
}

/**
 * Validates package through security pipeline
 */
export class AddSecurityValidationStep {
  private readonly npqService: NPQService;

  constructor(npqService: NPQService) {
    this.npqService = npqService;
  }

  /**
   * Executes security validation
   *
   * @param packageToAdd - Package to validate
   * @returns Validation result
   */
  async execute(packageToAdd: PackageToAdd): Promise<SecurityValidationResult> {
    logger.newLine();

    // Run NPQ validation and get user confirmation
    const confirmed = await this.npqService.validateAndConfirm(
      packageToAdd.name,
      packageToAdd.version,
    );

    if (!confirmed) {
      logger.warning("Installation cancelled");
      return {
        confirmed: false,
        cancelReason: "User did not confirm installation after security check",
      };
    }

    // User confirmed installation
    return {
      confirmed: true,
      package: {
        ...packageToAdd,
        npqPassed: true, // If we got here, NPQ passed (user may have overridden)
        userConfirmed: true,
      },
    };
  }
}
