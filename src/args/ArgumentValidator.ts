/**
 * Argument Validator
 *
 * Validates command-line argument values.
 * Throws ValidationError on invalid input.
 *
 * @module args/ArgumentValidator
 */
import { ValidationError } from "./ValidationError";

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
   * @throws ValidationError if value is missing or looks like a flag
   */
  requireValue(flag: string, value: string | undefined, expectedType: string): void {
    if (!value || value.startsWith("-")) {
      throw new ValidationError(flag, `${flag} requires ${expectedType}`);
    }
  }

  /**
   * Validates and parses a numeric value
   *
   * @param flag - The flag name
   * @param value - The string value to parse
   * @returns The parsed number
   * @throws ValidationError if value is not a valid positive number
   */
  validateNumeric(flag: string, value: string): number {
    this.requireValue(flag, value, "a number");

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      throw new ValidationError(flag, `${flag} must be a positive number`);
    }

    return num;
  }

  /**
   * Validates a string value (script name)
   *
   * @param flag - The flag name
   * @param value - The string value to validate
   * @returns The validated string
   * @throws ValidationError if value is missing
   */
  validateString(flag: string, value: string): string {
    this.requireValue(flag, value, "a script name");
    return value;
  }
}
