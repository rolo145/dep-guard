/**
 * Error Handling Module
 *
 * Centralized error classes, utilities, and handlers for the CLI.
 * This is the single entrypoint for all error handling across the application.
 *
 * @module errors
 */
import { logger } from "../logger";

/** Standard exit code for user cancellation (SIGINT) */
export const EXIT_CODE_CANCELLED = 130;

/** Standard exit code for fatal errors */
export const EXIT_CODE_ERROR = 1;

/**
 * Base error class for all CLI errors.
 *
 * All domain-specific errors should extend this class to enable
 * centralized error handling and consistent error detection.
 */
export class CLIError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "CLIError";
  }
}

/**
 * Checks if an error is a CLIError (or subclass).
 *
 * @param error - The error to check
 * @returns True if this is a CLIError
 */
export function isCLIError(error: unknown): error is CLIError {
  return error instanceof CLIError;
}

/**
 * Error thrown when user cancels an operation (Ctrl+C or prompt exit).
 *
 * Wraps external prompt library errors to provide stable error detection
 * via instanceof instead of fragile string matching.
 */
export class UserCancellationError extends CLIError {
  constructor(cause?: Error) {
    super("Operation cancelled by user", { cause });
    this.name = "UserCancellationError";
  }
}

/**
 * Checks if an error represents user cancellation from prompt libraries.
 *
 * @param error - The error to check
 * @returns True if this is a user cancellation error
 */
export function isPromptCancellation(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "ExitPromptError" || error.message.includes("User force closed"))
  );
}

/**
 * Wraps an async function to convert prompt cancellation errors
 * into UserCancellationError.
 *
 * @param fn - Async function that may throw prompt cancellation
 * @returns Result of the function
 * @throws UserCancellationError if user cancels
 */
export async function withCancellationHandling<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isPromptCancellation(error)) {
      throw new UserCancellationError(error instanceof Error ? error : undefined);
    }
    throw error;
  }
}

/**
 * Checks if an error is a user cancellation.
 *
 * @param error - The error to check
 * @returns True if this is a UserCancellationError
 */
export function isUserCancellation(error: unknown): error is UserCancellationError {
  return error instanceof UserCancellationError;
}

/**
 * Logs user cancellation message.
 * Call this when handling a UserCancellationError.
 */
export function logCancellation(): void {
  console.log("\n");
  logger.info("Operation cancelled by user");
  logger.info("No changes were made to your dependencies.");
}

/**
 * Handles fatal CLI errors.
 * Logs the error message and exits with error code.
 *
 * @param error - The error that occurred
 */
export function handleFatalError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nFatal error: ${message}`);
  process.exit(EXIT_CODE_ERROR);
}
