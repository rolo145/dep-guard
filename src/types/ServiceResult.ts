/**
 * Service Result Types
 *
 * Common type definitions for service method return values.
 * Documents the three-valued logic pattern used throughout the codebase.
 *
 * @module types/ServiceResult
 */

/**
 * Standard service result type using three-valued logic.
 *
 * This pattern is used consistently across service methods to represent
 * three distinct outcomes of an operation:
 *
 * - `true` - Operation completed successfully
 * - `false` - Operation failed (error state)
 * - `null` - Operation was skipped (user choice or not applicable)
 *
 * Examples:
 * - CI reinstall returns `true` if successful, `false` if failed, `null` if user declined
 * - Quality checks return `true` if passed, `false` if failed, `null` if no script configured
 * - Install operations return `true` if succeeded, `false` if failed, `null` if skipped
 *
 * Benefits of this pattern:
 * - Distinguishes between "failed" and "not attempted"
 * - Allows conditional success checks: `result !== false` means "proceed"
 * - Simplifies error handling and workflow logic
 *
 * Usage:
 * ```typescript
 * async function runTests(): Promise<ServiceResult> {
 *   if (!hasTestScript) return null;  // No test script configured
 *   const success = executeTests();
 *   return success ? true : false;    // true = passed, false = failed
 * }
 *
 * // Caller can check:
 * const testResult = await runTests();
 * if (testResult === false) {
 *   // Tests failed - hard error
 * } else if (testResult === null) {
 *   // Tests skipped - not a problem
 * } else {
 *   // Tests passed
 * }
 * ```
 */
export type ServiceResult = boolean | null;
