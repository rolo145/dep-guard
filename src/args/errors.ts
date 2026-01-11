/**
 * Argument Error Classes
 *
 * Custom error classes for command-line argument validation failures.
 * Extends CLIError for centralized error handling.
 *
 * @module args/errors
 */
import { CLIError } from "../errors";

/**
 * Base error thrown when argument validation fails.
 */
export class ValidationError extends CLIError {
  readonly flag: string;

  constructor(flag: string, message: string) {
    super(message);
    this.name = "ValidationError";
    this.flag = flag;
  }
}

/**
 * Error thrown when a required argument value is missing
 */
export class MissingValueError extends ValidationError {
  readonly expectedType: string;

  constructor(flag: string, expectedType: string) {
    super(flag, `${flag} requires ${expectedType}`);
    this.name = "MissingValueError";
    this.expectedType = expectedType;
  }
}

/**
 * Error thrown when an argument value has invalid format
 */
export class InvalidFormatError extends ValidationError {
  readonly value: string;
  readonly expectedFormat: string;

  constructor(flag: string, value: string, expectedFormat: string) {
    super(flag, `${flag} has invalid format: "${value}". Expected: ${expectedFormat}`);
    this.name = "InvalidFormatError";
    this.value = value;
    this.expectedFormat = expectedFormat;
  }
}

/**
 * Error thrown when an argument value is out of valid range
 */
export class OutOfRangeError extends ValidationError {
  readonly value: number;
  readonly min?: number;
  readonly max?: number;

  constructor(flag: string, value: number, min?: number, max?: number) {
    let message = `${flag} value ${value} is out of range`;
    if (min !== undefined && max !== undefined) {
      message += ` (must be between ${min} and ${max})`;
    } else if (min !== undefined) {
      message += ` (must be at least ${min})`;
    } else if (max !== undefined) {
      message += ` (must be at most ${max})`;
    }
    super(flag, message);
    this.name = "OutOfRangeError";
    this.value = value;
    this.min = min;
    this.max = max;
  }
}
