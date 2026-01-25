/**
 * Argument Validator
 *
 * Validates command-line argument values.
 * Throws specific error types for different validation failures.
 *
 * @module args/ArgumentValidator
 */
import { InvalidFormatError, MissingValueError, OutOfRangeError } from "./errors";
import { SEMVER_PATTERN } from "../constants/semver";

/**
 * Represents a parsed package specification
 */
export interface PackageSpec {
  /** Package name (e.g., "vue" or "@vue/cli") */
  name: string;
  /** Optional version (e.g., "3.2.0"). Undefined means "latest" */
  version?: string;
}

/**
 * Handles validation of command-line argument values.
 */
export class ArgumentValidator {
  /**
   * Validates that a value exists for a flag
   *
   * @param flag - The flag name (e.g., "--days")
   * @param value - The value to validate
   * @param expectedType - Description of expected type (e.g., "a number")
   * @throws MissingValueError if value is missing or looks like a flag
   */
  requireValue(flag: string, value: string | undefined, expectedType: string): void {
    if (!value || value.startsWith("-")) {
      throw new MissingValueError(flag, expectedType);
    }
  }

  /**
   * Validates and parses a numeric value
   *
   * @param flag - The flag name
   * @param value - The string value to parse
   * @returns The parsed number
   * @throws MissingValueError if value is missing
   * @throws InvalidFormatError if value is not a valid number
   * @throws OutOfRangeError if value is negative
   */
  validateNumeric(flag: string, value: string): number {
    this.requireValue(flag, value, "a number");

    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new InvalidFormatError(flag, value, "a positive number");
    }
    if (num < 0) {
      throw new OutOfRangeError(flag, num, 0);
    }

    return num;
  }

  /**
   * Validates a string value (script name)
   *
   * @param flag - The flag name
   * @param value - The string value to validate
   * @returns The validated string
   * @throws MissingValueError if value is missing
   */
  validateString(flag: string, value: string): string {
    this.requireValue(flag, value, "a script name");
    return value;
  }

  /**
   * Validates and parses a package specification
   *
   * Supports formats:
   * - "vue" -> { name: "vue" }
   * - "vue@3.2.0" -> { name: "vue", version: "3.2.0" }
   * - "@vue/cli" -> { name: "@vue/cli" }
   * - "@vue/cli@5.0.0" -> { name: "@vue/cli", version: "5.0.0" }
   *
   * @param packageSpec - The package specification string
   * @returns Parsed package specification with name and optional version
   * @throws InvalidFormatError if package specification is invalid
   */
  static validatePackageName(packageSpec: string): PackageSpec {
    this.validateNonEmpty(packageSpec);

    if (packageSpec.startsWith("@")) {
      return this.parseScopedPackage(packageSpec);
    }

    return this.parseRegularPackage(packageSpec);
  }

  /**
   * Validates that package specification is non-empty.
   *
   * @param packageSpec - The package specification string
   * @throws InvalidFormatError if empty or whitespace-only
   */
  private static validateNonEmpty(packageSpec: string): void {
    if (!packageSpec || packageSpec.trim() === "") {
      throw new InvalidFormatError(
        "package",
        packageSpec,
        "a non-empty package name",
      );
    }
  }

  /**
   * Parses scoped package specification (@scope/name or @scope/name@version).
   *
   * @param packageSpec - The scoped package specification string
   * @returns Parsed package specification
   * @throws InvalidFormatError if format is invalid
   */
  private static parseScopedPackage(packageSpec: string): PackageSpec {
    // Find the last @ symbol (version separator)
    const lastAtIndex = packageSpec.lastIndexOf("@");

    // If there's only one @, it's just the scoped package name
    if (lastAtIndex === 0) {
      if (!this.isValidPackageName(packageSpec)) {
        throw new InvalidFormatError(
          "package",
          packageSpec,
          "a valid package name (e.g., '@vue/cli' or '@vue/cli@5.0.0')",
        );
      }
      return { name: packageSpec };
    }

    // Split at the last @ to separate name and version
    const name = packageSpec.substring(0, lastAtIndex);
    const version = packageSpec.substring(lastAtIndex + 1);

    if (!this.isValidPackageName(name)) {
      throw new InvalidFormatError(
        "package",
        packageSpec,
        "a valid package name (e.g., '@vue/cli' or '@vue/cli@5.0.0')",
      );
    }

    if (version) {
      this.validateVersionFormat(version, packageSpec);
      return { name, version };
    }

    return { name };
  }

  /**
   * Parses regular (non-scoped) package specification (name or name@version).
   *
   * @param packageSpec - The package specification string
   * @returns Parsed package specification
   * @throws InvalidFormatError if format is invalid
   */
  private static parseRegularPackage(packageSpec: string): PackageSpec {
    const atIndex = packageSpec.indexOf("@");

    // No version specified
    if (atIndex === -1) {
      if (!this.isValidPackageName(packageSpec)) {
        throw new InvalidFormatError(
          "package",
          packageSpec,
          "a valid package name (e.g., 'vue' or 'vue@3.2.0')",
        );
      }
      return { name: packageSpec };
    }

    // Split at @ to separate name and version
    const name = packageSpec.substring(0, atIndex);
    const version = packageSpec.substring(atIndex + 1);

    if (!this.isValidPackageName(name)) {
      throw new InvalidFormatError(
        "package",
        packageSpec,
        "a valid package name (e.g., 'vue' or 'vue@3.2.0')",
      );
    }

    if (!version) {
      throw new InvalidFormatError(
        "package",
        packageSpec,
        "a version after @ (e.g., 'vue@3.2.0')",
      );
    }

    this.validateVersionFormat(version, packageSpec);
    return { name, version };
  }

  /**
   * Validates that a package name follows npm naming rules
   */
  private static isValidPackageName(name: string): boolean {
    // npm package name rules:
    // - Can contain lowercase letters, numbers, hyphens, underscores
    // - Scoped packages: @scope/name format
    // - Cannot start with . or _
    // - Length: 1-214 characters

    if (name.length === 0 || name.length > 214) {
      return false;
    }

    // Check for scoped package
    if (name.startsWith("@")) {
      const scopePattern = /^@[a-z0-9-_.]+\/[a-z0-9-_.]+$/;
      return scopePattern.test(name);
    }

    // Check for regular package
    const packagePattern = /^[a-z0-9-_.]+$/;
    return packagePattern.test(name) && !name.startsWith(".") && !name.startsWith("_");
  }

  /**
   * Validates version format (must be exact version, no ranges)
   */
  private static validateVersionFormat(version: string, fullSpec: string): void {
    // Reject version ranges (^, ~, >, <, *, etc.)
    if (/^[~^><=*]/.test(version) || version.includes(" ") || version === "latest") {
      throw new InvalidFormatError(
        "package",
        fullSpec,
        "an exact version number (e.g., '3.2.0'), not a version range",
      );
    }

    // Validate semver-like format (basic check)
    // Accept formats like: 1.2.3, 1.2.3-alpha, 1.2.3-beta.1, etc.
    if (!SEMVER_PATTERN.test(version)) {
      throw new InvalidFormatError(
        "package",
        fullSpec,
        "a valid semver version (e.g., '3.2.0' or '3.2.0-beta.1')",
      );
    }
  }
}
