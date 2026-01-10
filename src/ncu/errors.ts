/**
 * NCU Error Classes
 *
 * Custom error classes for NCU-related failures.
 *
 * @module ncu/errors
 */

/**
 * Base error class for NCU registry operations
 */
export class RegistryError extends Error {
  readonly packageName: string;

  constructor(packageName: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RegistryError";
    this.packageName = packageName;
  }
}

/**
 * Error thrown when NPM registry request fails
 */
export class RegistryFetchError extends RegistryError {
  readonly statusCode?: number;

  constructor(
    packageName: string,
    statusCode?: number,
    options?: ErrorOptions,
  ) {
    const message = statusCode
      ? `Failed to fetch ${packageName} from NPM registry (HTTP ${statusCode})`
      : `Failed to fetch ${packageName} from NPM registry`;
    super(packageName, message, options);
    this.name = "RegistryFetchError";
    this.statusCode = statusCode;
  }
}

/**
 * Error thrown when registry response is malformed
 */
export class RegistryParseError extends RegistryError {
  constructor(packageName: string, options?: ErrorOptions) {
    super(
      packageName,
      `Failed to parse registry response for ${packageName}`,
      options,
    );
    this.name = "RegistryParseError";
  }
}

/**
 * Error thrown when no safe version is available for a package
 */
export class NoSafeVersionError extends RegistryError {
  readonly days: number;

  constructor(packageName: string, days: number) {
    super(
      packageName,
      `No version of ${packageName} published at least ${days} days ago`,
    );
    this.name = "NoSafeVersionError";
    this.days = days;
  }
}
