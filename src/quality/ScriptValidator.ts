/**
 * Script Validator
 *
 * Validates that configured npm script names exist in the target project's package.json.
 * Shows warnings for any scripts that don't exist.
 *
 * @module quality/ScriptValidator
 */
import { PackageJsonReader } from "../context/PackageJsonReader";
import { logger } from "../logger";

export interface ScriptNames {
  lint: string;
  typecheck: string;
  test: string;
  build: string;
}

export interface ScriptValidationResult {
  lint: boolean;
  typecheck: boolean;
  test: boolean;
  build: boolean;
}

/**
 * Validates npm script names against package.json
 */
export class ScriptValidator {
  /**
   * Validates that configured script names exist in the target project's package.json
   * Shows warnings for any scripts that don't exist
   *
   * @param scriptNames - Object with script names to validate (lint, typecheck, test, build)
   * @returns Object indicating which scripts are available
   */
  static validate(scriptNames: ScriptNames): ScriptValidationResult {
    const reader = new PackageJsonReader();

    const results: ScriptValidationResult = {
      lint: reader.hasScript(scriptNames.lint),
      typecheck: reader.hasScript(scriptNames.typecheck),
      test: reader.hasScript(scriptNames.test),
      build: reader.hasScript(scriptNames.build),
    };

    const missing: string[] = [];

    if (!results.lint) {
      missing.push(`lint: "${scriptNames.lint}"`);
    }
    if (!results.typecheck) {
      missing.push(`typecheck: "${scriptNames.typecheck}"`);
    }
    if (!results.test) {
      missing.push(`test: "${scriptNames.test}"`);
    }
    if (!results.build) {
      missing.push(`build: "${scriptNames.build}"`);
    }

    if (missing.length > 0) {
      logger.warning(`The following scripts were not found in package.json:`);
      missing.forEach((script) => {
        logger.info(`  - ${script}`);
      });
      logger.info("These quality checks will be skipped. Use --lint, --typecheck, --test, --build to specify custom script names.");
      logger.newLine();
    }

    return results;
  }
}
