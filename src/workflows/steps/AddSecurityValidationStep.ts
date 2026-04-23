import type { PackageToAdd, ConfirmedPackage } from "../add/types";
import type { NPQService } from "../../npq";
import { logger } from "../../logger";

export interface SecurityValidationResult {
  confirmed: boolean;
  package?: ConfirmedPackage;
  cancelReason?: string;
}

export class AddSecurityValidationStep {
  private readonly npqService: NPQService;

  constructor(npqService: NPQService) {
    this.npqService = npqService;
  }

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
