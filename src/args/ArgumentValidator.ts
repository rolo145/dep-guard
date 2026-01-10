/**
 * Argument Validator
 *
 * Validates command-line argument values.
 * Throws specific error types for different validation failures.
 *
 * @module args/ArgumentValidator
 */
import { InvalidFormatError, MissingValueError, OutOfRangeError } from "./errors";

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
}
