/**
 * Validation Error
 *
 * Custom error class for argument validation failures.
 *
 * @module args/ValidationError
 */

/**
 * Error thrown when argument validation fails.
 */
export class ValidationError extends Error {
  readonly flag: string;

  constructor(flag: string, message: string) {
    super(message);
    this.name = "ValidationError";
    this.flag = flag;
  }
}
