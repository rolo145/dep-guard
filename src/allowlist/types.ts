/**
 * Allowlist Types
 *
 * Type definitions for the dep-guard allowlist file.
 * The allowlist records accepted NPQ messages per package so that
 * previously acknowledged warnings don't trigger user prompts again.
 *
 * @module allowlist/types
 */

/**
 * Structure of the dep-guard-allowlist.json file.
 *
 * Maps package names to arrays of accepted NPQ message patterns.
 * Patterns support glob-style wildcards (* matches any text).
 *
 * @example
 * ```json
 * {
 *   "lodash": [
 *     "Package has not been signed with provenance"
 *   ],
 *   "some-pkg": [
 *     "Package published * days ago"
 *   ]
 * }
 * ```
 */
export type AllowlistFile = Record<string, string[]>;

/**
 * Result of checking a set of issue messages against the allowlist
 */
export interface AllowlistCheckResult {
  /** Messages that matched an allowlist pattern */
  allowlisted: string[];
  /** Messages that did not match any allowlist pattern */
  unmatched: string[];
  /** True if all messages were covered by the allowlist */
  allAllowlisted: boolean;
}
